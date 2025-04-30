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
                <tr v-for="item in stats.itemsBySlot[slot]" :key="item.item_id">
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
                <tr v-for="item in stats.itemsBySlot[slot]" :key="item.item_id">
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
            v-if="stats.fusionItemsBySlot[slot]?.length"
          >
            <h3>Fusion</h3>
            <table class="stats-table">
              <thead><tr><th>Item</th><th>Usage</th></tr></thead>
              <tbody>
                <tr
                  v-for="fusionItem in stats.fusionItemsBySlot[slot]"
                  :key="fusionItem.fusion_item_id"
                >
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

<script>
import axios from 'axios';
import jobMappings from '@/config/jobMappings.js';
import ItemTooltip from '@/components/ItemTooltip.vue';
import MissingIcon from '@/assets/missingicon.png';

export default {
  name: 'EquipmentStats',
  components: { ItemTooltip },

  data() {
    return {
      stats: null,
      loading: false,
      error: null,
      // Slot ordering
      orderedSlots: [
        'TITLE', 'WEAPON', 'JACKET', 'SHOULDER', 'PANTS', 'WAIST', 'SHOES',
        'WRIST', 'RING', 'AMULET', 'SUPPORT', 'MAGIC_STON', 'EARRING'
      ],
      fusionOrderedSlots: [
        'JACKET', 'SHOULDER', 'PANTS', 'WAIST', 'SHOES',
        'WRIST', 'RING', 'AMULET', 'SUPPORT', 'MAGIC_STON', 'EARRING'
      ],
      setIconMapping: {
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
      }
    };
  },

  computed: {
    jobId() { return this.$route.params.jobId; },
    jobGrowId() { return this.$route.params.jobGrowId; },
    jobMapping() { return jobMappings[this.jobId] || {}; },
    jobFriendlyName() {
      const grows = this.jobMapping.finalJobGrows || [];
      const found = grows.find(g => g.jobGrowId === this.jobGrowId);
      return found?.jobGrowName || this.jobMapping.jobName || 'Unknown Job';
    },
    slotDisplayNames() {
      return {
        TITLE: 'Title', WEAPON: 'Weapon', JACKET: 'Top', SHOULDER: 'Head/Shoulder',
        PANTS: 'Bottom', SHOES: 'Shoes', WAIST: 'Belt', AMULET: 'Necklace',
        WRIST: 'Bracelet', RING: 'Ring', SUPPORT: 'Sub-Equipment',
        MAGIC_STON: 'Magic Stone', EARRING: 'Earrings'
      };
    },
    titleWeaponSlots() {
      return this.orderedSlots.filter(s => ['TITLE', 'WEAPON'].includes(s));
    },
    otherSlots() {
      return this.orderedSlots.filter(s => !['TITLE', 'WEAPON'].includes(s));
    },
    leftColumnOne() { return ['SHOULDER', 'PANTS', 'SHOES']; },
    leftColumnTwo() { return ['JACKET', 'WAIST']; },
    rightColumnOne() { return ['WEAPON', 'WRIST', 'SUPPORT', 'EARRING']; },
    rightColumnTwo() { return ['TITLE', 'RING', 'AMULET', 'MAGIC_STON']; },
    centerImgSrc() {
      const grows = this.jobMapping.finalJobGrows || [];
      const idx = grows.findIndex(g => g.jobGrowId === this.jobGrowId);
      return idx >= 0
        ? (grows[idx].imgSrc || this.getImageSrc(this.jobId, idx))
        : '';
    }
  },

  mounted() {
    if (this.jobGrowId) this.fetchEquipmentStats();
  },
  watch: {
    '$route.params.jobGrowId'(newVal, oldVal) {
      if (newVal !== oldVal) this.fetchEquipmentStats();
    }
  },

  methods: {
    async fetchEquipmentStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        const resp = await axios.get(`/api/equipment/stats/${this.jobId}/${this.jobGrowId}`);
        this.stats = resp.data;
      } catch (err) {
        this.error = err.response?.data?.error || err.message;
      } finally { this.loading = false; }
    },

    isActiveRoute(name) {
      return this.$route.name === name;
    },

    scrollToSlot(slot) {
      let el = this.$refs[slot];
      if (Array.isArray(el)) el = el[0];
      if (!el) return;
      const top = window.pageYOffset + el.getBoundingClientRect().top - 20;
      window.scrollTo({ top, behavior: 'smooth' });
      new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.classList.add('flash');
            setTimeout(() => el.classList.remove('flash'), 1500);
            obs.disconnect();
          }
        });
      }, { threshold: 0.5 }).observe(el);
    },

    getSequentialIndex(jobId, localIdx) {
      let count = 0;
      for (const [jid, map] of Object.entries(jobMappings)) {
        if (jid === jobId) return count + localIdx + 1;
        count += map.finalJobGrows.length;
      }
      return 0;
    },

    getImageSrc(jobId, localIdx) {
      const seq = this.getSequentialIndex(jobId, localIdx);
      try {
        return require(`@/assets/classImages/${seq}.jpg`);
      } catch {
        return 'https://via.placeholder.com/250x400';
      }
    },

    getItemImageUrl(itemId) {
      return `https://img-api.dfoneople.com/df/items/${itemId}`;
    },

    getSetIconUrl(setName) {
      const file = this.setIconMapping[setName];
      if (file) {
        try {
          return require(`@/assets/setIcons/${file}`);
        } catch {
          return MissingIcon;
        }
      }
      return MissingIcon;
    },

    hideBrokenIcon(event) {
      const img = event.target;
      img.onerror = null;           // prevent infinite fallback loop
      img.src = MissingIcon;
      img.style.width = '40px';
    }
  }
};
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

.other-grid .slot-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  .other-grid .slot-section {
    width: 90%;
    margin: 0 auto;
  }
}
</style>

