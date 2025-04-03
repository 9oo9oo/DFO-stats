<!-- src/views/HomePage.vue -->
<template>
  <div class="home">
    <h1>Welcome to the DFO Stats Website</h1>
    <p>Click on a character to view their equipment stats:</p>
    <div class="character-buttons">
      <!-- Loop over each job mapping -->
      <div
        v-for="(mapping, jobId) in jobMappings"
        :key="jobId"
        class="job-group"
      >
        <h2>{{ mapping.jobName }}</h2>
        <div class="buttons">
          <!-- Loop over the final job grows for the job -->
          <router-link
            v-for="finalGrow in mapping.finalJobGrows"
            :key="finalGrow.jobGrowId"
            :to="{ name: 'EquipmentStats', params: { jobId: jobId, jobGrowId: finalGrow.jobGrowId } }"
          >
            <button>{{ finalGrow.jobGrowName }}</button>
          </router-link>
        </div>
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
      jobMappings
    };
  }
};
</script>

<style scoped>
.home {
  text-align: center;
  padding: 20px;
}
.character-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}
.job-group {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  width: 250px;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
}
.job-group h2 {
  margin-bottom: 10px;
  font-size: 1.2em;
}
.buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}
button:hover {
  background-color: #0056b3;
}
</style>
