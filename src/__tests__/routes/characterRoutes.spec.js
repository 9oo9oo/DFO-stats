// src/__tests__/routes/characterRoutes.spec.js

// 1) Mock the controller before importing the router
const mockGetCharacter = jest.fn((req, res) => res.json({ character: true }));
jest.mock('../../controllers/characterController', () => ({
  getCharacter: mockGetCharacter,
}));

const request = require('supertest');
const express = require('express');
const characterRoutes = require('../../routes/characterRoutes');

describe('characterRoutes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/character', characterRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /character/:serverId/:jobId/:jobGrowId calls getCharacter and returns JSON', async () => {
    const res = await request(app)
      .get('/character/s1/j1/g1')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetCharacter).toHaveBeenCalledTimes(1);
    expect(mockGetCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(res.body).toEqual({ character: true });
  });

  it('returns 404 for unsupported methods or unknown routes', async () => {
    await request(app).post('/character/s1/j1/g1').expect(404);
    await request(app).get('/character/unsupported/path').expect(404);
  });
});
