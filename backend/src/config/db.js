const mongoose = require('mongoose');

// Set bufferTimeoutMS so operations fail quickly with clear errors when DB is disconnected
mongoose.set('bufferTimeoutMS', 3000);

let isConnected = false;
let lastConnectionError = '';

/**
 * Convert Atlas SRV URI to standard direct replica set URI as a fallback
 * for Windows / VPN environments where c-ares SRV DNS resolution fails (querySrv ETIMEOUT).
 */
const getDirectReplicaSetFallback = (uri) => {
  if (!uri || !uri.startsWith('mongodb+srv://')) return null;

  try {
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)\/([^?]*)(?:\?(.*))?$/);
    if (!match) return null;

    const [, user, pass, host, dbName, query] = match;
    if (host === 'lms.3xf7acg.mongodb.net') {
      const nodes = [
        'ac-bggyvz2-shard-00-00.3xf7acg.mongodb.net:27017',
        'ac-bggyvz2-shard-00-01.3xf7acg.mongodb.net:27017',
        'ac-bggyvz2-shard-00-02.3xf7acg.mongodb.net:27017',
      ].join(',');

      return `mongodb://${user}:${pass}@${nodes}/${dbName || 'LMS'}?ssl=true&replicaSet=atlas-ncshoj-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  } catch (err) {
    // ignore parse error
  }
  return null;
};

let cachedIP = null;
let lastIPFetchTime = 0;

/**
 * Fetch current public IP to give accurate whitelist instructions
 */
const getCurrentPublicIP = async () => {
  const now = Date.now();
  if (cachedIP && now - lastIPFetchTime < 60000) {
    return cachedIP;
  }
  try {
    const res = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      cachedIP = (await res.text()).trim();
      lastIPFetchTime = now;
      return cachedIP;
    }
  } catch (e) {
    // fallback
  }
  return cachedIP || null;
};

let isConnecting = false;

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async (timeoutMs = 8000) => {
  if (isConnecting) return false;
  isConnecting = true;

  try {
    // Re-read .env to catch any user updates dynamically
    require('dotenv').config();

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      lastConnectionError = 'MONGODB_URI is not defined in backend/.env.';
      console.warn(`⚠️ ${lastConnectionError}`);
      return false;
    }

    if (uri.includes('YOUR_NEW_URL_ENCODED_PASSWORD') || uri.includes('<db_password>') || uri.includes('<password>')) {
      lastConnectionError = "MONGODB_URI in backend/.env contains placeholder 'YOUR_NEW_URL_ENCODED_PASSWORD'. Please replace it with your actual Atlas password.";
      console.warn(`⚠️ ${lastConnectionError}`);
      return false;
    }

    const connectOptions = {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
    };

    try {
      const conn = await mongoose.connect(uri, connectOptions);
      isConnected = true;
      lastConnectionError = '';
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
      return true;
    } catch (error) {
      // If SRV DNS failed, attempt direct replica set fallback
      const fallbackUri = getDirectReplicaSetFallback(uri);
      if (fallbackUri && (error.message.includes('querySrv') || error.message.includes('ETIMEOUT'))) {
        console.warn('⚠️ SRV DNS resolution failed (querySrv ETIMEOUT). Attempting direct replica set fallback...');
        try {
          const conn = await mongoose.connect(fallbackUri, connectOptions);
          isConnected = true;
          lastConnectionError = '';
          console.log(`✅ MongoDB Atlas Connected (via Direct Replica Set): ${conn.connection.host} / Database: ${conn.connection.name}`);
          return true;
        } catch (fallbackError) {
          error = fallbackError;
        }
      }

      isConnected = false;
      const rawMsg = error.message || '';
      const currentIP = (await getCurrentPublicIP()) || 'your current IP';

      if (
        rawMsg.includes('whitelist') ||
        rawMsg.includes('buffering timed out') ||
        rawMsg.includes('ECONNRESET') ||
        rawMsg.includes('SSL alert') ||
        rawMsg.includes('internal error') ||
        rawMsg.includes('alert number 80') ||
        error.name === 'MongooseServerSelectionError'
      ) {
        lastConnectionError = `Atlas connection blocked or timed out. Please ensure your current IP (${currentIP} or 0.0.0.0/0) is added to MongoDB Atlas Network Access.`;
      } else {
        // Redact any URI credentials from error output
        lastConnectionError = rawMsg.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/gi, '$1***:***@');
      }
      console.error(`❌ MongoDB Connection Error: ${lastConnectionError}`);
      return false;
    }
  } finally {
    isConnecting = false;
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  lastConnectionError = '';
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  lastConnectionError = err.message;
  console.error(`💥 MongoDB connection error: ${err.message}`);
});

/**
 * Health check helper for MongoDB connection status
 */
const checkMongoHealth = async () => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const status = states[readyState] || 'unknown';

  if (readyState === 1 && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping();
      return {
        status: 'connected',
        connected: true,
        host: mongoose.connection.host,
        dbName: mongoose.connection.name,
        message: 'MongoDB Atlas connected and responsive',
      };
    } catch (err) {
      return {
        status: 'error',
        connected: false,
        message: `Database ping error: ${err.message}`,
      };
    }
  }

  // If disconnected, try to connect with a short 2.5s timeout so health check returns promptly
  if (readyState === 0) {
    const connectedNow = await connectDB(2500);
    if (connectedNow && mongoose.connection.readyState === 1) {
      return {
        status: 'connected',
        connected: true,
        host: mongoose.connection.host,
        dbName: mongoose.connection.name,
        message: 'MongoDB Atlas connected successfully',
      };
    }
  }

  return {
    status,
    connected: false,
    message:
      lastConnectionError ||
      (readyState === 2
        ? 'Connecting to MongoDB Atlas...'
        : 'MongoDB is disconnected. Check MONGODB_URI in backend/.env and Atlas IP Whitelist.'),
  };
};

module.exports = { connectDB, checkMongoHealth, mongoose };
