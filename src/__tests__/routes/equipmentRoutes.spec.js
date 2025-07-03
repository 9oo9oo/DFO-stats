// src/__tests__/routes/equipmentRoutes.spec.js

// 1) Mock the controller before importing the router
const mockFetchEquipment = jest.fn((req, res) => res.json({ fetch: true }));
const mockGetEquipmentStats = jest.fn((req, res) => res.json({ stats: true }));
const mockGetEquipmentCombos = jest.fn((req, res) => res.json({ combos: true }));

jest.mock('../../controllers/equipmentController', () => ({
  fetchEquipment: mockFetchEquipment,
  getEquipmentStats: mockGetEquipmentStats,
  getEquipmentCombinations: mockGetEquipmentCombos
}));

const request = require('supertest');
const express = require('express');
const equipmentRoutes = require('../../routes/equipmentRoutes');

describe('equipmentRoutes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/equipment', equipmentRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /equipment/fetch/:serverId/:jobId/:jobGrowId calls fetchEquipment and returns JSON', async () => {
    const res = await request(app)
      .get('/equipment/fetch/s1/j1/g1')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockFetchEquipment).toHaveBeenCalledTimes(1);
    expect(mockFetchEquipment).toHaveBeenCalledWith(
      expect.objectContaining({ params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(res.body).toEqual({ fetch: true });
  });

  it('GET /equipment/stats/:jobId/:jobGrowId calls getEquipmentStats and returns JSON', async () => {
    const res = await request(app)
      .get('/equipment/stats/j2/g2')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetEquipmentStats).toHaveBeenCalledTimes(1);
    expect(mockGetEquipmentStats).toHaveBeenCalledWith(
      expect.objectContaining({ params: { jobId: 'j2', jobGrowId: 'g2' } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(res.body).toEqual({ stats: true });
  });

  it('GET /equipment/combinations/:jobId/:jobGrowId calls getEquipmentCombinations and returns JSON', async () => {
    const res = await request(app)
      .get('/equipment/combinations/j3/g3')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetEquipmentCombos).toHaveBeenCalledTimes(1);
    expect(mockGetEquipmentCombos).toHaveBeenCalledWith(
      expect.objectContaining({ params: { jobId: 'j3', jobGrowId: 'g3' } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(res.body).toEqual({ combos: true });
  });

  it('returns 404 for unsupported methods or unknown routes', async () => {
    await request(app).post('/equipment/fetch/s1/j1/g1').expect(404);
    await request(app).put('/equipment/stats/j2/g2').expect(404);
    await request(app).get('/equipment/unknown').expect(404);
  });
});
