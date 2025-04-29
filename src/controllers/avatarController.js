const axios = require('axios');
const client = require('../models/db');
const apiKey = process.env.DFO_API_KEY;

exports.getAvatar = async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // Query to get character IDs based on server, job, and jobGrow
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
            const avatarUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/avatar?apikey=${apiKey}`;
            let avatarResponse;
            try {
                avatarResponse = await axios.get(avatarUrl);
            } catch (error) {
                console.error(`Error fetching avatar for ${characterId}:`, error.message);
                continue;
            }

            const avatarData = avatarResponse.data;
            if (!avatarData || !avatarData.avatar) {
                console.log(`No avatar data found for character ${characterId}`);
                continue;
            }

            // Loop through each avatar equipment entry
            for (const avatar of avatarData.avatar) {
                const slotId = avatar.slotId;
                const slotName = avatar.slotName;
                const itemId = avatar.itemId;
                const itemName = avatar.itemName;
                const itemRarity = avatar.itemRarity;
                const optionAbility = avatar.optionAbility; // May be null

                // Insert/update the main avatar record for this character and slot.
                // The query returns the inserted/updated record's id (avatarRecordId)
                const insertAvatarQuery = `
            INSERT INTO character_avatar (
              character_id, slot_id, slot_name, item_id, item_name, item_rarity, option_ability
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (character_id, slot_id)
            DO UPDATE SET 
              slot_name = EXCLUDED.slot_name,
              item_id = EXCLUDED.item_id,
              item_name = EXCLUDED.item_name,
              item_rarity = EXCLUDED.item_rarity,
              option_ability = EXCLUDED.option_ability
            RETURNING id;
          `;
                let avatarInsertResult;
                try {
                    avatarInsertResult = await client.query(insertAvatarQuery, [
                        characterId, slotId, slotName, itemId, itemName, itemRarity, optionAbility
                    ]);
                } catch (error) {
                    console.error(`Error inserting avatar for ${characterId} (slot ${slotId}):`, error.message);
                    continue;
                }
                // Retrieve the avatar record's ID to associate with emblems
                const avatarRecordId = avatarInsertResult.rows[0].id;

                // Clear existing emblems for this avatar record so that we can re-insert the current ones.
                const deleteEmblemsQuery = `
            DELETE FROM character_avatar_emblems
            WHERE character_avatar_id = $1;
          `;
                try {
                    await client.query(deleteEmblemsQuery, [avatarRecordId]);
                } catch (error) {
                    console.error(`Error deleting emblems for avatar record ${avatarRecordId}:`, error.message);
                }

                // Insert each emblem for this avatar entry, if any
                if (avatar.emblems && Array.isArray(avatar.emblems)) {
                    for (const emblem of avatar.emblems) {
                        const emblemSlotNo = emblem.slotNo;
                        const emblemSlotColor = emblem.slotColor;
                        const emblemItemId = emblem.itemId;
                        const emblemItemName = emblem.itemName;
                        const emblemItemRarity = emblem.itemRarity;

                        const insertEmblemQuery = `
                INSERT INTO character_avatar_emblems (
                  character_avatar_id, slot_no, slot_color, item_id, item_name, item_rarity
                )
                VALUES ($1, $2, $3, $4, $5, $6);
              `;
                        try {
                            await client.query(insertEmblemQuery, [
                                avatarRecordId, emblemSlotNo, emblemSlotColor, emblemItemId, emblemItemName, emblemItemRarity
                            ]);
                        } catch (error) {
                            console.error(`Error inserting emblem for avatar record ${avatarRecordId}:`, error.message);
                        }
                    }
                }
            }
        }

        res.status(200).json({
            message: 'Avatar data fetched and stored successfully for the retrieved character IDs.'
        });
    } catch (error) {
        console.error('Error processing avatar data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAvatarStats = async (req, res) => {
    const { jobId, jobGrowId } = req.params;
    const orderedSlots = [
      'WEAPON', 'AURORA', 'HEADGEAR', 'HAIR', 'FACE',
      'BREAST', 'JACKET', 'PANTS', 'WAIST', 'SHOES', 'SKIN'
    ];
  
    try {
      // 1. Aggregate WEAPON & AURORA by name, picking a representative ID
      const wepAurQuery = `
        WITH wea_counts AS (
          SELECT
            ca.slot_id,
            ca.item_name,
            COUNT(*) AS usage_count,
            MIN(ca.item_id) AS item_id
          FROM character_avatar ca
          JOIN characters c ON ca.character_id = c.character_id
          WHERE c.job_id = $1
            AND c.job_grow_id = $2
            AND ca.slot_id IN ('WEAPON','AURORA')
          GROUP BY ca.slot_id, ca.item_name
        )
        SELECT
          slot_id,
          item_id,
          item_name,
          NULL::text AS option_ability,
          usage_count
        FROM wea_counts
        ORDER BY slot_id, usage_count DESC;
      `;
      const wepAurResult = await client.query(wepAurQuery, [jobId, jobGrowId]);
  
      // 2. Aggregate other avatar slots by option_ability only
      const optQuery = `
        SELECT
          ca.slot_id,
          NULL::uuid   AS item_id,
          NULL::text   AS item_name,
          ca.option_ability,
          COUNT(*) AS usage_count
        FROM character_avatar ca
        JOIN characters c ON ca.character_id = c.character_id
        WHERE c.job_id = $1
          AND c.job_grow_id = $2
          AND ca.slot_id NOT IN ('WEAPON','AURORA')
        GROUP BY ca.slot_id, ca.option_ability
        ORDER BY ca.slot_id, usage_count DESC;
      `;
      const optResult = await client.query(optQuery, [jobId, jobGrowId]);
  
      // 3. Emblems: group by name, pick a representative ID
      const emblemQuery = `
        WITH em_counts AS (
          SELECT
            cae.slot_color,
            cae.item_name,
            COUNT(*) AS usage_count,
            MIN(cae.item_id) AS item_id
          FROM character_avatar_emblems cae
          JOIN character_avatar ca ON cae.character_avatar_id = ca.id
          JOIN characters c ON ca.character_id = c.character_id
          WHERE c.job_id = $1
            AND c.job_grow_id = $2
          GROUP BY cae.slot_color, cae.item_name
        )
        SELECT
          slot_color,
          item_id,
          item_name,
          usage_count
        FROM em_counts
        ORDER BY
          CASE
            WHEN lower(slot_color) = 'multicolored' THEN 1
            WHEN lower(slot_color) = 'platinum' THEN 2
            WHEN lower(slot_color) = 'blue' THEN 3
            WHEN lower(slot_color) = 'yellow' THEN 4
            WHEN lower(slot_color) = 'green' THEN 5
            WHEN lower(slot_color) = 'red' THEN 6
            ELSE 7
          END,
          usage_count DESC;
      `;
      const emblemResult = await client.query(emblemQuery, [jobId, jobGrowId]);
  
      // 4. Combine and dynamically group rows by slot
      const rawAvatar = [...wepAurResult.rows, ...optResult.rows];
      const avatarStatsBySlot = {};
  
      // build groups dynamically
      rawAvatar.forEach(row => {
        const slot = row.slot_id;
        if (!avatarStatsBySlot[slot]) avatarStatsBySlot[slot] = [];
        avatarStatsBySlot[slot].push({
          slot,
          item_id:       row.item_id,
          item_name:     row.item_name,
          option_ability: row.option_ability,
          usage_count:   parseInt(row.usage_count, 10)
        });
      });
  
      // ensure all ordered slots exist and limit to top 10
      orderedSlots.forEach(slot => {
        if (!avatarStatsBySlot[slot]) avatarStatsBySlot[slot] = [];
        avatarStatsBySlot[slot] = avatarStatsBySlot[slot].slice(0, 10);
      });
  
      // 5. Process emblems by color, limit top 10 each
      const emblemStatsByColor = {};
      emblemResult.rows.forEach(row => {
        const color = row.slot_color.toLowerCase();
        if (!emblemStatsByColor[color]) emblemStatsByColor[color] = [];
        emblemStatsByColor[color].push({
          slot_color:  color,
          item_id:     row.item_id,
          item_name:   row.item_name,
          usage_count: parseInt(row.usage_count, 10)
        });
      });
      Object.keys(emblemStatsByColor).forEach(color => {
        emblemStatsByColor[color] = emblemStatsByColor[color].slice(0, 10);
      });
  
      // 6. Return JSON payload
      res.json({ avatarStatsBySlot, emblemStatsByColor });
    } catch (err) {
      console.error('Error fetching avatar stats:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };