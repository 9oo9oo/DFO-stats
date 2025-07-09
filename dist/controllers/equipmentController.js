"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEquipmentCombinations = exports.getEquipmentStats = exports.fetchEquipment = void 0;
// src/controllers/equipmentController.ts
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../models/db"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
// -------------------
// 1) FETCH & UPSERT EQUIPMENT DATA
// -------------------
const fetchEquipment = async (req, res, next) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // Load character IDs
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
        // Fetch & upsert per character
        for (const { character_id } of charRes.rows) {
            const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${character_id}/equip/equipment?apikey=${apiKey}`;
            let apiRes;
            try {
                apiRes = await axios_1.default.get(url);
            }
            catch (err) {
                console.error(`Error fetching equipment for ${character_id}:`, err.message);
                continue;
            }
            const equipmentData = apiRes.data.equipment;
            if (!Array.isArray(equipmentData)) {
                console.log(`No equipment data for ${character_id}`);
                continue;
            }
            for (const equip of equipmentData) {
                const { slotId, itemId, itemName, setItemId, setItemName, upgradeInfo } = equip;
                const fusionItemId = (slotId !== 'WEAPON' && upgradeInfo?.itemId) ?? null;
                const fusionItemName = (slotId !== 'WEAPON' && upgradeInfo?.itemName) ?? null;
                const upsertQ = `
          INSERT INTO character_equipment (
            character_id, slot_id,
            item_id, set_item_id, fusion_item_id,
            item_name, set_item_name, fusion_item_name
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (character_id, slot_id) DO UPDATE SET
            item_id          = EXCLUDED.item_id,
            set_item_id      = EXCLUDED.set_item_id,
            fusion_item_id   = EXCLUDED.fusion_item_id,
            item_name        = EXCLUDED.item_name,
            set_item_name    = EXCLUDED.set_item_name,
            fusion_item_name = EXCLUDED.fusion_item_name;
        `;
                try {
                    await db_1.default.query(upsertQ, [
                        character_id,
                        slotId,
                        itemId,
                        setItemId,
                        fusionItemId,
                        itemName,
                        setItemName,
                        fusionItemName
                    ]);
                }
                catch (err) {
                    console.error(`Error upserting equipment for ${character_id} (${slotId}):`, err.message);
                }
            }
        }
        res.status(200).json({
            message: 'Equipment data fetched and stored successfully.'
        });
    }
    catch (err) {
        console.error('Error in fetchEquipment:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.fetchEquipment = fetchEquipment;
// -------------------
// 2) GET EQUIPMENT STATS
// -------------------
const getEquipmentStats = async (req, res) => {
    const { jobId, jobGrowId } = req.params;
    const orderedSlots = [
        "TITLE", "WEAPON", "JACKET", "SHOULDER", "PANTS", "SHOES",
        "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
    ];
    try {
        // TITLE
        const titleQ = `
      WITH title_counts AS (
        SELECT item_name, COUNT(*) AS usage_count, MIN(item_id) AS item_id
        FROM character_equipment ce
        JOIN characters c ON ce.character_id=c.character_id
        WHERE c.job_id=$1 AND c.job_grow_id=$2 AND ce.slot_id='TITLE'
        GROUP BY item_name
      )
      SELECT 'TITLE' AS slot_id, item_id, item_name, usage_count
      FROM title_counts
      ORDER BY usage_count DESC;
    `;
        const titleRes = await db_1.default.query(titleQ, [jobId, jobGrowId]);
        // Other items (exclude nulls)
        const itemsQ = `
      SELECT slot_id, item_id, item_name, COUNT(*) AS usage_count
      FROM character_equipment ce
      JOIN characters c ON ce.character_id=c.character_id
      WHERE c.job_id=$1
        AND c.job_grow_id=$2
        AND ce.slot_id<>'TITLE'
        AND ce.item_id IS NOT NULL
      GROUP BY slot_id, item_id, item_name
      ORDER BY slot_id, usage_count DESC;
    `;
        const itemsRes = await db_1.default.query(itemsQ, [jobId, jobGrowId]);
        // Fusion items
        const fusionQ = `
      SELECT slot_id, fusion_item_id, fusion_item_name, COUNT(*) AS usage_count
      FROM character_equipment ce
      JOIN characters c ON ce.character_id=c.character_id
      WHERE c.job_id=$1 AND c.job_grow_id=$2 AND fusion_item_id IS NOT NULL
      GROUP BY slot_id, fusion_item_id, fusion_item_name
      ORDER BY slot_id, usage_count DESC;
    `;
        const fusionRes = await db_1.default.query(fusionQ, [jobId, jobGrowId]);
        // Set usage
        const setQ = `
      WITH set_counts AS (
        SELECT ce.character_id, ce.set_item_id, ce.set_item_name, COUNT(*) AS cnt
        FROM character_equipment ce
        JOIN characters c ON ce.character_id=c.character_id
        WHERE ce.slot_id<>'WEAPON' AND set_item_id IS NOT NULL
          AND c.job_id=$1 AND c.job_grow_id=$2
        GROUP BY ce.character_id, set_item_id, set_item_name
      ), effective_sets AS (
        SELECT character_id, set_item_id, set_item_name, cnt,
          ROW_NUMBER() OVER (PARTITION BY character_id ORDER BY cnt DESC) AS rn
        FROM set_counts
      )
      SELECT set_item_id, set_item_name, COUNT(*) AS usage_count
      FROM effective_sets
      WHERE rn=1
      GROUP BY set_item_id, set_item_name
      ORDER BY usage_count DESC;
    `;
        const setRes = await db_1.default.query(setQ, [jobId, jobGrowId]);
        // Samples for normal items
        const sampleQ = `
      SELECT slot_id, COUNT(*) AS sample_number
      FROM character_equipment ce
      JOIN characters c ON ce.character_id=c.character_id
      WHERE c.job_id=$1 AND c.job_grow_id=$2
      GROUP BY slot_id;
    `;
        const sampleRes = await db_1.default.query(sampleQ, [jobId, jobGrowId]);
        const sampleNumbers = {};
        sampleRes.rows.forEach(r => {
            sampleNumbers[r.slot_id] = parseInt(r.sample_number, 10);
        });
        // Samples for fusion items
        const fusionSampleQ = `
      SELECT slot_id, COUNT(*) AS sample_number
      FROM character_equipment ce
      JOIN characters c ON ce.character_id=c.character_id
      WHERE c.job_id=$1 AND c.job_grow_id=$2 AND fusion_item_id IS NOT NULL
      GROUP BY slot_id;
    `;
        const fusionSampleRes = await db_1.default.query(fusionSampleQ, [jobId, jobGrowId]);
        const fusionSampleNumbers = {};
        fusionSampleRes.rows.forEach(r => {
            fusionSampleNumbers[r.slot_id] = parseInt(r.sample_number, 10);
        });
        // Map stats
        const titleStats = titleRes.rows.map(r => ({
            slot: 'TITLE',
            item_id: r.item_id,
            item_name: r.item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        const itemsStats = itemsRes.rows.map(r => ({
            slot: r.slot_id,
            item_id: r.item_id,
            item_name: r.item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        const fusionStats = fusionRes.rows.map(r => ({
            slot: r.slot_id,
            fusion_item_id: r.fusion_item_id,
            fusion_item_name: r.fusion_item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        const setStats = setRes.rows.map(r => ({
            set_item_id: r.set_item_id,
            set_item_name: r.set_item_name,
            usage_count: parseInt(r.usage_count, 10),
        }));
        // Group by slot & compute usage rates
        const itemsBySlot = {};
        const fusionBySlot = {};
        orderedSlots.forEach(slot => {
            itemsBySlot[slot] = [];
            fusionBySlot[slot] = [];
        });
        titleStats.forEach(s => itemsBySlot['TITLE'].push(s));
        itemsStats.forEach(s => {
            if (itemsBySlot[s.slot])
                itemsBySlot[s.slot].push(s);
        });
        fusionStats.forEach(s => {
            if (fusionBySlot[s.slot])
                fusionBySlot[s.slot].push(s);
        });
        orderedSlots.forEach(slot => {
            const total = sampleNumbers[slot] || 0;
            itemsBySlot[slot] = itemsBySlot[slot]
                .map(s => ({
                ...s,
                usage_rate: total > 0
                    ? parseFloat((s.usage_count / total).toFixed(2))
                    : 0
            }))
                .slice(0, 10);
            const fTotal = fusionSampleNumbers[slot] || 0;
            fusionBySlot[slot] = fusionBySlot[slot]
                .map(s => ({
                ...s,
                usage_rate: fTotal > 0
                    ? parseFloat((s.usage_count / fTotal).toFixed(2))
                    : 0
            }))
                .slice(0, 10);
        });
        // Compute set usage rate
        const setSampleQ2 = `
      SELECT COUNT(DISTINCT ce.character_id) AS sample_number
      FROM character_equipment ce
      JOIN characters c ON ce.character_id=c.character_id
      WHERE ce.slot_id<>'WEAPON'
        AND ce.set_item_id IS NOT NULL
        AND c.job_id=$1 AND c.job_grow_id=$2;
    `;
        const setSampleRes2 = await db_1.default.query(setSampleQ2, [jobId, jobGrowId]);
        const setTotal = setSampleRes2.rows[0]
            ? parseInt(setSampleRes2.rows[0].sample_number, 10)
            : 0;
        const setWithRate = setStats.map(s => ({
            ...s,
            usage_rate: setTotal > 0
                ? parseFloat((s.usage_count / setTotal).toFixed(2))
                : 0
        }));
        res.status(200).json({
            itemsBySlot,
            fusionItemsBySlot: fusionBySlot,
            setUsage: setWithRate
        });
    }
    catch (err) {
        console.error('Error in getEquipmentStats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getEquipmentStats = getEquipmentStats;
// -------------------
// 3) GET EQUIPMENT COMBINATIONS
// -------------------
const getEquipmentCombinations = async (req, res) => {
    const { jobId, jobGrowId } = req.params;
    const combos = {
        core: ['JACKET', 'SHOULDER', 'PANTS', 'WAIST', 'SHOES'],
        jewels: ['WRIST', 'RING', 'AMULET'],
        extras: ['SUPPORT', 'MAGIC_STON', 'EARRING']
    };
    // Helper to build SQL for combos
    const makeComboQ = (slots, useFusion = false) => {
        const joins = slots.map((slot, i) => `
      LEFT JOIN character_equipment s${i}
        ON s${i}.character_id = c.character_id
       AND s${i}.slot_id = '${slot}'
    `).join('\n');
        const selects = slots.map((slot, i) => {
            const col = useFusion ? 'fusion_item_id' : 'item_id';
            const name = useFusion ? 'fusion_item_name' : 'item_name';
            const key = slot.toLowerCase();
            return `s${i}.${col} AS ${key}_id, s${i}.${name} AS ${key}_name`;
        }).join(',\n');
        const groupBys = slots.map((slot, i) => {
            const col = useFusion ? 'fusion_item_id' : 'item_id';
            const name = useFusion ? 'fusion_item_name' : 'item_name';
            return `s${i}.${col}, s${i}.${name}`;
        }).join(', ');
        return `
      SELECT ${selects}, COUNT(*) AS usage_count
      FROM characters c
      ${joins}
      WHERE c.job_id=$1 AND c.job_grow_id=$2
      GROUP BY ${groupBys}
      ORDER BY usage_count DESC
      LIMIT 5;
    `;
    };
    try {
        const results = {};
        for (const [group, slots] of Object.entries(combos)) {
            const normalQ = makeComboQ(slots, false);
            const { rows: normalRows } = await db_1.default.query(normalQ, [jobId, jobGrowId]);
            results[group] = normalRows;
            const fusionQ = makeComboQ(slots, true);
            const { rows: fusionRows } = await db_1.default.query(fusionQ, [jobId, jobGrowId]);
            results[`${group}Fusion`] = fusionRows;
        }
        res.json(results);
    }
    catch (err) {
        console.error('Error in getEquipmentCombinations:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getEquipmentCombinations = getEquipmentCombinations;
