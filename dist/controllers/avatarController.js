"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvatarStats = exports.getAvatar = void 0;
// src/controllers/avatarController.ts
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../models/db"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
// Fetch & store avatars
const getAvatar = async (req, res, next) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // 1) Get character IDs
        const charQuery = `
      SELECT character_id
      FROM characters
      WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
    `;
        const charResult = await db_1.default.query(charQuery, [serverId, jobId, jobGrowId]);
        if (charResult.rows.length === 0) {
            res.status(404).json({ message: 'No character IDs found.' });
            return;
        }
        // 2) For each character, fetch from external API and upsert
        for (const { character_id } of charResult.rows) {
            const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${character_id}/equip/avatar?apikey=${apiKey}`;
            let apiResp;
            try {
                apiResp = await axios_1.default.get(url);
            }
            catch (err) {
                console.error(`Error fetching avatar ${character_id}:`, err.message);
                continue;
            }
            const avatarData = apiResp.data.avatar;
            if (!Array.isArray(avatarData)) {
                console.log(`No avatar data for ${character_id}`);
                continue;
            }
            for (const slot of avatarData) {
                const { slotId, slotName, itemId, itemName, itemRarity, optionAbility = null, emblems } = slot;
                // Upsert avatar
                const upsertAvatar = `
          INSERT INTO character_avatar
            (character_id, slot_id, slot_name, item_id, item_name, item_rarity, option_ability)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (character_id, slot_id)
          DO UPDATE SET
            slot_name     = EXCLUDED.slot_name,
            item_id       = EXCLUDED.item_id,
            item_name     = EXCLUDED.item_name,
            item_rarity   = EXCLUDED.item_rarity,
            option_ability= EXCLUDED.option_ability
          RETURNING id;
        `;
                let ins;
                try {
                    ins = await db_1.default.query(upsertAvatar, [
                        character_id, slotId, slotName, itemId, itemName, itemRarity, optionAbility
                    ]);
                }
                catch (err) {
                    console.error(`Insert avatar error ${character_id} slot ${slotId}:`, err.message);
                    continue;
                }
                const avatarRecordId = ins.rows[0].id;
                // Clear old emblems
                await db_1.default.query(`DELETE FROM character_avatar_emblems WHERE character_avatar_id = $1;`, [avatarRecordId]).catch(err => {
                    console.error(`Delete emblems ${avatarRecordId}:`, err.message);
                });
                // Insert new emblems
                if (Array.isArray(emblems)) {
                    for (const e of emblems) {
                        const { slotNo, slotColor, itemId: eid, itemName: ename, itemRarity: erarity } = e;
                        try {
                            await db_1.default.query(`INSERT INTO character_avatar_emblems
                  (character_avatar_id, slot_no, slot_color, item_id, item_name, item_rarity)
                  VALUES ($1,$2,$3,$4,$5,$6);`, [avatarRecordId, slotNo, slotColor, eid, ename, erarity]);
                        }
                        catch (err) {
                            console.error(`Insert emblem ${avatarRecordId}:`, err.message);
                        }
                    }
                }
            }
        }
        res.status(200).json({
            message: 'Avatar data fetched & stored successfully.'
        });
    }
    catch (err) {
        console.error('Error in getAvatar:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getAvatar = getAvatar;
// Fetch aggregated stats
const getAvatarStats = async (req, res) => {
    var _a;
    const { jobId, jobGrowId } = req.params;
    const orderedSlots = [
        'WEAPON', 'AURORA', 'HEADGEAR', 'HAIR', 'FACE',
        'BREAST', 'JACKET', 'PANTS', 'WAIST', 'SHOES', 'SKIN'
    ];
    try {
        // Weapon & Aurora
        const wepQuery = `
      WITH wea_counts AS (
        SELECT ca.slot_id, ca.item_name, COUNT(*) AS usage_count, MIN(ca.item_id) AS item_id
        FROM character_avatar ca
        JOIN characters c ON ca.character_id = c.character_id
        WHERE c.job_id=$1 AND c.job_grow_id=$2 AND ca.slot_id IN ('WEAPON','AURORA')
        GROUP BY ca.slot_id, ca.item_name
      )
      SELECT slot_id, item_id, item_name, NULL::text AS option_ability, usage_count
      FROM wea_counts
      ORDER BY slot_id, usage_count DESC;
    `;
        const wepRes = await db_1.default.query(wepQuery, [jobId, jobGrowId]);
        // Other slots
        const optQuery = `
      SELECT ca.slot_id, NULL::uuid AS item_id, NULL::text AS item_name,
             ca.option_ability, COUNT(*) AS usage_count
      FROM character_avatar ca
      JOIN characters c ON ca.character_id = c.character_id
      WHERE c.job_id=$1 AND c.job_grow_id=$2 AND ca.slot_id NOT IN ('WEAPON','AURORA')
      GROUP BY ca.slot_id, ca.option_ability
      ORDER BY ca.slot_id, usage_count DESC;
    `;
        const optRes = await db_1.default.query(optQuery, [jobId, jobGrowId]);
        // Emblems
        const emblemQuery = `
      WITH em_counts AS (
        SELECT cae.slot_color, cae.item_name, COUNT(*) AS usage_count, MIN(cae.item_id) AS item_id
        FROM character_avatar_emblems cae
        JOIN character_avatar ca ON cae.character_avatar_id = ca.id
        JOIN characters c ON ca.character_id = c.character_id
        WHERE c.job_id=$1 AND c.job_grow_id=$2
        GROUP BY cae.slot_color, cae.item_name
      )
      SELECT slot_color, item_id, item_name, usage_count
      FROM em_counts
      ORDER BY
        CASE LOWER(slot_color)
          WHEN 'multicolored' THEN 1 WHEN 'platinum' THEN 2
          WHEN 'blue' THEN 3 WHEN 'yellow' THEN 4
          WHEN 'green' THEN 5 WHEN 'red' THEN 6 ELSE 7
        END,
        usage_count DESC;
    `;
        const emblemRes = await db_1.default.query(emblemQuery, [jobId, jobGrowId]);
        // Merge avatar rows
        const rawAvatar = [...wepRes.rows, ...optRes.rows];
        const avatarStatsBySlot = {};
        for (const row of rawAvatar) {
            const count = parseInt(row.usage_count, 10);
            avatarStatsBySlot[_a = row.slot_id] ?? (avatarStatsBySlot[_a] = []);
            avatarStatsBySlot[row.slot_id].push({
                slot: row.slot_id,
                item_id: row.item_id,
                item_name: row.item_name,
                option_ability: row.option_ability,
                usage_count: count,
            });
        }
        // Ensure all slots and top 10
        for (const slot of orderedSlots) {
            avatarStatsBySlot[slot] = (avatarStatsBySlot[slot] || []).slice(0, 10);
        }
        // Process emblems
        const emblemStatsByColor = {};
        for (const row of emblemRes.rows) {
            const color = row.slot_color.toLowerCase();
            emblemStatsByColor[color] ?? (emblemStatsByColor[color] = []);
            emblemStatsByColor[color].push({
                slot_color: color,
                item_id: row.item_id,
                item_name: row.item_name,
                usage_count: parseInt(row.usage_count, 10),
            });
            emblemStatsByColor[color] = emblemStatsByColor[color].slice(0, 10);
        }
        res.json({ avatarStatsBySlot, emblemStatsByColor });
    }
    catch (err) {
        console.error('Error in getAvatarStats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getAvatarStats = getAvatarStats;
