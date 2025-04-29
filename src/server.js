// server.js
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('../client/dist'));

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
const avatarRoutes = require('./routes/avatarRoutes');
const itemRoutes = require('./routes/itemRoutes');

// Mount routes
app.use('/api/servers', serverRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/creature', creatureRoutes);
app.use('/api/talisman', talismanRoutes);
app.use('/api/skill', skillRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/items', itemRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});

