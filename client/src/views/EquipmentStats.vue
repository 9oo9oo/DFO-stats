<template>
  <h1>Equipment Statistics for {{ jobFriendlyName }}</h1>

  <!-- Navigation Tabs -->
  <div class="equipment-wrapper">
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

    <!-- Equipment Layout -->
    <div class="equipment-square">
      <div class="side left">
        <div class="column column-one">
          <div
            v-for="slot in leftColumnOne"
            :key="slot"
            class="slot-button"
            @click="scrollToSlot(slot)"
          >{{ slotDisplayNames[slot] || slot }}</div>
        </div>
        <div class="column column-two">
          <div
            v-for="slot in leftColumnTwo"
            :key="slot"
            class="slot-button"
            @click="scrollToSlot(slot)"
          >{{ slotDisplayNames[slot] || slot }}</div>
        </div>
      </div>
      <div class="center">
        <img :src="centerImgSrc" :alt="jobFriendlyName" class="awakening-img" />
      </div>
      <div class="side right">
        <div class="column column-one">
          <div
            v-for="slot in rightColumnOne"
            :key="slot"
            class="slot-button"
            @click="scrollToSlot(slot)"
          >{{ slotDisplayNames[slot] || slot }}</div>
        </div>
        <div class="column column-two">
          <div
            v-for="slot in rightColumnTwo"
            :key="slot"
            class="slot-button"
            @click="scrollToSlot(slot)"
          >{{ slotDisplayNames[slot] || slot }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading & error states -->
  <div v-if="loading">Loading equipment stats...</div>
  <div v-if="error">Error: {{ error }}</div>

  <!-- Primary stats grid -->
  <div v-if="stats" class="stats-container">
    <div class="first-row-grid">
      <!-- Set usage -->
      <section class="set-usage">
        <h2>Set Usage</h2>
        <table class="stats-table">
          <thead>
            <tr><th>Set</th><th>Usage</th></tr>
          </thead>
          <tbody>
            <tr v-for="set in stats.setUsage" :key="set.set_item_id">
              <td class="set-cell">
                <div class="icon-and-name">
                  <img
                    :src="getSetIconUrl(set.set_item_name)"
                    :alt="set.set_item_name"
                    class="set-icon"
                    loading="lazy"
                    @error="hideBrokenIcon"
                  />
                  <span class="set-name">{{ set.set_item_name }}</span>
                </div>
              </td>
              <td>{{ set.usage_count }}%</td>
            </tr>
          </tbody>
        </table>
      </section>

    <!-- Title & Weapon (no fusion items) -->
    <section
      v-for="slot in titleWeaponSlots"
      :key="slot"
      :ref="slot"
      class="slot-section"
    >
      <h2>{{ slotDisplayNames[slot] || slot }}</h2>
        <div class="tables-pair">
          <div class="table-wrapper">
            <table class="stats-table">
              <thead><tr><th>Item</th><th>Usage</th></tr></thead>
              <tbody>
                <tr v-for="item in stats.itemsBySlot?.[slot] || []" :key="item.item_id">
                  <td class="item-cell">
                    <div class="icon-and-name">
                      <ItemTooltip :id="item.item_id">
                        <img
                          :src="getItemImageUrl(item.item_id)"
                          :alt="item.item_name"
                          class="item-icon"
                          loading="lazy"
                          @error="hideBrokenIcon"
                        />
                      </ItemTooltip>
                      <span class="item-name">{{ item.item_name }}</span>
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

    <!-- Other Equipment -->
    <div class="other-grid">
      <section
        v-for="slot in otherSlots"
        :key="slot"
        :ref="slot"
        class="slot-section"
      >
        <h2>{{ slotDisplayNames[slot] || slot }}</h2>
        <div class="tables-pair">
          <!-- Normal Equipment -->
          <div class="table-wrapper">
            <h3>Normal</h3>
            <table class="stats-table">
              <thead><tr><th>Item</th><th>Usage</th></tr></thead>
              <tbody>
                <tr v-for="item in limitedItemsBySlot[slot]" :key="item.item_id">
                  <td class="item-cell">
                    <div class="icon-and-name">
                      <ItemTooltip :id="item.item_id" :name="item.item_name">
                        <img
                          :src="getItemImageUrl(item.item_id)"
                          :alt="item.item_name"
                          class="item-icon"
                          loading="lazy"
                        />
                      </ItemTooltip>
                      <span class="item-name">{{ item.item_name }}</span>
                    </div>
                  </td>
                  <td>{{ item.usage_count }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Fusion Equipment -->
          <div
            class="table-wrapper"
            v-if="stats.fusionItemsBySlot?.[slot]?.length"
          >
            <h3>Fusion</h3>
            <table class="stats-table">
              <thead><tr><th>Item</th><th>Usage</th></tr></thead>
              <tbody>
                <tr v-for="fusionItem in limitedFusionBySlot[slot]" :key="fusionItem.fusion_item_id">
                <td class="item-cell">
                  <div class="icon-and-name">
                    <ItemTooltip
                      :id="fusionItem.fusion_item_id"
                      :name="fusionItem.fusion_item_name"
                    >
                      <img
                        :src="getItemImageUrl(fusionItem.fusion_item_id)"
                        :alt="fusionItem.fusion_item_name"
                        class="item-icon"
                        loading="lazy"
                      />
                    </ItemTooltip>
                    <span class="item-name">{{ fusionItem.fusion_item_name }}</span>
                  </div>
                </td>
                  <td>{{ fusionItem.usage_count }}%</td>
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

// ——— Types —————————————————————————————————————————————

interface SetUsage {
  set_item_id: string;
  set_item_name: string;
  usage_count: number;
}

interface EquipmentItem {
  item_id: string;
  item_name: string;
  usage_count: number;
}

interface FusionItem {
  fusion_item_id: string;
  fusion_item_name: string;
  usage_count: number;
}

interface EquipmentStatsData {
  setUsage?: SetUsage[];
  itemsBySlot?: Record<string, EquipmentItem[]>;
  fusionItemsBySlot?: Record<string, FusionItem[]>;
  [key: string]: any;
}

// ——— Reactive State —————————————————————————————————————

const stats = ref<EquipmentStatsData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// reactive map of slot → DOM element
const slotRefs = reactive<Record<string, Element | null>>({});

// static configuration
const orderedSlots = [
  'TITLE', 'WEAPON', 'JACKET', 'SHOULDER', 'PANTS', 'WAIST', 'SHOES',
  'WRIST', 'RING', 'AMULET', 'SUPPORT', 'MAGIC_STON', 'EARRING'
] as const;

const fusionOrderedSlots = [
  'JACKET', 'SHOULDER', 'PANTS', 'WAIST', 'SHOES',
  'WRIST', 'RING', 'AMULET', 'SUPPORT', 'MAGIC_STON', 'EARRING'
] as const;

const setIconMapping: Record<string, string> = {
  "Hideout's Endless Gold Set": 'hideout.png',
  "Cleansing Darkness Set": 'cleansing.png',
  "Ancient Battlefield Valkyrie Set": 'ancient.png',
  "Death in the Shadows Set": 'death.png',
  "Dragon Arena Uprising Set": 'dragon.png',
  "Overwhelming Nature Set": 'overwhelming.png',
  "Serendipity Set": 'serendipity.png',
  "Ethereal Orb Arts Set": 'ethereal.png',
  "Beyond Limit Energy Set": 'beyond.png',
  "Magic Domain Set": 'magic.png',
  "Alpha of the Pack Hunt Set": 'alpha.png',
  "Soul Fairy Set": 'soul.png'
};

// ——— Router & Params ————————————————————————————————————

const route = useRoute();
const router = useRouter();
const jobId = computed(() => route.params.jobId as string);
const jobGrowId = computed(() => route.params.jobGrowId as string);

// ——— Computed ——————————————————————————————————————————

const jobMapping = computed<JobMapping>(() => {
  return (jobMappings as Record<string, JobMapping>)[jobId.value] || ({} as JobMapping);
});

const jobFriendlyName = computed(() => {
  const grows = jobMapping.value.finalJobGrows || [];
  const found = grows.find((g: JobGrow) => g.jobGrowId === jobGrowId.value);
  return found?.jobGrowName ?? jobMapping.value.jobName ?? 'Unknown Job';
});

const slotDisplayNames = computed<Record<string, string>>(() => ({
  TITLE: 'Title', WEAPON: 'Weapon', JACKET: 'Top', SHOULDER: 'Head/Shoulder',
  PANTS: 'Bottom', SHOES: 'Shoes', WAIST: 'Belt', AMULET: 'Necklace',
  WRIST: 'Bracelet', RING: 'Ring', SUPPORT: 'Sub-Equipment',
  MAGIC_STON: 'Magic Stone', EARRING: 'Earrings'
}));

const titleWeaponSlots = computed(() =>
  orderedSlots.filter(s => ['TITLE', 'WEAPON'].includes(s))
);

const otherSlots = computed(() =>
  orderedSlots.filter(s => !['TITLE', 'WEAPON'].includes(s))
);

const leftColumnOne = ['SHOULDER', 'PANTS', 'SHOES'] as const;
const leftColumnTwo = ['JACKET', 'WAIST'] as const;
const rightColumnOne = ['WEAPON', 'WRIST', 'SUPPORT', 'EARRING'] as const;
const rightColumnTwo = ['TITLE', 'RING', 'AMULET', 'MAGIC_STON'] as const;

const centerImgSrc = computed(() => {
  const grows = jobMapping.value.finalJobGrows || [];
  const idx = grows.findIndex(g => g.jobGrowId === jobGrowId.value);
  return idx >= 0
    ? (grows[idx].imgSrc ?? getImageSrc(jobId.value, idx))
    : '';
});

const limitedItemsBySlot = computed<Record<string, EquipmentItem[]>>(() => {
  if (!stats.value) return {};
  const out: Record<string, EquipmentItem[]> = {};
  const all = [...titleWeaponSlots.value, ...otherSlots.value];
  all.forEach(slot => {
    const list = stats.value!.itemsBySlot?.[slot] ?? [];
    const limit = titleWeaponSlots.value.includes(slot) ? 10 : 5;
    out[slot] = list.slice(0, limit);
  });
  return out;
});

const limitedFusionBySlot = computed<Record<string, FusionItem[]>>(() => {
  if (!stats.value) return {};
  const out: Record<string, FusionItem[]> = {};
  otherSlots.value.forEach(slot => {
    const list = stats.value!.fusionItemsBySlot?.[slot] ?? [];
    out[slot] = list.slice(0, 5);
  });
  return out;
});

// ——— Lifecycle & Watchers —————————————————————————————

onMounted(() => {
  if (jobGrowId.value) fetchEquipmentStats();
});

watch(() => route.params.jobGrowId, (n, o) => {
  if (n !== o) fetchEquipmentStats();
});

// ——— Methods —————————————————————————————————————————

async function fetchEquipmentStats(): Promise<void> {
  if (!jobGrowId.value) return;
  loading.value = true;
  try {
    const { data } = await axios.get<EquipmentStatsData>(
      `/api/equipment/stats/${jobId.value}/${jobGrowId.value}`
    );
    stats.value = data;
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message;
  } finally {
    loading.value = false;
  }
}

function isActiveRoute(name: string): boolean {
  return router.currentRoute.value.name === name;
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

function getSequentialIndex(currentJobId: string, localIdx: number): number {
  let count = 0;
  for (const [jid, map] of Object.entries(jobMappings as Record<string, JobMapping>)) {
    if (jid === currentJobId) return count + localIdx + 1;
    count += map.finalJobGrows.length;
  }
  return 0;
}

function getImageSrc(jobId: string, localIdx: number): string {
  const seq = getSequentialIndex(jobId, localIdx);
  try {
    return require(`@/assets/classImages/${seq}.jpg`);
  } catch {
    return 'https://via.placeholder.com/250x400';
  }
}

function getItemImageUrl(itemId: string): string {
  return `https://img-api.dfoneople.com/df/items/${itemId}`;
}

function getSetIconUrl(setName: string): string {
  const file = setIconMapping[setName];
  if (file) {
    try {
      return require(`@/assets/setIcons/${file}`);
    } catch {
      return MissingIcon;
    }
  }
  return MissingIcon;
}

function hideBrokenIcon(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.onerror = null;
  img.src = MissingIcon;
  img.style.width = '40px';
}
</script>


<style scoped>
/* Layout & Wrapper */
.equipment-wrapper {
  width: 700px;
  margin: 0 auto 40px;
  padding-top: 20px;
  position: relative;
}

/* Navigation Tabs */
.equipment-tabs {
  width: 95%;
  margin: 0 auto;
  display: flex;
  background: #222;
  border: 2px solid #fff;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.equipment-tabs .tab-button {
  flex: 1;
  padding: 10px;
  text-align: center;
  color: #fff;
  text-decoration: none;
  border-right: 1px solid #fff;
  transition: background-color 0.2s;
}

.equipment-tabs .tab-button:last-child {
  border-right: none;
}

.equipment-tabs .tab-button:hover,
.equipment-tabs .tab-button.active {
  background-color: #e56717;
}

/* Equipment Layout */
.equipment-square {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  border: 2px solid #fff;
  border-radius: 4px;
}

.equipment-square .side {
  flex: 1;
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.equipment-square .side.left,
.equipment-square .side.right {
  flex-direction: row;
}

.equipment-square .column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.equipment-square .center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.equipment-square .center img {
  width: 250px;
  height: 400px;
  object-fit: cover;
}

/* Slot Buttons */
.slot-button {
  width: 100px;
  height: 100px;
  margin: 5px;
  background: #222;
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

/* Table Base Styles */
.stats-table {
  table-layout: auto;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  border: 1px solid #ddd;
  padding: 8px;
  vertical-align: middle;
  text-align: left;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
}

.stats-table th:nth-child(2),
.stats-table td:nth-child(2) {
  text-align: center;
}

/* New Grid Layout */
.stats-container {
  margin: 40px auto;
}

/* Sections */
.set-usage,
.slot-section {
  padding: 0 20px;
  border-radius: 8px;
}

.set-usage h2,
.slot-section h2 {
  margin-bottom: 16px;
  padding-bottom: 4px;
  color: #e56717;
  border-bottom: 2px solid #e56717;
  width: 100%;
  text-align: left;
}

/* Tables Pairing */
.tables-pair {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin: 0 auto;
}

/* First Row Grid */
.first-row-grid,
.other-grid {
  display: grid;
  gap: 20px;
}

.first-row-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  margin-bottom: 40px;
}

.first-row-grid .slot-section,
.first-row-grid .set-usage {
  display: flex;
  flex-direction: column;
}

.first-row-grid .tables-pair {
  flex: 1;
}

.first-row-grid .table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/*  Other Equipment Grid */
.other-grid {
  grid-template-columns: repeat(auto-fit, minmax(700px, 1fr));
  margin-bottom: 40px;
}

.other-grid .tables-pair {
  gap: 40px;
}

.other-grid .tables-pair .table-wrapper {
  flex: 1;
}

.other-grid .slot-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.other-grid .stats-table {
  table-layout: fixed;
  width: 100%;
}

.other-grid .stats-table th:first-child,
.other-grid .stats-table td:first-child {
  width: 80%;
}

.other-grid .stats-table th:nth-child(2),
.other-grid .stats-table td:nth-child(2) {
  text-align: center;
}

/* Icon & Name Alignment */
.icon-and-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-name,
.set-name {
  font-size: 14px;
}

.set-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
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

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .first-row-grid {
    gap: 0;
  }

  .first-row-grid .tables-pair {
    gap: 0;
    margin-bottom: 12px;
  }

  .other-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .other-grid .slot-section {
    width: auto !important;
    justify-content: flex-start !important;
    margin: 0;
  }

  .other-grid .tables-pair {
    flex-direction: column !important;
    gap: 16px;
  }
}
</style>

