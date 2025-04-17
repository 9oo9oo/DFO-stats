<template>
  <div class="creature-stats">
    <!-- Navigation Buttons -->
    <div class="stats-nav">
      <router-link :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }">
        <button>Equipment</button>
      </router-link>
      <router-link :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }">
        <button>Avatar</button>
      </router-link>
      <router-link :to="{ name: 'CreatureStats', params: { jobId, jobGrowId } }">
        <button class="active">Creature</button>
      </router-link>
      <router-link :to="{ name: 'TalismanStats', params: { jobId, jobGrowId } }">
        <button>Talisman</button>
      </router-link>
      <router-link :to="{ name: 'SkillStats', params: { jobId, jobGrowId } }">
        <button>Skill</button>
      </router-link>
      
    </div>

    <h1>Creature Statistics for {{ jobFriendlyName }}</h1>

    <!-- Display stats only when a jobGrowId is set -->
    <div v-if="jobGrowId">
      <div v-if="loading">Loading creature stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- Creature Main Items Section -->
        <section class="stat-section">
          <h2>Creature</h2>
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
                  <tr v-for="item in stats.creatureStats" :key="item.creature_item_id">
                    <td>{{ item.creature_item_name }}</td>
                    <td>{{ item.usage_count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Artifact Items Section: Red, Blue, and Green side by side -->
        <section class="stat-section">
          <h2>Artifact</h2>
          <div class="tables-container artifact-container">
            <!-- Artifact Red Items -->
            <div class="slot">
              <h3>Artifact Red</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.artifactRedStats" :key="item.artifact_item_id">
                    <td>{{ item.artifact_item_name }}</td>
                    <td>{{ item.usage_count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Artifact Blue Items -->
            <div class="slot">
              <h3>Artifact Blue</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.artifactBlueStats" :key="item.artifact_item_id">
                    <td>{{ item.artifact_item_name }}</td>
                    <td>{{ item.usage_count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Artifact Green Items -->
            <div class="slot">
              <h3>Artifact Green</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.artifactGreenStats" :key="item.artifact_item_id">
                    <td>{{ item.artifact_item_name }}</td>
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
  name: 'CreatureStats',
  data() {
    return {
      stats: null,
      loading: false,
      error: null
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
    }
  },
  mounted() {
    if (this.jobGrowId) {
      this.fetchCreatureStats();
    }
  },
  watch: {
    '$route.params.jobGrowId'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchCreatureStats();
      }
    }
  },
  methods: {
    async fetchCreatureStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        const response = await axios.get(`/api/creature/stats/${this.jobId}/${this.jobGrowId}`);
        this.stats = response.data;
      } catch (err) {
        this.error = err.response && err.response.data && err.response.data.error
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
.creature-stats {
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

/* For artifact items: display three tables per row */
.artifact-container .slot {
  flex: 0 0 calc(33.33% - 20px);
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
}

/* General slot styling (fallback) */
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
