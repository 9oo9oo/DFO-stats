// controllers/itemController.js
const axios = require('axios');
const apiKey = process.env.DFO_API_KEY;

exports.getItemInfo = async (req, res) => {
    const itemId = req.params.itemId;
    console.log(`Proxying item ${itemId} with key ${apiKey ? '✔️' : '❌ undefined'}`);

    // Retrieving item info for item tooltip when user mouse is hovered over equipment icon
    try {
        const url = `https://api.dfoneople.com/df/items/${itemId}?apikey=${apiKey}`;
        const apiRes = await axios.get(url);
        return res.json(apiRes.data);
    } catch (err) {
        console.error('Item proxy error:', err.response ? err.response.status : err.message);
        return res.status(502).json({ error: 'Failed to fetch item info' });
    }
};