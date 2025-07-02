// src/__tests__/controllers/creatureController.spec.js

jest.mock('axios');
const axios = require('axios');

const mockQuery = jest.fn();
jest.mock('../../models/db', () => ({ query: mockQuery }));
const client = require('../../models/db');

process.env.DFO_API_KEY = 'testkey';

const {
  fetchCreature,
  getCreatureStats,
  getCreatureArtifactCombinations
} = require('../../controllers/creatureController');

describe('creatureController.fetchCreature', () => {
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
    req = { params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 404 when no character IDs', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await fetchCreature(req, res);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT character_id/), ['s1','j1','g1']);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No character IDs found for the specified class.' });
  });

  it('should return 200 when no creature data', async () => {
    // one character id
    mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    // axios returns empty data
    axios.get.mockResolvedValueOnce({ data: {} });

    await fetchCreature(req, res);

    const expectedUrl = `https://api.dfoneople.com/df/servers/s1/characters/c1/equip/creature?apikey=testkey`;
    expect(axios.get).toHaveBeenCalledWith(expectedUrl);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Creature data fetched and stored successfully for the retrieved character IDs.' });
  });

  it('should insert creature and artifacts on success', async () => {
    // one character
    mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    // axios returns creature with artifacts
    const creatureData = {
      creature: { itemId: 'ci', itemName: 'CreatureName', artifact: [
        { slotColor: 'RED',   itemId: 'r1', itemName: 'RedA' },
        { slotColor: 'BLUE',  itemId: 'b1', itemName: 'BlueA' },
        { slotColor: 'GREEN', itemId: 'g1', itemName: 'GreenA' }
      ] }
    };
    axios.get.mockResolvedValueOnce({ data: creatureData });
    // prepare insert query
    mockQuery.mockResolvedValueOnce({});

    await fetchCreature(req, res);

    // First mockQuery is SELECT characters
    expect(mockQuery.mock.calls[0][0]).toMatch(/SELECT character_id/);
    // Second call is INSERT INTO character_creature
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[0]).toMatch(/INSERT INTO character_creature/);
    expect(insertCall[1]).toEqual([
      'c1',
      'ci', 'CreatureName',
      'r1','RedA',
      'b1','BlueA',
      'g1','GreenA'
    ]);
    // Final response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Creature data fetched and stored successfully for the retrieved character IDs.' });
  });
});

describe('creatureController.getCreatureStats', () => {
  let req, res;
  beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterAll(() => console.error.mockRestore());
  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { jobId: 'j1', jobGrowId: 'g2' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('returns stats on success', async () => {
    const cr = [{ creature_item_id:'ci', creature_item_name:'CN', usage_count:'3' }];
    const rr = [{ artifact_item_id:'ri', artifact_item_name:'RN', usage_count:'2' }];
    const br = [{ artifact_item_id:'bi', artifact_item_name:'BN', usage_count:'4' }];
    const gr = [{ artifact_item_id:'gi', artifact_item_name:'GN', usage_count:'1' }];
    mockQuery
      .mockResolvedValueOnce({ rows: cr })
      .mockResolvedValueOnce({ rows: rr })
      .mockResolvedValueOnce({ rows: br })
      .mockResolvedValueOnce({ rows: gr });

    await getCreatureStats(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(4);
    // Check parsed numbers
    const resp = res.json.mock.calls[0][0];
    expect(resp.creatureStats).toEqual([{ creature_item_id:'ci', creature_item_name:'CN', usage_count:3 }]);
    expect(resp.artifactRedStats).toEqual([{ artifact_item_id:'ri', artifact_item_name:'RN', usage_count:2 }]);
    expect(resp.artifactBlueStats).toEqual([{ artifact_item_id:'bi', artifact_item_name:'BN', usage_count:4 }]);
    expect(resp.artifactGreenStats).toEqual([{ artifact_item_id:'gi', artifact_item_name:'GN', usage_count:1 }]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('fail'));
    await getCreatureStats(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});

describe('creatureController.getCreatureArtifactCombinations', () => {
  let req, res;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { jobId: 'j1', jobGrowId: 'g2' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });
  it('returns combination stats', async () => {
    const rows = [{
      creature_item_id: 'ci', creature_item_name: 'CN',
      red_id: 'r1', red_name: 'RN',
      blue_id: 'b1', blue_name: 'BN',
      green_id: 'g1', green_name: 'GN',
      usage_count: '7'
    }];
    mockQuery.mockResolvedValueOnce({ rows });

    await getCreatureArtifactCombinations(req, res);

    expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT[\s\S]*COUNT/), ['j1','g2']);
    const resp = res.json.mock.calls[0][0];
    expect(resp.combinationStats).toEqual([{ combinationStats: undefined }]);
    // Actually verify content
    expect(resp.combinationStats).toEqual([{
      creature_item:   { id: 'ci', name: 'CN' },
      artifact_red:    { id: 'r1', name: 'RN' },
      artifact_blue:   { id: 'b1', name: 'BN' },
      artifact_green:  { id: 'g1', name: 'GN' },
      usage_count:     7
    }]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles combo DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('combo fail'));
    await getCreatureArtifactCombinations(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
