// scripts/automationFetchCreature.js
import axios from 'axios';
import jobMappings from '../src/config/jobMappings.js';

// Set your server ID (update this as needed, for example "cain")
const serverId = 'cain';

/**
 * Fetch creature data for a given job and jobGrow by calling your creature endpoint.
 *
 * @param {string} jobId - The job ID from the mapping.
 * @param {string} jobGrowId - The job grow ID from the mapping.
 */
async function fetchCreatureForClass(jobId, jobGrowId) {
  try {
    const url = `http://localhost:3000/api/creature/fetch/${serverId}/${jobId}/${jobGrowId}`;
    console.log(`Calling: ${url}`);
    const response = await axios.get(url);
    console.log(
      `Success for jobId=${jobId}, jobGrowId=${jobGrowId}:`,
      response.data
    );
  } catch (error) {
    console.error(
      `Error for jobId=${jobId}, jobGrowId=${jobGrowId}:`,
      error.message
    );
  }
}

/**
 * Iterates over all job mappings and queues creature-fetch requests for every job grow concurrently.
 */
async function runAutomation() {
  console.log('Starting creature automation process...');

  // Accumulate all fetch promises.
  const allPromises = [];

  for (const jobId in jobMappings) {
    if (Object.prototype.hasOwnProperty.call(jobMappings, jobId)) {
      const mapping = jobMappings[jobId];
      console.log(`Processing Job: ${mapping.jobName} (ID: ${jobId})`);

      // Create a promise for each job grow.
      const jobGrowPromises = mapping.finalJobGrows.map((jobGrow) => {
        console.log(
          `  -> Queuing creature fetch for Job Grow: ${jobGrow.jobGrowName} (ID: ${jobGrow.jobGrowId})`
        );
        return fetchCreatureForClass(jobId, jobGrow.jobGrowId);
      });

      // Add the promises for this job to the array.
      allPromises.push(...jobGrowPromises);
    }
  }

  // Run all fetch requests concurrently.
  await Promise.all(allPromises);
  console.log('Creature automation process complete.');
}

// Execute the automation script.
runAutomation();
