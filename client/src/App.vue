<!-- src/App.vue -->
<template>
  <div id="app">
    <Header></Header>
    <router-view></router-view>
    <Footer></Footer>
  </div>
</template>

<script>
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";

export default {
  name: "App",
  components: {
    Header,
    Footer
  },
};
</script>

<style>
/* Global styles */
body {
  max-width: 1600px;
  font-family: 'Noto Sans', sans-serif;
  margin: 0 auto;
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
