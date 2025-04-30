<template>
  <footer class="site-footer">
    <div class="footer-accent"></div>
    <div class="footer-container">
      
      <!-- Logo link -->
      <a href="https://www.dfoneople.com/developers" target="_blank">
        <img :src="logoSrc" alt="Neople Open API" class="footer-logo" />
      </a>
    </div>
    
    <div class="footer-text">
      <p>
        dfostats.xyz is a fan-made website and is not officially affiliated with Neople. All data is sourced from the Neople Open API.
      </p>
      <p>
        Copyright © 2025 dfostats.xyz. All rights reserved.
      </p>
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
/* Footer */
.site-footer {
  background-color: transparent;
  text-align: center;
  padding: 20px;
}

.footer-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-logo {
  height: 100%;
}

.footer-accent {
  margin: 10px auto;
  border-bottom: 1px solid #fff;
}

.footer-text {
  margin-top: 10px;
  font-size: 12px;
  color: #fff;
}

.footer-text p {
  margin: 5px 0;
}
</style>

