<!-- src/views/EquipmentStats.vue -->
<template>
    <div class="equipment-stats">
      <h1>Equipment Statistics for Job: {{ jobId }}, Growth: {{ jobGrowId }}</h1>
  
      <div v-if="loading">
        Loading equipment stats...
      </div>
  
      <div v-if="error">
        <p>Error: {{ error }}</p>
      </div>
  
      <div v-if="stats">
        <!-- Loop through each slot in the defined order -->
        <div v-for="slot in orderedSlots" :key="slot" class="slot">
          <h2>{{ slot }} Items</h2>
          <ul>
            <li v-for="item in stats.itemsBySlot[slot]" :key="item.item_id">
              Item ID: {{ item.item_id }} - Usage: {{ item.usage_count }}
            </li>
          </ul>
          <!-- Fusion items: note that fusion items for WEAPON are skipped in your backend -->
          <h2 v-if="stats.fusionItemsBySlot[slot].length">Fusion {{ slot }} Items</h2>
          <ul>
            <li v-for="fusionItem in stats.fusionItemsBySlot[slot]" :key="fusionItem.fusion_item_id">
              Fusion Item ID: {{ fusionItem.fusion_item_id }} - Usage: {{ fusionItem.usage_count }}
            </li>
          </ul>
        </div>
  
        <div class="set-usage">
          <h2>Set Usage Stats</h2>
          <ul>
            <li v-for="set in stats.setUsage" :key="set.set_item_id">
              Set Item ID: {{ set.set_item_id }} - Usage: {{ set.usage_count }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
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
      }
    },
    mounted() {
      this.fetchEquipmentStats();
    },
    methods: {
      async fetchEquipmentStats() {
        this.loading = true;
        try {
          // Construct the URL using the route parameters
          const response = await axios.get(`/api/equipment/stats/${this.jobId}/${this.jobGrowId}`);
          this.stats = response.data;
        } catch (err) {
          // Check if error response exists; otherwise use a generic error message.
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
  .slot {
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
  }
  .set-usage {
    margin-top: 40px;
  }
  </style>
  