<!-- src/views/CreatureStats.vue -->
<template>
    <div class="creature-stats">
      <!-- Navigation Buttons -->
      <div class="stats-nav">
        <router-link :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }">
          <button>Equipment</button>
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
          <div class="section">
            <h2>Creature Main Items</h2>
            <ul>
              <li
                v-for="item in stats.creatureStats"
                :key="item.creature_item_id"
              >
                Item ID: {{ item.creature_item_id }} - Usage: {{ item.usage_count }}
              </li>
            </ul>
          </div>
  
          <!-- Artifact RED Items Section -->
          <div class="section">
            <h2>Artifact Red Items</h2>
            <ul>
              <li
                v-for="item in stats.artifactRedStats"
                :key="item.artifact_item_id"
              >
                Item ID: {{ item.artifact_item_id }} - Usage: {{ item.usage_count }}
              </li>
            </ul>
          </div>
  
          <!-- Artifact BLUE Items Section -->
          <div class="section">
            <h2>Artifact Blue Items</h2>
            <ul>
              <li
                v-for="item in stats.artifactBlueStats"
                :key="item.artifact_item_id"
              >
                Item ID: {{ item.artifact_item_id }} - Usage: {{ item.usage_count }}
              </li>
            </ul>
          </div>
  
          <!-- Artifact GREEN Items Section -->
          <div class="section">
            <h2>Artifact Green Items</h2>
            <ul>
              <li
                v-for="item in stats.artifactGreenStats"
                :key="item.artifact_item_id"
              >
                Item ID: {{ item.artifact_item_id }} - Usage: {{ item.usage_count }}
              </li>
            </ul>
          </div>
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
          // Use the jobId and jobGrowId to fetch creature stats from your backend.
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
  .stats-nav {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
  }
  .stats-nav button {
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .stats-nav button:hover {
    background-color: #0056b3;
  }
  .stats-nav button.active {
    background-color: #0056b3;
  }
  </style>
  