// scripts/automationFetchAvatar.js
import axios from 'axios';
import jobMappings from '../src/config/jobMappings.js';
const serverId = 'cain';

// Fetches avatar data for a given job and jobGrow by calling your avatar API.
async function fetchAvatarForClass(jobId, jobGrowId) {
  try {
    const url = `http://localhost:3000/api/avatar/fetch/${serverId}/${jobId}/${jobGrowId}`;
    console.log(`Calling: ${url}`);
    const response = await axios.get(url);
    console.log(`Success for jobId=${jobId}, jobGrowId=${jobGrowId}:`, response.data);
  } catch (error) {
    console.error(`Error for jobId=${jobId}, jobGrowId=${jobGrowId}:`, error.message);
  }
}

// Iterates over all job mappings and queues a fetch request for avatar data for every jobGrow concurrently.
async function runAutomation() {
  console.log('Starting avatar automation process...');
  const allPromises = [];

  // Loop through each job in the mapping.
  for (const jobId in jobMappings) {
    if (Object.prototype.hasOwnProperty.call(jobMappings, jobId)) {
      const mapping = jobMappings[jobId];
      console.log(`Processing Character: ${mapping.jobName}`);

      // Queue the API call for each job grow.
      mapping.finalJobGrows.forEach(jobGrow => {
        console.log(`-> Queuing fetch for ${jobGrow.jobGrowName}`);
        allPromises.push(fetchAvatarForClass(jobId, jobGrow.jobGrowId));
      });
    }
  }

  // Execute all fetch requests concurrently.
  await Promise.all(allPromises);
  console.log('Avatar data retrieved for all class.');
}

// Execute the automation script.
runAutomation();
