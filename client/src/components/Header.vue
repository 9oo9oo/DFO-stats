<template>
  <header class="app-header">
    <nav class="navbar">
      <router-link to="/" class="nav-link">Home</router-link>
    </nav>
    <div class="header-accent"></div>
  </header>
</template>

<script>
export default {
  name: "HeaderComponent",
};
</script>

<style scoped>
/* Header & Navigation */
.app-header {
  background-color: transparent;
  color: #fff;
  padding: 10px 20px;
}

.navbar {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  position: relative;
  font-size: 18px;
  color: #fff;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  color: #e56717;
}

.header-accent {
  margin-top: 10px;
  border-bottom: 1px solid #fff;
}
</style>
