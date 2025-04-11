<template>
  <div class="skill-stats">
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
        <button class="active">Skill</button>
      </router-link>
      <router-link :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }">
        <button>Avatar</button>
      </router-link>
    </div>

    <h1>Skill Statistics for {{ jobFriendlyName }}</h1>

    <!-- Display stats only when a jobGrowId is set -->
    <div v-if="jobGrowId">
      <div v-if="loading">Loading skill stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <section class="stat-section">
          <h2>Skill Statistics</h2>
          <div class="tables-container full-width">
            <div class="slot">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Skill Name</th>
                    <th>Required Level</th>
                    <th>Average Level</th>
                    <th>Total Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="skill in sortedSkillStats"
                    :key="skill.skill_id"
                  >
                    <td>{{ skill.skill_name }}</td>
                    <td>{{ skill.required_level }}</td>
                    <td>{{ skill.average_level.toFixed(2) }}</td>
                    <td>{{ formatNumber(skill.total_count) }}</td>
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
  name: 'SkillStats',
  data() {
    return {
      stats: null,
      loading: false,
      error: null,
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
    // Sort the skill statistics by required level (and alphabetically by skill name when equal)
    sortedSkillStats() {
      if (!this.stats || !this.stats.skillStats) return [];
      return this.stats.skillStats.slice().sort((a, b) => {
        if (a.required_level === b.required_level) {
          return a.skill_name.localeCompare(b.skill_name);
        }
        return a.required_level - b.required_level;
      });
    }
  },
  mounted() {
    if (this.jobGrowId) {
      this.fetchSkillStats();
    }
  },
  watch: {
    '$route.params.jobGrowId'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchSkillStats();
      }
    },
  },
  methods: {
    async fetchSkillStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        const response = await axios.get(
          `/api/skill/stats/${this.jobId}/${this.jobGrowId}`
        );
        this.stats = response.data;
      } catch (err) {
        this.error =
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : err.message;
      } finally {
        this.loading = false;
      }
    },
    formatNumber(number) {
      return Number(number).toLocaleString();
    }
  },
};
</script>

<style scoped>
.skill-stats {
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
  text-align: center;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
}
</style>
