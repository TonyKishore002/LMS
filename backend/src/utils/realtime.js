const clients = new Set();

/**
 * Register a new SSE client
 */
const addClient = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
  });

  // Flush headers if supported
  if (res.flushHeaders) {
    res.flushHeaders();
  }

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientsCount: clients.size + 1 })}\n\n`);

  clients.add(res);

  // Heartbeat to prevent timeouts
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeatInterval);
      clients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(res);
  });
};

/**
 * Broadcast an event to all connected clients
 * @param {Object} event - Event payload { type, role, action, details, timestamp }
 */
const broadcastEvent = (event) => {
  const payload = {
    ...event,
    timestamp: Date.now(),
  };

  const message = `event: lms_update\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
};

module.exports = {
  addClient,
  broadcastEvent,
  getConnectedCount: () => clients.size,
};

