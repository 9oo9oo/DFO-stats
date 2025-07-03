// src/__tests__/routes/avatarRoutes.spec.js

// 1) Mock the controller before importing the router
const mockGetAvatar = jest.fn((req, res) => res.json({ fetch: true }));
const mockGetAvatarStats = jest.fn((req, res) => res.json({ stats: true }));

jest.mock('../../controllers/avatarController', () => ({
  getAvatar: mockGetAvatar,
  getAvatarStats: mockGetAvatarStats,
}));

const request = require('supertest');
const express = require('express');
const avatarRoutes = require('../../routes/avatarRoutes');

describe('avatarRoutes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/avatar', avatarRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /avatar/fetch/:serverId/:jobId/:jobGrowId calls getAvatar and returns JSON', async () => {
    const res = await request(app)
      .get('/avatar/fetch/s1/j1/g1')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetAvatar).toHaveBeenCalledTimes(1);
    expect(mockGetAvatar).toHaveBeenCalledWith(
      expect.objectContaining({ params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(res.body).toEqual({ fetch: true });
  });

  it('GET /avatar/stats/:jobId/:jobGrowId calls getAvatarStats and returns JSON', async () => {
    const res = await request(app)
      .get('/avatar/stats/j2/g2')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetAvatarStats).toHaveBeenCalledTimes(1);
    expect(mockGetAvatarStats).toHaveBeenCalledWith(
      expect.objectContaining({ params: { jobId: 'j2', jobGrowId: 'g2' } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(res.body).toEqual({ stats: true });
  });

  it('returns 404 for unsupported routes/methods', async () => {
    await request(app).post('/avatar/fetch/s1/j1/g1').expect(404);
    await request(app).put('/avatar/stats/j2/g2').expect(404);
    await request(app).get('/avatar/unknown').expect(404);
  });
});
