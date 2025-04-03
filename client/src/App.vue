<!-- src/App.vue -->
<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/servers">Servers</router-link>
        <router-link :to="`/equipment/stats/40132cbc8b2b5eedfe035e35c322472e/ba2ae3598c3af10c26562e073bc92060`">Slayer equip</router-link>
      </nav>
    </header>
    <main>
      <router-view></router-view>
    </main>
    <footer>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
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
