// controllers/talismanController.js
const axios = require('axios');
const client = require('../models/db');
const apiKey = process.env.DFO_API_KEY;

exports.fetchTalismanAndRunes = async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;
    try {
        // Retrieve character IDs for the specified class
        const getCharacterIdsQuery = `
        SELECT character_id 
        FROM characters
        WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
      `;
        const { rows } = await client.query(getCharacterIdsQuery, [serverId, jobId, jobGrowId]);

        if (!rows.length) {
            return res.status(404).json({ message: 'No character IDs found for the specified class.' });
        }

        // Loop through each character to fetch talisman and rune data
        for (const row of rows) {
            const characterId = row.character_id;
            // Adjust the URL to the appropriate endpoint for talisman data
            const talismanUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/talisman?apikey=${apiKey}`;
            let talismanResponse;
            try {
                talismanResponse = await axios.get(talismanUrl);
            } catch (error) {
                console.error(`Error fetching talisman data for ${characterId}:`, error.message);
                continue;
            }

            const talismanData = talismanResponse.data;
            if (!talismanData || !talismanData.talismans) {
                console.log(`No talisman data found for character ${characterId}`);
                continue;
            }

            // Process each talisman (each representing a talisman slot)
            for (const talismanEntry of talismanData.talismans) {
                const talisman = talismanEntry.talisman;
                // Skip if no talisman is equipped in this slot
                if (!talisman) continue;

                const talismanSlotNo = talisman.slotNo;
                const talismanItemId = talisman.itemId;
                const talismanItemName = talisman.itemName;
                const runes = talismanEntry.runes || [];

                // Insert each rune record for this talisman slot
                for (const rune of runes) {
                    const runeSlotNo = rune.slotNo;
                    const runeItemId = rune.itemId;
                    const runeItemName = rune.itemName;

                    const insertTalismanRuneQuery = `
              INSERT INTO character_talisman_runes 
                (character_id, talisman_slot_no, rune_slot_no, talisman_item_id, talisman_item_name, rune_item_id, rune_item_name)
              VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (character_id, talisman_slot_no, rune_slot_no)
              DO UPDATE SET 
                talisman_item_id = EXCLUDED.talisman_item_id,
                talisman_item_name = EXCLUDED.talisman_item_name,
                rune_item_id = EXCLUDED.rune_item_id,
                rune_item_name = EXCLUDED.rune_item_name;
            `;
                    try {
                        await client.query(insertTalismanRuneQuery, [
                            characterId,
                            talismanSlotNo,
                            runeSlotNo,
                            talismanItemId,
                            talismanItemName,
                            runeItemId,
                            runeItemName,
                        ]);
                    } catch (error) {
                        console.error(`Error inserting data for ${characterId} (talisman slot ${talismanSlotNo}, rune slot ${runeSlotNo}):`, error.message);
                    }
                }
            }
        }

        res.status(200).json({
            message: 'Talisman and rune data fetched and stored successfully for the retrieved character IDs.',
        });
    } catch (error) {
        console.error('Error processing talisman and rune data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getTalismanRuneStats = async (req, res) => {
    const { jobId, jobGrowId } = req.params;

    try {
        // Aggregate overall talisman usage by item, regardless of slot.
        // The CTE now qualifies the character_id column to avoid ambiguity.
        const talismanQuery = `
        WITH unique_talismans AS (
          SELECT DISTINCT ctr.character_id, ctr.talisman_item_id, ctr.talisman_item_name
          FROM character_talisman_runes ctr
          JOIN characters c ON ctr.character_id = c.character_id
          WHERE c.job_id = $1 AND c.job_grow_id = $2
        )
        SELECT 
          talisman_item_id,
          talisman_item_name,
          COUNT(*) AS usage_count
        FROM unique_talismans
        GROUP BY talisman_item_id, talisman_item_name
        ORDER BY usage_count DESC;
      `;
        const talismanResult = await client.query(talismanQuery, [jobId, jobGrowId]);

        // Aggregate overall rune usage by item, regardless of slot.
        const runeQuery = `
        SELECT 
          ctr.rune_item_id,
          ctr.rune_item_name,
          COUNT(*) AS usage_count
        FROM character_talisman_runes ctr
        JOIN characters c ON ctr.character_id = c.character_id
        WHERE c.job_id = $1 AND c.job_grow_id = $2
        GROUP BY ctr.rune_item_id, ctr.rune_item_name
        ORDER BY usage_count DESC;
      `;
        const runeResult = await client.query(runeQuery, [jobId, jobGrowId]);

        const talismanStats = talismanResult.rows.map(row => ({
            talisman_item_id: row.talisman_item_id,
            talisman_item_name: row.talisman_item_name,
            usage_count: parseInt(row.usage_count, 10)
        }));

        const runeStats = runeResult.rows.map(row => ({
            rune_item_id: row.rune_item_id,
            rune_item_name: row.rune_item_name,
            usage_count: parseInt(row.usage_count, 10)
        }));

        // Optionally limit to Top 10 items overall.
        const topTalismanStats = talismanStats.slice(0, 10);
        const topRuneStats = runeStats.slice(0, 10);

        res.status(200).json({
            talismanStats: topTalismanStats,
            runeStats: topRuneStats
        });
    } catch (error) {
        console.error('Error fetching talisman and rune stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};