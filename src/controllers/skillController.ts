// src/controllers/skillController.ts
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

interface Skill {
  skillId:       string;
  name:          string;
  level:         number;
  requiredLevel: number;
}

interface SkillApiResponse {
  skill: {
    style?: {
      active?:  Skill[];
      passive?: Skill[];
    };
  };
}

interface SkillStatsRow {
  skill_id:       string;
  skill_name:     string;
  required_level: string;
  average_level:  string;
  total_count:    string;
}

// -------------------
// 1) FETCH & UPSERT SKILL DATA
// -------------------
export const fetchSkills: RequestHandler<{
  serverId: string;
  jobId:    string;
  jobGrowId: string;
}> = async (req, res) => {
  const { serverId, jobId, jobGrowId } = req.params;

  try {
    // 1) load character IDs
    const charQ = `
      SELECT character_id
      FROM characters
      WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
    `;
    const charRes = await client.query<CharacterRow>(charQ, [
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
        apiRes = await axios.get<SkillApiResponse>(url);
      } catch (err: any) {
        console.error(`Error fetching skills for ${character_id}:`, err.message);
        continue;
      }

      const style = apiRes.data.skill.style;
      if (!style) {
        console.log(`No skill data found for character ${character_id}`);
        continue;
      }

      const allSkills = [
        ...(style.active  ?? []),
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
          await client.query(upsertQ, [
            character_id,
            skillId,
            name,
            level,
            requiredLevel
          ]);
        } catch (err: any) {
          console.error(
            `Error inserting skill for ${character_id} (skill ${name}):`,
            err.message
          );
        }
      }
    }

    res.status(200).json({
      message: 'Skill data fetched and stored successfully.'
    });
  } catch (err: any) {
    console.error('Error processing skill data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// -------------------
// 2) GET SKILL STATS
// -------------------
export const getSkillStats: RequestHandler<{
  jobId:     string;
  jobGrowId: string;
}> = async (req, res) => {
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
    const statsRes = await client.query<SkillStatsRow>(statsQ, [
      jobId,
      jobGrowId
    ]);

    const skillStats = statsRes.rows.map((row) => ({
      skill_id:       row.skill_id,
      skill_name:     row.skill_name,
      required_level: parseInt(row.required_level, 10),
      average_level:  parseFloat(row.average_level),
      total_count:    parseInt(row.total_count, 10)
    }));

    res.json({ skillStats });
  } catch (err: any) {
    console.error('Error fetching skill stats:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
