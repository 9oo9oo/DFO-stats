<!-- src/views/HomePage.vue -->
<template>
  <div class="home">
    <h1>Welcome to the DFO Stats Website</h1>
    <p>Click on a character awakening to view their equipment stats:</p>
    <table class="awakening-table">
      <tbody>
        <!-- For each job mapping (class) create a row -->
        <tr v-for="(mapping, jobId) in jobMappings" :key="jobId">
          <td class="class-name">{{ mapping.jobName }}</td>
          <!-- For each character awakening available (assuming max 5 per class) -->
          <td v-for="characterIndex in 5" :key="characterIndex">
            <router-link
              v-if="mapping.finalJobGrows[characterIndex - 1]"
              :to="{ 
                name: 'EquipmentStats', 
                params: { 
                  jobId: jobId, 
                  jobGrowId: mapping.finalJobGrows[characterIndex - 1].jobGrowId 
                } 
              }"
            >
              <img
                :src="mapping.finalJobGrows[characterIndex - 1].imgSrc || 'https://via.placeholder.com/100'"
                :alt="mapping.finalJobGrows[characterIndex - 1].jobGrowName"
                class="awakening-img"
              />
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>
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
  width: 100px;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.awakening-img:hover {
  opacity: 0.8;
}
</style>
