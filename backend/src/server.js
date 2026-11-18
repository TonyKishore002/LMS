require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then((connected) => {
  if (connected) {
    console.log(`📡 MongoDB Atlas connection established successfully.`);
  } else {
    console.warn(`⚠️ Running with disconnected database. Check backend/.env MONGODB_URI and Atlas IP Access List.`);
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 LMS Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`📖 API Root: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`💥 Uncaught Exception: ${err.message}`);
});

module.exports = server;
