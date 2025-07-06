// src/controllers/itemController.ts
import axios from 'axios';
import { Request, Response, NextFunction, RequestHandler } from 'express';

const apiKey = process.env.DFO_API_KEY!;
if (!apiKey) {
  throw new Error('Missing DFO_API_KEY in environment');
}

// Now typed as a full RequestHandler so it matches router.get(...)
export const getItemInfo: RequestHandler<{ itemId: string }> = async (
  req,
  res,
  next
): Promise<void> => {
  const { itemId } = req.params;
  console.log(`Proxying item ${itemId} with key ${apiKey ? '✔️' : '❌ undefined'}`);

  try {
    const url = `https://api.dfoneople.com/df/items/${itemId}?apikey=${apiKey}`;
    const apiRes = await axios.get<Record<string, any>>(url);
    res.json(apiRes.data);
  } catch (err: any) {
    console.error(
      'Item proxy error:',
      err.response?.status ? `HTTP ${err.response.status}` : err.message
    );
    res.status(502).json({ error: 'Failed to fetch item info' });
  }
};
