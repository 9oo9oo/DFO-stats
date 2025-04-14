<template>
  <div class="equipment-stats">
    <!-- Stats Type Navigation -->
    <div class="stats-nav">
      <router-link
        :to="{ name: 'EquipmentStats', params: { jobId: jobId, jobGrowId: jobGrowId } }"
      >
        <button>Equipment</button>
      </router-link>
      <router-link
        :to="{ name: 'CreatureStats', params: { jobId: jobId, jobGrowId: jobGrowId } }"
      >
        <button>Creature</button>
      </router-link>
      <router-link
        :to="{ name: 'TalismanStats', params: { jobId: jobId, jobGrowId: jobGrowId } }"
      >
        <button>Talisman</button>
      </router-link>
      <router-link
        :to="{ name: 'SkillStats', params: { jobId: jobId, jobGrowId: jobGrowId } }"
      >
        <button>Skill</button>
      </router-link>
      <router-link :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }">
        <button class="active">Avatar</button>
      </router-link>
    </div>

    <h1>Avatar Statistics for {{ jobFriendlyName }}</h1>

    <div v-if="jobGrowId">
      <div v-if="loading">Loading avatar stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- Avatar Equipment Items Section -->
        <section class="stat-section">
          <h2>Avatar Equipment Items</h2>
          <div class="tables-container">
            <div
              v-for="slot in orderedSlots"
              :key="slot"
              :class="{
                slot: true,
                'half-width': (slot === 'WEAPON' || slot === 'AURORA'),
                'third-width': (slot !== 'WEAPON' && slot !== 'AURORA')
              }"
            >
              <h3>{{ convertSlotName(slot) }} Avatar Items</h3>
              <table class="stats-table">
                <thead>
                  <!-- For WEAPON and AURORA, display only two columns -->
                  <tr v-if="slot === 'WEAPON' || slot === 'AURORA'">
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                  <!-- For other slots, display two columns: Option and Usage Rate -->
                  <tr v-else>
                    <th>Option</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.avatarStatsBySlot[slot]" :key="item.item_id">
                    <template v-if="slot === 'WEAPON' || slot === 'AURORA'">
                      <td>{{ item.item_name }}</td>
                      <td>{{ item.usage_count }}</td>
                    </template>
                    <template v-else>
                      <td>{{ item.option_ability || '-' }}</td>
                      <td>{{ item.usage_count }}</td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Emblem Statistics Section -->
        <section class="stat-section">
          <h2>Emblem Statistics</h2>
          <div class="tables-container emblem-container">
            <div v-for="color in orderedEmblemColors" :key="color" class="slot">
              <h3>{{ capitalize(color) }} Emblems</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="emblem in stats.emblemStatsByColor[color] || []" :key="emblem.item_name">
                    <td>{{ emblem.item_name }}</td>
                    <td>{{ emblem.usage_count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
    
<script>
import axios from 'axios';
import jobMappings from '@/config/jobMappings.js';

export default {
  name: 'AvatarStats',
  data() {
    return {
      stats: null,
      loading: false,
      error: null,
      // Slot IDs remain as-is
      orderedSlots: [
        "WEAPON", "AURORA", "HEADGEAR", "HAIR", "FACE",
        "BREAST", "JACKET", "PANTS", "WAIST", "SHOES", "SKIN"
      ],
      orderedEmblemColors: ["multicolored", "platinum", "blue", "yellow", "green", "red"]
    };
  },
  computed: {
    jobId() {
      return this.$route.params.jobId;
    },
    jobGrowId() {
      return this.$route.params.jobGrowId;
    },
    jobMapping() {
      return jobMappings[this.jobId] || {};
    },
    jobFriendlyName() {
      if (this.jobGrowId && Array.isArray(this.jobMapping.finalJobGrows)) {
        const growMapping = this.jobMapping.finalJobGrows.find(
          (item) => item.jobGrowId === this.jobGrowId
        );
        if (growMapping && growMapping.jobGrowName) {
          return growMapping.jobGrowName;
        }
      }
      return this.jobMapping.jobName || 'Unknown Job';
    },
    emblemStatsByColor() {
      const groups = {};
      if (this.stats && this.stats.emblemStats) {
        this.stats.emblemStats.forEach(emblem => {
          const color = emblem.slot_color.toLowerCase();
          if (!groups[color]) {
            groups[color] = [];
          }
          groups[color].push(emblem);
        });
      }
      return groups;
    }
  },
  mounted() {
    if (this.jobGrowId) {
      this.fetchAvatarStats();
    }
  },
  watch: {
    '$route.params.jobGrowId'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchAvatarStats();
      }
    }
  },
  methods: {
    async fetchAvatarStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        const response = await axios.get(`/api/avatar/stats/${this.jobId}/${this.jobGrowId}`);
        this.stats = response.data;
      } catch (err) {
        this.error = err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : err.message;
      } finally {
        this.loading = false;
      }
    },
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    // Function to map slot IDs to friendly names
    convertSlotName(slot) {
      const slotMapping = {
        WEAPON: 'Weapon',
        AURORA: 'Aura',
        HEADGEAR: 'Hat',
        HAIR: 'Hair',
        FACE: 'Face',
        BREAST: 'Torso',
        JACKET: 'Top',
        PANTS: 'Bottom',
        WAIST: 'Waist',
        SHOES: 'Shoes',
        SKIN: 'Skin'
      };
      return slotMapping[slot] || slot.toLowerCase();
    }
  }
};
</script>
  
<style scoped>
.avatar-stats {
  padding: 20px;
}

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
  border: 2px solid white;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.stats-nav button:hover {
  background-color: #e56717;
}

.stats-nav button.active {
  background-color: #e56717;
}

.stat-section {
  margin-bottom: 40px;
}

.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.tables-container .slot {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
}

.stat-section:first-of-type .tables-container .slot {
  margin-bottom: 20px;
}

.emblem-container .slot {
  flex: 0 0 calc(33.33% - 20px);
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
}

/* New styling classes for equipment items */
.half-width {
  flex: 0 0 calc(50% - 20px);
}

.third-width {
  flex: 0 0 calc(33.33% - 20px);
}
</style>
