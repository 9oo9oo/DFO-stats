// src/__tests__/routes/itemRoutes.spec.js

// 1) Mock the controller before importing the router
const mockGetItemInfo = jest.fn((req, res) => res.json({ item: true }));
jest.mock('../../controllers/itemController', () => ({
  getItemInfo: mockGetItemInfo,
}));

const request = require('supertest');
const express = require('express');
const itemRoutes = require('../../routes/itemRoutes');

describe('itemRoutes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/item', itemRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /item/:itemId calls getItemInfo and returns JSON', async () => {
    const res = await request(app)
      .get('/item/12345')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(mockGetItemInfo).toHaveBeenCalledTimes(1);
    expect(mockGetItemInfo).toHaveBeenCalledWith(
      expect.objectContaining({ params: { itemId: '12345' } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(res.body).toEqual({ item: true });
  });

  it('returns 404 for unsupported methods or unknown routes', async () => {
    await request(app).post('/item/12345').expect(404);
    await request(app).get('/item').expect(404);
    await request(app).get('/item/12345/extra').expect(404);
  });
});
