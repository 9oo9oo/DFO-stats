"use strict";
// src/__tests__/routes/serverRoutes.spec.js
// 1) mock the controller before importing the route
const mockGetServers = jest.fn((req, res) => res.json({ hello: 'world' }));
jest.mock('../../controllers/serverController', () => ({
    getServers: mockGetServers,
}));
const request = require('supertest');
const express = require('express');
const serverRoutes = require('../../routes/serverRoutes');
const serverController = require('../../controllers/serverController');
describe('serverRoutes', () => {
    let app;
    beforeAll(() => {
        // build a minimal app mounting your router at '/servers'
        app = express();
        app.use(express.json());
        app.use('/servers', serverRoutes);
    });
    beforeEach(() => {
        mockGetServers.mockClear();
    });
    it('GET /servers → calls serverController.getServers and returns its JSON', async () => {
        const res = await request(app)
            .get('/servers')
            .expect(200)
            .expect('Content-Type', /json/);
        // 2) ensure our controller mock was called exactly once
        expect(mockGetServers).toHaveBeenCalledTimes(1);
        // 3) ensure the JSON payload is what our mock sent
        expect(res.body).toEqual({ hello: 'world' });
    });
    it('non-GET methods on /servers/ respond 404', async () => {
        await request(app).post('/servers').expect(404);
        await request(app).put('/servers').expect(404);
        await request(app).delete('/servers').expect(404);
    });
});
