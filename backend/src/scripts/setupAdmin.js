require('dotenv').config();
const { connectDB, checkMongoHealth, mongoose } = require('../config/db');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { logAuditEvent } = require('../utils/auditLogger');

const setupInitialAdmin = async () => {
  console.log('🔄 Connecting to MongoDB Atlas...');
  const connected = await connectDB(10000);
  if (!connected) {
    console.error('❌ MongoDB Atlas connection failed.');
    console.error('Please verify MONGODB_URI in backend/.env and ensure your IP is whitelisted in Atlas.');
    process.exit(1);
  }

  try {
    // 1. Check if an administrator or existing user already exists (idempotency guard)
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️ Administrator account already provisioned in MongoDB Atlas.');
      console.log(`Administrator Email: ${existingAdmin.email}`);
      console.log('No changes were made. Initial provisioning is strictly idempotent.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 2. Read provisioning credentials from command line args or env vars
    const args = process.argv.slice(2);
    const getArg = (key) => {
      const arg = args.find((a) => a.startsWith(`--${key}=`));
      return arg ? arg.split('=')[1] : null;
    };

    const name =
      getArg('name') ||
      process.env.INIT_ADMIN_NAME ||
      'Principal Administrator';

    const email =
      getArg('email') ||
      process.env.INIT_ADMIN_EMAIL ||
      'admin@college.edu';

    const password =
      getArg('password') ||
      process.env.INIT_ADMIN_PASSWORD ||
      'Admin@SecurePass2026';

    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long.');
      console.error('Usage:');
      console.log('  node src/scripts/setupAdmin.js --name="Admin Name" --email="admin@college.edu" --password="YourSecurePassword"');
      await mongoose.disconnect();
      process.exit(1);
    }

    // 3. Create the initial administrator in MongoDB
    const adminUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
      staffId: 'ADM-001',
      department: 'Library Administration',
      phone: '555-0100',
    });

    // 4. Initialize library settings if not present
    let settings = await Setting.findOne({ key: 'library_config' });
    if (!settings) {
      settings = await Setting.create({
        key: 'library_config',
        maxBorrowLimit: 3,
        loanPeriodDays: 14,
        finePerDay: 2,
        isFineEnabled: true,
        maxReservationLimit: 2,
      });
      console.log('✅ Default library circulation settings initialized in MongoDB.');
    }

    await logAuditEvent({
      user: adminUser,
      action: 'INITIAL_ADMIN_PROVISIONED',
      targetType: 'User',
      targetId: adminUser._id,
      details: { email: adminUser.email },
    });

    console.log('\n======================================================');
    console.log('🎉 Initial Administrator provisioned successfully in MongoDB Atlas!');
    console.log('======================================================');
    console.log(`Name:        ${adminUser.name}`);
    console.log(`Email:       ${adminUser.email}`);
    console.log(`Role:        ${adminUser.role}`);
    console.log(`Staff ID:    ${adminUser.staffId || 'ADM-001'}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

setupInitialAdmin();
