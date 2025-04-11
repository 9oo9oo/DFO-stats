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
        <!-- Normal Equipment Items Section -->
        <section class="normal-items">
          <h2>Normal Equipment Items</h2>
          <div class="tables-container">
            <!-- Loop through each normal equipment slot -->
            <div v-for="slot in orderedSlots" :key="slot" class="slot">
              <!-- Use the custom display name for each slot -->
              <h3>{{ slotDisplayNames[slot] || slot }}</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Equipment Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.itemsBySlot[slot]" :key="item.item_id">
                    <td>{{ item.item_name }}</td>
                    <td>{{ item.usage_rate }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Fusion Equipment Items Section -->
        <section class="fusion-items">
          <h2>Fusion Equipment Items</h2>
          <div class="tables-container">
            <!-- Loop through each fusion equipment slot -->
            <div v-for="slot in fusionOrderedSlots" :key="slot" class="slot">
              <!-- Use the custom display name for each slot -->
              <h3>Fusion {{ slotDisplayNames[slot] || slot }}</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Equipment Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="fusionItem in stats.fusionItemsBySlot[slot]" :key="fusionItem.fusion_item_id">
                    <td>{{ fusionItem.fusion_item_name }}</td>
                    <td>{{ fusionItem.usage_rate }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Set Usage Stats Section -->
        <section class="set-usage">
          <h2>Set Usage Stats</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Usage Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="set in stats.setUsage" :key="set.set_item_id">
                <td>{{ set.set_item_name }}</td>
                <td>{{ set.usage_rate }}</td>
              </tr>
            </tbody>
          </table>
        </section>
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
      // All equipment slots for normal items (total 13)
      orderedSlots: [
        "TITLE", "WEAPON", "JACKET", "SHOULDER", "PANTS", "SHOES",
        "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
      ],
      // Fusion equipment slots (11 slots; adjust as needed)
      fusionOrderedSlots: [
        "JACKET", "SHOULDER", "PANTS", "SHOES",
        "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
      ]
    };
  },
  computed: {
    // Route parameters for jobId and jobGrowId
    jobId() {
      return this.$route.params.jobId;
    },
    jobGrowId() {
      return this.$route.params.jobGrowId;
    },
    // Retrieve the job mapping information
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
    finalJobGrows() {
      return this.jobMapping.finalJobGrows || [];
    },
    // Mapping of in-game slot IDs to user-friendly display names
    slotDisplayNames() {
      return {
        "TITLE": "Title",
        "WEAPON": "Weapon",
        "JACKET": "Top",
        "SHOULDER": "Head/Shoulder",
        "PANTS": "Bottom",
        "SHOES": "Shoes",
        "WAIST": "Belt",
        "AMULET": "Necklace",
        "WRIST": "Bracelet",
        "RING": "Ring",
        "SUPPORT": "Sub-Equipment",
        "MAGIC_STON": "Magic Stone",
        "EARRING": "Earrings"
      };
    }
  },
  mounted() {
    if (this.jobGrowId) {
      this.fetchEquipmentStats();
    }
  },
  watch: {
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

/* Container for tables */
.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 40px;
}

/* Each slot container styling */
.tables-container .slot {
  flex: 0 0 calc(33.33% - 20px); /* For 3 tables per row */
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
}

/* Table styling */
.stats-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
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

/* Set usage section styling */
.set-usage {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 40px;
}
</style>
