<template>
    <h1>Equipment Statistics for {{ jobFriendlyName }}</h1>
    <div class="equipment-wrapper">
      <!-- Top Tabs (Equipment, Avatar, Creature, Talisman, Skill) -->
      <div class="equipment-tabs">
        <router-link
          :to="{ name: 'EquipmentStats', params: { jobId: jobId, jobGrowId: jobGrowId } }"
          class="tab-button"
          :class="{ active: isActiveRoute('EquipmentStats') }"
        >
          Equipment
        </router-link>

        <router-link
          :to="{ name: 'AvatarStats', params: { jobId, jobGrowId } }"
          class="tab-button"
          :class="{ active: isActiveRoute('AvatarStats') }"
        >
          Avatar
        </router-link>

        <router-link
          :to="{ name: 'CreatureStats', params: { jobId, jobGrowId } }"
          class="tab-button"
          :class="{ active: isActiveRoute('CreatureStats') }"
        >
          Creature
        </router-link>

        <router-link
          :to="{ name: 'TalismanStats', params: { jobId, jobGrowId } }"
          class="tab-button"
          :class="{ active: isActiveRoute('TalismanStats') }"
        >
          Talisman
        </router-link>

        <router-link
          :to="{ name: 'SkillStats', params: { jobId, jobGrowId } }"
          class="tab-button"
          :class="{ active: isActiveRoute('SkillStats') }"
        >
          Skill
        </router-link>
      </div>

      <!-- Big Square Equipment Slot Buttons Container -->
      <div class="equipment-square">
        <!-- Left side -->
        <div class="side left">
          <div class="column column-one">
            <div v-for="slot in leftColumnOne" :key="slot" class="slot-button" @click="scrollToSlot(slot)">
              {{ slotDisplayNames[slot] || slot }}
            </div>
          </div>
          <div class="column column-two">
            <div v-for="slot in leftColumnTwo" :key="slot" class="slot-button" @click="scrollToSlot(slot)">
              {{ slotDisplayNames[slot] || slot }}
            </div>
          </div>
        </div>

        <!-- Newly added center area with the image -->
        <div class="center">
          <img
            :src="centerImgSrc"
            :alt="jobFriendlyName"
            class="awakening-img"
          />
        </div>

        <!-- Right side -->
        <div class="side right">
          <div class="column column-one">
            <div v-for="slot in rightColumnOne" :key="slot" class="slot-button" @click="scrollToSlot(slot)">
              {{ slotDisplayNames[slot] || slot }}
            </div>
          </div>
          <div class="column column-two">
            <div v-for="slot in rightColumnTwo" :key="slot" class="slot-button" @click="scrollToSlot(slot)">
              {{ slotDisplayNames[slot] || slot }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- You can keep the rest of your equipment stats content below -->
    
    <div v-if="jobGrowId">
      <div v-if="loading">Loading equipment stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">
        <!-- === SET USAGE AT THE TOP === -->
        <section class="set-usage">
          <h2>Set Usage</h2>
          <table class="stats-table">
            <thead>
              <tr>
                <th>Set Name</th>
                <th>Usage Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="set in stats.setUsage" :key="set.set_item_id">
                <td>{{ set.set_item_name }}</td>
                <td>{{ set.usage_count }}%</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- === COMBINED NORMAL + FUSION PER SLOT === -->
        <div class="slot-by-slot">
          <section
            v-for="slot in orderedSlots"
            :key="slot"
            :ref="slot"
            :class="[
              'slot-section',
              (slot === 'TITLE' || slot === 'WEAPON') ? 'half-width' : 'full-width'
            ]"
          >
            <!-- Slot Heading -->
            <h2>{{ slotDisplayNames[slot] || slot }}</h2>

            <!-- Normal Items Table -->
            <div class="tables-pair">
              <div class="table-wrapper">
                <h3>Normal Equipment</h3>
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Usage Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in stats.itemsBySlot[slot]"
                      :key="item.item_id"
                    >
                      <td>{{ item.item_name }}</td>
                      <td>{{ item.usage_count }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Fusion Items Table -->
              <div
                class="table-wrapper"
                v-if="stats.fusionItemsBySlot[slot] && stats.fusionItemsBySlot[slot].length"
              >
                <h3>Fusion Equipment</h3>
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Usage Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="fusionItem in stats.fusionItemsBySlot[slot]"
                      :key="fusionItem.fusion_item_id"
                    >
                      <td>{{ fusionItem.fusion_item_name }}</td>
                      <td>{{ fusionItem.usage_count }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
      // Full ordered slots as before
      orderedSlots: [
        "TITLE", "WEAPON", "JACKET", "SHOULDER", "PANTS", "SHOES",
        "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
      ],
      fusionOrderedSlots: [
        "JACKET", "SHOULDER", "PANTS", "SHOES",
        "WAIST", "AMULET", "WRIST", "RING", "SUPPORT", "MAGIC_STON", "EARRING"
      ]
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
    slotDisplayNames() {
      return {
        TITLE: 'Title',
        WEAPON: 'Weapon',
        JACKET: 'Top',
        SHOULDER: 'Head/Shoulder',
        PANTS: 'Bottom',
        SHOES: 'Shoes',
        WAIST: 'Belt',
        AMULET: 'Necklace',
        WRIST: 'Bracelet',
        RING: 'Ring',
        SUPPORT: 'Sub-Equipment',
        MAGIC_STON: 'Magic Stone',
        EARRING: 'Earrings'
      };
    },
    // Define left side layout: 5 slots
    leftColumnOne() {
      // First 3 slots for left column
      return ["SHOULDER", "PANTS", "SHOES"];
    },
    leftColumnTwo() {
      // Next 2 slots for left side second column
      return ["JACKET", "WAIST"];
    },
    // Define right side layout: 8 slots split into 2 columns of 4 each
    rightColumnOne() {
      return ["WEAPON", "WRIST", "SUPPORT", "EARRING"];
    },
    rightColumnTwo() {
      return ["TITLE", "RING", "AMULET", "MAGIC_STON"];
    },
    centerImgSrc() {
      const grows = this.jobMapping.finalJobGrows || [];
      const idx = grows.findIndex(g => g.jobGrowId === this.jobGrowId);
      if (idx !== -1) {
        // if mapping already has an imgSrc, use it; otherwise build via require
        return grows[idx].imgSrc || this.getImageSrc(this.jobId, idx);
      }
      return ''; // fallback
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
    },
    isActiveRoute(name) {
      return this.$route.name === name;
    },
    scrollToSlot(slot) {
      let el = this.$refs[slot];
      if (Array.isArray(el)) el = el[0];
      if (!el) return;

      // how much space you want above the slot
      const offset = 20; 

      // compute the element's absolute top and subtract offset
      const top = window.pageYOffset + el.getBoundingClientRect().top - offset;

      // smooth‑scroll there
      window.scrollTo({ top, behavior: 'smooth' });

      // once it's in view, flash it
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.classList.add('flash');
            // remove after your flash duration (e.g. 1.5s)
            setTimeout(() => el.classList.remove('flash'), 1500);
            obs.disconnect();
          }
        });
      }, { threshold: 0.5 });

      observer.observe(el);
    },
    getSequentialIndex(currentJobId, currentLocalIndex) {
      let count = 0;
      for (const [jid, mapping] of Object.entries(jobMappings)) {
        if (jid === currentJobId) {
          return count + currentLocalIndex + 1;
        }
        count += mapping.finalJobGrows.length;
      }
      return 0;
    },
    getImageSrc(jobId, localIndex) {
      const seq = this.getSequentialIndex(jobId, localIndex);
      try {
        return require(`@/assets/classImages/${seq}.jpg`);
      } catch {
        return 'https://via.placeholder.com/250x400';
      }
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

/* Tabs styling */
.equipment-tabs {
  width: 95%;
  /* 95% of the square's width */
  margin: 0 auto;
  /* Center horizontally */
  display: flex;
  background: #222;
  border: 2px solid #fff;
  border-bottom: none;
  /* Merge with the square */
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

.equipment-tabs .tab-button:hover {
  background-color: #e56717;
}

.equipment-tabs .tab-button.active {
  background-color: #e56717;
}

/* Big square container for all equipment slot buttons */
.equipment-square {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  /* Remove any top margin so it abuts the tabs */
  margin-top: 0;
  border: 2px solid #fff;
  box-sizing: border-box;
  border-radius: 4px;
}

/* Each half (left/right) takes half of the square */
.equipment-square .side {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Columns inside each side */
.equipment-square .column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Separate the two columns with some space */
.equipment-square .side.left {
  flex-direction: row;
}

.equipment-square .side.right {
  flex-direction: row;
}

.equipment-square .side.left .column,
.equipment-square .side.right .column {
  /* Replace center with flex-start */
  justify-content: flex-start;
  /* If you have an existing rule like this, update it accordingly */
}

/* New center area styling */
.equipment-square .center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

/* Ensure the image fits well within the center container */
.equipment-square .center img {
  width: 250px;
  height: 400px;
  object-fit: cover;
}

/* Equipment slot button styling */
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

.stats-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
  table-layout: fixed;  
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
  width: 20%;           /* shrink to 25% of table width */
  text-align: center;   /* center horizontally */
  vertical-align: middle; /* center vertically */
}

.set-usage {
  display: flex;
  flex-wrap: wrap;
  margin: 40px;
}

.set-usage h2 {
  flex-basis: 100%;
  margin-bottom: 16px;
  padding-bottom: 4px;
  border-bottom: 2px solid #e56717;
  color: #e56717;
}

/* Wrapper around each slot’s two tables */
.tables-pair {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}

/* Each table in the pair shares the available width */
.table-wrapper {
  flex: 1;
}

/* Reuse your existing .stats-table styles for consistent look */
.slot-by-slot {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.slot-section {
  padding: 0 20px;
  margin: 0 20px;
}

.slot-section h2 {
  margin-bottom: 16px;              
  padding-bottom: 4px;            
  border-bottom: 2px solid #e56717;
  color: #e56717;
}

/* Default: each slot takes the full row */
.slot-section.full-width .tables-pair {
  flex-direction: column;
  row-gap: 20px;
}

.slot-section.full-width .tables-pair .table-wrapper {
  width: 100%;
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
</style>
