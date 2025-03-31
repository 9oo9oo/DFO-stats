// controllers/skillController.js
const axios = require('axios');
const client = require('../models/db');
const apiKey = process.env.DFO_API_KEY;

exports.fetchSkills = async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // Fetch character IDs for the specified class
        const getCharacterIdsQuery = `
        SELECT character_id 
        FROM characters
        WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
      `;
        const { rows } = await client.query(getCharacterIdsQuery, [serverId, jobId, jobGrowId]);

        if (!rows.length) {
            return res.status(404).json({ message: 'No character IDs found for the specified class.' });
        }

        // Iterate through each character
        for (const row of rows) {
            const characterId = row.character_id;
            const skillUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/skill/style?apikey=${apiKey}`;
            let skillResponse;
            try {
                skillResponse = await axios.get(skillUrl);
            } catch (error) {
                console.error(`Error fetching skills for ${characterId}:`, error.message);
                continue;
            }

            const skillData = skillResponse.data;
            if (!skillData || !skillData.skill || !skillData.skill.style) {
                console.log(`No skill data found for character ${characterId}`);
                continue;
            }

            // Retrieve active and passive skills from the API response
            const activeSkills = skillData.skill.style.active || [];
            const passiveSkills = skillData.skill.style.passive || [];
            const allSkills = [...activeSkills, ...passiveSkills];

            // Iterate through each skill and insert/update into the character_skills table
            for (const skill of allSkills) {
                const { skillId, name, level, requiredLevel } = skill;
                const insertSkillQuery = `
            INSERT INTO character_skills (character_id, skill_id, skill_name, level, required_level)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (character_id, skill_id)
            DO UPDATE SET 
                skill_name = EXCLUDED.skill_name,
                level = EXCLUDED.level,
                required_level = EXCLUDED.required_level;
          `;
                try {
                    await client.query(insertSkillQuery, [characterId, skillId, name, level, requiredLevel]);
                } catch (error) {
                    console.error(`Error inserting skill for ${characterId} (skill ${name}):`, error.message);
                }
            }
        }

        res.status(200).json({
            message: 'Skill data fetched and stored successfully for the retrieved character IDs.',
        });
    } catch (error) {
        console.error('Error processing skill data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getSkillStats = async (req, res) => {
    const { jobId, jobGrowId } = req.params;

    try {
        // Aggregate the average level for each skill for characters of the given class,
        // including required_level and sorted in ascending order by required_level.
        const skillStatsQuery = `
        SELECT cs.skill_id, cs.skill_name, cs.required_level, AVG(cs.level) AS average_level, COUNT(*) AS total_count
        FROM character_skills cs
        JOIN characters c ON cs.character_id = c.character_id
        WHERE c.job_id = $1 AND c.job_grow_id = $2
        GROUP BY cs.skill_id, cs.skill_name, cs.required_level
        ORDER BY cs.required_level ASC;
      `;
        const { rows } = await client.query(skillStatsQuery, [jobId, jobGrowId]);

        // Format the result rows.
        const skillStats = rows.map(row => ({
            skill_id: row.skill_id,
            skill_name: row.skill_name,
            required_level: parseInt(row.required_level, 10),
            average_level: parseFloat(row.average_level),
            total_count: parseInt(row.total_count, 10)
        }));

        res.status(200).json({ skillStats });
    } catch (error) {
        console.error('Error fetching skill stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
