// scripts/automationFetchAvatar.js
import axios from 'axios';
import jobMappings from '../src/config/jobMappings.js';

// Set your testing server ID (update this to your valid server identifier)
const serverId = 'cain';

/**
 * Fetches avatar data for a given job and jobGrow by calling your avatar API.
 *
 * @param {string} jobId - The job ID from jobMappings.
 * @param {string} jobGrowId - The job grow ID from the mapping.
 */
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

/**
 * Iterates over all job mappings and queues a fetch request for avatar data for every jobGrow concurrently.
 */
async function runAutomation() {
  console.log('Starting avatar automation process...');
  const allPromises = [];

  // Loop through each job in the mapping.
  for (const jobId in jobMappings) {
    if (Object.prototype.hasOwnProperty.call(jobMappings, jobId)) {
      const mapping = jobMappings[jobId];
      console.log(`Processing Job: ${mapping.jobName} (ID: ${jobId})`);

      // Queue the API call for each job grow.
      mapping.finalJobGrows.forEach(jobGrow => {
        console.log(
          `  -> Queuing fetch for Job Grow: ${jobGrow.jobGrowName} (ID: ${jobGrow.jobGrowId})`
        );
        allPromises.push(fetchAvatarForClass(jobId, jobGrow.jobGrowId));
      });
    }
  }

  // Execute all fetch requests concurrently.
  await Promise.all(allPromises);
  console.log('Avatar automation process complete.');
}

// Execute the automation script.
runAutomation();
