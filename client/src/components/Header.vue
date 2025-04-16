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
.app-header {
  background-color: transparent;
  color: #fff;
  padding: 10px 20px;
}

/* Navigation bar styling */
.navbar {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Nav link styling */
.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 18px;
  position: relative;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #e56717;
}

/* Decorative accent line under the header */
.header-accent {
  margin-top: 10px;
  border-bottom: 1px solid #fff; 
}
</style>
