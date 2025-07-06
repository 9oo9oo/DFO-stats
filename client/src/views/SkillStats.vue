<template>
    <h1>Skill Statistics for {{ jobFriendlyName }}</h1>

    <!-- Navigation Tabs -->
    <div class="equipment-wrapper">
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

     <!-- Skill layout (Undecided what to do) -->
     <div class="equipment-square">
     </div>
   </div>
      
    <div v-if="jobGrowId">
      <div v-if="loading">Loading skill stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <section class="stat-section">
          <h2>Skill Statistics</h2>
          <table class="stats-table skill-tree">
            <thead>
              <tr>
                <th>Required Level</th>
                <th>Skills</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in chunkedLevelRows" :key="group.level">
                <tr v-for="(rowSkills, rowIdx) in group.rows" :key="rowIdx">
                  <td
                    v-if="rowIdx === 0"
                    class="level-cell"
                    :rowspan="group.rows.length"
                  >{{ group.level }}</td>

                  <!-- Single-cell grid -->
                  <td>
                    <div
                      class="skill-grid-with-labels"
                      :style="{ gridTemplateColumns: `auto repeat(${rowSkills.length}, 1fr)` }"
                    >
                      <!-- skill names -->
                      <div class="row-label">Name</div>
                      <div
                        v-for="skill in rowSkills"
                        :key="skill.skill_id"
                        class="cell"
                      >
                        {{ skill.skill_name }}
                      </div>

                      <!-- usage rate -->
                      <div class="row-label">Usage</div>
                      <div
                        v-for="skill in rowSkills"
                        :key="'rate-' + skill.skill_id"
                        class="cell"
                      >
                        {{ formatNumber(skill.total_count) }}%
                      </div>

                      <!-- average level -->
                      <div class="row-label">Avg lvl</div>
                      <div
                        v-for="skill in rowSkills"
                        :key="'avg-' + skill.skill_id"
                        class="cell"
                      >
                        {{ skill.average_level.toFixed(2) }}
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </section>
      </div>
    </div>
</template>

<script lang="ts">
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
    jobId() {
      return this.$route.params.jobId;
    },
    jobGrowId() {
      return this.$route.params.jobGrowId;
    },
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
    sortedSkillStats() {
      if (!this.stats || !this.stats.skillStats) return [];
      return this.stats.skillStats.slice().sort((a, b) => {
        if (a.required_level === b.required_level) {
          return a.skill_name.localeCompare(b.skill_name);
        }
        return a.required_level - b.required_level;
      });
    },
    groupedByLevel() {
      return this.sortedSkillStats.reduce((acc, skill) => {
        const lvl = skill.required_level;
        if (!acc[lvl]) acc[lvl] = [];
        acc[lvl].push(skill);
        return acc;
      }, {});
    },
    chunkedLevelRows() {
      const MAX = 6;
      return Object.entries(this.groupedByLevel).map(([level, skills]) => {
        const rows = [];
        for (let i = 0; i < skills.length; i += MAX) {
          rows.push(skills.slice(i, i + MAX));
        }
        return { level, rows };
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
    },
    isActiveRoute(name) {
      return this.$route.name === name;
    }
  },
};
</script>

<style scoped>
/* Wrapper */
.equipment-wrapper {
  width: 700px;
  margin: 0 auto 40px;
  padding-top: 20px;
}

/* Tabs */
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
  padding: 10px;
  text-align: center;
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

/* Square Container */
.equipment-square {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-top: 0;
  padding: 10px;
  border: 2px solid #fff;
  border-radius: 4px;
  box-sizing: border-box;
}

.equipment-square .side,
.equipment-square .center {
  flex: 1;
}

/* Section Styling */
.stat-section {
  margin: 40px;
}

.stat-section h2 {
  margin-bottom: 16px;
  padding-bottom: 8px;
  color: #e56717;
  border-bottom: 2px solid #e56717;
}

.stat-section.skill-tree {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 40px;
}

/* Stats Table */
.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  vertical-align: middle;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
}

.stats-table th:nth-child(1),
.stats-table td:nth-child(1) {
  width: 10%;
}

/* Skill Tree Layout */
.skill-tree {
  margin: 40px auto;
  table-layout: fixed;
}

.level-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: start;
}

.skill-grid {
  display: grid;
  grid-template-rows: repeat(3, auto);
  column-gap: 16px;
  row-gap: 4px;
}

.skill-grid>div {
  text-align: center;
  padding: 4px 0;
  border-bottom: 1px solid #ddd;
}

/* Skill Table */
.skill-table {
  width: 100%;
  border-collapse: collapse;
}

.skill-table th,
.skill-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.skill-table th {
  background: #f2f2f2;
  color: #e56717;
}

/* Level Cell */
.skill-tree .level-cell {
  width: 20px;
  font-size: 30px;
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  color: #e56717;
  padding: 8px;
}

/* Grid with Labels */
.skill-grid-with-labels {
  display: grid;
  grid-template-rows: repeat(3, auto);
  column-gap: 12px;
  width: 100%;
}

.skill-grid-with-labels .row-label {
  font-weight: bold;
  text-align: right;
  padding-right: 6px;
  color: #e56717;
}

.skill-grid-with-labels .cell {
  text-align: center;
  padding: 2px 0;
  border-left: 1px solid #e56717;
}

/* Flash Animation */
@keyframes flashEffect {

  0%,
  100% {
    box-shadow: 0 0 0px #e56717;
  }

  50% {
    box-shadow: 0 0 10px 5px #e56717;
  }
}

.flash {
  animation: flashEffect 2s ease-out;
}
</style>
