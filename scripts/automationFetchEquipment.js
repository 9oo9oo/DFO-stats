// scripts/automationFetchEquipment.js
import axios from 'axios';
import jobMappings from '../src/config/jobMappings.js';
const serverId = 'cain';

// Fetch equipment data for a given job and jobGrow by calling your equipment endpoint
async function fetchEquipmentForClass(jobId, jobGrowId) {
  try {
    const url = `http://localhost:3000/api/equipment/fetch/${serverId}/${jobId}/${jobGrowId}`;
    console.log(`Calling: ${url}`);
    const response = await axios.get(url);
    console.log(`Success for jobId=${jobId}, jobGrowId=${jobGrowId}:`, response.data);
  } catch (error) {
    console.error(`Error for jobId=${jobId}, jobGrowId=${jobGrowId}:`, error.message);
  }
}

// Iterates over all job mappings and queues equipment-fetch requests for every job grow concurrently
async function runAutomation() {
  console.log('Starting equipment automation process...');

  // Accumulate all fetch promises.
  const allPromises = [];

  for (const jobId in jobMappings) {
    if (Object.prototype.hasOwnProperty.call(jobMappings, jobId)) {
      const mapping = jobMappings[jobId];
      console.log(`Processing Character: ${mapping.jobName}`);
      
      // Create fetch promise for each job grow variant.
      const jobGrowPromises = mapping.finalJobGrows.map((jobGrow) => {
        console.log(`-> Queuing fetch for ${jobGrow.jobGrowName}`);
        return fetchEquipmentForClass(jobId, jobGrow.jobGrowId);
      });
      
      // Add the job grow promises to the overall array.
      allPromises.push(...jobGrowPromises);
    }
  }

  // Wait for all equipment fetch requests to complete concurrently.
  await Promise.all(allPromises);
  console.log('Equipment data retrieved for all class.');
}

// Run the automation script.
runAutomation();
