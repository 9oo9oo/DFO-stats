const Build = require('../models/Build');

exports.createBuild = async (req, res) => {
  try {
    const buildData = req.body;
    const newBuild = await Build.create(buildData);
    res.status(201).json(newBuild);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBuilds = async (req, res) => {
  try {
    const { className } = req.query;
    const filter = className ? { className } : {};
    const builds = await Build.find(filter);
    res.status(200).json(builds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
