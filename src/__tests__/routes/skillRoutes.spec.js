// src/__tests__/routes/skillRoutes.spec.js

// 1) Mock the controller before importing the router
const mockFetchSkills = jest.fn((req, res) => res.json({ fetch: true }));
const mockGetSkillStats = jest.fn((req, res) => res.json({ stats: true }));

jest.mock('../../controllers/skillController', () => ({
  fetchSkills: mockFetchSkills,
  getSkillStats: mockGetSkillStats
}));

const request = require('supertest');
const express = require('express');
const skillRoutes = require('../../routes/skillRoutes');

describe('skillRoutes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/skill', skillRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /skill/fetch/:serverId/:jobId/:jobGrowId calls fetchSkills and returns JSON', async () => {
    const res = await request(app)
      .get('/skill/fetch/s1/j1/g1')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockFetchSkills).toHaveBeenCalledTimes(1);
    expect(mockFetchSkills).toHaveBeenCalledWith(
      expect.objectContaining({ params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } }),
      expect.any(Object)
    );
    expect(res.body).toEqual({ fetch: true });
  });

  it('GET /skill/stats/:jobId/:jobGrowId calls getSkillStats and returns JSON', async () => {
    const res = await request(app)
      .get('/skill/stats/j2/g2')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetSkillStats).toHaveBeenCalledTimes(1);
    expect(mockGetSkillStats).toHaveBeenCalledWith(
      expect.objectContaining({ params: { jobId: 'j2', jobGrowId: 'g2' } }),
      expect.any(Object)
    );
    expect(res.body).toEqual({ stats: true });
  });

  it('returns 404 for unsupported methods or unknown routes', async () => {
    await request(app).post('/skill/fetch/s1/j1/g1').expect(404);
    await request(app).put('/skill/stats/j2/g2').expect(404);
    await request(app).get('/skill/unknown').expect(404);
  });
});
