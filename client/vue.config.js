module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Ensure this matches your backend port
        changeOrigin: true
      }
    }
  }
}