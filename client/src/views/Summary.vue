<template>
  <div class="summary-container">
    <h1>Equipment Combinations Summary</h1>

    <div v-if="loading">Loading summary...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="stats && combos && stats.setUsage && Object.keys(combos).length">

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
              <td>{{ set.set_item_name }}</td>
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
                <ItemTooltip :id="item.item_id" :name="item.item_name">
                  <img :src="getItemImageUrl(item.item_id)" :alt="item.item_name" class="item-icon" loading="lazy"
                    @error="hideBrokenIcon" />
                </ItemTooltip>
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
                <ItemTooltip :id="item.item_id" :name="item.item_name">
                  <img :src="getItemImageUrl(item.item_id)" :alt="item.item_name" class="item-icon" loading="lazy"
                    @error="hideBrokenIcon" />
                </ItemTooltip>
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

      <!-- Weapon & Aura Avatar Tables -->
      <div v-if="avatarStats">
        <!-- Weapon Avatar Table -->
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
                <ItemTooltip :id="it.item_id" :name="it.item_name">
                  <img :src="getItemImageUrl(it.item_id)" :alt="it.item_name" class="item-icon" loading="lazy"
                    @error="hideBrokenIcon" />
                </ItemTooltip>
              </td>
              <td>{{ it.usage_count }}%</td>
            </tr>
          </tbody>
        </table>

        <!-- Aurora Avatar Table -->
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
                <ItemTooltip :id="it.item_id" :name="it.item_name">
                  <img :src="getItemImageUrl(it.item_id)" :alt="it.item_name" class="item-icon" loading="lazy"
                    @error="hideBrokenIcon" />
                </ItemTooltip>
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
            <tr v-for="combo in creatureCombos.slice(0, 10)" :key="combo.creature_item.id + '-' + combo.usage_count">
              <td class="item-cell">
                <ItemTooltip :id="combo.creature_item.id" :name="combo.creature_item.name">
                  <img :src="getItemImageUrl(combo.creature_item.id)" :alt="combo.creature_item.name" class="item-icon"
                    loading="lazy" @error="hideBrokenIcon" />
                </ItemTooltip>
              </td>
              <td>
                <div class="icon-group">
                  <ItemTooltip :id="combo.artifact_red.id" :name="combo.artifact_red.name">
                    <img :src="getItemImageUrl(combo.artifact_red.id)" :alt="combo.artifact_red.name" class="item-icon"
                      loading="lazy" @error="hideBrokenIcon" />
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
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ItemTooltip from '@/components/ItemTooltip.vue';
import MissingIcon from '@/assets/missingicon.png';

export default {
  name: 'SummaryStats',
  components: { ItemTooltip },
  data() {
    return {
      combos: {},
      loading: false,
      error: null,
      stats: null,
      avatarStats: null,
      creatureCombos: null,
      talismanStats: [],
      runeStats: [],
      groups: [
        { key: 'core', title: 'Armor', slots: ['jacket', 'shoulder', 'pants', 'waist', 'shoes'] },
        { key: 'jewels', title: 'Accessory', slots: ['wrist', 'ring', 'amulet'] },
        { key: 'extras', title: 'Special Equipment', slots: ['support', 'magic_ston', 'earring'] }
      ],
      fusionGroups: [
        { key: 'coreFusion', title: 'Fusion Armor', slots: ['jacket', 'shoulder', 'pants', 'waist', 'shoes'] },
        { key: 'jewelsFusion', title: 'Fusion Accessory', slots: ['wrist', 'ring', 'amulet'] },
        { key: 'extrasFusion', title: 'Fusion Special Equipment', slots: ['support', 'magic_ston', 'earring'] }
      ]
    };
  },
  computed: {
    jobId() { return this.$route.params.jobId; },
    jobGrowId() { return this.$route.params.jobGrowId; },
    slotDisplayNames() {
      return {
        jacket: 'Top',
        shoulder: 'Head/Shoulder',
        pants: 'Bottom',
        waist: 'Belt',
        shoes: 'Shoes',
        wrist: 'Bracelet',
        ring: 'Ring',
        amulet: 'Necklace',
        support: 'Sub-Equipment',
        magic_ston: 'Magic Stone',
        earring: 'Earrings'
      };
    },
    otherAvatarSlots() {
      return this.avatarStats
        ? Object.keys(this.avatarStats)
          .filter(s => !['WEAPON', 'AURORA', 'AURA_SKIN'].includes(s))
        : [];
    },
  },
  methods: {
    comboKey(combo, slots) {
      return slots.map(s => combo[`${s}_id`] || s).join('-');
    },
    async fetchStats() {
      try {
        const resp = await axios.get(
          `/api/equipment/stats/${this.jobId}/${this.jobGrowId}`
        );
        this.stats = resp.data;
      } catch (err) {
        this.error = err.response?.data?.error || err.message;
      }
    },
    async fetchCombinations() {
      this.loading = true;
      try {
        const resp = await axios.get(
          `/api/equipment/combinations/${this.jobId}/${this.jobGrowId}`
        );
        this.combos = resp.data;
      } catch (err) {
        this.error = err.response?.data?.error || err.message;
      } finally {
        this.loading = false;
      }
    },
    getItemImageUrl(itemId) {
      return `https://img-api.dfoneople.com/df/items/${itemId}`;
    },
    hideBrokenIcon(event) {
      const img = event.target;
      img.onerror = null;
      img.src = MissingIcon;
      img.style.width = '40px';
    },
    async fetchAvatarStats() {
      try {
        const { data } = await axios.get(
          `/api/avatar/stats/${this.jobId}/${this.jobGrowId}`
        );
        this.avatarStats = data.avatarStatsBySlot;
      } catch (err) {
        this.error = err.message;
      }
    },
    async fetchCreatureCombos() {
      try {
        const resp = await axios.get(
          `/api/creature/combinations/${this.jobId}/${this.jobGrowId}`
        );
        this.creatureCombos = resp.data.combinationStats || [];
      } catch (err) {
        this.error = err.response?.data?.error || err.message;
      }
    },
    async fetchTalismanStats() {
      if (!this.jobGrowId) return;
      try {
        const { data } = await axios.get(
          `/api/talisman/stats/${this.jobId}/${this.jobGrowId}`
        );
        this.talismanStats = data.talismanStats;
        this.runeStats    = data.runeStats;
      } catch (err) {
        this.error = err.response?.data?.error || err.message;
      }
    },
    formatRate(value, divisor) {
      return (value / divisor).toFixed(2);
    },
  },
  mounted() {
    this.loading = true;
    Promise.all([
      this.fetchStats(),
      this.fetchCombinations(),
      this.fetchAvatarStats(),
      this.fetchCreatureCombos(),
      this.fetchTalismanStats(),
    ])
      .catch(err => { this.error ||= err.message; })
      .finally(() => { this.loading = false; });
  }
};
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

.combo-group {
  margin-bottom: 40px;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
  padding: 8px;
  text-align: left;
}

.stats-table td {
  border: 1px solid #ddd;
  padding: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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