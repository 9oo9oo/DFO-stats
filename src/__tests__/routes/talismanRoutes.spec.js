// src/__tests__/routes/tailsmanRoutes.spec.js

// 1) Mock the controller before importing the router
const mockFetchTalismanAndRunes = jest.fn((req, res) => res.json({ fetch: true }));
const mockGetTalismanRuneStats = jest.fn((req, res) => res.json({ stats: true }));

jest.mock('../../controllers/talismanController', () => ({
    fetchTalismanAndRunes: mockFetchTalismanAndRunes,
    getTalismanRuneStats: mockGetTalismanRuneStats,
}));

const request = require('supertest');
const express = require('express');
const talismanRoutes = require('../../routes/tailsmanRoutes');

describe('talismanRoutes', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/talisman', talismanRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /talisman/fetch/:serverId/:jobId/:jobGrowId calls fetchTalismanAndRunes and returns JSON', async () => {
        const res = await request(app)
            .get('/talisman/fetch/s1/j1/g1')
            .expect(200)
            .expect('Content-Type', /json/);

        expect(mockFetchTalismanAndRunes).toHaveBeenCalledTimes(1);
        expect(mockFetchTalismanAndRunes).toHaveBeenCalledWith(
            expect.objectContaining({ params: { serverId: 's1', jobId: 'j1', jobGrowId: 'g1' } }),
            expect.any(Object)
        );
        expect(res.body).toEqual({ fetch: true });
    });

    it('GET /talisman/stats/:jobId/:jobGrowId calls getTalismanRuneStats and returns JSON', async () => {
        const res = await request(app)
            .get('/talisman/stats/j2/g2')
            .expect(200)
            .expect('Content-Type', /json/);

        expect(mockGetTalismanRuneStats).toHaveBeenCalledTimes(1);
        expect(mockGetTalismanRuneStats).toHaveBeenCalledWith(
            expect.objectContaining({ params: { jobId: 'j2', jobGrowId: 'g2' } }),
            expect.any(Object)
        );
        expect(res.body).toEqual({ stats: true });
    });

    it('returns 404 for unsupported methods or unknown routes', async () => {
        await request(app).post('/talisman/fetch/s1/j1/g1').expect(404);
        await request(app).put('/talisman/stats/j2/g2').expect(404);
        await request(app).get('/talisman/unknown').expect(404);
    });
});
