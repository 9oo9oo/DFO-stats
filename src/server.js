require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const apiKey = process.env.DFO_API_KEY;
const PORT = process.env.PORT

app.set('json spaces', 2);

// PostgreSQL
// const { Client } = require('pg');

// const client = new Client({
//     user: process.env.PG_USER,
//     host: process.env.PG_HOST,
//     database: process.env.PG_DB,
//     password: process.env.PG_PASSWORD,
//     port: process.env.PG_PORT,
// });

// async function connectDB() {
//     try {
//         await client.connect();
//         console.log('Connected to PostgreSQL successfully!');

//         const res = await client.query('SELECT version();');
//         console.log('PostgreSQL version:', res.rows[0]);
//     } catch (err) {
//         console.error('Connection error:', err.stack);
//     }
// }

// connectDB();

// process.on('SIGINT', async () => {
//     await client.end();
//     console.log('Database connection closed gracefully.');
//     process.exit();
// });

app.get('', (req, res) => {
    res.send("DFO STATS COMING SOON :)");
})

// server info
app.get('/api/servers', async (req, res) => {
    const url = `https://api.dfoneople.com/df/servers?apikey=${apiKey}`;

    const response = await axios.get(url);
    response.data.rows.forEach(server => {
        console.log(server.serverId);
    });
    res.json(response.data);
});

// character id
app.get('/api/character/:serverId/:characterName', async (req, res) => {
    const { serverId, characterName } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters?characterName=${characterName}&apikey=${apiKey}`;

    const response = await axios.get(url);
    response.data.rows.forEach(character => {
        console.log(`Character ID for ${characterName}:`, character.characterId);
    })
    res.json(response.data);
});

// basic character info
app.get('/api/characterinfo/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}?apikey=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data);
});

// character status
app.get('/api/status/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/status?apikey=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data);
});

// equip info
app.get('/api/equip/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/equipment?apikey=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data);
});

// talisman info
app.get('/api/talisman/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/talisman?apikey=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data);
});

// skill
app.get('/api/skill/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/skill/style?apikey=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data);
});

// buff enhancement equip
app.get('/api/buff/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/skill/buff/equip/equipment?apikey=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data);
});

// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
// searching characters with fame, store character ID
// app.get('/api/characters/:serverId/:jobId/:jobGrowId', async (req, res) => {
//     const { serverId, jobId, jobGrowId } = req.params;
//     const url = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
//         `?&maxFame=50000&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=10&apikey=${apiKey}`;

//     // const response = await axios.get(url);
//     // res.json(response.data);

//     try {
//         const response = await axios.get(url);

//         // Extract character IDs (and other details if needed)
//         const rows = response.data.rows;
//         const characterIds = rows.map(row => row.characterId);

//         // Prepare the SQL insert query.
//         // ON CONFLICT ensures that if the character already exists (by character_id), it won't be inserted again.
//         const insertQuery = `
//           INSERT INTO characters (character_id, server_id, job_id, job_grow_id)
//           VALUES ($1, $2, $3, $4)
//           ON CONFLICT (character_id) DO NOTHING;
//         `;

//         // Insert each character into the table.
//         for (const row of rows) {
//             await client.query(insertQuery, [row.characterId, row.serverId, row.jobId, row.jobGrowId]);
//         }

//         res.json(characterIds);
//     } catch (error) {
//         console.error('Error retrieving or storing characters:', error.message);
//         res.status(500).json({ error: 'Failed to fetch or store data' });
//     }
// });

// Search 100 characters from the highest fame and display the character IDs
app.get('/api/characters/:serverId/:jobId/:jobGrowId', async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;

    // Get the highest fame value in the game.
    const urlForHighest = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
        `?jobId=${jobId}&jobGrowId=${jobGrowId}&limit=1&apikey=${apiKey}`;
    let currentMaxFame;
    try {
        const initialResponse = await axios.get(urlForHighest);
        currentMaxFame = initialResponse.data.fame.max;
    } catch (error) {
        console.error('Error retrieving highest fame:', error.message);
        return res.status(500).json({ error: 'Failed to fetch highest fame' });
    }

    const targetCount = 100;
    let accumulatedCharacterIds = [];

    // Query in descending fame brackets (each of 2000 fame) until we have 100 character IDs.
    while (accumulatedCharacterIds.length < targetCount && currentMaxFame > 0) {
        const currentMinFame = currentMaxFame - 2000;
        const url = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
            `?minFame=${currentMinFame}&maxFame=${currentMaxFame}` +
            `&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=200&apikey=${apiKey}`;

        try {
            const response = await axios.get(url);
            const rows = response.data.rows;

            // Add each unique characterId to our accumulator.
            rows.forEach(row => {
                if (!accumulatedCharacterIds.includes(row.characterId)) {
                    accumulatedCharacterIds.push(row.characterId);
                }
            });

            // Prepare to query the next fame bracket.
            currentMaxFame = currentMinFame;

            // Stop if no characters are returned for the current fame bracket.
            if (rows.length === 0) {
                break;
            }
        } catch (error) {
            console.error('Error retrieving characters:', error.message);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }
    }

    // Ensure we only return 100 character IDs.
    accumulatedCharacterIds = accumulatedCharacterIds.slice(0, targetCount);

    res.json(accumulatedCharacterIds);
});

// retrieve character ID
app.get('/api/stored-characters', async (req, res) => {
    try {
        // Query the characters table for saved data
        const queryText = 'SELECT character_id, server_id, job_id, job_grow_id FROM characters';
        const result = await client.query(queryText);

        // The rows will contain the stored data
        const storedCharacters = result.rows;
        res.json(storedCharacters);
    } catch (error) {
        console.error('Error retrieving stored characters:', error.message);
        res.status(500).json({ error: 'Failed to retrieve stored characters' });
    }
});

// POST endpoint to store equipment data from a received payload
app.post('/api/equipment', async (req, res) => {
    const { characterId, equipment } = req.body;

    // Validate incoming payload
    if (!characterId || !Array.isArray(equipment)) {
        return res.status(400).json({ error: 'Invalid payload. Required: characterId and equipment array.' });
    }

    try {
        // Loop through each equipment item
        for (const equip of equipment) {
            // Skip TITLE parts
            if (equip.slotId === 'TITLE') continue;

            const itemId = equip.itemId;
            const setItemId = equip.setItemId;
            let fusionItemId = null;

            // For parts other than WEAPON, check for a fusion option (using upgradeInfo)
            if (equip.slotId !== 'WEAPON' && equip.upgradeInfo && equip.upgradeInfo.itemId) {
                fusionItemId = equip.upgradeInfo.itemId;
            }

            // Insert the extracted data into the PostgreSQL table
            const queryText = `
          INSERT INTO character_equipment (character_id, slot_id, item_id, set_item_id, fusion_item_id)
          VALUES ($1, $2, $3, $4, $5)
        `;
            await client.query(queryText, [characterId, equip.slotId, itemId, setItemId, fusionItemId]);
        }
        res.status(200).json({ message: 'Equipment data stored successfully' });
    } catch (error) {
        console.error('Error storing equipment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET endpoint to fetch equipment data from the external API,
// extract the required fields, and store them in the database.
app.get('/api/fetch-equipment/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;

    try {
        // Build the request URL using the provided parameters
        const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/equipment?apikey=${apiKey}`;
        const response = await axios.get(url);
        const equipmentData = response.data;

        if (!equipmentData || !equipmentData.equipment) {
            return res.status(404).json({ error: 'No equipment data found' });
        }

        // Process and store each equipment item
        for (const equip of equipmentData.equipment) {
            if (equip.slotId === 'TITLE') continue;

            const itemId = equip.itemId;
            const setItemId = equip.setItemId;
            let fusionItemId = null;

            if (equip.slotId !== 'WEAPON' && equip.upgradeInfo && equip.upgradeInfo.itemId) {
                fusionItemId = equip.upgradeInfo.itemId;
            }

            const queryText = `
          INSERT INTO character_equipment (character_id, slot_id, item_id, set_item_id, fusion_item_id)
          VALUES ($1, $2, $3, $4, $5)
        `;
            await client.query(queryText, [characterId, equip.slotId, itemId, setItemId, fusionItemId]);
        }

        res.status(200).json({ message: 'Equipment data fetched and stored successfully' });
    } catch (error) {
        console.error('Error fetching equipment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET endpoint to retrieve stored equipment data for a given character
app.get('/api/equipment/:characterId', async (req, res) => {
    const { characterId } = req.params;
    try {
        const result = await client.query(
            'SELECT * FROM character_equipment WHERE character_id = $1',
            [characterId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving equipment data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// search with fame and store their equip info
app.get('/api/fetch-characters-equipment/:serverId/:jobId/:jobGrowId', async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;

    // minFame=<minFame>&maxFame=<maxFame>&, max fame - min fame = 2000
    try {
        // Step 1: Search for characters by fame
        const searchUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
            `?maxFame=50000&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=10&apikey=${apiKey}`;
        const searchResponse = await axios.get(searchUrl);
        const rows = searchResponse.data.rows;

        // Upsert character details to avoid duplicates
        const insertCharacterQuery = `
        INSERT INTO characters (character_id, server_id, job_id, job_grow_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (character_id) DO NOTHING;
      `;
        for (const row of rows) {
            await client.query(insertCharacterQuery, [row.characterId, row.serverId, row.jobId, row.jobGrowId]);
        }

        // Step 2: For each character, fetch and store equipment data
        for (const row of rows) {
            const characterId = row.characterId;
            const equipmentUrl = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/equipment?apikey=${apiKey}`;
            const equipmentResponse = await axios.get(equipmentUrl);
            const equipmentData = equipmentResponse.data;

            if (!equipmentData || !equipmentData.equipment) {
                console.log(`No equipment data found for character ${characterId}`);
                continue;
            }

            for (const equip of equipmentData.equipment) {
                // Skip TITLE parts
                if (equip.slotId === 'TITLE') continue;

                const itemId = equip.itemId;
                const setItemId = equip.setItemId;
                let fusionItemId = null;
                if (equip.slotId !== 'WEAPON' && equip.upgradeInfo && equip.upgradeInfo.itemId) {
                    fusionItemId = equip.upgradeInfo.itemId;
                }

                // Use ON CONFLICT to avoid duplicates
                const insertEquipmentQuery = `
            INSERT INTO character_equipment (character_id, slot_id, item_id, set_item_id, fusion_item_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (character_id, slot_id)
            DO UPDATE SET 
              item_id = EXCLUDED.item_id,
              set_item_id = EXCLUDED.set_item_id,
              fusion_item_id = EXCLUDED.fusion_item_id;
          `;
                await client.query(insertEquipmentQuery, [characterId, equip.slotId, itemId, setItemId, fusionItemId]);
            }
        }

        res.status(200).json({
            message: 'Characters and their equipment data fetched and stored successfully',
            characterIds: rows.map(row => row.characterId)
        });
    } catch (error) {
        console.error('Error processing fetch-characters-equipment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
app.get('/api/stats/:jobId/:jobGrowId', async (req, res) => {
    const { jobId, jobGrowId } = req.params;
    const orderedSlots = [
        "WEAPON", "JACKET", "SHOULDER", "PANTS", "SHOES",
        "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
    ];

    try {
        // 1. Aggregate individual item usage by slot, filtered by class.
        const itemsQuery = `
        SELECT ce.slot_id, ce.item_id, COUNT(*) AS usage_count
        FROM character_equipment ce
        JOIN characters c ON ce.character_id = c.character_id
        WHERE c.job_id = $1 AND c.job_grow_id = $2
        GROUP BY ce.slot_id, ce.item_id
        ORDER BY ce.slot_id, usage_count DESC;
      `;
        const itemsResult = await client.query(itemsQuery, [jobId, jobGrowId]);

        // 2. Aggregate fusion item usage by slot.
        const fusionQuery = `
        SELECT ce.slot_id, ce.fusion_item_id, COUNT(*) AS usage_count
        FROM character_equipment ce
        JOIN characters c ON ce.character_id = c.character_id
        WHERE c.job_id = $1 AND c.job_grow_id = $2 AND ce.fusion_item_id IS NOT NULL
        GROUP BY ce.slot_id, ce.fusion_item_id
        ORDER BY ce.slot_id, usage_count DESC;
      `;
        const fusionResult = await client.query(fusionQuery, [jobId, jobGrowId]);

        // 3. Aggregate effective set usage. For each character (excluding WEAPON),
        // count pieces per set and select the set with the highest count.
        const setQuery = `
        WITH set_counts AS (
          SELECT ce.character_id, ce.set_item_id, COUNT(*) AS cnt
          FROM character_equipment ce
          JOIN characters c ON ce.character_id = c.character_id
          WHERE ce.slot_id <> 'WEAPON' AND ce.set_item_id IS NOT NULL
            AND c.job_id = $1 AND c.job_grow_id = $2
          GROUP BY ce.character_id, ce.set_item_id
        ),
        effective_sets AS (
          SELECT character_id, set_item_id, cnt,
            ROW_NUMBER() OVER (PARTITION BY character_id ORDER BY cnt DESC) AS rn
          FROM set_counts
        )
        SELECT set_item_id, COUNT(*) AS usage_count
        FROM effective_sets
        WHERE rn = 1
        GROUP BY set_item_id
        ORDER BY usage_count DESC;
      `;
        const setResult = await client.query(setQuery, [jobId, jobGrowId]);

        // 4. (Disabled) Getting human-readable names for normal items and fusion items.
        // For now, we simply set these mappings to an empty object so that later item_name remains null.
        const itemsWithNames = {};
        // 5. (Disabled) Getting human-readable names for set items.
        const setItemsWithNames = {};

        // 6. Attach human-readable names to the aggregated stats.
        const itemsWithStats = itemsResult.rows.map(row => ({
            slot: row.slot_id,
            item_id: row.item_id,
            usage_count: row.usage_count,
            item_name: itemsWithNames[row.item_id] || null
        }));

        const fusionItemsWithStats = fusionResult.rows.map(row => ({
            slot: row.slot_id,
            fusion_item_id: row.fusion_item_id,
            usage_count: row.usage_count,
            item_name: itemsWithNames[row.fusion_item_id] || null
        }));

        const setUsageWithNames = setResult.rows.map(row => ({
            set_item_id: row.set_item_id,
            usage_count: row.usage_count,
            set_item_name: setItemsWithNames[row.set_item_id] || null
        }));

        // 7. Group normal items and fusion items by slot (using the defined order).
        const itemsBySlot = {};
        const fusionItemsBySlot = {};
        orderedSlots.forEach(slot => {
            itemsBySlot[slot] = [];
            fusionItemsBySlot[slot] = [];
        });
        itemsWithStats.forEach(item => {
            if (orderedSlots.includes(item.slot)) {
                itemsBySlot[item.slot].push(item);
            }
        });
        fusionItemsWithStats.forEach(item => {
            // Skip fusion items for WEAPON slot.
            if (item.slot === "WEAPON") return;
            if (orderedSlots.includes(item.slot)) {
                fusionItemsBySlot[item.slot].push(item);
            }
        });

        // 8. Return the final aggregated statistics.
        res.status(200).json({
            itemsBySlot,
            fusionItemsBySlot,
            setUsage: setUsageWithNames
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
});