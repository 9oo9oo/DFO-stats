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

    // Step 1: Retrieve the highest fame value in the game.
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

    // Step 2: Query in descending fame brackets (each 2000 fame wide) until we have 100 unique character IDs.
    while (accumulatedCharacterIds.length < targetCount && currentMaxFame > 0) {
        const currentMinFame = currentMaxFame - 2000;
        const url = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
            `?minFame=${currentMinFame}&maxFame=${currentMaxFame}` +
            `&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=200&apikey=${apiKey}`;

        try {
            const response = await axios.get(url);
            const rows = response.data.rows;
            rows.forEach(row => {
                if (!accumulatedCharacterIds.includes(row.characterId)) {
                    accumulatedCharacterIds.push(row.characterId);
                    accumulatedRows.push(row);
                }
            });
            currentMaxFame = currentMinFame;
            if (rows.length === 0) break;
        } catch (error) {
            console.error('Error retrieving characters:', error.message);
            return res.status(500).json({ error: 'Failed to fetch character data' });
        }
    }

    accumulatedCharacterIds = accumulatedCharacterIds.slice(0, targetCount);
    accumulatedRows = accumulatedRows.slice(0, targetCount);

    // Step 3: Begin a transaction to remove old records and insert new ones atomically.
    try {
        await client.query('BEGIN');

        // Delete existing character IDs for this class.
        const deleteQuery = `
            DELETE FROM characters 
            WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
        `;
        await client.query(deleteQuery, [serverId, jobId, jobGrowId]);

        // Insert the new 100 character IDs.
        const insertQuery = `
          INSERT INTO characters (character_id, server_id, job_id, job_grow_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (character_id) DO NOTHING;
        `;
        for (const row of accumulatedRows) {
            await client.query(insertQuery, [row.characterId, row.serverId, row.jobId, row.jobGrowId]);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error storing characters in DB:', error.message);
        return res.status(500).json({ error: 'Failed to store character data' });
    }

    // Return a success message.
    res.json({ message: '100 character IDs inserted successfully for the given class.' });
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

// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
// fetch creature info for each class and store them
app.get('/api/fetch-characters-creature/:serverId/:jobId/:jobGrowId', async (req, res) => {
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

        // Step 2: For each character ID, fetch and store creature data.
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

            // Extract the creature's itemId.
            const creatureItemId = creatureData.creature.itemId;

            // Initialize artifact IDs.
            let artifactRed = null;
            let artifactBlue = null;
            let artifactGreen = null;

            // Loop through the artifact array and extract IDs based on slotColor.
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

            // Insert or update the creature data into the new table.
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
});

// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
// return the creature statistics
app.get('/api/stats/creature/:jobId/:jobGrowId', async (req, res) => {
    const { jobId, jobGrowId } = req.params;

    try {
        // 1. Aggregate creature usage.
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

        // 2. Aggregate artifact RED usage.
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

        // 3. Aggregate artifact BLUE usage.
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

        // 4. Aggregate artifact GREEN usage.
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

        // Map results to a simplified structure.
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

        // Return the aggregated creature statistics.
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
});

/* 
To add
Skill tree
Avatar, aura, emblem
Creature, artifacts
Talisman 
Title
*/

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
});