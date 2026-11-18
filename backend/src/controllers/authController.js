const User = require('../models/User');
const { generateToken } = require('../utils/token');
const { logAuditEvent } = require('../utils/auditLogger');
const { broadcastEvent } = require('../utils/realtime');

// @desc    Authenticate user & get token (Role-specific or general)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password, portalRole } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. User not found.',
    });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Incorrect password.',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact the administrator.',
    });
  }

  // Strict portal verification to prevent role confusion/impersonation
  if (portalRole && portalRole !== user.role) {
    return res.status(403).json({
      success: false,
      message: `Access denied. This account has the role '${user.role}' and cannot log in through the ${portalRole} portal.`,
    });
  }

  const token = generateToken(user);

  await logAuditEvent({
    user,
    action: 'USER_LOGIN',
    targetType: 'User',
    targetId: user._id,
    details: { portalRole: portalRole || user.role },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      staffId: user.staffId,
      department: user.department,
      phone: user.phone,
    },
  });
};

// @desc    Register a new student account
// @route   POST /api/auth/register-student
// @access  Public
const registerStudent = async (req, res) => {
  const { name, email, password, studentId, department, phone, role } = req.body;

  // Reject any public attempt to register as admin or librarian
  if (role && role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Public registration is only available for students. Staff and administrators must be created by an administrator.',
    });
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email address already exists.',
    });
  }

  if (studentId) {
    const existingStudentId = await User.findOne({ studentId });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        message: 'A student account with this Student ID already exists.',
      });
    }
  }

  // Force student role - cannot register as admin or librarian
  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
    studentId,
    department: department || '',
    phone: phone || '',
  });

  const token = generateToken(user);

  await logAuditEvent({
    user,
    action: 'STUDENT_REGISTERED',
    targetType: 'User',
    targetId: user._id,
    details: { email, studentId },
    ipAddress: req.ip,
  });

  // Broadcast user registration so Admin dashboard counters immediately update
  broadcastEvent({
    type: 'USER_MUTATION',
    action: 'register',
    role: 'student',
    user: { _id: user._id, name: user.name, email: user.email },
    message: `New student "${user.name}" registered.`,
  });

  res.status(201).json({
    success: true,
    message: 'Student account registered successfully',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      department: user.department,
      phone: user.phone,
    },
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.status(200).json({
    success: true,
    user,
  });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password does not match.',
    });
  }

  user.password = newPassword;
  await user.save();

  await logAuditEvent({
    user: req.user,
    action: 'PASSWORD_CHANGED',
    targetType: 'User',
    targetId: req.user._id,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
  });
};

module.exports = {
  login,
  registerStudent,
  getMe,
  changePassword,
};
