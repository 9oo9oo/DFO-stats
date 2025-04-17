<template>
      <h1>Avatar Statistics for {{ jobFriendlyName }}</h1>
  <div class="equipment-wrapper">
    <!-- Top Tabs -->
    <div class="equipment-tabs">
      <router-link
        :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId } }"
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

    <!-- Square container: left image, right buttons -->
    <div class="equipment-square">
      <!-- Left side: Awakening image -->
      <div class="side left">
        <img
          :src="centerImgSrc"
          :alt="jobFriendlyName"
          class="awakening-img"
        />
      </div>
      <!-- Right side: Slot buttons grid -->
      <div class="side right">
        <div class="avatar-buttons-grid">
          <div
            v-for="slot in slotButtons"
            :key="slot"
            class="slot-button"
            @click="scrollToSlot(slot)"
          >
            {{ convertSlotName(slot) }}
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Avatar stats sections placed outside of the square -->
    <div class="avatar-stats">
      <div v-if="jobGrowId">
        <div v-if="loading">Loading avatar stats...</div>
        <div v-if="error">Error: {{ error }}</div>
        <div v-if="stats">
          <!-- Avatar Equipment Items Section -->
          <section class="stat-section">
            <h2>Avatar</h2>
            <div class="tables-container">
              <div
                v-for="slot in orderedSlots"
                :key="slot"
                :id="slot"
                :class="{
                  slot: true,
                  'half-width': slot === 'WEAPON' || slot === 'AURORA',
                  'third-width': slot !== 'WEAPON' && slot !== 'AURORA'
                }"
              >
                <h3>{{ convertSlotName(slot) }}</h3>
                <table class="stats-table">
                  <thead>
                    <tr v-if="slot === 'WEAPON' || slot === 'AURORA'">
                      <th>Item Name</th>
                      <th>Usage Rate</th>
                    </tr>
                    <tr v-else>
                      <th>Option</th>
                      <th>Usage Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in stats.avatarStatsBySlot[slot]"
                      :key="item.item_id"
                    >
                      <template v-if="slot === 'WEAPON' || slot === 'AURORA'">
                        <td>{{ item.item_name }}</td>
                        <td>{{ item.usage_count }}</td>
                      </template>
                      <template v-else>
                        <td>{{ item.option_ability || '-' }}</td>
                        <td>{{ item.usage_count }}</td>
                      </template>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Emblem Statistics Section -->
          <section class="stat-section">
            <h2>Emblem</h2>
            <div class="tables-container emblem-container">
              <div
                v-for="color in orderedEmblemColors"
                :key="color"
                class="slot"
              >
                <h3>{{ capitalize(color) }}</h3>
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Usage Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="emblem in stats.emblemStatsByColor[color] || []"
                      :key="emblem.item_name"
                    >
                      <td>{{ emblem.item_name }}</td>
                      <td>{{ emblem.usage_count }}</td>
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
  name: 'AvatarStats',
  data() {
    return {
      stats: null,
      loading: false,
      error: null,
      slotButtons: [
        'WEAPON',
        'HAIR',
        'HEADGEAR',
        'FACE',
        'AURORA',
        'BREAST',
        'JACKET',
        'SKIN',
        'WAIST',
        'PANTS',
        'SHOES'
      ],
      orderedSlots: [
        'WEAPON', 'AURORA', 'HAIR', 'HEADGEAR', 'FACE',
        'BREAST', 'JACKET', 'SKIN', 'WAIST', 'PANTS', 'SHOES'
      ],
      orderedEmblemColors: [
        'platinum', 'multicolored', 'blue', 'yellow', 'green', 'red'
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
      const grow = Array.isArray(this.jobMapping.finalJobGrows)
        ? this.jobMapping.finalJobGrows.find(
          g => g.jobGrowId === this.jobGrowId
        )
        : null;
      return grow?.jobGrowName || this.jobMapping.jobName || 'Unknown Job';
    },
    centerImgSrc() {
      const grows = this.jobMapping.finalJobGrows || [];
      const idx = grows.findIndex(g => g.jobGrowId === this.jobGrowId);
      if (idx !== -1) {
        // if mapping already has an imgSrc, use it; otherwise build via require
        return grows[idx].imgSrc || this.getImageSrc(this.jobId, idx);
      }
      return ''; // fallback
    },
    emblemStatsByColor() {
      const groups = {};
      this.stats?.emblemStats?.forEach(e => {
        const c = e.slot_color.toLowerCase();
        groups[c] = groups[c] || [];
        groups[c].push(e);
      });
      return groups;
    }
  },
  mounted() {
    if (this.jobGrowId) this.fetchAvatarStats();
  },
  watch: {
    '$route.params.jobGrowId'(n, o) {
      if (n !== o) this.fetchAvatarStats();
    }
  },
  methods: {
    isActiveRoute(name) {
      return this.$route.name === name;
    },
    async fetchAvatarStats() {
      if (!this.jobGrowId) return;
      this.loading = true;
      try {
        const { data } = await axios.get(
          `/api/avatar/stats/${this.jobId}/${this.jobGrowId}`
        );
        this.stats = data;
      } catch (e) {
        this.error = e.response?.data?.error || e.message;
      } finally {
        this.loading = false;
      }
    },
    capitalize(s) {
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    },
    convertSlotName(slot) {
      const mappings = {
        WEAPON: 'Weapon',
        AURORA: 'Aura',
        HEADGEAR: 'Hat',
        HAIR: 'Hair',
        FACE: 'Face',
        BREAST: 'Torso',
        JACKET: 'Top',
        PANTS: 'Bottom',
        WAIST: 'Waist',
        SHOES: 'Shoes',
        SKIN: 'Skin'
      };
      return mappings[slot] || slot;
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
    },
    scrollToSlot(slot) {
      const el = document.getElementById(slot)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
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

/* Square container styles */
.equipment-square {
  display: flex;
  align-items: center;
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

.equipment-square .side.left img {
  width: 250px;
  height: 400px;
  object-fit: cover;
}

.avatar-stats {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.stat-section {
  margin-bottom: 40px;
}

.tables-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.tables-container .slot {
  padding: 10px;
  border-radius: 4px;
}

.tables-container h3 {
  color: #e56717;
}

.emblem-container .slot {
  flex: 0 0 calc(33.33% - 20px);
}

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

.half-width {
  flex: 0 0 calc(50% - 20px);
}

.third-width {
  flex: 0 0 calc(33.33% - 20px);
}

.avatar-buttons-grid {
  display: grid;
  grid-template-columns: repeat(4, 100px);
  grid-auto-rows: 100px;
  gap: 10px;
  justify-content: center;
  align-content: center;
}

.avatar-buttons-grid .slot-button:nth-child(9) {
  grid-column-start: 2;
}

/* Retain .slot-button styles from EquipmentStats.vue */
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
</style>
