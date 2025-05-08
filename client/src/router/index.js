// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import ServerPage from '@/views/ServerPage.vue';
import EquipmentStats from '@/views/EquipmentStats.vue';
import CreatureStats from '@/views/CreatureStats.vue';
import TalismanStats from '@/views/TalismanStats.vue';
import SkillStats from '@/views/SkillStats.vue';
import AvatarStats from '@/views/AvatarStats.vue';
import SummaryStats from '@/views/Summary.vue';

const routes = [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/servers', name: 'Servers', component: ServerPage },
    { path: '/equipment/stats/:jobId/:jobGrowId', name: 'EquipmentStats', component: EquipmentStats },
    { path: '/creature/stats/:jobId/:jobGrowId', name: 'CreatureStats', component: CreatureStats },
    { path: '/talisman/stats/:jobId/:jobGrowId', name: 'TalismanStats', component: TalismanStats },
    { path: '/skill/stats/:jobId/:jobGrowId', name: 'SkillStats', component: SkillStats },
    { path: '/avatar/stats/:jobId/:jobGrowId', name: 'AvatarStats', component: AvatarStats },
    { path: '/summary/stats/:jobId/:jobGrowId', name: 'SummaryStats', component: SummaryStats }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;