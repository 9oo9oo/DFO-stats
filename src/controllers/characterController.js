// controllers/characterController.js
const axios = require('axios');
const client = require('../models/db');
const apiKey = process.env.DFO_API_KEY;

exports.getCharacter = async (req, res) => {
    const { serverId, jobId, jobGrowId } = req.params;

    // Retrieving highest fame
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

    // 100 Character IDs
    const targetCount = 100;
    let accumulatedCharacterIds = [];
    let accumulatedRows = [];

    // Query in descending frame brackets until we have desired number of character IDs
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

            if (rows.length === 0) {
                console.log(`No characters found in fame range [${currentMinFame}, ${currentMaxFame + 2000}]. Continuing search...`);
            }
        } catch (error) {
            console.error('Error retrieving characters:', error.message);
            return res.status(500).json({ error: 'Failed to fetch character data' });
        }
    }

    accumulatedCharacterIds = accumulatedCharacterIds.slice(0, targetCount);
    accumulatedRows = accumulatedRows.slice(0, targetCount);

    // Replace old data with new data
    try {
        await client.query('BEGIN');

        // Deleting existing character IDs for certain class
        const deleteQuery = `
            DELETE FROM characters 
            WHERE server_id = $1 AND job_id = $2 AND job_grow_id = $3;
        `;
        await client.query(deleteQuery, [serverId, jobId, jobGrowId]);

        // Inserting 100 new IDs
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

    res.json({ message: '100 character IDs inserted successfully for the given class.' });
};
