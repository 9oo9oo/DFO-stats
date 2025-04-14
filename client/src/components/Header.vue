<template>
    <header class="app-header">
      <nav class="navbar">
        <router-link to="/" class="nav-link">Home</router-link>
      </nav>
    </header>
  </template>
  
  <script>
  export default {
    name: "HeaderComponent",
  };
  </script>
  
  <style scoped>
  .app-header {
    background-color: #333;
    color: #fff;
    padding: 10px 20px;
  }
  
  .navbar {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .nav-link {
    color: #fff;
    text-decoration: none;
    font-size: 18px;
  }
  
  .nav-link:hover {
    text-decoration: underline;
  }
  </style>
  