<template>
  <h1>Avatar Statistics for {{ jobFriendlyName }}</h1>
  <div class="equipment-wrapper">
    <!-- Navigation Tabs -->
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

    <!-- Avatar Layout -->
    <div class="equipment-square">
      <div class="side left">
        <img :src="centerImgSrc" :alt="jobFriendlyName" class="awakening-img" />
      </div>
      <div class="side right">
        <div class="avatar-buttons-grid">
          <div
            v-for="slot in slotButtons"
            :key="slot"
            class="slot-button"
            @click="scrollToSlot(slot)"
            :style="{ border: `1px solid ${slotFontColors[slot] || '#666'}` }"
          >
            {{ convertSlotName(slot) }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="avatar-stats">
    <div v-if="jobGrowId">
      <!-- Loading & error states -->
      <div v-if="loading">Loading avatar stats...</div>
      <div v-if="error">Error: {{ error }}</div>
      <div v-if="stats">

        <!-- Weapon & Aura -->
        <div class="weapon-aura-grid">
          <section ref="WEAPON" class="slot-section">
            <div class="slot-table-block">
            <h2>{{ convertSlotName('WEAPON') }}</h2>
            <table class="stats-table">
              <thead><tr><th>Item</th><th>Usage</th></tr></thead>
              <tbody>
                <tr v-for="it in (stats.avatarStatsBySlot['WEAPON'] || []).slice(0, 5)" :key="it.item_id">
                  <td class="item-cell">
                    <div class="icon-and-name">
                      <ItemTooltip :id="it.item_id" :name="it.item_name">
                        <img
                          :src="getItemImageUrl(it.item_id)"
                          :alt="it.item_name"
                          class="item-icon"
                          @error="hideBrokenIcon"
                        />
                      </ItemTooltip>
                      <span class="item-name">{{ it.item_name }}</span>
                    </div>
                  </td>
                  <td>{{ it.usage_count }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          </section>

          <section ref="AURORA" class="slot-section">
            <div class="slot-table-block">
            <h2>{{ convertSlotName('AURORA') }}</h2>
            <table class="stats-table">
              <thead><tr><th>Item</th><th>Usage</th></tr></thead>
              <tbody>
                <tr v-for="it in (stats.avatarStatsBySlot['AURORA'] || []).slice(0, 5)" :key="it.item_id">
                  <td class="item-cell">
                    <div class="icon-and-name">
                      <ItemTooltip :id="it.item_id" :name="it.item_name">
                        <img
                          :src="getItemImageUrl(it.item_id)"
                          :alt="it.item_name"
                          class="item-icon"
                          @error="hideBrokenIcon"
                        />
                      </ItemTooltip>
                      <span class="item-name">{{ it.item_name }}</span>
                    </div>
                  </td>
                  <td>{{ it.usage_count }}%</td>
                </tr>
              </tbody>
            </table>
            </div>
          </section>
        </div>

        <!-- Grouped by emblem socket color -->
        <section
          v-for="group in equipGroups"
          :key="group.color"
          :ref="`group-${group.color}`"
          :class="`group-${group.color}`"
        >
          <h2>{{ group.name }} Emblem Socketed Avatars </h2>
          <div class="group-grid">
            <!-- Avatar tables -->
            <div class="avatar-tables">
              <div
                v-for="slot in group.slots"
                :key="slot"
                :ref="slot"
                class="slot-table-block"
              >
                <h3>{{ convertSlotName(slot) }}</h3>
                <table class="stats-table">
                  <thead>
                    <tr v-if="slot === 'WEAPON' || slot === 'AURORA'">
                      <th>Item</th><th>Usage</th>
                    </tr>
                    <tr v-else>
                      <th>Option</th><th>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in (stats.avatarStatsBySlot[slot] || []).slice(0, 3)" :key="item.item_id">
                        <template v-if="slot === 'WEAPON' || slot === 'AURORA'">
                        <td class="item-cell">
                          <div class="icon-and-name">
                            <ItemTooltip :id="item.item_id" :name="item.item_name">
                              <img
                                :src="getItemImageUrl(item.item_id)"
                                :alt="item.item_name"
                                class="item-icon"
                                loading="lazy"
                                @error="hideBrokenIcon"
                              />
                            </ItemTooltip>
                            <span class="item-name">{{ item.item_name }}</span>
                          </div>
                        </td>
                        <td>{{ item.usage_count }}%</td>
                      </template>
                      <template v-else>
                        <td>{{ item.option_ability || '-' }}</td>
                        <td>{{ item.usage_count }}%</td>
                      </template>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Emblem tables -->
            <div class="emblem-tables">
              <div
                v-for="emColor in group.emblemColors"
                :key="emColor"
                class="emblem-table-block"
              >
                <h3>{{ capitalize(emColor) }} Emblems</h3>
                <table class="stats-table">
                  <thead>
                    <tr><th>Item</th><th>Usage</th></tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="em in (stats.emblemStatsByColor[emColor] || []).slice(0, 5)"
                      :key="em.item_id"
                    >
                    <td class="item-cell">
                      <div class="icon-and-name">
                        <ItemTooltip :id="em.item_id">
                          <img
                            :src="getItemImageUrl(em.item_id)"
                            :alt="em.item_name"
                            class="item-icon"
                            loading="lazy"
                            @error="hideBrokenIcon"
                          />
                        </ItemTooltip>
                        <span class="item-name">{{ em.item_name }}</span>
                      </div>
                    </td>
                        <td>
                        {{ formatRate(
                          em.usage_count,
                          emColor === 'multicolored' ? 6 : 4
                        ) }}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
import ItemTooltip from '@/components/ItemTooltip.vue';
import MissingIcon from '@/assets/missingicon.png';

export default {
  name: 'AvatarStats',
  components: { ItemTooltip },

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
      ],
      equipGroups: [
        { color: 'red', name: 'Red', slots: ['HEADGEAR', 'HAIR'], emblemColors: ['red'] },
        { color: 'yellow', name: 'Yellow', slots: ['FACE', 'BREAST'], emblemColors: ['yellow'] },
        { color: 'green', name: 'Green & Platinum', slots: ['JACKET', 'PANTS'], emblemColors: ['green', 'platinum'] },
        { color: 'blue', name: 'Blue', slots: ['WAIST', 'SHOES'], emblemColors: ['blue'] },
        { color: 'multicolor', name: 'Multicolor', slots: ['SKIN'], emblemColors: ['multicolored'] }
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
        return grows[idx].imgSrc || this.getImageSrc(this.jobId, idx);
      }
      return '';
    },
    slotFontColors() {
      return {
        HEADGEAR: '#c0392b',  // “Hat”
        HAIR: '#c0392b',
        FACE: '#f5c32c',
        BREAST: '#f5c32c', // “Torso”
        JACKET: '#3cb043',  // “Top”
        PANTS: '#3cb043',  // “Bottom”
        WAIST: '#4a90e2',
        SHOES: '#4a90e2'
      };
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
      let el = this.$refs[slot];
      if (Array.isArray(el)) el = el[0];
      if (!el) return;
      const top = window.pageYOffset + el.getBoundingClientRect().top - 20;
      window.scrollTo({ top, behavior: 'smooth' });
      new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.classList.add('flash');
            setTimeout(() => el.classList.remove('flash'), 1500);
            obs.disconnect();
          }
        });
      }, { threshold: 0.5 }).observe(el);
    },

    formatRate(value, divisor) {
      return (value / divisor).toFixed(2);
    },

    getItemImageUrl(itemId) {
      return `https://img-api.dfoneople.com/df/items/${itemId}`;
    },

    hideBrokenIcon(event) {
      const img = event.target;
      img.onerror = null;
      img.src = MissingIcon;
      img.style.width = '40px';
    }
  }
};
</script>

<style scoped>
/* Wrapper */
.equipment-wrapper {
  width: 700px;
  margin: 0 auto 40px;
  padding-top: 20px;
  position: relative;
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
  overflow: visible;
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
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: 2px solid #fff;
  border-radius: 4px;
  margin-top: 0;
  padding: 10px;
  box-sizing: border-box;
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

/* Avatar Stats */
.avatar-stats {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* Stat Sections */
.stat-section {
  margin: 40px;
}

/* Tables Container */
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

/* Stats Table */
.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  vertical-align: middle;
}

.stats-table th {
  background-color: #f2f2f2;
  color: #e56717;
}

.stats-table th:nth-child(2),
.stats-table td:nth-child(2) {
  width: 20%;
  text-align: center;
  vertical-align: middle;
}

/* Width Utilities */
.half-width {
  flex: 0 0 calc(50% - 20px);
}

.third-width {
  flex: 0 0 calc(33.33% - 20px);
}

/* Avatar Buttons Grid */
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

/* Slot Button */
.slot-button {
  width: 100px;
  height: 100px;
  margin: 5px;
  background-color: #222;
  border: 1px solid;
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

/* Weapon Aura Grid */
.weapon-aura-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-bottom: 40px;
}

.weapon-aura-grid h2 {
  color: #e56717;
  padding-bottom: 4px;
  border-bottom: 3px solid #e56717;
  margin-bottom: 16px;
}

section[class^="group-"] h2 {
  padding-bottom: 4px;
  border-bottom: 3px solid currentColor;
}

/* Group Grid */
.group-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px 60px;
  margin-bottom: 40px;
}

/* Group Colors */
.group-red h2 {
  color: #c0392b;
}

.group-yellow h2 {
  color: #f5c32c;
}

.group-green h2 {
  color: #3cb043;
}

.group-blue h2 {
  color: #4a90e2;
}

/* Block Sections */
.slot-table-block,
.emblem-table-block {
  padding: 0 10px 10px;
  border-radius: 8px;
  overflow: visible;
  box-sizing: border-box;
}

.slot-table-block h3,
.emblem-table-block h3 {
  padding: 10px 0;
  color: #e56717;
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

/* Icon & Name */
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