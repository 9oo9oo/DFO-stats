<template>
    <span class="item-tooltip" @mouseenter="onEnter" @mouseleave="onLeave" ref="wrapper">
      <!-- Render the wrapped element (image or text) -->
      <slot />
  
      <!-- Tooltip popup -->
      <div v-if="visible" class="tooltip" :style="tooltipStyle">
        <div v-if="loading">Loading...</div>
        <div v-else>
          <h3>{{ info.itemName }}</h3>
          <!-- Show rarity and type detail -->
          <p><strong><span :style="{ color: rarityColor }">{{ info.itemRarity }}</span></strong></p>
          <p><strong>{{ info.itemTypeDetail }}</strong></p><br>
          <!-- List all status attributes -->
          <template v-for="status in info.itemStatus" :key="status.name">
            <p><strong>{{ status.name }}</strong> {{ status.value }}</p>
            </template><br>
          <!-- Formatted explanation -->
        <div v-html="formattedExplain" class="explanation"></div>
      </div>
    </div>
  </span>
</template>
  
  <script>
import axios from 'axios';
// Simple in-memory cache
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
            return {
                top: this.y + 'px',
                left: this.x + 'px'
            };
        },
        rarityColor() {
            switch (this.info.itemRarity) {
                case 'Rare': return '#b36bff';
                case 'Unique': return '#ff00ff';
                case 'Legendary': return '#ff7800';
                case 'Epic': return '#ffb400';
                case 'Primeval': return '#59dcc3';
                default: return '#000000';
            }
        },
        formattedExplain() {
            let raw = this.info.itemExplain || this.info.itemExplainDetail || 'No description available.';
            // Replace internal markup tokens with inline styled spans for highlighting
            raw = raw.replace(/<tst::up_color>/g, '<span style="color: #e56717; font-weight: bold;">')
                .replace(/<tst::default>/g, '</span>');
            // Split into paragraphs on double newlines
            const paras = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
            // Wrap each paragraph, converting single newlines to <br/>
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
                    const response = await axios.get(`/api/items/${this.id}`);
                    cache.set(this.id, response.data);
                    this.info = response.data;
                } catch (error) {
                    console.error('Failed to fetch item info in tooltip:', error);
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
.item-tooltip {
    position: relative;
    display: inline-block;
    cursor: help;
}

.tooltip {
    position: absolute;
    z-index: 1000;
    background: black;
    border: 1px solid #ccc;
    padding: 0.5em;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    white-space: normal;
    max-width: 300px;
    width: 300px;
    height: auto;
    max-height: calc(100vh - 20px);
    overflow: visible;
}

.tooltip h3 {
    margin: 0 0 0.5em;
    font-size: 1em;
    color: #e56717;
}

.tooltip p {
    margin: 0.25em 0;
    font-size: 0.875em;
    line-height: 1.4;
}

.highlight {
    font-weight: bold;
    color: #e56717;
}
</style>
  