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
  <div class="img-container">
    <img
      :src="jobGrow.imgSrc || getImageSrc(jobId, localIndex)"
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
  text-align: left;
  padding: 20px;
  max-width: 1600px;          /* Optional: limits overall page width */
  margin: 0 auto; 
}

.img-container {
  position: relative;
  display: inline-block;
}

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

/* Styling for the navigation buttons */
.job-buttons {
  display: grid;
  /* This sets three columns. Change the number here to adjust your layout 
     (e.g., repeat(2, 1fr) for two columns or repeat(auto-fit, minmax(150px, 1fr)) for flexible columns). */
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 30px;
  margin-bottom: 30px;
  max-width: 1000px;
  /* Optional: limits the width and helps center the grid */
  margin-left: auto;
  margin-right: auto;
}

.job-button {
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
  background-color: transparent;
  color: #fff;
  border: 2px solid white;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.job-button:hover {
  background-color: #e56717;
}

/* Each job group (character section) */
.job-group {
  margin-bottom: 40px;
  text-align: left;
}

/* Job name header style */
.job-name {
  font-size: 1.5rem;
  margin-bottom: 10px;
  text-align: left;
}

/* Container for class images */
.job-images {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 10px;
}

/* Style for clickable images */
.awakening-img {
  width: 300px;
  height: 250px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 10px;
}

.awakening-img:hover {
  opacity: 0.5;
}
</style>
