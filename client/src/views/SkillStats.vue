<!-- src/views/SkillStats.vue -->
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
          <table>
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Required Level</th>
                <th>Average Level</th>
                <th>Total Count</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="skill in stats.skillStats" :key="skill.skill_id">
                <td>{{ skill.skill_name }}</td>
                <td>{{ skill.required_level }}</td>
                <td>{{ skill.average_level.toFixed(2) }}</td>
                <td>{{ skill.total_count }}</td>
              </tr>
            </tbody>
          </table>
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
        // Check if a jobGrowId exists and the mapping contains finalJobGrows.
        if (this.jobGrowId && Array.isArray(this.jobMapping.finalJobGrows)) {
          // Look for the jobGrow that matches the jobGrowId.
          const growMapping = this.jobMapping.finalJobGrows.find(
            (item) => item.jobGrowId === this.jobGrowId
          );
          // If found, return the jobGrowName.
          if (growMapping && growMapping.jobGrowName) {
            return growMapping.jobGrowName;
          }
        }
        // If no matching jobGrow is found, return the default jobName.
        return this.jobMapping.jobName || 'Unknown Job';
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
          const response = await axios.get(`/api/skill/stats/${this.jobId}/${this.jobGrowId}`);
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
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  
  th {
    background-color: #f2f2f2;
  }
  </style>
  