<!-- src/App.vue -->
<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/servers">Servers</router-link>
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

<style>
/* Global styles */
body {
  font-family: 'Noto Sans', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #201F24;
  color: #FFFFFF;
}

h1 {
  font-family: 'Noto Sans', sans-serif;
  text-align: center;
}

ul {
  font-family: 'Noto Sans', sans-serif;
  list-style-type: none;
  padding: 0;
}

li {
  font-family: 'Noto Sans', sans-serif;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
