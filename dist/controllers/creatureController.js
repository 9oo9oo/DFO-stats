"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCreatureArtifactCombinations = exports.getCreatureStats = exports.fetchCreature = void 0;
// src/controllers/creatureController.ts
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../models/db"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
// -------------------
// 1) FETCH & UPSERT CREATURE DATA
// -------------------
const fetchCreature = async (req, res, next) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // load character IDs
        const charQ = `
      SELECT character_id 
      FROM characters
      WHERE server_id=$1 AND job_id=$2 AND job_grow_id=$3;
    `;
        const charRes = await db_1.default.query(charQ, [serverId, jobId, jobGrowId]);
        if (charRes.rows.length === 0) {
            res.status(404).json({ message: 'No character IDs found.' });
            return;
        }
        // for each character: fetch from API & upsert
        for (const { character_id } of charRes.rows) {
            const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${character_id}/equip/creature?apikey=${apiKey}`;
            let apiRes;
            try {
                apiRes = await axios_1.default.get(url);
            }
            catch (err) {
                console.error(`Error fetching creature for ${character_id}:`, err.message);
                continue;
            }
            const creatureData = apiRes.data.creature;
            if (!creatureData) {
                console.log(`No creature data for ${character_id}`);
                continue;
            }
            // extract creature and artifact fields
            const { itemId: creatureItemId, itemName: creatureItemName, artifact } = creatureData;
            let redId = null;
            let redName = null;
            let blueId = null;
            let blueName = null;
            let greenId = null;
            let greenName = null;
            if (Array.isArray(artifact)) {
                for (const art of artifact) {
                    switch (art.slotColor) {
                        case 'RED':
                            redId = art.itemId;
                            redName = art.itemName;
                            break;
                        case 'BLUE':
                            blueId = art.itemId;
                            blueName = art.itemName;
                            break;
                        case 'GREEN':
                            greenId = art.itemId;
                            greenName = art.itemName;
                            break;
                    }
                }
            }
            // upsert into character_creature
            const upsertQ = `
        INSERT INTO character_creature (
          character_id,
          creature_item_id,   creature_item_name,
          artifact_red_item_id,   artifact_red_item_name,
          artifact_blue_item_id,  artifact_blue_item_name,
          artifact_green_item_id, artifact_green_item_name
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (character_id)
        DO UPDATE SET
          creature_item_id         = EXCLUDED.creature_item_id,
          creature_item_name       = EXCLUDED.creature_item_name,
          artifact_red_item_id     = EXCLUDED.artifact_red_item_id,
          artifact_red_item_name   = EXCLUDED.artifact_red_item_name,
          artifact_blue_item_id    = EXCLUDED.artifact_blue_item_id,
          artifact_blue_item_name  = EXCLUDED.artifact_blue_item_name,
          artifact_green_item_id   = EXCLUDED.artifact_green_item_id,
          artifact_green_item_name = EXCLUDED.artifact_green_item_name;
      `;
            try {
                await db_1.default.query(upsertQ, [
                    character_id,
                    creatureItemId, creatureItemName,
                    redId, redName,
                    blueId, blueName,
                    greenId, greenName
                ]);
            }
            catch (err) {
                console.error(`Error upserting creature for ${character_id}:`, err.message);
            }
        }
        res.status(200).json({
            message: 'Creature data fetched and stored successfully.'
        });
    }
    catch (err) {
        console.error('Error in fetchCreature:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.fetchCreature = fetchCreature;
// -------------------
// 2) GET CREATURE & ARTIFACT STATS
// -------------------
const getCreatureStats = async (req, res) => {
    const { jobId, jobGrowId } = req.params;
    try {
        // creature stats
        const creatureQ = `
      SELECT
        creature_item_id   AS item_id,
        creature_item_name AS item_name,
        COUNT(*)           AS usage_count
      FROM character_creature cc
      JOIN characters c ON cc.character_id=c.character_id
      WHERE c.job_id=$1 AND c.job_grow_id=$2 AND cc.creature_item_id IS NOT NULL
      GROUP BY item_id, item_name
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
        const creatureRes = await db_1.default.query(creatureQ, [jobId, jobGrowId]);
        // artifact stats helper
        const artifactQ = (field) => `
      WITH counts AS (
        SELECT
          cc.${field}_item_name AS item_name,
          COUNT(*)             AS usage_count,
          MIN(cc.${field}_item_id) AS item_id
        FROM character_creature cc
        JOIN characters c ON cc.character_id=c.character_id
        WHERE c.job_id=$1 AND c.job_grow_id=$2 AND cc.${field}_item_id IS NOT NULL
        GROUP BY cc.${field}_item_name
      )
      SELECT item_id, item_name, usage_count
      FROM counts
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
        const [redRes, blueRes, greenRes] = await Promise.all([
            db_1.default.query(artifactQ('artifact_red'), [jobId, jobGrowId]),
            db_1.default.query(artifactQ('artifact_blue'), [jobId, jobGrowId]),
            db_1.default.query(artifactQ('artifact_green'), [jobId, jobGrowId]),
        ]);
        // map to front-end keys
        const creatureStats = creatureRes.rows.map(r => ({
            creature_item_id: r.item_id,
            creature_item_name: r.item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        const artifactRedStats = redRes.rows.map(r => ({
            artifact_item_id: r.item_id,
            artifact_item_name: r.item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        const artifactBlueStats = blueRes.rows.map(r => ({
            artifact_item_id: r.item_id,
            artifact_item_name: r.item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        const artifactGreenStats = greenRes.rows.map(r => ({
            artifact_item_id: r.item_id,
            artifact_item_name: r.item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        res.status(200).json({
            creatureStats,
            artifactRedStats,
            artifactBlueStats,
            artifactGreenStats
        });
    }
    catch (err) {
        console.error('Error in getCreatureStats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getCreatureStats = getCreatureStats;
// -------------------
// 3) GET CREATURE-ARTIFACT COMBINATIONS
// -------------------
const getCreatureArtifactCombinations = async (req, res) => {
    const { jobId, jobGrowId } = req.params;
    try {
        const comboQ = `
      SELECT
        cc.creature_item_id,
        cc.creature_item_name,
        cc.artifact_red_item_id   AS red_id,
        cc.artifact_red_item_name AS red_name,
        cc.artifact_blue_item_id  AS blue_id,
        cc.artifact_blue_item_nameAS blue_name,
        cc.artifact_green_item_id AS green_id,
        cc.artifact_green_item_name AS green_name,
        COUNT(*) AS usage_count
      FROM character_creature cc
      JOIN characters c ON cc.character_id=c.character_id
      WHERE c.job_id=$1 AND c.job_grow_id=$2
        AND cc.creature_item_id IS NOT NULL
        AND cc.artifact_red_item_id IS NOT NULL
        AND cc.artifact_blue_item_id IS NOT NULL
        AND cc.artifact_green_item_id IS NOT NULL
      GROUP BY
        cc.creature_item_id,
        cc.creature_item_name,
        cc.artifact_red_item_id,
        cc.artifact_red_item_name,
        cc.artifact_blue_item_id,
        cc.artifact_blue_item_name,
        cc.artifact_green_item_id,
        cc.artifact_green_item_name
      ORDER BY usage_count DESC
      LIMIT 20;
    `;
        const comboRes = await db_1.default.query(comboQ, [jobId, jobGrowId]);
        const combos = comboRes.rows.map(r => ({
            creature_item: { id: r.creature_item_id, name: r.creature_item_name },
            artifact_red: { id: r.red_id, name: r.red_name },
            artifact_blue: { id: r.blue_id, name: r.blue_name },
            artifact_green: { id: r.green_id, name: r.green_name },
            usage_count: parseInt(r.usage_count, 10),
        }));
        res.status(200).json({ combinationStats: combos });
    }
    catch (err) {
        console.error('Error in getCreatureArtifactCombinations:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getCreatureArtifactCombinations = getCreatureArtifactCombinations;
