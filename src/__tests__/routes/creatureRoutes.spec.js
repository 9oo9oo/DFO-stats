// src/__tests__/routes/creatureRoutes.spec.js

// 1) Mock the controller before importing the router
const mockFetchCreature = jest.fn((req, res) => res.json({ fetch: true }));
const mockGetCreatureStats = jest.fn((req, res) => res.json({ stats: true }));
const mockGetCreatureCombos = jest.fn((req, res) => res.json({ combos: true }));

jest.mock('../../controllers/creatureController', () => ({
  fetchCreature: mockFetchCreature,
  getCreatureStats: mockGetCreatureStats,
  getCreatureArtifactCombinations: mockGetCreatureCombos
}));

const request = require('supertest');
const express = require('express');
const creatureRoutes = require('../../routes/creatureRoutes');

describe('creatureRoutes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/creature', creatureRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /creature/fetch/:serverId/:jobId/:jobGrowId calls fetchCreature and returns JSON', async () => {
    const res = await request(app)
      .get('/creature/fetch/s1/j1/g1')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockFetchCreature).toHaveBeenCalledTimes(1);
    expect(mockFetchCreature).toHaveBeenCalledWith(
      expect.objectContaining({ params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } }),
      expect.any(Object)
    );
    expect(res.body).toEqual({ fetch: true });
  });

  it('GET /creature/stats/:jobId/:jobGrowId calls getCreatureStats and returns JSON', async () => {
    const res = await request(app)
      .get('/creature/stats/j2/g2')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetCreatureStats).toHaveBeenCalledTimes(1);
    expect(mockGetCreatureStats).toHaveBeenCalledWith(
      expect.objectContaining({ params: { jobId: 'j2', jobGrowId: 'g2' } }),
      expect.any(Object)
    );
    expect(res.body).toEqual({ stats: true });
  });

  it('GET /creature/combinations/:jobId/:jobGrowId calls getCreatureArtifactCombinations and returns JSON', async () => {
    const res = await request(app)
      .get('/creature/combinations/j3/g3')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetCreatureCombos).toHaveBeenCalledTimes(1);
    expect(mockGetCreatureCombos).toHaveBeenCalledWith(
      expect.objectContaining({ params: { jobId: 'j3', jobGrowId: 'g3' } }),
      expect.any(Object)
    );
    expect(res.body).toEqual({ combos: true });
  });

  it('returns 404 for unsupported methods or unknown routes', async () => {
    await request(app).post('/creature/fetch/s1/j1/g1').expect(404);
    await request(app).put('/creature/stats/j2/g2').expect(404);
    await request(app).get('/creature/unknown').expect(404);
  });
});
