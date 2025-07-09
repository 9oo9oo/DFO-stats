import axios from 'axios';
import type { Request, Response, NextFunction } from 'express';
import client from '../../models/db';

// We'll dynamically require the controller after setting the env var
let getAvatar: (req: Request<any>, res: Response, next: NextFunction) => Promise<void>;
let getAvatarStats: (req: Request<any>, res: Response) => Promise<void>;

jest.mock('axios');
jest.mock('../../models/db', () => ({
  __esModule: true,
  default: { query: jest.fn() }
}));

const mockAxiosGet = axios.get as jest.Mock;
const mockClientQuery = (client as any).query as jest.Mock;

// Ensure API key is present before loading the controller module
beforeAll(() => {
  process.env.DFO_API_KEY = 'testkey';
  jest.resetModules();
  const controller = require('../../controllers/avatarController');
  getAvatar = controller.getAvatar;
  getAvatarStats = controller.getAvatarStats;
});

describe('getAvatar', () => {
  let req: Partial<Request<{ serverId: string; jobId: string; jobGrowId: string }>>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    mockClientQuery.mockReset();
    mockAxiosGet.mockReset();
    next = jest.fn();
    req = { params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('returns 404 when no character IDs found', async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [] });

    await getAvatar(req as Request<any>, res as Response, next);

    expect(mockClientQuery).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT character_id/),
      ['s1', 'j1', 'g1']
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No character IDs found.' });
  });

  it('skips when API errors or no avatar array', async () => {
    mockClientQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    mockAxiosGet.mockResolvedValueOnce({ data: {} });

    await getAvatar(req as Request<any>, res as Response, next);

    expect(mockAxiosGet).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Avatar data fetched & stored successfully.' });
  });

  it('inserts avatar and emblems when present', async () => {
    const avatarItem = {
      slotId: 'slot1', slotName: 'name1', itemId: 'item1', itemName: 'n1',
      itemRarity: 'rare', optionAbility: 'opt1',
      emblems: [{ slotNo: 2, slotColor: 'blue', itemId: 'e1', itemName: 'eName', itemRarity: 'uncommon' }]
    };

    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    mockAxiosGet.mockResolvedValueOnce({ data: { avatar: [avatarItem] } });

    await getAvatar(req as Request<any>, res as Response, next);

    expect(mockClientQuery).toHaveBeenCalledTimes(4);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Avatar data fetched & stored successfully.' });
  });
});

describe('getAvatarStats', () => {
  let req: Partial<Request<{ jobId: string; jobGrowId: string }>>;
  let res: Partial<Response>;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    mockClientQuery.mockReset();
    req = { params: { jobId: 'j1', jobGrowId: 'g2' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('aggregates and returns avatar and emblem stats', async () => {
    const wepRows = [ { slot_id: 'WEAPON', item_id: 'id1', item_name: 'Sword', option_ability: null, usage_count: '5' } ];
    const optRows = [ { slot_id: 'HEADGEAR', item_id: null, item_name: null, option_ability: 'power', usage_count: '2' } ];
    const emblemRows = [ { slot_color: 'Blue', item_id: 'eid', item_name: 'Emblem', usage_count: '10' } ];

    mockClientQuery
      .mockResolvedValueOnce({ rows: wepRows })
      .mockResolvedValueOnce({ rows: optRows })
      .mockResolvedValueOnce({ rows: emblemRows });

    await getAvatarStats(req as Request<any>, res as Response);

    expect(mockClientQuery).toHaveBeenCalledTimes(3);
    const resp = (res.json as jest.Mock).mock.calls[0][0];
    expect(resp.avatarStatsBySlot.WEAPON[0]).toMatchObject({ slot: 'WEAPON', usage_count: 5 });
    expect(resp.emblemStatsByColor.blue[0]).toMatchObject({ slot_color: 'blue', usage_count: 10 });
  });

  it('sends 500 when a DB error occurs', async () => {
    mockClientQuery.mockRejectedValueOnce(new Error('db fail'));

    await getAvatarStats(req as Request<any>, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
