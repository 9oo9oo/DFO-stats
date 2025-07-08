<template>
    <h1>Talisman & Rune Statistics for {{ jobFriendlyName }}</h1>
    <div class="equipment-wrapper">
     <!-- Navigation Tabs -->
     <div class="equipment-tabs">
       <router-link
         :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('EquipmentStats') }"
       >Equipment</router-link>
       <router-link
         :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('AvatarStats') }"
       >Avatar</router-link>
       <router-link
         :to="{ name: 'CreatureStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('CreatureStats') }"
       >Creature</router-link>
       <router-link
         :to="{ name: 'TalismanStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('TalismanStats') }"
       >Talisman</router-link>
       <router-link
         :to="{ name: 'SkillStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('SkillStats') }"
       >Skill</router-link>
     </div>

     <!-- Talisman Layout (Still dunno what to do with this) -->
     <div class="equipment-square">
     </div>
   </div>

    <div v-if="jobGrowId">
      <div v-if="loading">Loading talisman stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">

        <!-- Talisman & Rune Side‑by‑Side -->
        <section class="stat-section">
          <div class="tables-container side-by-side">
            <div class="slot">
              <h2>Talisman</h2>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.talismanStats" :key="item.talisman_item_id">
                    <td>{{ item.talisman_item_name }}</td>
                    <td>{{ formatRate(item.usage_count, 3) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="slot">
              <h2>Rune</h2>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.runeStats" :key="item.rune_item_id">
                    <td>{{ item.rune_item_name }}</td>
                    <td>{{ formatRate(item.usage_count, 9) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import jobMappings from '@/config/jobMappings';
import type { JobMapping, JobGrow } from '@/types/jobMappings';

// ——— Types —————————————————————————————————————————————

interface TalismanStat {
  talisman_item_id:   string;
  talisman_item_name: string;
  usage_count:        number;
}

interface RuneStat {
  rune_item_id:   string;
  rune_item_name: string;
  usage_count:    number;
}

interface TalismanStatsData {
  talismanStats?: TalismanStat[];
  runeStats?:     RuneStat[];
}

// ——— State —————————————————————————————————————————————

const stats   = ref<TalismanStatsData | null>(null);
const loading = ref(false);
const error   = ref<string | null>(null);

// ——— Routing & Job Info ——————————————————————————————————

const route     = useRoute();
const router    = useRouter();
const jobId     = computed(() => route.params.jobId as string);
const jobGrowId = computed(() => route.params.jobGrowId as string);

const jobMapping = computed<JobMapping>(() =>
  jobMappings[jobId.value] ?? ({} as JobMapping)
);

const jobFriendlyName = computed(() => {
  const grows = jobMapping.value.finalJobGrows ?? [];
  const found = grows.find((g: JobGrow) => g.jobGrowId === jobGrowId.value);
  return found?.jobGrowName ?? jobMapping.value.jobName ?? 'Unknown Job';
});

// ——— Lifecycle & Watchers —————————————————————————————

onMounted(() => {
  if (jobGrowId.value) fetchTalismanStats();
});

watch(() => route.params.jobGrowId, (n, o) => {
  if (n !== o) fetchTalismanStats();
});

// ——— Methods —————————————————————————————————————————

async function fetchTalismanStats(): Promise<void> {
  if (!jobGrowId.value) return;
  loading.value = true;
  try {
    const { data } = await axios.get<TalismanStatsData>(
      `/api/talisman/stats/${jobId.value}/${jobGrowId.value}`
    );
    stats.value = data;
  } catch (err: any) {
    error.value = err.response?.data?.error ?? err.message;
  } finally {
    loading.value = false;
  }
}

function isActiveRoute(name: string): boolean {
  return router.currentRoute.value.name === name;
}

function formatRate(value: number, divisor: number): string {
  return (value / divisor).toFixed(2);
}
</script>

<style scoped>
/* Wrapper */
.equipment-wrapper {
  width: 700px;
  margin: 0 auto 40px;
  padding-top: 20px;
  position: relative;
}

/* Tabs */
.equipment-tabs {
  width: 95%;
  margin: 0 auto;
  display: flex;
  background: #222;
  border: 2px solid #fff;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  box-sizing: border-box;
}

.equipment-tabs .tab-button {
  flex: 1;
  padding: 10px;
  text-align: center;
  color: #fff;
  text-decoration: none;
  border-right: 1px solid #fff;
  box-sizing: border-box;
}

.equipment-tabs .tab-button:last-child {
  border-right: none;
}

.equipment-tabs .tab-button:hover,
.equipment-tabs .tab-button.active {
  background-color: #e56717;
}

/* Square Container */
.equipment-square {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-top: 0;
  padding: 10px;
  border: 2px solid #fff;
  border-radius: 4px;
  box-sizing: border-box;
}

.equipment-square .side,
.equipment-square .center {
  flex: 1;
}

/* Navigation */
.stats-nav {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.stats-nav button {
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
  background-color: transparent;
  color: #fff;
  border: 2px solid #fff;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.stats-nav button:hover,
.stats-nav button.active {
  background-color: #e56717;
}

/* Section Title */
.slot h2 {
  margin-bottom: 16px;
  padding-bottom: 8px;
  color: #e56717;
  border-bottom: 2px solid #e56717;
}

/* Tables Container */
.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.tables-container.side-by-side {
  display: flex;
  column-gap: 60px;
  /* horizontal only */
}

/* Full-Width Slots */
.full-width .slot {
  flex: 0 0 100%;
}

/* Side-by-Side Slots */
.tables-container.side-by-side .slot {
  flex: 1;
}

/* Section Spacing */
.stat-section {
  margin: 40px;
}

/* Table Styles */
.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  vertical-align: middle;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
}

.stats-table th:nth-child(2),
.stats-table td:nth-child(2) {
  width: 20%;
  text-align: center;
  vertical-align: middle;
}
</style>