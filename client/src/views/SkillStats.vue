<template>
    <h1>Skill Statistics for {{ jobFriendlyName }}</h1>
    <!-- Navigation Buttons -->
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
                  <!-- only show the level cell once, spanning all row chunks -->
                  <td
                    v-if="rowIdx === 0"
                    class="level-cell"
                    :rowspan="group.rows.length"
                  >{{ group.level }}</td>

                  <!-- our single‑cell grid for up to 5 skills -->
                  <td>
                    <div
                      class="skill-grid-with-labels"
                      :style="{ gridTemplateColumns: `auto repeat(${rowSkills.length}, 1fr)` }"
                    >
                      <!-- names -->
                      <div class="row-label">Name</div>
                      <div
                        v-for="skill in rowSkills"
                        :key="skill.skill_id"
                        class="cell"
                      >
                        {{ skill.skill_name }}
                      </div>

                      <!-- usage% -->
                      <div class="row-label">Usage</div>
                      <div
                        v-for="skill in rowSkills"
                        :key="'rate-'+skill.skill_id"
                        class="cell"
                      >
                        {{ formatNumber(skill.total_count) }}%
                      </div>

                      <!-- average -->
                      <div class="row-label">Avg lvl</div>
                      <div
                        v-for="skill in rowSkills"
                        :key="'avg-'+skill.skill_id"
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
    // Sort the skill statistics by required level (and alphabetically by skill name when equal)
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
.equipment-wrapper {
  width: 700px;
  margin: 0 auto 40px;
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

.stat-section {
  margin: 40px;
}

.stat-section h2 {
  color: #e56717;
  padding-bottom: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e56717;
}

.stats-table th:nth-child(1),
.stats-table td:nth-child(1) {
  width: 10%;
  text-align: center;
  vertical-align: middle;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
}

.stat-section.skill-tree {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 40px;
}

/* each “level” row */
.level-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: start;
}

/* the nested skills table */
.skill-table {
  border-collapse: collapse;
  width: 100%;
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

.skill-tree {
  margin: 40px auto;
}

/* cell for Required Level */
.skill-tree .level-cell {
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  color: #e56717;
  padding: 8px;
  width: 20px;
  font-size: 30px;
}

/* the 3‑row inner grid */
.skill-grid {
  display: grid;
  grid-template-rows: auto auto auto;
  column-gap: 16px;
  row-gap: 4px;
}

/* center content in each grid cell */
.skill-grid>div {
  text-align: center;
  padding: 4px 0;
  border-bottom: 1px solid #ddd;
}

.skill-tree {
  table-layout: fixed;
}

.skill-grid-with-labels {
  display: grid;
  grid-template-rows: repeat(3, auto);
  column-gap: 12px;

  width: 100%;
}

/* the row‑labels column */
.skill-grid-with-labels .row-label {
  font-weight: bold;
  text-align: right;
  padding-right: 6px;
  color: #e56717;
}

/* center the data cells */
.skill-grid-with-labels .cell {
  text-align: center;
  padding: 2px 0;
}

/* 2) put a vertical line before every skill cell */
.skill-grid-with-labels .cell {
  border-left: 1px solid #e56717;
}
</style>
