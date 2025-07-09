"use strict";
// first, mock axios
jest.mock('axios');
//
// Make sure the env var is set *before* requiring your controller
//
process.env.DFO_API_KEY = 'testkey123';
const axios = require('axios');
const { getServers } = require('../../controllers/serverController');
describe('serverController.getServers', () => {
    let req, res;
    beforeAll(() => {
        // silence console output in tests
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterAll(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });
    beforeEach(() => {
        req = {}; // controller doesn't use req
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        axios.get.mockReset();
    });
    it('should call axios.get with the correct URL and return data on success', async () => {
        const fakeData = {
            rows: [
                { serverId: 'srv-1', name: 'Alpha' },
                { serverId: 'srv-2', name: 'Beta' }
            ],
            count: 2
        };
        axios.get.mockResolvedValue({ data: fakeData });
        await getServers(req, res);
        // verify we called the right URL
        expect(axios.get).toHaveBeenCalledWith(`https://api.dfoneople.com/df/servers?apikey=${process.env.DFO_API_KEY}`);
        // and that we forwarded the response data
        expect(res.json).toHaveBeenCalledWith(fakeData);
    });
    it('should return 500 + error message when axios.get throws', async () => {
        axios.get.mockRejectedValue(new Error('network down'));
        await getServers(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});
