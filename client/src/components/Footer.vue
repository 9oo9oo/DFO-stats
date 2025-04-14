<template>
    <footer class="site-footer">
      <div class="footer-container">
        <!-- Logo link -->
        <a href="https://www.dfoneople.com/developers" target="_blank">
          <!-- Use a local asset or URL in the src attribute -->
          <img :src="logoSrc" alt="Neople Open API" class="footer-logo" />
        </a>
      </div>
    </footer>
  </template>
  
  <script>
  import logo from '@/assets/logo.png'
  export default {
    name: 'FooterComponent',
    data() {
      return {
        logoSrc: logo
      }
    }
  }
  </script>
  
  <style scoped>
  .site-footer {
    background-color: #333; 
    text-align: center;
  }
  
  .footer-container {
    display: flex;
    align-items: center;
    justify-content: right;
  }
  
  .footer-logo {
    max-height: 60px; 
  }
  </style>
  