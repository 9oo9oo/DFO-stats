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
    // Define the order of avatar slots; adjust as necessary.
    const orderedSlots = ["WEAPON", "AURORA", "HEADGEAR", "HAIR", "FACE", "BREAST", "JACKET", "PANTS", "WAIST", "SHOES", "SKIN"];

    try {
        // Aggregate avatar usage by slot.
        // For WEAPON and AURORA, group by item_id and item_name.
        // For all other slots, group solely by option_ability.
        const avatarQuery = `
        SELECT 
          ca.slot_id,
          ca.item_id, 
          CASE WHEN ca.slot_id IN ('WEAPON', 'AURORA') THEN ca.item_name ELSE NULL END as item_name,
          ca.option_ability,
          COUNT(*) AS usage_count
        FROM character_avatar ca
        JOIN characters c ON ca.character_id = c.character_id
        WHERE c.job_id = $1 AND c.job_grow_id = $2
        GROUP BY 
          ca.slot_id,
          ca.item_id,
          CASE WHEN ca.slot_id IN ('WEAPON', 'AURORA') THEN ca.item_name ELSE NULL END,
          ca.option_ability
        ORDER BY ca.slot_id, usage_count DESC;
      `;

        const avatarResult = await client.query(avatarQuery, [jobId, jobGrowId]);

        // Updated Emblem Query:
        // Group only by slot_color and item_name so that items with the same name aggregate together.
        const emblemQuery = `
        SELECT 
            cae.slot_color,
            cae.item_id, 
            cae.item_name, 
            COUNT(*) AS usage_count
        FROM character_avatar_emblems cae
        JOIN character_avatar ca ON cae.character_avatar_id = ca.id
        JOIN characters c ON ca.character_id = c.character_id
        WHERE c.job_id = $1 AND c.job_grow_id = $2
        GROUP BY cae.slot_color, cae.item_id, cae.item_name
        ORDER BY 
          CASE 
            WHEN lower(cae.slot_color) = 'multicolored' THEN 1
            WHEN lower(cae.slot_color) = 'platinum' THEN 2
            WHEN lower(cae.slot_color) = 'blue' THEN 3
            WHEN lower(cae.slot_color) = 'yellow' THEN 4
            WHEN lower(cae.slot_color) = 'green' THEN 5
            WHEN lower(cae.slot_color) = 'red' THEN 6
            ELSE 7 
          END,
          usage_count DESC;
      `;
        const emblemResult = await client.query(emblemQuery, [jobId, jobGrowId]);

        // Process avatar stats.
        const avatarStats = avatarResult.rows.map(row => ({
            slot: row.slot_id,
            item_id: row.item_id,
            item_name: row.item_name,
            option_ability: row.option_ability,
            usage_count: parseInt(row.usage_count, 10)
        }));

        // Group avatar stats by slot (using the orderedSlots array).
        const avatarStatsBySlot = {};
        orderedSlots.forEach(slot => {
            avatarStatsBySlot[slot] = [];
        });
        avatarStats.forEach(item => {
            if (orderedSlots.includes(item.slot)) {
                avatarStatsBySlot[item.slot].push(item);
            }
        });
        // Optionally, limit to the top 10 per slot.
        for (const slot of orderedSlots) {
            avatarStatsBySlot[slot] = avatarStatsBySlot[slot].slice(0, 10);
        }

        // Process emblem stats.
        const emblemStatsRaw = emblemResult.rows.map(row => ({
            slot_color: row.slot_color,
            item_id: row.item_id,
            item_name: row.item_name,
            usage_count: parseInt(row.usage_count, 10)
        }));

        // Group emblems by color
        const emblemStatsByColor = {};
        emblemStatsRaw.forEach(item => {
            // Normalize color key (can be adjusted if needed)
            const color = item.slot_color.toLowerCase();
            if (!emblemStatsByColor[color]) {
                emblemStatsByColor[color] = [];
            }
            emblemStatsByColor[color].push(item);
        });

        // For each color group, sort by usage_count (descending) and pick the top 10.
        for (const color in emblemStatsByColor) {
            emblemStatsByColor[color].sort((a, b) => b.usage_count - a.usage_count);
            emblemStatsByColor[color] = emblemStatsByColor[color].slice(0, 10);
        }

        res.status(200).json({
            avatarStatsBySlot,
            emblemStatsByColor
        });
    } catch (error) {
        console.error('Error fetching avatar stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};