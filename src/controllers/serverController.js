// controllers/serverController.js
const axios = require('axios');
const apiKey = process.env.DFO_API_KEY;

exports.getServers = async (req, res) => {
  try {
    // Retrieving server information
    const url = `https://api.dfoneople.com/df/servers?apikey=${apiKey}`;
    const response = await axios.get(url);
    response.data.rows.forEach(server => {
      console.log(server.serverId);
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching servers:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};