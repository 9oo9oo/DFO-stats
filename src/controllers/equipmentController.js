// controllers/equipmentController.js
const axios = require('axios');
const client = require('../models/db');
const apiKey = process.env.DFO_API_KEY;

exports.fetchEquipment = async (req, res) => {
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
      const equipmentUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/equipment?apikey=${apiKey}`;
      let equipmentResponse;
      try {
        equipmentResponse = await axios.get(equipmentUrl);
      } catch (error) {
        console.error(`Error fetching equipment for ${characterId}:`, error.message);
        continue;
      }

      const equipmentData = equipmentResponse.data;
      if (!equipmentData || !equipmentData.equipment) {
        console.log(`No equipment data found for character ${characterId}`);
        continue;
      }

      for (const equip of equipmentData.equipment) {
        const itemId = equip.itemId;
        const itemName = equip.itemName;
        const setItemId = equip.setItemId;
        const setItemName = equip.setItemName;
        let fusionItemId = null;
        let fusionItemName = null;
        if (equip.slotId !== 'WEAPON' && equip.upgradeInfo && equip.upgradeInfo.itemId) {
          fusionItemId = equip.upgradeInfo.itemId;
          fusionItemName = equip.upgradeInfo.itemName;
        }

        const insertEquipmentQuery = `
          INSERT INTO character_equipment (character_id, slot_id, item_id, set_item_id, fusion_item_id, item_name, set_item_name, fusion_item_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (character_id, slot_id)
          DO UPDATE SET 
              item_id = EXCLUDED.item_id,
              set_item_id = EXCLUDED.set_item_id,
              fusion_item_id = EXCLUDED.fusion_item_id,
              item_name = EXCLUDED.item_name,
              set_item_name = EXCLUDED.set_item_name,
              fusion_item_name = EXCLUDED.fusion_item_name;
        `;
        try {
          await client.query(insertEquipmentQuery, [
            characterId,
            equip.slotId,
            itemId,
            setItemId,
            fusionItemId,
            itemName,
            setItemName,
            fusionItemName,
          ]);
        } catch (error) {
          console.error(`Error inserting equipment for ${characterId} (slot ${equip.slotId}):`, error.message);
        }
      }
    }

    res.status(200).json({
      message: 'Equipment data fetched and stored successfully for the retrieved character IDs.',
    });
  } catch (error) {
    console.error('Error processing equipment data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getEquipmentStats = async (req, res) => {
  const { jobId, jobGrowId } = req.params;
  const orderedSlots = [
    "TITLE", "WEAPON", "JACKET", "SHOULDER", "PANTS", "SHOES",
    "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
  ];

  try {
    // 1. Aggregate TITLE items by name and pick one representative ID
    const titleQuery = `
      WITH title_counts AS (
        SELECT
          ce.item_name,
          COUNT(*) AS usage_count,
          MIN(ce.item_id) AS item_id
        FROM character_equipment ce
        JOIN characters c ON ce.character_id = c.character_id
        WHERE c.job_id = $1
          AND c.job_grow_id = $2
          AND ce.slot_id = 'TITLE'
        GROUP BY ce.item_name
      )
      SELECT
        'TITLE'    AS slot_id,
        item_id,
        item_name,
        usage_count
      FROM title_counts
      ORDER BY usage_count DESC;
    `;
    const titleResult = await client.query(titleQuery, [jobId, jobGrowId]);

    // 2. Aggregate all other items normally (excluding TITLE)
    const itemsQuery = `
      SELECT 
        ce.slot_id,
        ce.item_id,
        ce.item_name,
        COUNT(*) AS usage_count
      FROM character_equipment ce
      JOIN characters c ON ce.character_id = c.character_id
      WHERE c.job_id = $1
        AND c.job_grow_id = $2
        AND ce.slot_id <> 'TITLE'
      GROUP BY ce.slot_id, ce.item_id, ce.item_name
      ORDER BY ce.slot_id, usage_count DESC;
    `;
    const itemsResult = await client.query(itemsQuery, [jobId, jobGrowId]);

    // 3. Fusion items (unchanged)
    const fusionQuery = `
      SELECT ce.slot_id, ce.fusion_item_id, ce.fusion_item_name, COUNT(*) AS usage_count
      FROM character_equipment ce
      JOIN characters c ON ce.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2 AND ce.fusion_item_id IS NOT NULL
      GROUP BY ce.slot_id, ce.fusion_item_id, ce.fusion_item_name
      ORDER BY ce.slot_id, usage_count DESC;
    `;
    const fusionResult = await client.query(fusionQuery, [jobId, jobGrowId]);

    // 4. Set usage (unchanged)
    const setQuery = `
      WITH set_counts AS (
        SELECT ce.character_id, ce.set_item_id, ce.set_item_name, COUNT(*) AS cnt
        FROM character_equipment ce
        JOIN characters c ON ce.character_id = c.character_id
        WHERE ce.slot_id <> 'WEAPON' AND ce.set_item_id IS NOT NULL
          AND c.job_id = $1 AND c.job_grow_id = $2
        GROUP BY ce.character_id, ce.set_item_id, ce.set_item_name
      ),
      effective_sets AS (
        SELECT character_id, set_item_id, set_item_name, cnt,
          ROW_NUMBER() OVER (PARTITION BY character_id ORDER BY cnt DESC) AS rn
        FROM set_counts
      )
      SELECT set_item_id, set_item_name, COUNT(*) AS usage_count
      FROM effective_sets
      WHERE rn = 1
      GROUP BY set_item_id, set_item_name
      ORDER BY usage_count DESC;
    `;
    const setResult = await client.query(setQuery, [jobId, jobGrowId]);

    // 5. Sample counts for regular items
    const sampleQuery = `
      SELECT ce.slot_id, COUNT(*) AS sample_number
      FROM character_equipment ce
      JOIN characters c ON ce.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2
      GROUP BY ce.slot_id;
    `;
    const sampleResult = await client.query(sampleQuery, [jobId, jobGrowId]);
    const sampleNumbers = {};
    sampleResult.rows.forEach(row => {
      sampleNumbers[row.slot_id] = parseInt(row.sample_number, 10);
    });

    // 6. Sample counts for fusion items
    const fusionSampleQuery = `
      SELECT ce.slot_id, COUNT(*) AS sample_number
      FROM character_equipment ce
      JOIN characters c ON ce.character_id = c.character_id
      WHERE c.job_id = $1 AND c.job_grow_id = $2 AND ce.fusion_item_id IS NOT NULL
      GROUP BY ce.slot_id;
    `;
    const fusionSampleResult = await client.query(fusionSampleQuery, [jobId, jobGrowId]);
    const fusionSampleNumbers = {};
    fusionSampleResult.rows.forEach(row => {
      fusionSampleNumbers[row.slot_id] = parseInt(row.sample_number, 10);
    });

    // 7. Sample for sets (distinct characters)
    const setSampleQuery = `
      SELECT COUNT(DISTINCT ce.character_id) AS sample_number
      FROM character_equipment ce
      JOIN characters c ON ce.character_id = c.character_id
      WHERE ce.slot_id <> 'WEAPON'
        AND ce.set_item_id IS NOT NULL
        AND c.job_id = $1 AND c.job_grow_id = $2;
    `;
    const setSampleResult = await client.query(setSampleQuery, [jobId, jobGrowId]);
    const setSampleNumber = setSampleResult.rows[0]
      ? parseInt(setSampleResult.rows[0].sample_number, 10)
      : 0;

    // 8. Map rows to JS objects
    const titleStats = titleResult.rows.map(row => ({
      slot: 'TITLE',
      item_id: row.item_id,
      item_name: row.item_name,
      usage_count: parseInt(row.usage_count, 10)
    }));

    const itemsStats = itemsResult.rows.map(row => ({
      slot:      row.slot_id,
      item_id:   row.item_id,
      item_name: row.item_name,
      usage_count: parseInt(row.usage_count, 10)
    }));

    const fusionItemsStats = fusionResult.rows.map(row => ({
      slot: row.slot_id,
      fusion_item_id:   row.fusion_item_id,
      fusion_item_name: row.fusion_item_name,
      usage_count:      parseInt(row.usage_count, 10)
    }));

    const setUsageStats = setResult.rows.map(row => ({
      set_item_id:   row.set_item_id,
      set_item_name: row.set_item_name,
      usage_count:  parseInt(row.usage_count, 10)
    }));

    // 9. Group by slot
    const itemsBySlot = {};
    const fusionItemsBySlot = {};
    orderedSlots.forEach(slot => {
      itemsBySlot[slot] = [];
      fusionItemsBySlot[slot] = [];
    });

    titleStats.forEach(item => itemsBySlot['TITLE'].push(item));
    itemsStats.forEach(item => {
      if (itemsBySlot[item.slot]) itemsBySlot[item.slot].push(item);
    });
    fusionItemsStats.forEach(item => {
      if (fusionItemsBySlot[item.slot]) fusionItemsBySlot[item.slot].push(item);
    });

    // 10. Calculate usage rates
    orderedSlots.forEach(slot => {
      const total = sampleNumbers[slot] || 0;
      itemsBySlot[slot] = itemsBySlot[slot]
        .map(item => ({
          ...item,
          usage_rate: total > 0
            ? parseFloat((item.usage_count / total).toFixed(2))
            : 0
        }))
        .slice(0, 10);

      const fusionTotal = fusionSampleNumbers[slot] || 0;
      fusionItemsBySlot[slot] = fusionItemsBySlot[slot]
        .map(item => ({
          ...item,
          usage_rate: fusionTotal > 0
            ? parseFloat((item.usage_count / fusionTotal).toFixed(2))
            : 0
        }))
        .slice(0, 10);
    });

    const setUsageWithRate = setUsageStats.map(setStat => ({
      ...setStat,
      usage_rate: setSampleNumber > 0
        ? parseFloat((setStat.usage_count / setSampleNumber).toFixed(2))
        : 0
    }));

    // 11. Return JSON
    res.status(200).json({
      itemsBySlot,
      fusionItemsBySlot,
      setUsage: setUsageWithRate
    });
  } catch (error) {
    console.error('Error fetching equipment stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


