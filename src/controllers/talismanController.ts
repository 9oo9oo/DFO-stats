// src/controllers/talismanController.ts
import axios from 'axios';
import { RequestHandler } from 'express';
import client from '../models/db';

const apiKey = process.env.DFO_API_KEY!;
if (!apiKey) {
  throw new Error('Missing DFO_API_KEY in environment');
}

// --- Types ---
interface CharacterRow {
  character_id: string;
}

interface TalismanEntry {
  talisman?: {
    slotNo:    number;
    itemId:    string;
    itemName:  string;
  };
  runes?: Array<{
    slotNo:   number;
    itemId:   string;
    itemName: string;
  }>;
}

interface TalismanApiResponse {
  talismans?: TalismanEntry[];
}

interface TalismanStatsRow {
  talisman_item_id:   string;
  talisman_item_name: string;
  usage_count:        string;
}

interface RuneStatsRow {
  rune_item_id:   string;
  rune_item_name: string;
  usage_count:    string;
}

// -------------------
// 1) FETCH & UPSERT TALISMAN & RUNES
// -------------------
export const fetchTalismanAndRunes: RequestHandler<{
  serverId: string;
  jobId: string;
  jobGrowId: string;
}> = async (req, res) => {
  const { serverId, jobId, jobGrowId } = req.params;

  try {
    // Load character IDs
    const charQ = `
      SELECT character_id
      FROM characters
      WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
    `;
    const charRes = await client.query<CharacterRow>(charQ, [serverId, jobId, jobGrowId]);
    if (charRes.rows.length === 0) {
      res.status(404).json({ message: 'No character IDs found for the specified class.' });
      return;
    }

    // Fetch & upsert for each character
    for (const { character_id } of charRes.rows) {
      const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${character_id}/equip/talisman?apikey=${apiKey}`;
      let apiRes;
      try {
        apiRes = await axios.get<TalismanApiResponse>(url);
      } catch (err: any) {
        console.error(`Error fetching talisman data for ${character_id}:`, err.message);
        continue;
      }

      const entries = apiRes.data.talismans;
      if (!Array.isArray(entries)) {
        console.log(`No talisman data found for character ${character_id}`);
        continue;
      }

      for (const entry of entries) {
        const t = entry.talisman;
        if (!t) continue;

        const { slotNo: talismanSlotNo, itemId: talismanItemId, itemName: talismanItemName } = t;
        const runes = Array.isArray(entry.runes) ? entry.runes : [];

        for (const rune of runes) {
          const { slotNo: runeSlotNo, itemId: runeItemId, itemName: runeItemName } = rune;
          const upsertQ = `
            INSERT INTO character_talisman_runes
              (character_id, talisman_slot_no, rune_slot_no,
               talisman_item_id, talisman_item_name,
               rune_item_id, rune_item_name)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            ON CONFLICT (character_id, talisman_slot_no, rune_slot_no)
            DO UPDATE SET
              talisman_item_id   = EXCLUDED.talisman_item_id,
              talisman_item_name = EXCLUDED.talisman_item_name,
              rune_item_id       = EXCLUDED.rune_item_id,
              rune_item_name     = EXCLUDED.rune_item_name;
          `;
          try {
            await client.query(upsertQ, [
              character_id,
              talismanSlotNo,
              runeSlotNo,
              talismanItemId,
              talismanItemName,
              runeItemId,
              runeItemName
            ]);
          } catch (err: any) {
            console.error(
              `Error inserting data for ${character_id} (talisman slot ${talismanSlotNo}, rune slot ${runeSlotNo}):`,
              err.message
            );
          }
        }
      }
    }

    res.status(200).json({
      message: 'Talisman and rune data fetched and stored successfully.'
    });
  } catch (err: any) {
    console.error('Error processing talisman and rune data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// -------------------
// 2) GET TALISMAN & RUNE STATS
// -------------------
export const getTalismanRuneStats: RequestHandler<{
  jobId: string;
  jobGrowId: string;
}> = async (req, res) => {
  const { jobId, jobGrowId } = req.params;

  try {
    // Talisman usage
    const talismanQ = `
      WITH unique_talismans AS (
        SELECT DISTINCT ctr.character_id,
                        ctr.talisman_item_id,
                        ctr.talisman_item_name
        FROM character_talisman_runes ctr
        JOIN characters c ON ctr.character_id = c.character_id
        WHERE c.job_id = $1 AND c.job_grow_id = $2
      )
      SELECT
        talisman_item_id,
        talisman_item_name,
        COUNT(*) AS usage_count
      FROM unique_talismans
      GROUP BY talisman_item_id, talisman_item_name
      ORDER BY usage_count DESC;
    `;
    const talismanRes = await client.query<TalismanStatsRow>(talismanQ, [jobId, jobGrowId]);

    // Rune usage
    const runeQ = `
      SELECT
        ctr.rune_item_id,
        ctr.rune_item_name,
        COUNT(*) AS usage_count
      FROM character_talisman_runes ctr
      JOIN characters c ON ctr.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
      GROUP BY ctr.rune_item_id, ctr.rune_item_name
      ORDER BY usage_count DESC;
    `;
    const runeRes = await client.query<RuneStatsRow>(runeQ, [jobId, jobGrowId]);

    // Map & limit to top 10
    const talismanStats = talismanRes.rows
      .map(r => ({
        talisman_item_id:   r.talisman_item_id,
        talisman_item_name: r.talisman_item_name,
        usage_count:        parseInt(r.usage_count, 10)
      }))
      .slice(0, 10);

    const runeStats = runeRes.rows
      .map(r => ({
        rune_item_id:   r.rune_item_id,
        rune_item_name: r.rune_item_name,
        usage_count:    parseInt(r.usage_count, 10)
      }))
      .slice(0, 10);

    res.json({ talismanStats, runeStats });
  } catch (err: any) {
    console.error('Error fetching talisman and rune stats:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
