<template>
  <div class="home">
    <div class="home-text">
      <h1>DFO stats</h1>
      <p>Click on a class image to view their top equipment picks</p>
      <p>Updated daily with the latest stats</p>
    </div>

    <!-- Navigation buttons -->
    <div class="job-buttons">
      <button
        v-for="(mapping, jobId) in mappings"
        :key="jobId"
        class="job-button"
        @click="scrollToJobGroup(jobId)"
      >
        {{ mapping.jobName }}
      </button>
    </div>

    <!-- Character sections -->
    <div
      class="job-group"
      v-for="(mapping, jobId) in mappings"
      :key="jobId"
      :id="jobId"
    >
      <h2 class="job-name">{{ mapping.jobName }}</h2>
      <div class="job-images">
        <router-link
          v-for="(jobGrow, idx) in mapping.finalJobGrows"
          :key="jobGrow.jobGrowId"
          :to="{ name: 'EquipmentStats', params: { jobId, jobGrowId: jobGrow.jobGrowId } }"
        >
          <div class="img-container">
            <img
              :src="jobGrow.imgSrc ?? getImageSrc(jobId, idx)"
              :alt="jobGrow.jobGrowName"
              class="awakening-img"
            />
            <div class="img-overlay">{{ jobGrow.jobGrowName }}</div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { useRouter } from 'vue-router';
import jobMappings from '@/config/jobMappings';
import type { JobMapping } from '@/types/jobMappings';

// our config is already typed as Record<string,JobMapping>
const mappings: Record<string, JobMapping> = jobMappings;

// const router = useRouter();

/**
 * Returns the 1-based sequential index across all jobGrows
 */
function getSequentialIndex(currentJobId: string, currentLocalIndex: number): number {
  let count = 0;
  for (const [jobId, mapping] of Object.entries(mappings)) {
    if (jobId === currentJobId) {
      return count + currentLocalIndex + 1;
    }
    count += mapping.finalJobGrows.length;
  }
  return 0;
}

/**
 * Attempts to require a class image by its sequence index,
 * falling back to a placeholder if missing.
 */
function getImageSrc(jobId: string, localIndex: number): string {
  const seqIndex = getSequentialIndex(jobId, localIndex);
  try {
    // webpack / Vite require context
    return require(`@/assets/classImages/${seqIndex}.jpg`);
  } catch {
    return 'https://via.placeholder.com/100';
  }
}

/**
 * Smooth-scroll to the element whose id matches the jobId.
 */
function scrollToJobGroup(jobId: string): void {
  const target = document.getElementById(jobId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>

<style scoped>
/* Root layout */
.home {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  text-align: left;
}

/* Introductory header */
.home-text {
  padding: 20px;
  text-align: center;
}

/* Navigation buttons */
.job-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin: 30px auto;
  max-width: 1000px;
}

.job-button {
  background-color: transparent;
  border: 2px solid #fff;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  padding: 8px 12px;
  transition: background-color 0.2s;
}

.job-button:hover {
  background-color: #e56717;
}

/* Character section */
.job-group {
  margin-bottom: 40px;
}

.job-name {
  color: #e56717;
  font-size: 1.5rem;
  margin-bottom: 10px;
  text-align: left;
}

/* Image gallery */
.job-images {
  border-top: 2px solid #e56717;
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: flex-start;
  padding-top: 15px;
}

/* Image container with overlay */
.img-container {
  display: inline-block;
  position: relative;
}

.awakening-img {
  width: 280px;
  height: 240px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
  border-radius: 15px;
}

.awakening-img:hover {
  opacity: 0.5;
}

/* Overlay label on image */
.img-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 20px;
  padding: 5px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.img-container:hover .img-overlay {
  opacity: 1;
}
</style>
