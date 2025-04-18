<template>
    <h1>Talisman & Rune Statistics for {{ jobFriendlyName }}</h1>
    <div class="equipment-wrapper">
     <!-- Top Tabs (Equipment, Avatar, Creature, Talisman, Skill) -->
     <div class="equipment-tabs">
       <router-link
         :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('EquipmentStats') }"
       >Equipment</router-link>
       <router-link
         :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('AvatarStats') }"
       >Avatar</router-link>
       <router-link
         :to="{ name: 'CreatureStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('CreatureStats') }"
       >Creature</router-link>
       <router-link
         :to="{ name: 'TalismanStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('TalismanStats') }"
       >Talisman</router-link>
       <router-link
         :to="{ name: 'SkillStats', params: { jobId, jobGrowId } }"
         class="tab-button"
         :class="{ active: isActiveRoute('SkillStats') }"
       >Skill</router-link>
     </div>

     <!-- Big Square (buttons omitted for now) -->
     <div class="equipment-square">
     </div>
   </div>


    <!-- Display stats only when a jobGrowId is set -->
    <div v-if="jobGrowId">
      <div v-if="loading">Loading talisman stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">

        <!-- Combined Talisman & Rune Side‑by‑Side -->
        <section class="stat-section">
          <div class="tables-container side-by-side">
            <div class="slot">
              <h2>Talisman</h2>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.talismanStats" :key="item.talisman_item_id">
                    <td>{{ item.talisman_item_name }}</td>
                    <td>{{ formatRate(item.usage_count, 3) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="slot">
              <h2>Rune</h2>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Usage Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.runeStats" :key="item.rune_item_id">
                    <td>{{ item.rune_item_name }}</td>
                    <td>{{ formatRate(item.usage_count, 9) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
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
      error: null,
      talismanSlots: [
        'T1','T2','T3','T4','T5','T6','T7','T8'
      ]
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
        // Assumes your backend route is /api/talisman/stats/:jobId/:jobGrowId
        const response = await axios.get(`/api/talisman/stats/${this.jobId}/${this.jobGrowId}`);
        this.stats = response.data;
      } catch (err) {
        this.error = (err.response && err.response.data && err.response.data.error)
          ? err.response.data.error
          : err.message;
      } finally {
        this.loading = false;
      }
    },
    isActiveRoute(name) {
      return this.$route.name === name;
    },
      formatRate(value, divisor) {
      return (value / divisor).toFixed(2);
    }
  }
};
</script>

<style scoped>
.equipment-wrapper {
  width: 700px;
  margin: 0 auto 40px;
  position: relative;
  padding-top: 20px;
}

.equipment-tabs {
  width: 95%;
  margin: 0 auto;
  display: flex;
  background: #222;
  border: 2px solid #fff;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  box-sizing: border-box;
}

.equipment-tabs .tab-button {
  flex: 1;
  text-align: center;
  padding: 10px;
  color: #fff;
  text-decoration: none;
  border-right: 1px solid #fff;
  box-sizing: border-box;
}

.equipment-tabs .tab-button:last-child {
  border-right: none;
}

.equipment-tabs .tab-button:hover,
.equipment-tabs .tab-button.active {
  background-color: #e56717;
}

.equipment-square {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  margin-top: 0;
  border: 2px solid #fff;
  border-radius: 4px;
  box-sizing: border-box;
  padding: 10px;
}

.equipment-square .side,
.equipment-square .center {
  flex: 1;
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
.slot h2 {
  padding-bottom: 8px;
  /* space between text and the line */
  margin-bottom: 16px;
  /* space between the line and the table */
  border-bottom: 2px solid #e56717;
  color: #e56717;
}

/* Tables container styling */
.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.tables-container.side-by-side {
  display: flex;
  gap: 40px;
}

/* For full-width table sections */
.full-width .slot {
  flex: 0 0 100%;
}

/* Slot styling */
.tables-container .slot {
  padding: 10px;
  border-radius: 4px;
}

.tables-container.side-by-side {
  display: flex;
  column-gap: 60px;
  /* horizontal only */
}

.tables-container.side-by-side .slot {
  flex: 1;
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
