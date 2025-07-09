"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTalismanRuneStats = exports.fetchTalismanAndRunes = void 0;
// src/controllers/talismanController.ts
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../models/db"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
// -------------------
// 1) FETCH & UPSERT TALISMAN & RUNES
// -------------------
const fetchTalismanAndRunes = async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // Load character IDs
        const charQ = `
      SELECT character_id
      FROM characters
      WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
    `;
        const charRes = await db_1.default.query(charQ, [serverId, jobId, jobGrowId]);
        if (charRes.rows.length === 0) {
            res.status(404).json({ message: 'No character IDs found for the specified class.' });
            return;
        }
        // Fetch & upsert for each character
        for (const { character_id } of charRes.rows) {
            const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${character_id}/equip/talisman?apikey=${apiKey}`;
            let apiRes;
            try {
                apiRes = await axios_1.default.get(url);
            }
            catch (err) {
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
                if (!t)
                    continue;
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
                        await db_1.default.query(upsertQ, [
                            character_id,
                            talismanSlotNo,
                            runeSlotNo,
                            talismanItemId,
                            talismanItemName,
                            runeItemId,
                            runeItemName
                        ]);
                    }
                    catch (err) {
                        console.error(`Error inserting data for ${character_id} (talisman slot ${talismanSlotNo}, rune slot ${runeSlotNo}):`, err.message);
                    }
                }
            }
        }
        res.status(200).json({
            message: 'Talisman and rune data fetched and stored successfully.'
        });
    }
    catch (err) {
        console.error('Error processing talisman and rune data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.fetchTalismanAndRunes = fetchTalismanAndRunes;
// -------------------
// 2) GET TALISMAN & RUNE STATS
// -------------------
const getTalismanRuneStats = async (req, res) => {
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
        const talismanRes = await db_1.default.query(talismanQ, [jobId, jobGrowId]);
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
        const runeRes = await db_1.default.query(runeQ, [jobId, jobGrowId]);
        // Map & limit to top 10
        const talismanStats = talismanRes.rows
            .map(r => ({
            talisman_item_id: r.talisman_item_id,
            talisman_item_name: r.talisman_item_name,
            usage_count: parseInt(r.usage_count, 10)
        }))
            .slice(0, 10);
        const runeStats = runeRes.rows
            .map(r => ({
            rune_item_id: r.rune_item_id,
            rune_item_name: r.rune_item_name,
            usage_count: parseInt(r.usage_count, 10)
        }))
            .slice(0, 10);
        res.json({ talismanStats, runeStats });
    }
    catch (err) {
        console.error('Error fetching talisman and rune stats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getTalismanRuneStats = getTalismanRuneStats;
