<template>
  <div class="equipment-stats">
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
              Item ID: {{ item.item_id }} - Usage: {{ item.usage_count }}
            </li>
          </ul>
          <!-- Fusion items (if any) -->
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
  </div>
</template>

<script>
import axios from 'axios';
import jobMappings from '@/config/jobMappings';

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
    },
    selectFinalJobGrow(finalGrow) {
      // Update the route parameters so that jobGrowId is set to the selected final job grow.
      this.$router.push({
        name: 'EquipmentStats',
        params: { jobId: this.jobId, jobGrowId: finalGrow.jobGrowId }
      });
      // Optionally, clear previous stats until new stats are fetched.
      this.stats = null;
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
button {
  margin: 5px;
  padding: 8px 12px;
  border: none;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
}
button.active {
  background-color: #0056b3;
}
</style>
