require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

const apiKey = process.env.DFO_API_KEY;

app.get('/api/servers', async (req, res) => {

    const url = `https://api.dfoneople.com/df/servers?apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching server info:', error.message);
        res.status(500).json({ error: 'Failed to fetch server data' });
    }
});

app.get('/api/character/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;;

    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}?apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        res.status(200).json(response.data);
    } catch (error) {
        conmsole.error('Error fecthing character info:', error.message);
        res.status(500).json({ error: 'Failed to fetch character data' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server listening on port ${PORT}');
})


