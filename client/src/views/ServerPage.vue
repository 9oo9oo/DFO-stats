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
  
<script lang="ts">
import axios from 'axios';

export default {
  name: 'ServerPage',
  data() {
    return {
      servers: []
    };
  },
  mounted() {
  axios.get('/api/servers')
      .then(response => {
      this.servers = response.data.rows;
      })
      .catch(error => {
      console.error('Error fetching server data:', error);
      });
  }
};
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