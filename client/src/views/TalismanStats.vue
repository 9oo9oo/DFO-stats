<!-- src/views/TalismanStats.vue -->
<template>
    <div class="talisman-stats">
      <!-- Navigation Buttons -->
      <div class="stats-nav">
        <router-link :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }">
          <button>Equipment</button>
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
        <router-link :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }">
          <button>Avatar</button>
        </router-link>
      </div>
  
      <h1>Talisman & Rune Statistics for {{ jobFriendlyName }}</h1>
  
      <!-- Display stats only when a jobGrowId is set -->
      <div v-if="jobGrowId">
        <div v-if="loading">Loading talisman stats...</div>
        <div v-if="error">Error: {{ error }}</div>
        <div v-if="stats">
          <!-- Talisman Items Section -->
          <div class="section">
            <h2>Top Talisman Items</h2>
            <ul>
              <li
                v-for="item in stats.talismanStats"
                :key="item.talisman_item_id"
              >
                {{ item.talisman_item_name }} - Usage: {{ item.usage_count }}
              </li>
            </ul>
          </div>
  
          <!-- Rune Items Section -->
          <div class="section">
            <h2>Top Rune Items</h2>
            <ul>
              <li
                v-for="item in stats.runeStats"
                :key="item.rune_item_id"
              >
                {{ item.rune_item_name }} - Usage: {{ item.usage_count }}
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
          // Adjust the endpoint if necessary.
          // Here we assume your backend route for talisman stats is:
          // /api/talisman/rune-stats/:jobId/:jobGrowId
          const response = await axios.get(`/api/talisman/stats/${this.jobId}/${this.jobGrowId}`);
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
  .talisman-stats {
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
  
  .section {
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
  }
  </style>
  