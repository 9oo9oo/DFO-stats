<template>
  <div class="home">
    <h1>DFO class stats</h1>
    <p>Click on a character awakening to view their equipment stats:</p>
    <!-- Iterate over each job mapping -->
    <div class="job-group" v-for="(mapping, jobId) in jobMappings" :key="jobId">
      <!-- Display the job name above the images -->
      <h2 class="job-name">{{ mapping.jobName }}</h2>
      <div class="job-images">
        <!-- Iterate over each class (finalJobGrow) for the current mapping -->
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
    // currentJobId: the key for the current character mapping
    // currentLocalIndex: the index of the class in the finalJobGrows array (0-indexed)
    getSequentialIndex(currentJobId, currentLocalIndex) {
      let count = 0;
      // Iterate over job mappings in insertion order
      for (const [jobId, mapping] of Object.entries(this.jobMappings)) {
        if (jobId === currentJobId) {
          // Add the local index (+1 for 1-indexed image file naming)
          return count + currentLocalIndex + 1;
        }
        // Add the count for each character's classes
        count += mapping.finalJobGrows.length;
      }
      // Fallback value if not found (should not occur)
      return 0;
    },

    // Using the computed sequential index, build the image path
    getImageSrc(jobId, localIndex) {
      const seqIndex = this.getSequentialIndex(jobId, localIndex);
      try {
        // Dynamically require the image file based on the sequence index
        return require(`@/assets/classImages/${seqIndex}.jpg`);
      } catch (error) {
        // If the image isn't found, fallback to a placeholder image
        return 'https://via.placeholder.com/100';
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

.awakening-table {
  width: 100%;
  margin: 0 auto;
  border-collapse: collapse;
}

.awakening-table th,
.awakening-table td {
  border: 1px solid #ddd;
  padding: 10px;
}

.class-name {
  font-weight: bold;
  background-color: #e0e0e0;
}

/* Image styling for clickable images */
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
