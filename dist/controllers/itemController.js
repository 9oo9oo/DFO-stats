"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemInfo = void 0;
// src/controllers/itemController.ts
const axios_1 = __importDefault(require("axios"));
const apiKey = process.env.DFO_API_KEY;
if (!apiKey) {
    throw new Error('Missing DFO_API_KEY in environment');
}
// Now typed as a full RequestHandler so it matches router.get(...)
const getItemInfo = async (req, res, next) => {
    const { itemId } = req.params;
    console.log(`Proxying item ${itemId} with key ${apiKey ? '✔️' : '❌ undefined'}`);
    try {
        const url = `https://api.dfoneople.com/df/items/${itemId}?apikey=${apiKey}`;
        const apiRes = await axios_1.default.get(url);
        res.json(apiRes.data);
    }
    catch (err) {
        console.error('Item proxy error:', err.response?.status ? `HTTP ${err.response.status}` : err.message);
        res.status(502).json({ error: 'Failed to fetch item info' });
    }
};
exports.getItemInfo = getItemInfo;
