// src/__tests__/controllers/itemController.spec.js

jest.mock('axios');
const axios = require('axios');

process.env.DFO_API_KEY = 'testapikey';
const { getItemInfo } = require('../../controllers/itemController');

describe('itemController.getItemInfo', () => {
  let req, res;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { itemId: 'item123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should proxy item info successfully', async () => {
    const fakeData = { id: 'item123', name: 'Excalibur' };
    axios.get.mockResolvedValueOnce({ data: fakeData });

    await getItemInfo(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      `https://api.dfoneople.com/df/items/item123?apikey=${process.env.DFO_API_KEY}`
    );
    expect(res.json).toHaveBeenCalledWith(fakeData);
  });

  it('should return 502 if API request fails with response status', async () => {
    const error = { response: { status: 404 } };
    axios.get.mockRejectedValueOnce(error);

    await getItemInfo(req, res);

    expect(console.error).toHaveBeenCalledWith('Item proxy error:', 404);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch item info' });
  });

  it('should return 502 if API request fails without response', async () => {
    const errMsg = 'network down';
    axios.get.mockRejectedValueOnce(new Error(errMsg));

    await getItemInfo(req, res);

    expect(console.error).toHaveBeenCalledWith('Item proxy error:', errMsg);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch item info' });
  });
});
