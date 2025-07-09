"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCharacter = void 0;
// src/controllers/characterController.ts
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../models/db"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
const getCharacter = async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;
    // 1) Get current max fame
    const urlForHighest = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
        `?jobId=${jobId}&jobGrowId=${jobGrowId}&limit=1&apikey=${apiKey}`;
    let currentMaxFame;
    try {
        const highestResp = await axios_1.default.get(urlForHighest);
        currentMaxFame = highestResp.data.fame.max;
    }
    catch (err) {
        console.error('Error retrieving highest fame:', err.message);
        res.status(500).json({ error: 'Failed to fetch highest fame' });
        return;
    }
    // 2) Accumulate up to 100 unique character IDs
    const targetCount = 100;
    const seenIds = new Set();
    const rows = [];
    while (seenIds.size < targetCount && currentMaxFame > 0) {
        const minFame = currentMaxFame - 2000;
        const fameUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
            `?minFame=${minFame}&maxFame=${currentMaxFame}` +
            `&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=200&apikey=${apiKey}`;
        try {
            const fameResp = await axios_1.default.get(fameUrl);
            const fetched = fameResp.data.rows;
            if (fetched.length === 0) {
                console.log(`No characters in fame range [${minFame}, ${currentMaxFame}]. Continuing...`);
            }
            for (const row of fetched) {
                if (!seenIds.has(row.characterId)) {
                    seenIds.add(row.characterId);
                    rows.push(row);
                    if (seenIds.size >= targetCount)
                        break;
                }
            }
        }
        catch (err) {
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
        await db_1.default.query('BEGIN');
        await db_1.default.query(`DELETE FROM characters
       WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;`, [serverId, jobId, jobGrowId]);
        const insertQ = `
      INSERT INTO characters (character_id, server_id, job_id, job_grow_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (character_id) DO NOTHING;
    `;
        for (const r of topRows) {
            await db_1.default.query(insertQ, [
                r.characterId,
                r.serverId,
                r.jobId,
                r.jobGrowId,
            ]);
        }
        await db_1.default.query('COMMIT');
    }
    catch (err) {
        await db_1.default.query('ROLLBACK');
        console.error('Error storing characters in DB:', err.message);
        res.status(500).json({ error: 'Failed to store character data' });
        return;
    }
    res.json({ message: '100 character IDs inserted successfully for the given class.' });
};
exports.getCharacter = getCharacter;
