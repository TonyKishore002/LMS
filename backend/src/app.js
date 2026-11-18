const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { checkMongoHealth } = require('./config/db');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const circulationRoutes = require('./routes/circulationRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const fineRoutes = require('./routes/fineRoutes');
const settingRoutes = require('./routes/settingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const realtimeRoutes = require('./routes/realtimeRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching frontend
      if (!origin || origin === frontendUrl || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev / testing
      }
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Mount real-time stream before rate limiter so persistent SSE connections are never blocked
app.use('/api/realtime', realtimeRoutes);

// Apply rate limiting to all API endpoints
app.use('/api', apiLimiter);

// Root informative endpoint (fixes direct navigation to http://localhost:5000)
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'College Library Management System API',
    status: 'running',
    version: '1.0.0',
    documentation: '/api',
    healthCheck: '/api/health',
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'LMS REST API Root',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      circulation: '/api/circulation',
      reservations: '/api/reservations',
      fines: '/api/fines',
      users: '/api/users',
      reports: '/api/reports',
      settings: '/api/settings',
      notifications: '/api/notifications',
      auditLogs: '/api/audit-logs',
    },
  });
});

// Health check endpoint with MongoDB state
app.get('/api/health', async (req, res) => {
  const health = await checkMongoHealth();
  res.status(200).json({
    status: 'ok',
    database: health.connected ? 'connected' : 'disconnected',
    databaseProvider: 'mongodb_atlas',
    dbStatus: health.status,
    dbHost: health.host || null,
    dbName: health.dbName || null,
    message: health.message,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/circulation', circulationRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
