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

// searching characters with fame, store character ID
app.get('/api/characters/:serverId/:jobId/:jobGrowId', async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters-fame` +
        `?&jobId=${jobId}&jobGrowId=${jobGrowId}&limit=10&apikey=${apiKey}`;

    // const response = await axios.get(url);
    // res.json(response.data);

    // Slayer 40132cbc8b2b5eedfe035e35c322472e
    // Neo Blade Master ba2ae3598c3af10c26562e073bc92060

    try {
        const response = await axios.get(url);

        // Extract character IDs (and other details if needed)
        const rows = response.data.rows;
        const characterIds = rows.map(row => row.characterId);

        // Prepare the SQL insert query.
        // ON CONFLICT ensures that if the character already exists (by character_id), it won't be inserted again.
        const insertQuery = `
          INSERT INTO characters (character_id, server_id, job_id, job_grow_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (character_id) DO NOTHING;
        `;

        // Insert each character into the table.
        for (const row of rows) {
            await client.query(insertQuery, [row.characterId, row.serverId, row.jobId, row.jobGrowId]);
        }

        res.json(characterIds);
    } catch (error) {
        console.error('Error retrieving or storing characters:', error.message);
        res.status(500).json({ error: 'Failed to fetch or store data' });
    }
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

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
});


