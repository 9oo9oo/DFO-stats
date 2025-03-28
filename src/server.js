require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const apiKey = process.env.DFO_API_KEY;
const PORT = process.env.PORT

app.set('json spaces', 2);

// PostgreSQL
const { Client } = require('pg');

const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL successfully!');

        const res = await client.query('SELECT version();');
        console.log('PostgreSQL version:', res.rows[0]);
    } catch (err) {
        console.error('Connection error:', err.stack);
    }
}

connectDB();

process.on('SIGINT', async () => {
    await client.end();
    console.log('Database connection closed gracefully.');
    process.exit();
});

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


// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
// search and store 100 character IDs sorted with fame
app.get('/api/characters/:serverId/:jobId/:jobGrowId', async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;

    // Step 1: Get the highest fame value in the game.
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
    let accumulatedRows = [];

    // Step 2: Query in descending fame brackets (2000 fame each) until 100 unique character IDs are gathered.
    while (accumulatedCharacterIds.length < targetCount && currentMaxFame > 0) {
        const currentMinFame = currentMaxFame - 2000;
        const url = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
            `?minFame=${currentMinFame}&maxFame=${currentMaxFame}` +
            `&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=200&apikey=${apiKey}`;

        try {
            const response = await axios.get(url);
            const rows = response.data.rows;

            // Accumulate unique character IDs.
            rows.forEach(row => {
                if (!accumulatedCharacterIds.includes(row.characterId)) {
                    accumulatedCharacterIds.push(row.characterId);
                    accumulatedRows.push(row);
                }
            });

            // Update the fame range for the next iteration.
            currentMaxFame = currentMinFame;
            if (rows.length === 0) break;
        } catch (error) {
            console.error('Error retrieving characters:', error.message);
            return res.status(500).json({ error: 'Failed to fetch character data' });
        }
    }

    // Limit the arrays to exactly 100 entries.
    accumulatedCharacterIds = accumulatedCharacterIds.slice(0, targetCount);
    accumulatedRows = accumulatedRows.slice(0, targetCount);

    // Step 3: Insert the 100 character IDs into the database.
    const insertQuery = `
      INSERT INTO characters (character_id, server_id, job_id, job_grow_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (character_id) DO NOTHING;
    `;
    try {
        for (const row of accumulatedRows) {
            await client.query(insertQuery, [row.characterId, row.serverId, row.jobId, row.jobGrowId]);
        }
    } catch (error) {
        console.error('Error storing characters in DB:', error.message);
        return res.status(500).json({ error: 'Failed to store character data' });
    }

    // Step 4: Return a simple success message.
    res.json({ message: '100 character IDs inserted successfully' });
});


// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
// fetch equipment info for each class and store them
app.get('/api/fetch-characters-equipment/:serverId/:jobId/:jobGrowId', async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;

    try {
        // Step 1: Retrieve character IDs from the database for the specified server and class.
        const getCharacterIdsQuery = `
            SELECT character_id 
            FROM characters
            WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
        `;
        const { rows } = await client.query(getCharacterIdsQuery, [serverId, jobId, jobGrowId]);
        
        if (!rows.length) {
            return res.status(404).json({ message: 'No character IDs found for the specified class.' });
        }

        // Step 2: For each character ID from the DB, fetch and store equipment data.
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
                // Skip TITLE parts.
                if (equip.slotId === 'TITLE') continue;

                const itemId = equip.itemId;
                const setItemId = equip.setItemId;
                let fusionItemId = null;
                if (equip.slotId !== 'WEAPON' && equip.upgradeInfo && equip.upgradeInfo.itemId) {
                    fusionItemId = equip.upgradeInfo.itemId;
                }

                const insertEquipmentQuery = `
                    INSERT INTO character_equipment (character_id, slot_id, item_id, set_item_id, fusion_item_id)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (character_id, slot_id)
                    DO UPDATE SET 
                        item_id = EXCLUDED.item_id,
                        set_item_id = EXCLUDED.set_item_id,
                        fusion_item_id = EXCLUDED.fusion_item_id;
                `;
                try {
                    await client.query(insertEquipmentQuery, [characterId, equip.slotId, itemId, setItemId, fusionItemId]);
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
});


// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
// return the equipment statistics
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

        // 4. Map the results to a simplified structure without human-readable names.
        const itemsStats = itemsResult.rows.map(row => ({
            slot: row.slot_id,
            item_id: row.item_id,
            usage_count: parseInt(row.usage_count, 10)
        }));

        const fusionItemsStats = fusionResult.rows.map(row => ({
            slot: row.slot_id,
            fusion_item_id: row.fusion_item_id,
            usage_count: parseInt(row.usage_count, 10)
        }));

        const setUsageStats = setResult.rows.map(row => ({
            set_item_id: row.set_item_id,
            usage_count: parseInt(row.usage_count, 10)
        }));

        // 5. Group normal items and fusion items by slot based on the defined order.
        const itemsBySlot = {};
        const fusionItemsBySlot = {};
        orderedSlots.forEach(slot => {
            itemsBySlot[slot] = [];
            fusionItemsBySlot[slot] = [];
        });
        itemsStats.forEach(item => {
            if (orderedSlots.includes(item.slot)) {
                itemsBySlot[item.slot].push(item);
            }
        });
        fusionItemsStats.forEach(item => {
            // Skip fusion items for WEAPON slot.
            if (item.slot === "WEAPON") return;
            if (orderedSlots.includes(item.slot)) {
                fusionItemsBySlot[item.slot].push(item);
            }
        });

        // 6. Limit the list for each slot to the Top 10 entries.
        for (const slot of orderedSlots) {
            itemsBySlot[slot] = itemsBySlot[slot].slice(0, 10);
            fusionItemsBySlot[slot] = fusionItemsBySlot[slot].slice(0, 10);
        }

        // 7. Return the final aggregated statistics.
        res.status(200).json({
            itemsBySlot,
            fusionItemsBySlot,
            setUsage: setUsageStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
});