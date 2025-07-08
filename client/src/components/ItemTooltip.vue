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
  
<script setup lang="ts">
import { ref, reactive, computed, defineProps } from 'vue';
import axios from 'axios';

// ——— Types —————————————————————————————————————————————

interface Status {
  name: string;
  value: string;
}

interface FusionOption {
  explain: string;
}

interface ItemInfo {
  itemName: string;
  itemRarity: string;
  itemTypeDetail?: string;
  slots?: { slotName: string }[];
  fusionOption?: { options: FusionOption[] };
  itemStatus: Status[];
  itemExplain: string;
  [key: string]: any;
}

// ——— Props —————————————————————————————————————————————

const props = defineProps<{ id: string }>();

// ——— Reactive State —————————————————————————————————————

const visible = ref(false);
const loading = ref(false);
const info = reactive<Partial<ItemInfo>>({});
const x = ref(0);
const y = ref(0);

// Template ref for tooltip wrapper
const wrapper = ref<HTMLElement | null>(null);

// ——— Computed —————————————————————————————————————————————

const tooltipStyle = computed(() => ({
  top: `${y.value}px`,
  left: `${x.value}px`
}));

const rarityColor = computed(() => {
  switch (info.itemRarity) {
    case 'Rare':      return '#b36bff';
    case 'Unique':    return '#ff00ff';
    case 'Legendary': return '#ff7800';
    case 'Epic':      return '#ffb400';
    case 'Primeval':  return '#59dcc3';
    default:          return '#000';
  }
});

const displayTypeDetail = computed(() => {
  if (info.fusionOption && info.slots?.length) {
    return info.slots[0].slotName;
  }
  return info.itemTypeDetail ?? '';
});

const explainHtml = computed(() => {
  const fusion = info.fusionOption?.options;
  if (fusion?.length) {
    return fusion
      .map(opt => `<p>${opt.explain.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }
  let raw = info.itemExplain ?? '';
  raw = raw
    .replace(/<tst::up_color>/g, '<span style="color: #e56717; font-weight: bold;">')
    .replace(/<tst::default>/g, '</span>');
  const paras = raw.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return paras.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
});

// ——— Cache —————————————————————————————————————————————

const cache = new Map<string, ItemInfo>();

// ——— Methods —————————————————————————————————————————————

async function onEnter(): Promise<void> {
  visible.value = true;
  const rect = wrapper.value?.getBoundingClientRect();
  if (rect) {
    x.value = rect.width + 8;
    y.value = 0;
  }

  if (cache.has(props.id)) {
    Object.assign(info, cache.get(props.id)!);
  } else {
    loading.value = true;
    try {
      const { data } = await axios.get<ItemInfo>(`/api/items/${props.id}`);
      cache.set(props.id, data);
      Object.assign(info, data);
    } catch (e) {
      console.error('Tooltip fetch error:', e);
    } finally {
      loading.value = false;
    }
  }
}

function onLeave(): void {
  visible.value = false;
}
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
  