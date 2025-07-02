// src/__tests__/controllers/avatarController.spec.js

jest.mock('axios');
const axios = require('axios');

const mockQuery = jest.fn();
jest.mock('../../models/db', () => ({ query: mockQuery }));
const client = require('../../models/db');

process.env.DFO_API_KEY = 'testkey';

const {
  getAvatar,
  getAvatarStats
} = require('../../controllers/avatarController');

describe('getAvatar', () => {
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
    mockQuery.mockReset();
    axios.get.mockReset();
    req = { params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  });

  it('returns 404 when no character IDs found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await getAvatar(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT character_id/),
      ['s1', 'j1', 'g1']
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No character IDs found for the specified class.'
    });
  });

  it('returns 200 when avatar API returns no data', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    axios.get.mockResolvedValueOnce({ data: {} });

    await getAvatar(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      `https://api.dfoneople.com/df/servers/s1/characters/c1/equip/avatar?apikey=testkey`
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Avatar data fetched and stored successfully for the retrieved character IDs.'
    });
  });

  it('inserts avatar and emblems when present', async () => {
    // 1) getCharacterIds, 2) insertAvatar, 3) deleteEmblems, 4) insertEmblem
    mockQuery
      .mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({ }) // deleteEmblems
      .mockResolvedValueOnce({ }); // insertEmblem

    const avatarItem = {
      slotId: 'slot1',
      slotName: 'name1',
      itemId: 'item1',
      itemName: 'n1',
      itemRarity: 'rare',
      optionAbility: 'opt1',
      emblems: [
        {
          slotNo: 2,
          slotColor: 'blue',
          itemId: 'e1',
          itemName: 'eName',
          itemRarity: 'uncommon'
        }
      ]
    };
    axios.get.mockResolvedValueOnce({ data: { avatar: [avatarItem] } });

    await getAvatar(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(4);
    // first call is the SELECT character_id
    expect(mockQuery.mock.calls[0][0]).toMatch(/SELECT character_id/);
    expect(mockQuery.mock.calls[0][1]).toEqual(['s1', 'j1', 'g1']);
    // second is the INSERT ... RETURNING id
    expect(mockQuery.mock.calls[1][1][0]).toBe('c1');
    // last call uses the avatarRecordId = 10
    expect(mockQuery.mock.calls[3][1][0]).toBe(10);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Avatar data fetched and stored successfully for the retrieved character IDs.'
    });
  });
});

describe('getAvatarStats', () => {
  let req, res;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    mockQuery.mockReset();
    req = { params: { jobId: 'j1', jobGrowId: 'g2' } };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };
  });

  it('aggregates and returns avatar and emblem stats', async () => {
    const wepRows = [
      { slot_id: 'WEAPON', item_id: 'id1', item_name: 'Sword', option_ability: null, usage_count: '5' }
    ];
    const optRows = [
      { slot_id: 'HEADGEAR', item_id: null, item_name: null, option_ability: 'power', usage_count: '2' }
    ];
    const emblemRows = [
      { slot_color: 'Blue', item_id: 'eid', item_name: 'Emblem', usage_count: '10' }
    ];

    mockQuery
      .mockResolvedValueOnce({ rows: wepRows })
      .mockResolvedValueOnce({ rows: optRows })
      .mockResolvedValueOnce({ rows: emblemRows });

    await getAvatarStats(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(3);
    expect(mockQuery.mock.calls[0][1]).toEqual(['j1', 'g2']);

    const resp = res.json.mock.calls[0][0];

    // Weapon slot should be converted and usage_count parsed as number
    expect(resp.avatarStatsBySlot.WEAPON).toEqual([
      expect.objectContaining({
        slot: 'WEAPON',
        item_id: 'id1',
        item_name: 'Sword',
        option_ability: null,
        usage_count: 5
      })
    ]);
    // Headgear under avatarStatsBySlot
    expect(resp.avatarStatsBySlot.HEADGEAR).toEqual([
      expect.objectContaining({
        slot: 'HEADGEAR',
        option_ability: 'power',
        usage_count: 2
      })
    ]);
    // Emblem stats grouped by lowercase color
    expect(resp.emblemStatsByColor.blue).toEqual([
      expect.objectContaining({
        slot_color: 'blue',
        item_id: 'eid',
        item_name: 'Emblem',
        usage_count: 10
      })
    ]);
  });

  it('sends 500 when a DB error occurs', async () => {
    mockQuery.mockRejectedValueOnce(new Error('db fail'));

    await getAvatarStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
