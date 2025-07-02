// src/__tests__/controllers/equipmentController.spec.js

jest.mock('axios');
const axios = require('axios');

const mockQuery = jest.fn();
jest.mock('../../models/db', () => ({ query: mockQuery }));
const client = require('../../models/db');

process.env.DFO_API_KEY = 'testkey';

const {
  fetchEquipment,
  getEquipmentStats,
  getEquipmentCombinations
} = require('../../controllers/equipmentController');

describe('equipmentController.fetchEquipment', () => {
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
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('returns 404 when no character IDs', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await fetchEquipment(req, res);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT character_id/), ['s1','j1','g1']);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No character IDs found for the specified class.' });
  });

  it('returns 200 when equipment API returns no data', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    axios.get.mockResolvedValueOnce({ data: {} });

    await fetchEquipment(req, res);

    const expectedUrl = `https://api.dfoneople.com/df/servers/s1/characters/c1/equip/equipment?apikey=testkey`;
    expect(axios.get).toHaveBeenCalledWith(expectedUrl);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Equipment data fetched and stored successfully for the retrieved character IDs.' });
  });

  it('inserts equipment and fusion items on success', async () => {
    // Setup one character
    mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    // axios returns equipment array
    const equipmentData = { equipment: [
      { slotId: 'WEAPON', itemId: 'i1', itemName: 'Name1', setItemId: 'sI1', setItemName: 'SName1' },
      { slotId: 'SHOULDER', itemId: 'i2', itemName: 'Name2', setItemId: 'sI2', setItemName: 'SName2', upgradeInfo: { itemId: 'f1', itemName: 'FName1' } }
    ]};
    axios.get.mockResolvedValueOnce({ data: equipmentData });
    // mock insert calls
    mockQuery.mockResolvedValue({});

    await fetchEquipment(req, res);

    // First call: SELECT character_id
    expect(mockQuery.mock.calls[0][0]).toMatch(/SELECT character_id/);
    // Second call: INSERT equipment for WEAPON
    const insertCall1 = mockQuery.mock.calls[1];
    expect(insertCall1[0]).toMatch(/INSERT INTO character_equipment/);
    expect(insertCall1[1]).toEqual([
      'c1','WEAPON','i1','sI1',null,'Name1','SName1',null
    ]);
    // Third call: INSERT equipment for SHOULDER with fusion
    const insertCall2 = mockQuery.mock.calls[2];
    expect(insertCall2[1]).toEqual([
      'c1','SHOULDER','i2','sI2','f1','Name2','SName2','FName1'
    ]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Equipment data fetched and stored successfully for the retrieved character IDs.' });
  });
});

describe('equipmentController.getEquipmentStats', () => {
  let req, res;
  beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterAll(() => console.error.mockRestore());
  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { jobId: 'j1', jobGrowId: 'g2' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('aggregates and returns equipment stats', async () => {
    const titleRows = [{ item_id:'ti', item_name:'TName', usage_count:'5' }];
    const itemsRows = [{ slot_id:'WEAPON', item_id:'i1', item_name:'Name1', usage_count:'10' }];
    const fusionRows = [{ slot_id:'SHOULDER', fusion_item_id:'f1', fusion_item_name:'FName', usage_count:'2' }];
    const setRows = [{ set_item_id:'s1', set_item_name:'SName', usage_count:'3' }];
    const sampleRows = [{ slot_id:'WEAPON', sample_number:'20' }];
    const fusionSampleRows = [{ slot_id:'SHOULDER', sample_number:'4' }];
    const setSampleRows = [{ sample_number:'5' }];

    mockQuery
      .mockResolvedValueOnce({ rows: titleRows })
      .mockResolvedValueOnce({ rows: itemsRows })
      .mockResolvedValueOnce({ rows: fusionRows })
      .mockResolvedValueOnce({ rows: setRows })
      .mockResolvedValueOnce({ rows: sampleRows })
      .mockResolvedValueOnce({ rows: fusionSampleRows })
      .mockResolvedValueOnce({ rows: setSampleRows });

    await getEquipmentStats(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(7);
    const resp = res.json.mock.calls[0][0];
    // Title slot usage_rate = 5/ usage total of TITLE? sampleRows only WEAPON, so TITLE total = 0 → 0
    expect(resp.itemsBySlot.TITLE).toEqual([{ slot:'TITLE', item_id:'ti', item_name:'TName', usage_count:5, usage_rate:0 }]);
    expect(resp.itemsBySlot.WEAPON).toEqual([{ slot:'WEAPON', item_id:'i1', item_name:'Name1', usage_count:10, usage_rate:0.5 }]);
    expect(resp.fusionItemsBySlot.SHOULDER).toEqual([{ slot:'SHOULDER', fusion_item_id:'f1', fusion_item_name:'FName', usage_count:2, usage_rate:0.5 }]);
    expect(resp.setUsage).toEqual([{ set_item_id:'s1', set_item_name:'SName', usage_count:3, usage_rate:0.6 }]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('fail'));
    await getEquipmentStats(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});

describe('equipmentController.getEquipmentCombinations', () => {
  let req, res;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { jobId: 'j1', jobGrowId: 'g2' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('returns combination stats for each group', async () => {
    // There are 3 groups * 2 (normal+fusion) = 6 queries
    const coreRows = [{ core_id:'c1', core_name:'C1', usage_count:'3' }];
    const coreFusionRows = [{ core_id:'c2', core_name:'C2', usage_count:'1' }];
    const jewelsRows = [{ wrist_id:'w1', wrist_name:'W1', usage_count:'2' }];
    const jewelsFusionRows = [{ wrist_id:'w2', wrist_name:'W2', usage_count:'1' }];
    const extrasRows = [{ support_id:'s1', support_name:'S1', usage_count:'4' }];
    const extrasFusionRows = [{ support_id:'s2', support_name:'S2', usage_count:'2' }];

    mockQuery
      .mockResolvedValueOnce({ rows: coreRows })
      .mockResolvedValueOnce({ rows: coreFusionRows })
      .mockResolvedValueOnce({ rows: jewelsRows })
      .mockResolvedValueOnce({ rows: jewelsFusionRows })
      .mockResolvedValueOnce({ rows: extrasRows })
      .mockResolvedValueOnce({ rows: extrasFusionRows });

    await getEquipmentCombinations(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(6);
    expect(res.json).toHaveBeenCalledWith({
      core: coreRows,
      coreFusion: coreFusionRows,
      jewels: jewelsRows,
      jewelsFusion: jewelsFusionRows,
      extras: extrasRows,
      extrasFusion: extrasFusionRows
    });
  });

  it('handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('combo fail'));
    await getEquipmentCombinations(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'combo fail' });
  });
});
