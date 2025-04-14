// scripts/automationFetchSkills.js
import axios from 'axios';
import jobMappings from '../src/config/jobMappings.js';

// Set your testing server ID (update this to your valid server identifier)
const serverId = 'cain';

/**
 * Fetches skill data for a given job and jobGrow by calling your skill API.
 *
 * @param {string} jobId - The main job ID from jobMappings.
 * @param {string} jobGrowId - The job grow ID from the mapping.
 */
async function fetchSkillsForClass(jobId, jobGrowId) {
  try {
    const url = `http://localhost:3000/api/skill/fetch/${serverId}/${jobId}/${jobGrowId}`;
    console.log(`Calling: ${url}`);
    const response = await axios.get(url);
    console.log(`Success for jobId=${jobId}, jobGrowId=${jobGrowId}:`, response.data);
  } catch (error) {
    console.error(`Error for jobId=${jobId}, jobGrowId=${jobGrowId}:`, error.message);
  }
}

/**
 * Iterates over all job mappings and queues a fetch request for skill data for every jobGrow concurrently.
 */
async function runAutomation() {
  console.log('Starting skills automation process...');
  
  // Create an array to store all API call promises.
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
        allPromises.push(fetchSkillsForClass(jobId, jobGrow.jobGrowId));
      });
    }
  }

  // Execute all fetch requests concurrently.
  await Promise.all(allPromises);
  console.log('Skills automation process completed for all classes.');
}

// Run the automation script.
runAutomation();
