// src/controllers/characterController.ts
import axios from 'axios';
import { Request, Response } from 'express';
import client from '../models/db';

const apiKey = process.env.DFO_API_KEY!;
if (!apiKey) {
  throw new Error('Missing DFO_API_KEY in environment');
}

interface FameApiRow {
  characterId: string;
  serverId:   string;
  jobId:      string;
  jobGrowId:  string;
}

export const getCharacter = async (
  req: Request<{ serverId: string; jobId: string; jobGrowId: string }>,
  res: Response
): Promise<void> => {
  const { serverId, jobId, jobGrowId } = req.params;

  // 1) Get current max fame
  const urlForHighest = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
    `?jobId=${jobId}&jobGrowId=${jobGrowId}&limit=1&apikey=${apiKey}`;

  let currentMaxFame: number;
  try {
    const highestResp = await axios.get<{ fame: { max: number } }>(urlForHighest);
    currentMaxFame = highestResp.data.fame.max;
  } catch (err: any) {
    console.error('Error retrieving highest fame:', err.message);
    res.status(500).json({ error: 'Failed to fetch highest fame' });
    return;
  }

  // 2) Accumulate up to 100 unique character IDs
  const targetCount = 100;
  const seenIds = new Set<string>();
  const rows: FameApiRow[] = [];

  while (seenIds.size < targetCount && currentMaxFame > 0) {
    const minFame = currentMaxFame - 2000;
    const fameUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
      `?minFame=${minFame}&maxFame=${currentMaxFame}` +
      `&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=200&apikey=${apiKey}`;

    try {
      const fameResp = await axios.get<{ rows: FameApiRow[] }>(fameUrl);
      const fetched = fameResp.data.rows;

      if (fetched.length === 0) {
        console.log(`No characters in fame range [${minFame}, ${currentMaxFame}]. Continuing...`);
      }

      for (const row of fetched) {
        if (!seenIds.has(row.characterId)) {
          seenIds.add(row.characterId);
          rows.push(row);
          if (seenIds.size >= targetCount) break;
        }
      }
    } catch (err: any) {
      console.error('Error retrieving characters:', err.message);
      res.status(500).json({ error: 'Failed to fetch character data' });
      return;
    }

    currentMaxFame = minFame;
  }

  // Keep only the first 100
  const topRows = rows.slice(0, targetCount);

  // 3) Store in DB
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM characters
       WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;`,
      [serverId, jobId, jobGrowId]
    );

    const insertQ = `
      INSERT INTO characters (character_id, server_id, job_id, job_grow_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (character_id) DO NOTHING;
    `;
    for (const r of topRows) {
      await client.query(insertQ, [
        r.characterId,
        r.serverId,
        r.jobId,
        r.jobGrowId,
      ]);
    }

    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error storing characters in DB:', err.message);
    res.status(500).json({ error: 'Failed to store character data' });
    return;
  }

  res.json({ message: '100 character IDs inserted successfully for the given class.' });
};
