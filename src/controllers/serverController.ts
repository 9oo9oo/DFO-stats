// src/controllers/serverController.ts
import axios from 'axios';
import { RequestHandler } from 'express';

const apiKey = process.env.DFO_API_KEY!;
if (!apiKey) {
  throw new Error('Missing DFO_API_KEY in environment');
}

interface Server {
  serverId: string;
  [key: string]: any;
}
interface ServersApiResponse {
  rows: Server[];
  [key: string]: any;
}

/**
 * GET /api/servers
 * Proxies the DFO servers endpoint.
 */
export const getServers: RequestHandler = async (req, res) => {
  try {
    const url = `https://api.dfoneople.com/df/servers?apikey=${apiKey}`;
    const response = await axios.get<ServersApiResponse>(url);

    // Log each serverId
    response.data.rows.forEach((server) => {
      console.log(server.serverId);
    });

    // Return the full response payload
    res.json(response.data);
  } catch (err: any) {
    console.error('Error fetching servers:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
