<template>
    <h1>Creature Statistics for {{ jobFriendlyName }}</h1>
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

      <!-- Creautre & Artifact layout -->
      <div class="equipment-square">
        <div class="side left">
          <div class="left-button-container">
            <div class="slot-button slot-purple" @click="scrollToSlot('CREATURE')">Creature</div>
          </div>
        </div>

        <div class="center"></div>

        <div class="side right">
          <div class="right-button-container">
            <div class="slot-button slot-red" @click="scrollToSlot('ARTIFACT_RED')">Red Artifact</div>
            <div class="slot-button slot-blue" @click="scrollToSlot('ARTIFACT_BLUE')">Blue Artifact</div>
            <div class="slot-button slot-green" @click="scrollToSlot('ARTIFACT_GREEN')">Green Artifact</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="jobGrowId">
      <div v-if="loading">Loading creature stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- Creature Section -->
        <section :ref="setSlotRef('CREATURE')" class="stat-section">
          <h2>Creature</h2>
          <div class="tables-container full-width">
            <div class="slot">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Usage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in (stats.creatureStats || []).slice(0, 5)" :key="item.creature_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip :id="item.creature_item_id">
                          <img
                            :src="getItemImageUrl(item.creature_item_id)"
                            :alt="item.creature_item_name"
                            class="item-icon"
                            loading="lazy"
                            @error="hideBrokenIcon"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.creature_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Artifact Section (Red, Blue, Green) -->
        <section class="stat-section">
          <h2>Artifact</h2>
          <div class="tables-container artifact-container">
            <div class="slot" :ref="setSlotRef('ARTIFACT_RED')">
              <h3>Red Artifact </h3>
              <table class="stats-table">
                <thead>
                  <tr><th>Item</th><th>Usage</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in (stats.artifactRedStats || []).slice(0, 5)" :key="item.artifact_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip
                          :id="item.artifact_item_id"
                          :name="item.artifact_item_name"
                        >
                          <img
                            :src="getItemImageUrl(item.artifact_item_id)"
                            :alt="item.artifact_item_name"
                            class="item-icon"
                            loading="lazy"
                            @error="hideBrokenIcon"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.artifact_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="slot" :ref="setSlotRef('ARTIFACT_BLUE')">
              <h3>Blue Artifact</h3>
              <table class="stats-table">
                <thead>
                  <tr><th>Item</th><th>Usage</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in (stats.artifactBlueStats || []).slice(0, 5)" :key="item.artifact_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip
                          :id="item.artifact_item_id"
                          :name="item.artifact_item_name"
                        >
                          <img
                            :src="getItemImageUrl(item.artifact_item_id)"
                            :alt="item.artifact_item_name"
                            class="item-icon"
                            loading="lazy"
                            @error="hideBrokenIcon"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.artifact_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="slot" :ref="setSlotRef('ARTIFACT_GREEN')">
              <h3>Green Artifact</h3>
              <table class="stats-table">
                <thead>
                  <tr><th>Item</th><th>Usage</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in (stats.artifactGreenStats || []).slice(0, 5)" :key="item.artifact_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip
                          :id="item.artifact_item_id"
                          :name="item.artifact_item_name"
                        >
                          <img
                            :src="getItemImageUrl(item.artifact_item_id)"
                            :alt="item.artifact_item_name"
                            class="item-icon"
                            loading="lazy"
                            @error="hideBrokenIcon"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.artifact_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import jobMappings from '@/config/jobMappings';
import type { JobMapping, JobGrow } from '@/types/jobMappings';
import ItemTooltip from '@/components/ItemTooltip.vue';
import MissingIcon from '@/assets/missingicon.png';
import type { ComponentPublicInstance } from 'vue'

// ——— Types —————————————————————————————————————————————

interface CreatureStatsData {
  // shape of your API response; add fields as needed
  [key: string]: any;
}

// ——— Reactive State —————————————————————————————————————

const stats = ref<CreatureStatsData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// ——— Reactive map of slot → DOM element —————————————————————
const slotRefs = reactive<Record<string, HTMLElement | null>>({})

// ——— Helper to inject into the template —————————————————————
const setSlotRef = (slot: string) =>
  (el: Element | ComponentPublicInstance | null): void => {
    if (el instanceof HTMLElement) {
      slotRefs[slot] = el
    } else {
      slotRefs[slot] = null
    }
  }


// ——— Router & Params ————————————————————————————————————

const route = useRoute();
const router = useRouter();

const jobId = computed(() => route.params.jobId as string);
const jobGrowId = computed(() => route.params.jobGrowId as string);

// ——— Typed Mapping & Labels —————————————————————————————

const jobMapping = computed<JobMapping>(() => {
  return (jobMappings as Record<string, JobMapping>)[jobId.value] || ({} as JobMapping);
});

const jobFriendlyName = computed(() => {
  if (jobGrowId.value && Array.isArray(jobMapping.value.finalJobGrows)) {
    const grow = jobMapping.value.finalJobGrows.find(
      (g: JobGrow) => g.jobGrowId === jobGrowId.value
    );
    return grow?.jobGrowName || jobMapping.value.jobName || 'Unknown Job';
  }
  return jobMapping.value.jobName || 'Unknown Job';
});

// ——— Lifecycle & Watchers —————————————————————————————

onMounted(() => {
  if (jobGrowId.value) fetchCreatureStats();
});

watch(
  () => route.params.jobGrowId,
  (newVal, oldVal) => {
    if (newVal !== oldVal) fetchCreatureStats();
  }
);

// ——— Methods as Functions ————————————————————————————

function isActiveRoute(name: string): boolean {
  return router.currentRoute.value.name === name;
}

async function fetchCreatureStats(): Promise<void> {
  if (!jobGrowId.value) return;
  loading.value = true;
  try {
    const res = await axios.get<CreatureStatsData>(
      `/api/creature/stats/${jobId.value}/${jobGrowId.value}`
    );
    stats.value = res.data;
  } catch (e: any) {
    error.value = e.response?.data?.error || e.message;
  } finally {
    loading.value = false;
  }
}

function scrollToSlot(slot: string): void {
  const el = slotRefs[slot];
  if (!(el instanceof Element)) return;

  const top = window.pageYOffset + el.getBoundingClientRect().top - 20;
  window.scrollTo({ top, behavior: 'smooth' });

  new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 1500);
        obs.disconnect();
      }
    }
  }, { threshold: 0.5 }).observe(el);
}

function getItemImageUrl(itemId: string): string {
  return `https://img-api.dfoneople.com/df/items/${itemId}`;
}

function hideBrokenIcon(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.onerror = null;
  img.src = MissingIcon;
  img.style.width = '40px';
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

/* Square Layout */
.equipment-square {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  border: 2px solid #fff;
  border-radius: 4px;
  padding: 10px;
  box-sizing: border-box;
  margin-top: 0;
}

.equipment-square .side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.equipment-square .side.left {
  align-items: flex-start;
  justify-content: flex-start;
}

.equipment-square .side.right {
  align-items: flex-start;
  justify-content: flex-end;
}

.equipment-square .column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.equipment-square .side.left .column,
.equipment-square .side.right .column {
  justify-content: flex-start;
}

.equipment-square .center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

/* Button Containers */
.left-button-container {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.right-button-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Slot Buttons */
.slot-button {
  width: 100px;
  height: 100px;
  margin: 5px;
  background-color: #222;
  border: 1px solid #666;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.slot-button:hover {
  background-color: #e56717;
}

/* Themed Slots */
.slot-purple {
  border-color: #8e44ad;
  color: #fff;
}

.slot-red {
  border-color: #c0392b;
  color: #fff;
}

.slot-blue {
  border-color: #4a90e2;
  color: #fff;
}

.slot-green {
  border-color: #3cb043;
  color: #fff;
}

/* Stat Sections */
.stat-section {
  margin: 40px;
}

.stat-section h2 {
  margin-bottom: 16px;
  padding-bottom: 4px;
  color: #e56717;
  border-bottom: 2px solid currentColor;
  width: auto;
}

/* Artifact Container */
.artifact-container h3 {
  font-size: 24px;
}

.artifact-container .slot:nth-child(1) h3 {
  color: #c0392b;
}

.artifact-container .slot:nth-child(2) h3 {
  color: #4a90e2;
}

.artifact-container .slot:nth-child(3) h3 {
  color: #3cb043;
}

/* Tables Container */
.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.tables-container.full-width {
  justify-content: space-between;
}

.tables-container.full-width .slot {
  flex: 1 1 auto;
}

.tables-container.full-width .stats-table {
  width: 100%;
}

.tables-container.artifact-container {
  justify-content: space-between;
}

.tables-container.artifact-container .slot {
  flex: 1 1 0;
}

.tables-container.artifact-container .stats-table {
  width: 100%;
  table-layout: fixed;
}

.tables-container.artifact-container .stats-table th,
.tables-container.artifact-container .stats-table td {
  white-space: normal;
  overflow-wrap: break-word;
  /* modern */
}

.tables-container.artifact-container .stats-table th:nth-child(2),
.tables-container.artifact-container .stats-table td:nth-child(2) {
  width: 20%;
}

.tables-container .slot {
  padding: 10px;
  border-radius: 4px;
  margin: 0 10px;
}

/* Stats Table */
.stats-table {
  width: auto;
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
  text-align: center;
}

/* Flash Animation */
@keyframes flashEffect {

  0%,
  100% {
    box-shadow: 0 0 0px #e56717;
  }

  50% {
    box-shadow: 0 0 10px 5px #e56717;
  }
}

.flash {
  animation: flashEffect 2s ease-out;
}

.stat-section.flash {
  border-radius: 8px;
}

/* Icon and Name */
.item-cell,
.icon-and-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.item-name {
  font-size: 14px;
}

@media (max-width: 1024px) {
  .tables-container.artifact-container {
    gap: 8px;
  }

  .tables-container.artifact-container .slot {
    margin: 0 5px;
  }

  .tables-container.artifact-container .stats-table th:nth-child(2),
  .tables-container.artifact-container .stats-table td:nth-child(2) {
    width: 25%;
  }
}
</style>