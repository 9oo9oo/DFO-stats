// controllers/characterController.js
const axios = require('axios');
const client = require('../models/db');
const apiKey = process.env.DFO_API_KEY;

exports.getCharacter = async (req, res) => {
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

            // If rows are found, add unique character IDs
            rows.forEach(row => {
                if (!accumulatedCharacterIds.includes(row.characterId)) {
                    accumulatedCharacterIds.push(row.characterId);
                    accumulatedRows.push(row);
                }
            });

            // Update currentMaxFame regardless of whether any rows were returned.
            // This lets the loop continue down to lower fame ranges instead of terminating early.
            currentMaxFame = currentMinFame;

            // Logging for transparency. No break is used even if rows.length === 0.
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
};
