<template>
  <div class="summary-container">
    <h1>Equipment Combinations Summary</h1>

    <div v-if="loading">Loading summary...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="stats && combos && stats.setUsage && Object.keys(combos).length">

      <section class="section-group basic-equipment">
        <h2>
          <router-link :to="{ name: 'EquipmentStats' }" class="section-heading-link">
            Basic Equipment <span class="section-link">>></span>
          </router-link>
        </h2>

        <!-- Set Usage -->
        <div class="combo-group">
          <h2>Set Item</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Set</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="set in stats.setUsage.slice(0, 3)" :key="set.set_item_id">
                <td>
                  <div class="icon-group">
                    <img :src="getSetIconUrl(set.set_item_name)" :alt="set.set_item_name" class="set-icon"
                      loading="lazy" @error="hideBrokenIcon" />
                    <span class="set-name">{{ set.set_item_name }}</span>
                  </div>
                </td>
                <td>{{ set.usage_rate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Title -->
        <div class="combo-group">
          <h2>Title Equipment</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in stats.itemsBySlot['TITLE'].slice(0, 3)" :key="item.item_id">
                <td class="item-cell">
                  <div class="icon-group">
                    <ItemTooltip :id="item.item_id" :name="item.item_name">
                      <img :src="getItemImageUrl(item.item_id)" :alt="item.item_name" class="item-icon" loading="lazy"
                        @error="hideBrokenIcon" />
                    </ItemTooltip>
                    <span class="item-name">{{ item.item_name }}</span>
                  </div>
                </td>
                <td>{{ item.usage_rate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Weapon -->
        <div class="combo-group">
          <h2>Weapon Equipment</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Weapon</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in stats.itemsBySlot['WEAPON'].slice(0, 3)" :key="item.item_id">
                <td class="item-cell">
                  <div class="icon-group">
                    <ItemTooltip :id="item.item_id" :name="item.item_name">
                      <img :src="getItemImageUrl(item.item_id)" :alt="item.item_name" class="item-icon" loading="lazy"
                        @error="hideBrokenIcon" />
                    </ItemTooltip>
                    <span class="item-name">{{ item.item_name }}</span>
                  </div>
                </td>
                <td>{{ item.usage_rate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Normal Combos -->
        <div class="combo-group" v-for="group in groups" :key="group.key">
          <h2>Popular {{ group.title }} Combination</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Items</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="combo in combos[group.key]" :key="comboKey(combo, group.slots)">
                <td>
                  <div class="icon-group">
                    <ItemTooltip v-for="slot in group.slots" :key="slot" :id="combo[`${slot}_id`]">
                      <img :src="getItemImageUrl(combo[`${slot}_id`])" :alt="combo[`${slot}_name`]" class="item-icon"
                        loading="lazy" @error="hideBrokenIcon" />
                    </ItemTooltip>
                  </div>
                </td>
                <td>{{ combo.usage_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Fusion Combos -->
        <div class="combo-group" v-for="group in fusionGroups" :key="group.key">
          <h2>Popular {{ group.title }} Combination</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Items</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="combo in combos[group.key]" :key="comboKey(combo, group.slots)">
                <td>
                  <div class="icon-group">
                    <ItemTooltip v-for="slot in group.slots" :key="slot" :id="combo[`${slot}_id`]">
                      <img :src="getItemImageUrl(combo[`${slot}_id`])" :alt="combo[`${slot}_name`]" class="item-icon"
                        loading="lazy" @error="hideBrokenIcon" />
                    </ItemTooltip>
                  </div>
                </td>
                <td>{{ combo.usage_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="section-group avatar-equipment">
        <h2>
          <router-link :to="{ name: 'AvatarStats' }" class="section-heading-link">
            Avatar Equipment <span class="section-link">>></span>
          </router-link>
        </h2>
        <!-- Weapon Avatar Table -->
        <div v-if="avatarStats" class="combo-group">
          <h2>Weapon Avatar</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in (avatarStats.WEAPON || []).slice(0, 3)" :key="`weapon-${it.item_id}`">
                <td class="item-cell">
                  <div class="icon-group">
                    <ItemTooltip :id="it.item_id" :name="it.item_name">
                      <img :src="getItemImageUrl(it.item_id)" :alt="it.item_name" class="item-icon" loading="lazy"
                        @error="hideBrokenIcon" />
                    </ItemTooltip>
                    <span class="item-name">{{ it.item_name }}</span>
                  </div>
                </td>
                <td>{{ it.usage_count }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Aurora Avatar Table -->
        <div v-if="avatarStats" class="combo-group">
          <h2>Aura Avatar</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in (avatarStats.AURORA || []).slice(0, 3)" :key="`aurora-${it.item_id}`">
                <td class="item-cell">
                  <div class="icon-group">
                    <ItemTooltip :id="it.item_id" :name="it.item_name">
                      <img :src="getItemImageUrl(it.item_id)" :alt="it.item_name" class="item-icon" loading="lazy"
                        @error="hideBrokenIcon" />
                    </ItemTooltip>
                    <span class="item-name">{{ it.item_name }}</span>
                  </div>
                </td>
                <td>{{ it.usage_count }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- "Other" Avatar options -->
        <div v-if="avatarStats && otherAvatarSlots.length" class="combo-group">
          <h2>Popular Avatar Options</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Options</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <!-- for each slot, render two rows -->
              <template v-for="slot in otherAvatarSlots" :key="slot">
                <tr v-for="(item, idx) in (avatarStats[slot] || []).slice(0, 2)" :key="item.item_id">
                  <!-- Part name only on the first of the two rows -->
                  <td v-if="idx === 0" :rowspan="2">
                    {{ slotDisplayNames[slot] || slot }}
                  </td>
                  <td>{{ item.option_ability || '-' }}</td>
                  <td>{{ item.usage_count }}%</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <section class="section-group creature-artifact">
        <h2>
          <router-link :to="{ name: 'CreatureStats' }" class="section-heading-link">
            Creature + Artifact Combinations <span class="section-link">>></span>
          </router-link>
        </h2>
        <!-- Creature + Artifact Combinations -->
        <div class="combo-group" v-if="creatureCombos && creatureCombos.length">
          <h2>Creature + Artifact Combinations</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Creature</th>
                <th>Artifacts</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="combo in creatureCombos.slice(0, 5)" :key="combo.creature_item.id + '-' + combo.usage_count">
                <td class="item-cell">
                  <div class="icon-group">
                    <ItemTooltip :id="combo.creature_item.id" :name="combo.creature_item.name">
                      <img :src="getItemImageUrl(combo.creature_item.id)" :alt="combo.creature_item.name"
                        class="item-icon" loading="lazy" @error="hideBrokenIcon" />
                    </ItemTooltip>
                    <span class="item-name">{{ combo.creature_item.name }}</span>
                  </div>
                </td>
                <td>
                  <div class="icon-group">
                    <ItemTooltip :id="combo.artifact_red.id" :name="combo.artifact_red.name">
                      <img :src="getItemImageUrl(combo.artifact_red.id)" :alt="combo.artifact_red.name"
                        class="item-icon" loading="lazy" @error="hideBrokenIcon" />
                    </ItemTooltip>
                    <ItemTooltip :id="combo.artifact_blue.id" :name="combo.artifact_blue.name">
                      <img :src="getItemImageUrl(combo.artifact_blue.id)" :alt="combo.artifact_blue.name"
                        class="item-icon" loading="lazy" @error="hideBrokenIcon" />
                    </ItemTooltip>
                    <ItemTooltip :id="combo.artifact_green.id" :name="combo.artifact_green.name">
                      <img :src="getItemImageUrl(combo.artifact_green.id)" :alt="combo.artifact_green.name"
                        class="item-icon" loading="lazy" @error="hideBrokenIcon" />
                    </ItemTooltip>
                  </div>
                </td>
                <td>{{ combo.usage_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="section-group talisman-rune">
        <h2>
          <router-link :to="{ name: 'TalismanStats' }" class="section-heading-link">
            Talismans & Runes <span class="section-link">>></span>
          </router-link>
        </h2>
        <!-- Top 3 Talismans -->
        <div v-if="talismanStats.length" class="combo-group">
          <h2>Talisman</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Usage Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in talismanStats.slice(0, 3)" :key="item.talisman_item_id">
                <td>{{ item.talisman_item_name }}</td>
                <td>{{ formatRate(item.usage_count, 3) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Top 3 Runes -->
        <div v-if="runeStats.length" class="combo-group">
          <h2>Rune</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Usage Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in runeStats.slice(0, 3)" :key="item.rune_item_id">
                <td>{{ item.rune_item_name }}</td>
                <td>{{ formatRate(item.usage_count, 9) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts" name="SummaryStats">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ItemTooltip from '@/components/ItemTooltip.vue';
import MissingIcon from '@/assets/missingicon.png';
import axios from 'axios';

// ——— Interfaces ——————————————————————————————————————
interface SetUsage {
  set_item_id: string;
  set_item_name: string;
  usage_rate: number;
}
interface EquipmentItem {
  item_id: string;
  item_name: string;
  usage_rate: number;
}
interface Combo {
  [key: string]: any;
  usage_count: number;
}
interface AvatarStats {
  [slot: string]: Array<{
    item_id: string;
    item_name: string;
    usage_count: number;
    option_ability?: string;
  }>;
}
interface CreatureCombo {
  creature_item: { id: string; name: string };
  artifact_red: { id: string; name: string };
  artifact_blue: { id: string; name: string };
  artifact_green: { id: string; name: string };
  usage_count: number;
}
interface TalismanStat {
  talisman_item_id: string;
  talisman_item_name: string;
  usage_count: number;
}
interface RuneStat {
  rune_item_id: string;
  rune_item_name: string;
  usage_count: number;
}
interface SummaryStatsData {
  setUsage: SetUsage[];
  itemsBySlot: Record<string, EquipmentItem[]>;
}

// ——— Reactive State —————————————————————————————————————
const loading = ref(false);
const error = ref<string | null>(null);
const stats = ref<SummaryStatsData | null>(null);
const combos = ref<Record<string, Combo[]>>({});
const avatarStats = ref<AvatarStats | null>(null);
const creatureCombos = ref<CreatureCombo[] | null>(null);
const talismanStats = ref<TalismanStat[]>([]);
const runeStats = ref<RuneStat[]>([]);

// ——— Config Groups —————————————————————————————————————
const groups = [
  { key: 'core', title: 'Armor', slots: ['jacket', 'shoulder', 'pants', 'waist', 'shoes'] },
  { key: 'jewels', title: 'Accessory', slots: ['wrist', 'ring', 'amulet'] },
  { key: 'extras', title: 'Special Equipment', slots: ['support', 'magic_ston', 'earring'] },
];
const fusionGroups = [
  { key: 'coreFusion', title: 'Fusion Armor', slots: ['jacket', 'shoulder', 'pants', 'waist', 'shoes'] },
  { key: 'jewelsFusion', title: 'Fusion Accessory', slots: ['wrist', 'ring', 'amulet'] },
  { key: 'extrasFusion', title: 'Fusion Special Equipment', slots: ['support', 'magic_ston', 'earring'] },
];

// ——— Display Helpers —————————————————————————————————————
const slotDisplayNames: Record<string, string> = {
  jacket: 'Top', shoulder: 'Head/Shoulder', pants: 'Bottom', waist: 'Belt', shoes: 'Shoes',
  wrist: 'Bracelet', ring: 'Ring', amulet: 'Necklace', support: 'Sub-Equipment',
  magic_ston: 'Magic Stone', earring: 'Earrings'
};
const otherAvatarSlots = computed(() =>
  avatarStats.value
    ? Object.keys(avatarStats.value).filter(s =>
      !['WEAPON', 'AURORA', 'AURA_SKIN'].includes(s)
    )
    : []
);

// ——— Helpers —————————————————————————————————————————————
function comboKey(combo: Combo, slots: string[]): string {
  return slots.map(s => combo[`${s}_id`] || s).join('-');
}
function getItemImageUrl(itemId: string): string {
  return `https://img-api.dfoneople.com/df/items/${itemId}`;
}
function getSetIconUrl(setName: string): string {
  try {
    return require(`@/assets/setIcons/${setName.toLowerCase()}.png`);
  } catch {
    return MissingIcon;
  }
}
function hideBrokenIcon(e: Event) {
  const img = e.target as HTMLImageElement;
  img.onerror = null;
  img.src = MissingIcon;
  img.style.width = '40px';
}
function formatRate(value: number, divisor: number): string {
  return (value / divisor).toFixed(2);
}

// ——— Data Fetchers —————————————————————————————————————
const route = useRoute();
const jobId = computed(() => route.params.jobId as string);
const jobGrowId = computed(() => route.params.jobGrowId as string);

async function fetchStats() {
  const { data } = await axios.get<SummaryStatsData>(
    `/api/equipment/stats/${jobId.value}/${jobGrowId.value}`
  );
  stats.value = data;
}
async function fetchCombinations() {
  const { data } = await axios.get<Record<string, Combo[]>>(
    `/api/equipment/combinations/${jobId.value}/${jobGrowId.value}`
  );
  combos.value = data;
}
async function fetchAvatarStats() {
  const { data } = await axios.get<{ avatarStatsBySlot: AvatarStats }>(
    `/api/avatar/stats/${jobId.value}/${jobGrowId.value}`
  );
  avatarStats.value = data.avatarStatsBySlot;
}
async function fetchCreatureCombos() {
  const { data } = await axios.get<{ combinationStats: CreatureCombo[] }>(
    `/api/creature/combinations/${jobId.value}/${jobGrowId.value}`
  );
  creatureCombos.value = data.combinationStats;
}
async function fetchTalismanStats() {
  const { data } = await axios.get<{
    talismanStats: TalismanStat[];
    runeStats: RuneStat[];
  }>(`/api/talisman/stats/${jobId.value}/${jobGrowId.value}`);
  talismanStats.value = data.talismanStats;
  runeStats.value = data.runeStats;
}

// ——— Initialization —————————————————————————————————————
onMounted(() => {
  loading.value = true;
  Promise.all([
    fetchStats(),
    fetchCombinations(),
    fetchAvatarStats(),
    fetchCreatureCombos(),
    fetchTalismanStats(),
  ])
    .catch(err => { error.value ||= err.message; })
    .finally(() => { loading.value = false; });
});
</script>


<style scoped>
.summary-container {
  width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.error {
  color: red;
}

.section-group {
  margin-bottom: 48px;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.section-group h2 {
  margin-top: 0;
  padding-bottom: 16px;
}

.section-heading-link {
  display: inline-block;
  color: #e56717;
  text-decoration: none;
  border-bottom: 2px solid #e56717;
  padding-bottom: 4px;
}

.section-heading-link:hover {
  opacity: 0.8;
}

.section-heading-link .section-link {
  margin-left: 6px;
  font-weight: bold;
}

.combo-group {
  margin-bottom: 40px;
}

.combo-group h2 {
  color: white;
}

.stats-table {
  width: auto;
  border-collapse: collapse;
  /* margin-top: 8px; */
}

.stats-table th {
  background-color: white;
  border: 2px solid black;
  color: #e56717;
  padding: 8px;
  text-align: left;
}

.stats-table td {
  border: 1px solid white;
  padding: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: center;
}

.icon-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.stats-table,
.stats-table td,
.stats-table th {
  overflow: visible !important;
}
</style>