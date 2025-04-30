<template>
    <span class="item-tooltip" @mouseenter="onEnter" @mouseleave="onLeave" ref="wrapper">
      <slot />
      <div v-if="visible" class="tooltip" :style="tooltipStyle">
        <div v-if="loading">Loading...</div>
        <div v-else>
          <h3>{{ info.itemName }}</h3><br />
          <p>
            <strong><span :style="{ color: rarityColor, }">{{ info.itemRarity }}</span></strong>
          </p>
          <p><strong>{{ displayTypeDetail }}</strong></p><br />
          <template v-for="status in info.itemStatus" :key="status.name">
            <p><strong>{{ status.name }}</strong> {{ status.value }}</p>
          </template>
          <!-- Explanation or Fusion Options -->
          <template v-if="explainHtml">
            <br />
            <div v-html="explainHtml" class="explanation"></div>
            </template>
        </div>
      </div>
    </span>
  </template>
  
  <script>
import axios from 'axios';
const cache = new Map();

export default {
    name: 'ItemTooltip',
    props: {
        id: { type: String, required: true }
    },
    data() {
        return {
            visible: false,
            loading: false,
            info: {},
            x: 0,
            y: 0
        };
    },
    computed: {
        tooltipStyle() {
            return { top: this.y + 'px', left: this.x + 'px' };
        },
        rarityColor() {
            switch (this.info.itemRarity) {
                case 'Rare': return '#b36bff';
                case 'Unique': return '#ff00ff';
                case 'Legendary': return '#ff7800';
                case 'Epic': return '#ffb400';
                case 'Primeval': return '#59dcc3';
                default: return '#000';
            }
        },
        displayTypeDetail() {
            if (this.info.fusionOption && this.info.slots && this.info.slots.length) {
                return this.info.slots[0].slotName;
            }
            return this.info.itemTypeDetail || '';
        },
        explainHtml() {
            // Handle fusion items with fusionOption
            const fusion = this.info.fusionOption && this.info.fusionOption.options;
            if (fusion && fusion.length) {
                return fusion
                    .map(opt => `<p>${opt.explain.replace(/\n/g, '<br/>')}</p>`)
                    .join('');
            }
            // Otherwise, normal item explanation
            let raw = this.info.itemExplain;
            raw = raw
                .replace(/<tst::up_color>/g, '<span style="color: #e56717; font-weight: bold;">')
                .replace(/<tst::default>/g, '</span>');
            const paras = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
            return paras.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
        }
    },
    methods: {
        async onEnter() {
            this.visible = true;
            const rect = this.$refs.wrapper.getBoundingClientRect();
            this.x = rect.width + 8;
            this.y = 0;
            if (cache.has(this.id)) {
                this.info = cache.get(this.id);
            } else {
                this.loading = true;
                try {
                    const res = await axios.get(`/api/items/${this.id}`);
                    cache.set(this.id, res.data);
                    this.info = res.data;
                } catch (e) {
                    console.error('Tooltip fetch error:', e);
                } finally {
                    this.loading = false;
                }
            }
        },
        onLeave() {
            this.visible = false;
        }
    }
};
</script>
  
<style scoped>
/* Tooltip */
.item-tooltip {
    display: inline-block;
    position: relative;
    cursor: help;
}

.tooltip {
    position: absolute;
    z-index: 1000;
    width: 300px;
    max-width: 300px;
    max-height: calc(100vh - 20px);
    background: #000;
    border: 1px solid #ccc;
    padding: 0.5em;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    overflow: auto;
}

.tooltip h3 {
    font-size: 1em;
    color: #e56717;
    text-align: left;
}

.tooltip p,
.explanation {
    font-size: 0.875em;
    line-height: 1.5;
    text-align: left;
}

.tooltip p strong {
    font-weight: bold;
}
</style>
  