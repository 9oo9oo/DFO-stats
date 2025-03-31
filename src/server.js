// server.js
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('json spaces', 2);

// Import routes
const serverRoutes = require('./routes/serverRoutes');
const characterRoutes = require('./routes/characterRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const creatureRoutes = require('./routes/creatureRoutes');
const talismanRoutes = require('./routes/talismanRoutes');
const skillRoutes = require('./routes/skillRoutes');

// Mount routes
// Slayer 40132cbc8b2b5eedfe035e35c322472e
// Neo Blade Master ba2ae3598c3af10c26562e073bc92060
app.use('/api/servers', serverRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/creature', creatureRoutes);
app.use('/api/talisman', talismanRoutes);
app.use('/api/skill', skillRoutes);

// Default route
app.get('/', (req, res) => {
  res.send("DFO STATS COMING SOON :)");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});


/* 
To add
Skill tree
Avatar, aura, emblem
*/