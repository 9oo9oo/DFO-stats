"use strict";
// src/__tests__/controllers/talismanController.spec.js
jest.mock('axios');
const axios = require('axios');
const mockQuery = jest.fn();
jest.mock('../../models/db', () => ({ query: mockQuery }));
const client = require('../../models/db');
process.env.DFO_API_KEY = 'testkey';
const { fetchTalismanAndRunes, getTalismanRuneStats } = require('../../controllers/talismanController');
describe('talismanController.fetchTalismanAndRunes', () => {
    let req, res;
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterAll(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it('returns 404 when no character IDs found', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });
        await fetchTalismanAndRunes(req, res);
        expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT character_id/), ['s1', 'j1', 'g1']);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'No character IDs found for the specified class.' });
    });
    it('returns 200 when API returns no talisman data', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
        axios.get.mockResolvedValueOnce({ data: {} });
        await fetchTalismanAndRunes(req, res);
        expect(axios.get).toHaveBeenCalledWith(`https://api.dfoneople.com/df/servers/s1/characters/c1/equip/talisman?apikey=testkey`);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Talisman and rune data fetched and stored successfully for the retrieved character IDs.'
        });
    });
    it('inserts talisman runes and returns 200 on success', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
        const entry = {
            talisman: { slotNo: 1, itemId: 't1', itemName: 'TName' },
            runes: [
                { slotNo: 2, itemId: 'r1', itemName: 'RName' },
                { slotNo: 3, itemId: 'r2', itemName: 'RName2' }
            ]
        };
        axios.get.mockResolvedValueOnce({ data: { talismans: [entry] } });
        // mocks for insert queries
        mockQuery.mockResolvedValue({});
        await fetchTalismanAndRunes(req, res);
        // 1 select + 2 inserts
        expect(mockQuery).toHaveBeenCalledTimes(3);
        expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO character_talisman_runes/), ['c1', 1, 2, 't1', 'TName', 'r1', 'RName']);
        expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/INSERT INTO character_talisman_runes/), ['c1', 1, 3, 't1', 'TName', 'r2', 'RName2']);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Talisman and rune data fetched and stored successfully for the retrieved character IDs.'
        });
    });
});
describe('talismanController.getTalismanRuneStats', () => {
    let req, res;
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterAll(() => {
        console.error.mockRestore();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        req = { params: { jobId: 'j1', jobGrowId: 'g2' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it('returns formatted talisman and rune stats successfully', async () => {
        const talRows = [
            { talisman_item_id: 't1', talisman_item_name: 'TName', usage_count: '5' }
        ];
        const runeRows = [
            { rune_item_id: 'r1', rune_item_name: 'RName', usage_count: '3' }
        ];
        mockQuery
            .mockResolvedValueOnce({ rows: talRows })
            .mockResolvedValueOnce({ rows: runeRows });
        await getTalismanRuneStats(req, res);
        expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/WITH unique_talismans/), ['j1', 'g2']);
        expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT[\s\S]*rune_item_id/), ['j1', 'g2']);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            talismanStats: [
                { talisman_item_id: 't1', talisman_item_name: 'TName', usage_count: 5 }
            ],
            runeStats: [
                { rune_item_id: 'r1', rune_item_name: 'RName', usage_count: 3 }
            ]
        });
    });
    it('returns 500 if DB query fails', async () => {
        mockQuery.mockRejectedValueOnce(new Error('db fail'));
        await getTalismanRuneStats(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});
