require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const apiKey = process.env.DFO_API_KEY;
const PORT = process.env.PORT
app.set('json spaces', 2);

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

// equip trait info
app.get('/api/equiptrait/:serverId/:characterId', async (req, res) => {
    const { serverId, characterId } = req.params;
    const url = `https://api.dfoneople.com/df/servers/${serverId}/characters/${characterId}/equip/equipment-trait?apikey=${apiKey}`;

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

app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
});


