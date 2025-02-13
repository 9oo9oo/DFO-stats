require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const buildRoutes = require('./routes/builds');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(express.json());    // parse JSON bodies
app.use(require('cors')());

// Routes
app.use('/api/builds', buildRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
