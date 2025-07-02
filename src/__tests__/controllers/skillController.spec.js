// src/__tests__/controllers/skillController.spec.js

jest.mock('axios');
const axios = require('axios');

const mockQuery = jest.fn();
jest.mock('../../models/db', () => ({ query: mockQuery }));
const client = require('../../models/db');

process.env.DFO_API_KEY = 'testkey';
const { fetchSkills, getSkillStats } = require('../../controllers/skillController');

describe('skillController.fetchSkills', () => {
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

  it('returns 404 when no character IDs found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await fetchSkills(req, res);

    expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT character_id/), ['s1','j1','g1']);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No character IDs found for the specified class.' });
  });

  it('returns 200 when API returns no skill data', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    axios.get.mockResolvedValueOnce({ data: {} });

    await fetchSkills(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      `https://api.dfoneople.com/df/servers/s1/characters/c1/skill/style?apikey=testkey`
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Skill data fetched and stored successfully for the retrieved character IDs.' });
  });

  it('inserts active and passive skills and returns 200', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ character_id: 'c1' }] });
    const skillData = {
      skill: {
        style: {
          active: [ { skillId: 'a1', name: 'ActiveSkill', level: 2, requiredLevel: 1 } ],
          passive: [ { skillId: 'p1', name: 'PassiveSkill', level: 3, requiredLevel: 1 } ]
        }
      }
    };
    axios.get.mockResolvedValueOnce({ data: skillData });
    // subsequent insert queries
    mockQuery.mockResolvedValue({});

    await fetchSkills(req, res);

    // first call: select character IDs
    expect(mockQuery.mock.calls[0][0]).toMatch(/SELECT character_id/);
    // second call: insert active skill
    expect(mockQuery.mock.calls[1][0]).toMatch(/INSERT INTO character_skills/);
    expect(mockQuery.mock.calls[1][1]).toEqual(['c1','a1','ActiveSkill',2,1]);
    // third call: insert passive skill
    expect(mockQuery.mock.calls[2][1]).toEqual(['c1','p1','PassiveSkill',3,1]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Skill data fetched and stored successfully for the retrieved character IDs.' });
  });
});

describe('skillController.getSkillStats', () => {
  let req, res;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
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

  it('returns formatted skill stats successfully', async () => {
    const rows = [
      { skill_id: 's1', skill_name: 'Skill1', required_level: '5', average_level: '4.2', total_count: '8' }
    ];
    mockQuery.mockResolvedValueOnce({ rows });

    await getSkillStats(req, res);

    expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT cs.skill_id/), ['j1','g2']);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ skillStats: [
      { skill_id: 's1', skill_name: 'Skill1', required_level: 5, average_level: 4.2, total_count: 8 }
    ] });
  });

  it('returns 500 if DB query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('db error'));

    await getSkillStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
