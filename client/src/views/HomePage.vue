<template>
  <div class="home">
    <h1>DFO Class Stats</h1>
    <p>Click on a character awakening to view their equipment stats:</p>
    <!-- Buttons at the top to navigate to each character section -->
    <div class="job-buttons">
      <button
        v-for="(mapping, jobId) in jobMappings"
        :key="jobId"
        class="job-button"
        @click="scrollToJobGroup(jobId)"
      >
        {{ mapping.jobName }}
      </button>
    </div>
    <!-- Render each job group (character section) with a unique id -->
    <div
      class="job-group"
      v-for="(mapping, jobId) in jobMappings"
      :key="jobId"
      :id="jobId"
    >
      <h2 class="job-name">{{ mapping.jobName }}</h2>
      <div class="job-images">
        <router-link
          v-for="(jobGrow, localIndex) in mapping.finalJobGrows"
          :key="jobGrow.jobGrowId"
          :to="{ 
              name: 'EquipmentStats', 
              params: { jobId: jobId, jobGrowId: jobGrow.jobGrowId }
          }"
        >
          <img
            :src="jobGrow.imgSrc || getImageSrc(jobId, localIndex)"
            :alt="jobGrow.jobGrowName"
            class="awakening-img"
          />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import jobMappings from '@/config/jobMappings.js';

export default {
  name: "HomePage",
  data() {
    return {
      jobMappings,
    };
  },
  methods: {
    // Compute a global sequential index for each class image
    // currentJobId: key for the current character mapping
    // currentLocalIndex: the index within mapping.finalJobGrows (0-indexed)
    getSequentialIndex(currentJobId, currentLocalIndex) {
      let count = 0;
      for (const [jobId, mapping] of Object.entries(this.jobMappings)) {
        if (jobId === currentJobId) {
          return count + currentLocalIndex + 1;
        }
        count += mapping.finalJobGrows.length;
      }
      return 0; // Fallback (should not occur)
    },

    // Build the dynamic image path based on the sequential index.
    getImageSrc(jobId, localIndex) {
      const seqIndex = this.getSequentialIndex(jobId, localIndex);
      try {
        return require(`@/assets/classImages/${seqIndex}.jpg`);
      } catch (error) {
        return 'https://via.placeholder.com/100';
      }
    },

    // Scroll smoothly to the job group identified by jobId.
    scrollToJobGroup(jobId) {
      const target = document.getElementById(jobId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  },
};
</script>

<style scoped>
.home {
  text-align: center;
  padding: 20px;
}

/* Styling for the navigation buttons */
.job-buttons {
  display: flex;
  flex-wrap: wrap; 
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.job-button {
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  background-color: #007acc;
  color: #fff;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.job-button:hover {
  background-color: #005fa3;
}

/* Each job group (character section) */
.job-group {
  margin-bottom: 40px;
}

/* Job name header style */
.job-name {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

/* Container for class images */
.job-images {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* Style for clickable images */
.awakening-img {
  width: 200px;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 10px;
}

.awakening-img:hover {
  opacity: 0.5;
}
</style>
