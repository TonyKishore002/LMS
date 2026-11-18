const express = require('express');
const router = express.Router();
const { addClient, getConnectedCount } = require('../utils/realtime');

// SSE stream for real-time synchronization across all tabs and clients
router.get('/stream', (req, res) => {
  addClient(req, res);
});

// Real-time status inspection
router.get('/status', (req, res) => {
  res.json({
    success: true,
    connectedClients: getConnectedCount(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

