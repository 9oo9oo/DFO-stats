<!-- src/views/ServerPage.vue -->
<template>
  <div>
    <h1>DFO Server Information</h1>
    <ul>
      <li v-for="server in servers" :key="server.serverId">
        <strong>ID:</strong> {{ server.serverId }}<br>
        <strong>Name:</strong> {{ server.serverName }}
      </li>
    </ul>
  </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// 1. Define the shape of a server record
interface Server {
  serverId:   string;
  serverName: string;
}

// 2. Reactive list of servers
const servers = ref<Server[]>([]);

// 3. Fetch on mount
onMounted(async () => {
  try {
    // Assuming your API returns { rows: Server[] }
    const { data } = await axios.get<{ rows: Server[] }>('/api/servers');
    servers.value = data.rows;
  } catch (err: any) {
    console.error('Error fetching server data:', err);
  }
});
</script>

<style scoped>
h1 {
  text-align: center;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>