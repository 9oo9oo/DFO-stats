<template>
  <div class="avatar-stats">
    <!-- Navigation Buttons -->
    <div class="stats-nav">
      <router-link :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }">
        <button>Equipment</button>
      </router-link>
      <router-link :to="{ name: 'CreatureStats', params: { jobId, jobGrowId } }">
        <button>Creature</button>
      </router-link>
      <router-link :to="{ name: 'TalismanStats', params: { jobId, jobGrowId } }">
        <button>Talisman</button>
      </router-link>
      <router-link :to="{ name: 'SkillStats', params: { jobId, jobGrowId } }">
        <button>Skill</button>
      </router-link>
      <router-link :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }">
        <button class="active">Avatar</button>
      </router-link>
    </div>

    <h1>Avatar Statistics for {{ jobFriendlyName }}</h1>

    <!-- Display stats only when a jobGrowId is set -->
    <div v-if="jobGrowId">
      <div v-if="loading">Loading avatar stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- Avatar Equipment Items Section -->
        <section class="stat-section">
          <h2>Avatar Equipment Items</h2>
          <div class="tables-container">
            <div v-for="slot in orderedSlots" :key="slot" class="slot">
              <h3>{{ slot }} Avatar Items</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Option</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.avatarStatsBySlot[slot]" :key="item.item_id">
                    <td>{{ item.item_name }}</td>
                    <!-- If option_ability is undefined or null, display a dash -->
                    <td>{{ item.option_ability || '-' }}</td>
                    <td>{{ item.usage_count }}</td>
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
                  <tr
                    v-for="emblem in emblemStatsByColor[color] || []"
                    :key="emblem.item_id"
                  >
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
      // Define the order of avatar slots; adjust as necessary.
      orderedSlots: ["AURORA", "HEADGEAR", "HAIR", "FACE", "BREAST", "JACKET", "PANTS", "WAIST", "SHOES"],
      // Define the desired emblem color order (all in lowercase for grouping).
      orderedEmblemColors: ["multicoloured", "platinum", "blue", "yellow", "green", "red"]
    };
  },
  computed: {
    // Retrieve jobId and jobGrowId from route parameters.
    jobId() {
      return this.$route.params.jobId;
    },
    jobGrowId() {
      return this.$route.params.jobGrowId;
    },
    // Use jobMappings to get the friendly job name.
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
    // Group emblem stats by slot_color.
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
        // Fetch avatar stats from your backend API.
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

/* Section styling */
.stat-section {
  margin-bottom: 40px;
}

/* Tables container styling */
.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

/* Each slot container will be rendered in a flexible box.
   For avatar equipment, you might want full width (change if needed),
   while for emblem stats we use three columns per row. */
.tables-container .slot {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
}

/* For avatar equipment items, let each slot take full width */
.stat-section:first-of-type .tables-container .slot {
  flex: 0 0 100%;
  margin-bottom: 20px;
}

/* For emblem statistics, use three columns per row */
.emblem-container .slot {
  flex: 0 0 calc(33.33% - 20px);
}

/* Table styling */
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
</style>
