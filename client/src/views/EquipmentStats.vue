<template>
  <div class="equipment-stats">
    <!-- Stats Type Navigation -->
    <div class="stats-nav">
      <router-link
        :to="{ name: 'EquipmentStats', params: { jobId: jobId, jobGrowId: jobGrowId } }"
      >
        <button class="active">Equipment</button>
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
          <button>Avatar</button>
        </router-link>
    </div>

    <h1>Equipment Statistics for {{ jobFriendlyName }}</h1>

    <!-- Display the stats if a jobGrowId is set -->
    <div v-if="jobGrowId">
      <div v-if="loading">Loading equipment stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- Loop through each slot -->
        <div v-for="slot in orderedSlots" :key="slot" class="slot">
          <h2>{{ slot }} Items</h2>
          <ul>
            <li v-for="item in stats.itemsBySlot[slot]" :key="item.item_id">
              <!-- Display item name and usage count -->
              {{ item.item_name }} - Usage: {{ item.usage_count }}
            </li>
          </ul>
          <!-- Fusion items (if any) -->
          <h2 v-if="stats.fusionItemsBySlot[slot].length">Fusion {{ slot }} Items</h2>
          <ul>
            <li v-for="fusionItem in stats.fusionItemsBySlot[slot]" :key="fusionItem.fusion_item_id">
              <!-- Display fusion item name and usage count -->
              {{ fusionItem.fusion_item_name }} - Usage: {{ fusionItem.usage_count }}
            </li>
          </ul>
        </div>

        <div class="set-usage">
          <h2>Set Usage Stats</h2>
          <ul>
            <li v-for="set in stats.setUsage" :key="set.set_item_id">
              <!-- Display set item name and usage count -->
              {{ set.set_item_name }} - Usage: {{ set.usage_count }}
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
  name: 'EquipmentStats',
  data() {
    return {
      stats: null,
      loading: false,
      error: null,
      // Define the order of equipment slots (must match your backend's ordering)
      orderedSlots: [
        "TITLE", "WEAPON", "JACKET", "SHOULDER", "PANTS", "SHOES",
        "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
      ]
    };
  },
  computed: {
    // Grab the route parameters for jobId and jobGrowId
    jobId() {
      return this.$route.params.jobId;
    },
    jobGrowId() {
      return this.$route.params.jobGrowId;
    },
    // Use the jobMappings file to get friendly names and final job grow options
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
      },
    finalJobGrows() {
      return this.jobMapping.finalJobGrows || [];
    }
  },
  mounted() {
    // If a jobGrowId is present, fetch the equipment stats.
    if (this.jobGrowId) {
      this.fetchEquipmentStats();
    }
  },
  watch: {
    // If the jobGrowId changes (via route update), refetch stats.
    '$route.params.jobGrowId'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchEquipmentStats();
      }
    }
  },
  methods: {
    async fetchEquipmentStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        // Construct the URL using the route parameters
        const response = await axios.get(`/api/equipment/stats/${this.jobId}/${this.jobGrowId}`);
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
  .equipment-stats {
    padding: 20px;
  }
  
  /* Stats navigation buttons */
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
  
  .slot {
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
  }
  
  .set-usage {
    margin-top: 40px;
  }
  </style>
  