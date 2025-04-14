// scripts/automationFetchTalisman.js
import axios from 'axios';
import jobMappings from '../src/config/jobMappings.js';

// Set your testing server ID (update this to your valid server identifier)
const serverId = 'cain';

/**
 * Fetches talisman and rune data for a given job and jobGrow by calling your API.
 *
 * @param {string} jobId - The main job ID from jobMappings.
 * @param {string} jobGrowId - The job grow ID from the mapping.
 */
async function fetchTalismanAndRunesForClass(jobId, jobGrowId) {
    try {
        const url = `http://localhost:3000/api/talisman/fetch/${serverId}/${jobId}/${jobGrowId}`;
        console.log(`Calling: ${url}`);
        const response = await axios.get(url);
        console.log(`Success for jobId=${jobId}, jobGrowId=${jobGrowId}:`, response.data);
    } catch (error) {
        console.error(`Error for jobId=${jobId}, jobGrowId=${jobGrowId}:`, error.message);
    }
}

/**
 * Iterates over all job mappings and queues a fetch request for talisman and rune data for every jobGrow concurrently.
 */
async function runAutomation() {
    console.log('Starting talisman & rune automation process...');
    const allPromises = [];

    // Loop over each job in the mapping.
    for (const jobId in jobMappings) {
        if (Object.prototype.hasOwnProperty.call(jobMappings, jobId)) {
            const mapping = jobMappings[jobId];
            console.log(`Processing Job: ${mapping.jobName} (ID: ${jobId})`);

            // Queue the API calls for each job grow.
            mapping.finalJobGrows.forEach(jobGrow => {
                console.log(`  -> Queuing fetch for Job Grow: ${jobGrow.jobGrowName} (ID: ${jobGrow.jobGrowId})`);
                allPromises.push(fetchTalismanAndRunesForClass(jobId, jobGrow.jobGrowId));
            });
        }
    }

    // Run all fetch requests concurrently.
    await Promise.all(allPromises);
    console.log('Talisman & rune automation process complete.');
}

// Execute the automation script.
runAutomation();
