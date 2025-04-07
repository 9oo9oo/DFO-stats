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
          <!-- Avatar Equipment Section -->
          <div class="section" v-for="slot in orderedSlots" :key="slot">
            <h2>{{ slot }} Avatar Items</h2>
            <ul>
              <li v-for="item in stats.avatarStatsBySlot[slot]" :key="item.item_id">
                {{ item.item_name }}
                <span v-if="item.option_ability"> (Option: {{ item.option_ability }})</span>
                - Usage: {{ item.usage_count }}
              </li>
            </ul>
          </div>
  
          <!-- Emblem Statistics Section -->
          <div class="section">
            <h2>Emblem Statistics</h2>
            <div v-for="color in orderedEmblemColors" :key="color" class="emblem-section">
              <h3>{{ capitalize(color) }} Emblems</h3>
              <ul>
                <li v-for="emblem in emblemStatsByColor[color] || []" :key="emblem.item_id">
                  {{ emblem.item_name }} - Usage: {{ emblem.usage_count }}
                </li>
              </ul>
            </div>
          </div>
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