// scripts/automationFetchEquipment.js
import axios from 'axios';
import jobMappings from '../src/config/jobMappings.js';

// Update this with your valid server identifier, e.g., "cain"
const serverId = 'cain';

/**
 * Fetch equipment data for a given job and jobGrow by calling your equipment endpoint.
 *
 * @param {string} jobId - The job ID from the mapping.
 * @param {string} jobGrowId - The job grow ID from the mapping.
 */
async function fetchEquipmentForClass(jobId, jobGrowId) {
  try {
    const url = `http://localhost:3000/api/equipment/fetch/${serverId}/${jobId}/${jobGrowId}`;
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
 * Iterates over all job mappings and queues equipment-fetch requests for every job grow concurrently.
 */
async function runAutomation() {
  console.log('Starting equipment automation process...');

  // Accumulate all fetch promises.
  const allPromises = [];

  for (const jobId in jobMappings) {
    if (Object.prototype.hasOwnProperty.call(jobMappings, jobId)) {
      const mapping = jobMappings[jobId];
      console.log(`Processing Job: ${mapping.jobName} (ID: ${jobId})`);
      
      // Create fetch promise for each job grow variant.
      const jobGrowPromises = mapping.finalJobGrows.map((jobGrow) => {
        console.log(
          `  -> Queuing fetch for Job Grow: ${jobGrow.jobGrowName} (ID: ${jobGrow.jobGrowId})`
        );
        return fetchEquipmentForClass(jobId, jobGrow.jobGrowId);
      });
      
      // Add the job grow promises to the overall array.
      allPromises.push(...jobGrowPromises);
    }
  }

  // Wait for all equipment fetch requests to complete concurrently.
  await Promise.all(allPromises);
  console.log('Equipment automation process complete.');
}

// Run the automation script.
runAutomation();
