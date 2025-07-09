"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServers = void 0;
// src/controllers/serverController.ts
const axios_1 = __importDefault(require("axios"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
/**
 * GET /api/servers
 * Proxies the DFO servers endpoint.
 */
const getServers = async (req, res) => {
    try {
        const url = `https://api.dfoneople.com/df/servers?apikey=${apiKey}`;
        const response = await axios_1.default.get(url);
        // Log each serverId
        response.data.rows.forEach((server) => {
            console.log(server.serverId);
        });
        // Return the full response payload
        res.json(response.data);
    }
    catch (err) {
        console.error('Error fetching servers:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getServers = getServers;
