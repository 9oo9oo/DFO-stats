const mongoose = require('mongoose');

const BuildSchema = new mongoose.Schema({
  className: { type: String, required: true },
  skills: [{ name: String, level: Number }],
  items: [{ slot: String, itemName: String }],
  enchantments: [{ slot: String, enchantName: String }],
  timestamp: { type: Date, default: Date.now },
  // Add more fields (e.g., user ID, region, etc.) as needed
});

module.exports = mongoose.model('Build', BuildSchema);
