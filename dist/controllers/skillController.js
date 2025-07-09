"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkillStats = exports.fetchSkills = void 0;
// src/controllers/skillController.ts
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../models/db"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
// -------------------
// 1) FETCH & UPSERT SKILL DATA
// -------------------
const fetchSkills = async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // 1) load character IDs
        const charQ = `
      SELECT character_id
      FROM characters
      WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
    `;
        const charRes = await db_1.default.query(charQ, [
            serverId,
            jobId,
            jobGrowId
        ]);
        if (charRes.rows.length === 0) {
            res.status(404).json({
                message: 'No character IDs found for the specified class.'
            });
            return;
        }
        // 2) fetch & upsert per character
        for (const { character_id } of charRes.rows) {
            const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${character_id}/skill/style?apikey=${apiKey}`;
            let apiRes;
            try {
                apiRes = await axios_1.default.get(url);
            }
            catch (err) {
                console.error(`Error fetching skills for ${character_id}:`, err.message);
                continue;
            }
            const style = apiRes.data.skill.style;
            if (!style) {
                console.log(`No skill data found for character ${character_id}`);
                continue;
            }
            const allSkills = [
                ...(style.active ?? []),
                ...(style.passive ?? [])
            ];
            for (const sk of allSkills) {
                const { skillId, name, level, requiredLevel } = sk;
                const upsertQ = `
          INSERT INTO character_skills
            (character_id, skill_id, skill_name, level, required_level)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (character_id, skill_id)
          DO UPDATE SET
            skill_name     = EXCLUDED.skill_name,
            level          = EXCLUDED.level,
            required_level = EXCLUDED.required_level;
        `;
                try {
                    await db_1.default.query(upsertQ, [
                        character_id,
                        skillId,
                        name,
                        level,
                        requiredLevel
                    ]);
                }
                catch (err) {
                    console.error(`Error inserting skill for ${character_id} (skill ${name}):`, err.message);
                }
            }
        }
        res.status(200).json({
            message: 'Skill data fetched and stored successfully.'
        });
    }
    catch (err) {
        console.error('Error processing skill data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.fetchSkills = fetchSkills;
// -------------------
// 2) GET SKILL STATS
// -------------------
const getSkillStats = async (req, res) => {
    const { jobId, jobGrowId } = req.params;
    try {
        const statsQ = `
      SELECT
        cs.skill_id,
        cs.skill_name,
        cs.required_level,
        AVG(cs.level)   AS average_level,
        COUNT(*)        AS total_count
      FROM character_skills cs
      JOIN characters c ON cs.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
      GROUP BY
        cs.skill_id,
        cs.skill_name,
        cs.required_level
      ORDER BY cs.required_level ASC;
    `;
        const statsRes = await db_1.default.query(statsQ, [
            jobId,
            jobGrowId
        ]);
        const skillStats = statsRes.rows.map((row) => ({
            skill_id: row.skill_id,
            skill_name: row.skill_name,
            required_level: parseInt(row.required_level, 10),
            average_level: parseFloat(row.average_level),
            total_count: parseInt(row.total_count, 10)
        }));
        res.json({ skillStats });
    }
    catch (err) {
        console.error('Error fetching skill stats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getSkillStats = getSkillStats;
