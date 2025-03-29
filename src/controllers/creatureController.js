// controllers/creatureController.js
const axios = require('axios');
const client = require('../models/db');
const apiKey = process.env.DFO_API_KEY;

exports.fetchCreature = async (req, res) => {
  const { serverId, jobId, jobGrowId } = req.params;
  try {
    const getCharacterIdsQuery = `
      SELECT character_id 
      FROM characters
      WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
    `;
    const { rows } = await client.query(getCharacterIdsQuery, [serverId, jobId, jobGrowId]);

    if (!rows.length) {
      return res.status(404).json({ message: 'No character IDs found for the specified class.' });
    }

    for (const row of rows) {
      const characterId = row.character_id;
      const creatureUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/creature?apikey=${apiKey}`;
      let creatureResponse;
      try {
        creatureResponse = await axios.get(creatureUrl);
      } catch (error) {
        console.error(`Error fetching creature data for ${characterId}:`, error.message);
        continue;
      }

      const creatureData = creatureResponse.data;
      if (!creatureData || !creatureData.creature) {
        console.log(`No creature data found for character ${characterId}`);
        continue;
      }

      const creatureItemId = creatureData.creature.itemId;
      let artifactRed = null;
      let artifactBlue = null;
      let artifactGreen = null;
      if (creatureData.creature.artifact && Array.isArray(creatureData.creature.artifact)) {
        for (const art of creatureData.creature.artifact) {
          if (art.slotColor === 'RED') {
            artifactRed = art.itemId;
          } else if (art.slotColor === 'BLUE') {
            artifactBlue = art.itemId;
          } else if (art.slotColor === 'GREEN') {
            artifactGreen = art.itemId;
          }
        }
      }

      const insertCreatureQuery = `
        INSERT INTO character_creature (character_id, creature_item_id, artifact_red_item_id, artifact_blue_item_id, artifact_green_item_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (character_id)
        DO UPDATE SET 
          creature_item_id = EXCLUDED.creature_item_id,
          artifact_red_item_id = EXCLUDED.artifact_red_item_id,
          artifact_blue_item_id = EXCLUDED.artifact_blue_item_id,
          artifact_green_item_id = EXCLUDED.artifact_green_item_id;
      `;
      try {
        await client.query(insertCreatureQuery, [characterId, creatureItemId, artifactRed, artifactBlue, artifactGreen]);
      } catch (error) {
        console.error(`Error inserting creature data for ${characterId}:`, error.message);
      }
    }

    res.status(200).json({
      message: 'Creature data fetched and stored successfully for the retrieved character IDs.',
    });
  } catch (error) {
    console.error('Error processing creature data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getCreatureStats = async (req, res) => {
  const { jobId, jobGrowId } = req.params;
  try {
    // Aggregate creature main item usage.
    const creatureQuery = `
      SELECT creature_item_id, COUNT(*) AS usage_count
      FROM character_creature cc
      JOIN characters c ON cc.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
        AND creature_item_id IS NOT NULL
      GROUP BY creature_item_id
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const creatureResult = await client.query(creatureQuery, [jobId, jobGrowId]);

    // Aggregate artifact RED usage.
    const artifactRedQuery = `
      SELECT artifact_red_item_id AS artifact_item_id, COUNT(*) AS usage_count
      FROM character_creature cc
      JOIN characters c ON cc.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
        AND artifact_red_item_id IS NOT NULL
      GROUP BY artifact_red_item_id
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const artifactRedResult = await client.query(artifactRedQuery, [jobId, jobGrowId]);

    // Aggregate artifact BLUE usage.
    const artifactBlueQuery = `
      SELECT artifact_blue_item_id AS artifact_item_id, COUNT(*) AS usage_count
      FROM character_creature cc
      JOIN characters c ON cc.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
        AND artifact_blue_item_id IS NOT NULL
      GROUP BY artifact_blue_item_id
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const artifactBlueResult = await client.query(artifactBlueQuery, [jobId, jobGrowId]);

    // Aggregate artifact GREEN usage.
    const artifactGreenQuery = `
      SELECT artifact_green_item_id AS artifact_item_id, COUNT(*) AS usage_count
      FROM character_creature cc
      JOIN characters c ON cc.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
        AND artifact_green_item_id IS NOT NULL
      GROUP BY artifact_green_item_id
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const artifactGreenResult = await client.query(artifactGreenQuery, [jobId, jobGrowId]);

    const creatureStats = creatureResult.rows.map(row => ({
      creature_item_id: row.creature_item_id,
      usage_count: parseInt(row.usage_count, 10)
    }));

    const artifactRedStats = artifactRedResult.rows.map(row => ({
      artifact_item_id: row.artifact_item_id,
      usage_count: parseInt(row.usage_count, 10)
    }));

    const artifactBlueStats = artifactBlueResult.rows.map(row => ({
      artifact_item_id: row.artifact_item_id,
      usage_count: parseInt(row.usage_count, 10)
    }));

    const artifactGreenStats = artifactGreenResult.rows.map(row => ({
      artifact_item_id: row.artifact_item_id,
      usage_count: parseInt(row.usage_count, 10)
    }));

    res.status(200).json({
      creatureStats,
      artifactRedStats,
      artifactBlueStats,
      artifactGreenStats
    });
  } catch (error) {
    console.error('Error fetching creature stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
