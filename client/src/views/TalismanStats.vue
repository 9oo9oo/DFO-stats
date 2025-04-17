<template>
  <div class="talisman-stats">
    <!-- Navigation Buttons -->
    <div class="stats-nav">
      <router-link :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }">
        <button>Equipment</button>
      </router-link>
      <router-link :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }">
        <button>Avatar</button>
      </router-link>
      <router-link :to="{ name: 'CreatureStats', params: { jobId, jobGrowId } }">
        <button>Creature</button>
      </router-link>
      <router-link :to="{ name: 'TalismanStats', params: { jobId, jobGrowId } }">
        <button class="active">Talisman</button>
      </router-link>
      <router-link :to="{ name: 'SkillStats', params: { jobId, jobGrowId } }">
        <button>Skill</button>
      </router-link>
      
    </div>

    <h1>Talisman & Rune Statistics for {{ jobFriendlyName }}</h1>

    <!-- Display stats only when a jobGrowId is set -->
    <div v-if="jobGrowId">
      <div v-if="loading">Loading talisman stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- Talisman Items Section -->
        <section class="stat-section">
          <h2>Talisman</h2>
          <div class="tables-container full-width">
            <div class="slot">
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
                    <td>{{ item.usage_count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Rune Items Section -->
        <section class="stat-section">
          <h2>Rune</h2>
          <div class="tables-container full-width">
            <div class="slot">
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
                    <td>{{ item.usage_count }}</td>
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
  name: 'TalismanStats',
  data() {
    return {
      stats: null,
      loading: false,
      error: null
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
    // Use the jobMappings file to get the friendly job name.
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
    }
  },
  mounted() {
    if (this.jobGrowId) {
      this.fetchTalismanStats();
    }
  },
  watch: {
    '$route.params.jobGrowId'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchTalismanStats();
      }
    }
  },
  methods: {
    async fetchTalismanStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        // Assumes your backend route is /api/talisman/stats/:jobId/:jobGrowId
        const response = await axios.get(`/api/talisman/stats/${this.jobId}/${this.jobGrowId}`);
        this.stats = response.data;
      } catch (err) {
        this.error = (err.response && err.response.data && err.response.data.error)
          ? err.response.data.error
          : err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.talisman-stats {
  padding: 20px;
}

/* Navigation styling */
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

/* For full-width table sections */
.full-width .slot {
  flex: 0 0 100%;
}

/* Slot styling */
.tables-container .slot {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
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
