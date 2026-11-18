require('dotenv').config();
const dns = require('dns').promises;
const net = require('net');
const mongoose = require('mongoose');

// Configure public DNS servers to resolve MongoDB Atlas SRV records smoothly on Windows
try {
  require('dns').setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const sanitizeMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return '';
  // Redact mongodb connection strings: mongodb+srv://username:password@host -> mongodb+srv://***:***@host
  return msg.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/gi, '$1***:***@');
};

const checkTcp = (host, port, timeoutMs = 4000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      isResolved = true;
      socket.destroy();
      resolve({ success: true, host, port });
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ success: false, host, port, error: 'TCP_TIMEOUT' });
      }
    });

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ success: false, host, port, error: err.code || err.message });
      }
    });

    socket.connect(port, host);
  });
};

async function runDiagnostics() {
  const report = {
    timestamp: new Date().toISOString(),
    dns: { status: 'PENDING' },
    tcp: { status: 'PENDING' },
    auth: { status: 'PENDING' },
  };

  // Step 1: DNS Resolution
  let srvRecords = [];
  try {
    srvRecords = await dns.resolveSrv('_mongodb._tcp.lms.3xf7acg.mongodb.net');
    report.dns = {
      status: 'RESOLVED',
      hostCount: srvRecords.length,
      sampleHost: srvRecords[0] ? srvRecords[0].name : null,
    };
  } catch (dnsErr) {
    report.dns = {
      status: 'DNS_RESOLUTION_FAILURE',
      error: dnsErr.code || dnsErr.message,
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  // Step 2: TCP Connectivity to port 27017
  const targetHost = srvRecords[0] ? srvRecords[0].name : 'ac-bggyvz2-shard-00-00.3xf7acg.mongodb.net';
  const tcpResult = await checkTcp(targetHost, 27017, 4000);
  if (tcpResult.success) {
    report.tcp = {
      status: 'CONNECTED',
      host: targetHost,
      port: 27017,
    };
  } else {
    report.tcp = {
      status: 'TCP_TIMEOUT_OR_BLOCKED',
      host: targetHost,
      port: 27017,
      error: tcpResult.error,
      diagnostic: 'Cluster firewall dropped TCP connection. IP Access List rule in Atlas Network Access is either missing or pending.',
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  // Step 3: MongoDB Driver Connection & Auth
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    report.auth = {
      status: 'MISSING_URI',
      error: 'MONGODB_URI not defined in backend/.env',
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    // Run ping command to verify database access
    await mongoose.connection.db.admin().ping();

    report.auth = {
      status: 'AUTHENTICATED_AND_CONNECTED',
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    };

    await mongoose.disconnect();
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    const sanitizedErr = sanitizeMessage(err.message);
    let category = 'CONNECTION_ERROR';
    if (sanitizedErr.includes('Authentication failed') || err.code === 8000 || err.name === 'MongoServerError') {
      category = 'AUTHENTICATION_FAILED';
    } else if (sanitizedErr.includes('TLS') || sanitizedErr.includes('SSL')) {
      category = 'TLS_HANDSHAKE_ERROR';
    } else if (sanitizedErr.includes('timed out') || err.name === 'MongooseServerSelectionError') {
      category = 'SERVER_SELECTION_TIMEOUT';
    }

    report.auth = {
      status: category,
      error: sanitizedErr,
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
}

runDiagnostics();
