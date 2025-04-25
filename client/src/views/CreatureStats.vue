<template>
    <h1>Creature Statistics for {{ jobFriendlyName }}</h1>
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

      <!-- Buttons Square -->
      <div class="equipment-square">
        <div class="side left">
          <div class="left-button-container">
            <div class="slot-button slot-purple" @click="scrollToSlot('CREATURE')">Creature</div>
          </div>
        </div>

        <div class="center"></div>

        <div class="side right">
          <div class="right-button-container">
            <div class="slot-button slot-red" @click="scrollToSlot('ARTIFACT_RED')">Red Artifact</div>
            <div class="slot-button slot-blue" @click="scrollToSlot('ARTIFACT_BLUE')">Blue Artifact</div>
            <div class="slot-button slot-green" @click="scrollToSlot('ARTIFACT_GREEN')">Green Artifact</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="jobGrowId">
      <div v-if="loading">Loading creature stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- Creature Main Items Section -->
        <section ref="CREATURE" class="stat-section">
          <h2>Creature</h2>
          <div class="tables-container full-width">
            <div class="slot">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Usage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.creatureStats" :key="item.creature_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip :id="item.creature_item_id">
                          <img
                            :src="getItemImageUrl(item.creature_item_id)"
                            :alt="item.creature_item_name"
                            class="item-icon"
                            loading="lazy"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.creature_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Artifact Items Section -->
        <section class="stat-section">
          <h2>Artifact</h2>
          <div class="tables-container artifact-container">
            <div class="slot" ref="ARTIFACT_RED">
              <h3>Red Artifact </h3>
              <table class="stats-table">
                <thead>
                  <tr><th>Item</th><th>Usage</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.artifactRedStats" :key="item.artifact_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip
                          :id="item.artifact_item_id"
                          :name="item.artifact_item_name"
                        >
                          <img
                            :src="getItemImageUrl(item.artifact_item_id)"
                            :alt="item.artifact_item_name"
                            class="item-icon"
                            loading="lazy"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.artifact_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="slot" ref="ARTIFACT_BLUE">
              <h3>Blue Artifact</h3>
              <table class="stats-table">
                <thead>
                  <tr><th>Item</th><th>Usage</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.artifactBlueStats" :key="item.artifact_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip
                          :id="item.artifact_item_id"
                          :name="item.artifact_item_name"
                        >
                          <img
                            :src="getItemImageUrl(item.artifact_item_id)"
                            :alt="item.artifact_item_name"
                            class="item-icon"
                            loading="lazy"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.artifact_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="slot" ref="ARTIFACT_GREEN">
              <h3>Green Artifact</h3>
              <table class="stats-table">
                <thead>
                  <tr><th>Item</th><th>Usage</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.artifactGreenStats" :key="item.artifact_item_id">
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip
                          :id="item.artifact_item_id"
                          :name="item.artifact_item_name"
                        >
                          <img
                            :src="getItemImageUrl(item.artifact_item_id)"
                            :alt="item.artifact_item_name"
                            class="item-icon"
                            loading="lazy"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ item.artifact_item_name }}</span>
                      </div>
                    </td>
                    <td>{{ item.usage_count }}%</td>
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
import ItemTooltip from '@/components/ItemTooltip.vue';

export default {
  name: 'CreatureStats',
  components: { ItemTooltip },
  data() {
    return {
      stats: null,
      loading: false,
      error: null
    };
  },
  computed: {
    jobId() { return this.$route.params.jobId; },
    jobGrowId() { return this.$route.params.jobGrowId; },
    jobMapping() { return jobMappings[this.jobId] || {}; },
    jobFriendlyName() {
      if (this.jobGrowId && Array.isArray(this.jobMapping.finalJobGrows)) {
        const grow = this.jobMapping.finalJobGrows.find(g => g.jobGrowId === this.jobGrowId);
        return grow?.jobGrowName || this.jobMapping.jobName;
      }
      return this.jobMapping.jobName || 'Unknown Job';
    }
  },
  mounted() {
    if (this.jobGrowId) this.fetchCreatureStats();
  },
  watch: {
    '$route.params.jobGrowId'(n, o) { if (n !== o) this.fetchCreatureStats(); }
  },
  methods: {
    isActiveRoute(name) { return this.$route.name === name; },
    async fetchCreatureStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        const res = await axios.get(`/api/creature/stats/${this.jobId}/${this.jobGrowId}`);
        this.stats = res.data;
      } catch (e) {
        this.error = e.response?.data?.error || e.message;
      } finally { this.loading = false; }
    },
    scrollToSlot(slot) {
      // grab the element (could be the <section> or a .slot div)
      let el = this.$refs[slot];
      if (Array.isArray(el)) el = el[0];
      if (!el) return;

      // scroll just above it
      const offset = 20;
      const top = window.pageYOffset + el.getBoundingClientRect().top - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      // watch for when it hits the viewport
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          // choose flash target: if this isn't already a .slot, find its child
          let flashEl = el;
          if (!flashEl.classList.contains('slot')) {
            const childSlot = flashEl.querySelector('.slot');
            if (childSlot) flashEl = childSlot;
          }

          flashEl.classList.add('flash');
          setTimeout(() => flashEl.classList.remove('flash'), 2000);
          o.disconnect();
        });
      }, { threshold: 0.5 });

      obs.observe(el);
    },
    getItemImageUrl(itemId) {
      return `https://img-api.dfoneople.com/df/items/${itemId}`;
    }
  }
};
</script>

<style scoped>
/* === Equipment‑Tabs & Equipment‑Square (copied from AvatarStats.vue) === */

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
  text-decoration: none;
  color: #fff;
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
  border: 2px solid #fff;
  box-sizing: border-box;
  border-radius: 4px;
  margin-top: 0;
  padding: 10px;
}

.equipment-square .side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.equipment-square .side.left {
  justify-content: flex-start;
  align-items: flex-start;
}


.left-button-container {
  /* just let it flow normally at the top-left */
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.equipment-square .side.right {
  justify-content: flex-end;
  align-items: flex-start;
}

.right-button-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.equipment-square .column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.equipment-square .side.left .column,
.equipment-square .side.right .column {
  justify-content: flex-start;
}

.equipment-square .center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

/* slot-button styling */
.slot-button {
  width: 100px;
  height: 100px;
  margin: 5px;
  background-color: #222;
  border: 1px solid #666;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color 0.2s;
}

.slot-button:hover {
  background-color: #e56717;
}

.slot-purple {
  border-color: #8e44ad;
  color: white;
  /* ensure text shows */
}

.slot-red {
  border-color: #c0392b;
  color: white;
}

.slot-blue {
  border-color: #4a90e2;
  color: white;
}

.slot-green {
  border-color: #3cb043;
  color: white;
}


/* === Your existing CreatureStats styles === */

/* Section styling */
.stat-section {
  margin: 40px;
}

.stat-section h2 {
  color: #e56717;
  padding-bottom: 4px;
  border-bottom: 2px solid currentColor;
  margin-bottom: 16px;
  width: auto;
}

.artifact-container h3 {
  font-size: 24px;
}
.artifact-container .slot:nth-child(1) h3 {
  color: #c0392b;
}

.artifact-container .slot:nth-child(2) h3 {
  color: #4a90e2;
}

.artifact-container .slot:nth-child(3) h3 {
  color: #3cb043;
}

/* Tables container styling */
.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.tables-container.full-width {
  display: flex;
  justify-content: space-between;  
}

.tables-container.full-width .slot {
  flex: 1 1 auto;   
}

.tables-container.full-width .stats-table {
  width: 100%;
}

.tables-container.artifact-container {
  display: flex;               
  justify-content: space-between; 
}

/* General slot styling (fallback) */
.tables-container .slot {
  padding: 10px;
  border-radius: 4px;
  margin: 0 10px; 
}

/* Table styling */
.stats-table {
  width: auto;
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

.stats-table th:nth-child(2),
.stats-table td:nth-child(2) {
  text-align: center;
  vertical-align: middle;
}

@keyframes flashEffect {
  0% {
    box-shadow: 0 0 0px #e56717;
  }

  50% {
    box-shadow: 0 0 10px 5px #e56717;
  }

  100% {
    box-shadow: 0 0 0px #e56717;
  }
}

.flash {
  animation: flashEffect 2s ease-out;
}

.item-cell {
  display: flex;
  align-items: center;
}

.icon-and-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.item-name {
  font-size: 14px;
}
</style>
