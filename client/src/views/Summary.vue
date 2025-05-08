<template>
    <div class="summary-container">
      <h1>Equipment Combinations Summary</h1>

      <div v-if="loading">Loading summary...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="stats && combos && stats.setUsage && Object.keys(combos).length">

        <!-- Set Usage -->
      <div class="combo-group">
        <h2>Set Usage (Top 3)</h2>
        <table class="stats-table">
          <thead>
            <tr><th>Set</th><th>Usage</th></tr>
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
        <h2>Top Titles (Top 3)</h2>
        <table class="stats-table">
          <thead>
            <tr><th>Title</th><th>Usage</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.itemsBySlot['TITLE'].slice(0, 3)" :key="item.item_id">
              <td class="item-cell">
                <ItemTooltip :id="item.item_id" :name="item.item_name">
                  <img
                    :src="getItemImageUrl(item.item_id)"
                    :alt="item.item_name"
                    class="item-icon"
                    loading="lazy"
                    @error="hideBrokenIcon"
                  />
                </ItemTooltip>
              </td>
              <td>{{ item.usage_rate }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Weapon -->
      <div class="combo-group">
        <h2>Top Weapons (Top 3)</h2>
        <table class="stats-table">
          <thead>
            <tr><th>Weapon</th><th>Usage</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.itemsBySlot['WEAPON'].slice(0, 3)" :key="item.item_id">
              <td class="item-cell">
                <ItemTooltip :id="item.item_id" :name="item.item_name">
                  <img
                    :src="getItemImageUrl(item.item_id)"
                    :alt="item.item_name"
                    class="item-icon"
                    loading="lazy"
                    @error="hideBrokenIcon"
                  />
                </ItemTooltip>
              </td>
              <td>{{ item.usage_rate }}</td>
            </tr>
          </tbody>
        </table>
      </div>

        <!-- Normal Combos -->
        <div class="combo-group" v-for="group in groups" :key="group.key">
          <h2>{{ group.title }}</h2>
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
                  <ItemTooltip
                    v-for="slot in group.slots"
                    :key="slot"
                    :id="combo[`${slot}_id`]"
                  >
                    <img
                      :src="getItemImageUrl(combo[`${slot}_id`])"
                      :alt="combo[`${slot}_name`]"
                      class="item-icon"
                      loading="lazy"
                      @error="hideBrokenIcon"
                    />
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
          <h2>{{ group.title }} (Fusion)</h2>
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
                  <ItemTooltip
                    v-for="slot in group.slots"
                    :key="slot"
                    :id="combo[`${slot}_id`]"
                  >
                    <img
                      :src="getItemImageUrl(combo[`${slot}_id`])"
                      :alt="combo[`${slot}_name`]"
                      class="item-icon"
                      loading="lazy"
                      @error="hideBrokenIcon"
                    />
                  </ItemTooltip>
                </div>
              </td>
              <td>{{ combo.usage_count }}</td>
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
            groups: [
                { key: 'core', title: 'Core Equipment', slots: ['jacket', 'shoulder', 'pants', 'waist', 'shoes'] },
                { key: 'jewels', title: 'Jewelry', slots: ['wrist', 'ring', 'amulet'] },
                { key: 'extras', title: 'Extras', slots: ['support', 'magic_ston', 'earring'] }
            ],
            fusionGroups: [
                { key: 'coreFusion', title: 'Core Equipment', slots: ['jacket', 'shoulder', 'pants', 'waist', 'shoes'] },
                { key: 'jewelsFusion', title: 'Jewelry', slots: ['wrist', 'ring', 'amulet'] },
                { key: 'extrasFusion', title: 'Extras', slots: ['support', 'magic_ston', 'earring'] }
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
        }
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
    },
    mounted() {
    this.loading = true;
    Promise.all([this.fetchStats(), this.fetchCombinations()])
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
  