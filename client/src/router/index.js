// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import ServerPage from '@/views/ServerPage.vue';
import EquipmentStats from '@/views/EquipmentStats.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage,
    },
    {
        path: '/servers',
        name: 'Servers',
        component: ServerPage,
    },
    {
        path: '/equipment/stats/:jobId/:jobGrowId',
        name: 'EquipmentStats',
        component: EquipmentStats,
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;