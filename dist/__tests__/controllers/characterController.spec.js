"use strict";
// src/__tests__/controllers/characterController.spec.js
jest.mock('axios');
const axios = require('axios');
const mockQuery = jest.fn();
jest.mock('../../models/db', () => ({ query: mockQuery }));
// Ensure API key is set for URL construction
process.env.DFO_API_KEY = 'apikey123';
const { getCharacter } = require('../../controllers/characterController');
describe('characterController.getCharacter', () => {
    let req;
    let res;
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
    it('returns 500 if fetching highest fame fails', async () => {
        axios.get.mockRejectedValueOnce(new Error('network error'));
        await getCharacter(req, res);
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch highest fame' });
    });
    it('returns 500 if fetching character data fails in loop', async () => {
        // First call succeeds, second fails
        axios.get
            .mockResolvedValueOnce({ data: { fame: { max: 2000 } } })
            .mockRejectedValueOnce(new Error('api down'));
        await getCharacter(req, res);
        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch character data' });
    });
    it('successfully inserts fetched characters and returns 200', async () => {
        // initial fame fetch
        axios.get.mockResolvedValueOnce({ data: { fame: { max: 2000 } } });
        // loop fetch returns two rows
        const rows = [
            { characterId: 'c1', serverId: 's1', jobId: 'j1', jobGrowId: 'g1' },
            { characterId: 'c2', serverId: 's1', jobId: 'j1', jobGrowId: 'g1' }
        ];
        axios.get.mockResolvedValueOnce({ data: { rows } });
        // Mock DB queries: BEGIN, DELETE, two INSERTs, COMMIT
        mockQuery
            .mockResolvedValueOnce() // BEGIN
            .mockResolvedValueOnce() // DELETE
            .mockResolvedValueOnce() // INSERT c1
            .mockResolvedValueOnce() // INSERT c2
            .mockResolvedValueOnce(); // COMMIT
        await getCharacter(req, res);
        // axios calls
        expect(axios.get.mock.calls[0][0]).toContain('characters-fame');
        expect(axios.get.mock.calls[1][0]).toContain('minFame=0');
        // DB calls
        expect(mockQuery.mock.calls[0][0]).toBe('BEGIN');
        expect(mockQuery.mock.calls[1][0]).toMatch(/DELETE FROM characters/);
        expect(mockQuery.mock.calls[2][0]).toMatch(/INSERT INTO characters/);
        expect(mockQuery.mock.calls[2][1]).toEqual(['c1', 's1', 'j1', 'g1']);
        expect(mockQuery.mock.calls[3][1][0]).toBe('c2');
        expect(mockQuery.mock.calls[4][0]).toBe('COMMIT');
        expect(res.json).toHaveBeenCalledWith({ message: '100 character IDs inserted successfully for the given class.' });
    });
    it('rolls back and returns 500 if DB insertion fails', async () => {
        axios.get.mockResolvedValueOnce({ data: { fame: { max: 2000 } } });
        axios.get.mockResolvedValueOnce({ data: { rows: [{ characterId: 'c1', serverId: 's1', jobId: 'j1', jobGrowId: 'g1' }] } });
        // BEGIN succeeds, DELETE succeeds, INSERT fails
        mockQuery
            .mockResolvedValueOnce() // BEGIN
            .mockResolvedValueOnce() // DELETE
            .mockRejectedValueOnce(new Error('db insert fail'));
        await getCharacter(req, res);
        expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to store character data' });
    });
});
