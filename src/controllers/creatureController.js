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

      // Extract creature item ID and name
      const creatureItemId = creatureData.creature.itemId;
      const creatureItemName = creatureData.creature.itemName;

      // Initialize artifact IDs and names
      let artifactRed = null;
      let artifactBlue = null;
      let artifactGreen = null;
      let artifactRedName = null;
      let artifactBlueName = null;
      let artifactGreenName = null;

      if (creatureData.creature.artifact && Array.isArray(creatureData.creature.artifact)) {
        for (const art of creatureData.creature.artifact) {
          if (art.slotColor === 'RED') {
            artifactRed = art.itemId;
            artifactRedName = art.itemName;
          } else if (art.slotColor === 'BLUE') {
            artifactBlue = art.itemId;
            artifactBlueName = art.itemName;
          } else if (art.slotColor === 'GREEN') {
            artifactGreen = art.itemId;
            artifactGreenName = art.itemName;
          }
        }
      }

      const insertCreatureQuery = `
        INSERT INTO character_creature (
          character_id, 
          creature_item_id, creature_item_name, 
          artifact_red_item_id, artifact_red_item_name, 
          artifact_blue_item_id, artifact_blue_item_name, 
          artifact_green_item_id, artifact_green_item_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (character_id)
        DO UPDATE SET 
          creature_item_id = EXCLUDED.creature_item_id,
          creature_item_name = EXCLUDED.creature_item_name,
          artifact_red_item_id = EXCLUDED.artifact_red_item_id,
          artifact_red_item_name = EXCLUDED.artifact_red_item_name,
          artifact_blue_item_id = EXCLUDED.artifact_blue_item_id,
          artifact_blue_item_name = EXCLUDED.artifact_blue_item_name,
          artifact_green_item_id = EXCLUDED.artifact_green_item_id,
          artifact_green_item_name = EXCLUDED.artifact_green_item_name;
      `;
      try {
        await client.query(insertCreatureQuery, [
          characterId,
          creatureItemId, creatureItemName,
          artifactRed, artifactRedName,
          artifactBlue, artifactBlueName,
          artifactGreen, artifactGreenName
        ]);
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
    // 1. Creature main item usage (unchanged)
    const creatureQuery = `
      SELECT creature_item_id, creature_item_name, COUNT(*) AS usage_count
      FROM character_creature cc
      JOIN characters c ON cc.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
        AND creature_item_id IS NOT NULL
      GROUP BY creature_item_id, creature_item_name
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const creatureResult = await client.query(creatureQuery, [jobId, jobGrowId]);

    // 2. Artifact RED: group by name and pick representative ID
    const artifactRedQuery = `
      WITH red_counts AS (
        SELECT
          cc.artifact_red_item_name AS artifact_item_name,
          COUNT(*) AS usage_count,
          MIN(cc.artifact_red_item_id) AS artifact_item_id
        FROM character_creature cc
        JOIN characters c ON cc.character_id = c.character_id
        WHERE c.job_id = $1
          AND c.job_grow_id = $2
          AND cc.artifact_red_item_id IS NOT NULL
        GROUP BY cc.artifact_red_item_name
      )
      SELECT artifact_item_id, artifact_item_name, usage_count
      FROM red_counts
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const artifactRedResult = await client.query(artifactRedQuery, [jobId, jobGrowId]);

    // 3. Artifact BLUE
    const artifactBlueQuery = `
      WITH blue_counts AS (
        SELECT
          cc.artifact_blue_item_name AS artifact_item_name,
          COUNT(*) AS usage_count,
          MIN(cc.artifact_blue_item_id) AS artifact_item_id
        FROM character_creature cc
        JOIN characters c ON cc.character_id = c.character_id
        WHERE c.job_id = $1
          AND c.job_grow_id = $2
          AND cc.artifact_blue_item_id IS NOT NULL
        GROUP BY cc.artifact_blue_item_name
      )
      SELECT artifact_item_id, artifact_item_name, usage_count
      FROM blue_counts
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const artifactBlueResult = await client.query(artifactBlueQuery, [jobId, jobGrowId]);

    // 4. Artifact GREEN
    const artifactGreenQuery = `
      WITH green_counts AS (
        SELECT
          cc.artifact_green_item_name AS artifact_item_name,
          COUNT(*) AS usage_count,
          MIN(cc.artifact_green_item_id) AS artifact_item_id
        FROM character_creature cc
        JOIN characters c ON cc.character_id = c.character_id
        WHERE c.job_id = $1
          AND c.job_grow_id = $2
          AND cc.artifact_green_item_id IS NOT NULL
        GROUP BY cc.artifact_green_item_name
      )
      SELECT artifact_item_id, artifact_item_name, usage_count
      FROM green_counts
      ORDER BY usage_count DESC
      LIMIT 10;
    `;
    const artifactGreenResult = await client.query(artifactGreenQuery, [jobId, jobGrowId]);

    // 5. Map to JS
    const creatureStats = creatureResult.rows.map(r => ({
      creature_item_id: r.creature_item_id,
      creature_item_name: r.creature_item_name,
      usage_count: parseInt(r.usage_count, 10)
    }));

    const artifactRedStats = artifactRedResult.rows.map(r => ({
      artifact_item_id: r.artifact_item_id,
      artifact_item_name: r.artifact_item_name,
      usage_count: parseInt(r.usage_count, 10)
    }));
    const artifactBlueStats = artifactBlueResult.rows.map(r => ({
      artifact_item_id: r.artifact_item_id,
      artifact_item_name: r.artifact_item_name,
      usage_count: parseInt(r.usage_count, 10)
    }));
    const artifactGreenStats = artifactGreenResult.rows.map(r => ({
      artifact_item_id: r.artifact_item_id,
      artifact_item_name: r.artifact_item_name,
      usage_count: parseInt(r.usage_count, 10)
    }));

    // 6. Return JSON
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
