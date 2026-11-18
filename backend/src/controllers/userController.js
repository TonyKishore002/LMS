const User = require('../models/User');
const BorrowTransaction = require('../models/BorrowTransaction');
const Reservation = require('../models/Reservation');
const { logAuditEvent } = require('../utils/auditLogger');
const { broadcastEvent } = require('../utils/realtime');

// @desc    Get all users (with filtering and pagination)
// @route   GET /api/users
// @access  Admin only
const getUsers = async (req, res) => {
  const { role, search, status, page = 1, limit = 10 } = req.query;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (status !== undefined && status !== '') {
    query.isActive = status === 'active';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { staffId: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    users,
  });
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Admin only
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Retrieve user's borrowing overview if student
  let borrowingOverview = null;
  if (user.role === 'student') {
    const totalBorrowed = await BorrowTransaction.countDocuments({ student: user._id });
    const currentIssued = await BorrowTransaction.countDocuments({
      student: user._id,
      status: 'issued',
    });
    const overdue = await BorrowTransaction.countDocuments({
      student: user._id,
      status: 'issued',
      dueDate: { $lt: new Date() },
    });
    const reservations = await Reservation.countDocuments({
      student: user._id,
      status: { $in: ['pending', 'available'] },
    });

    borrowingOverview = {
      totalBorrowed,
      currentIssued,
      overdue,
      reservations,
    };
  }

  res.status(200).json({
    success: true,
    user,
    borrowingOverview,
  });
};

// @desc    Create student or librarian account
// @route   POST /api/users
// @access  Admin only
const createUser = async (req, res) => {
  const { name, email, password, role, studentId, staffId, department, phone } = req.body;

  if (!['student', 'librarian', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified',
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A user with this email already exists',
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    studentId: role === 'student' ? studentId : null,
    staffId: role !== 'student' ? staffId : null,
    department: department || '',
    phone: phone || '',
  });

  await logAuditEvent({
    user: req.user,
    action: 'USER_CREATED',
    targetType: 'User',
    targetId: user._id,
    details: { email: user.email, role: user.role },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'USER_MUTATION',
    action: 'create',
    role: user.role,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    message: `New ${user.role} account created for "${user.name}".`,
  });

  res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      staffId: user.staffId,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
    },
  });
};

// @desc    Update user details & role
// @route   PUT /api/users/:id
// @access  Admin only
const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const { name, email, role, studentId, staffId, department, phone, password } = req.body;

  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another account',
      });
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (department !== undefined) user.department = department;
  if (phone !== undefined) user.phone = phone;

  if (role && ['student', 'librarian', 'admin'].includes(role)) {
    // Prevent removing the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only active administrator in the system',
        });
      }
    }
    user.role = role;
  }

  if (studentId !== undefined) user.studentId = studentId;
  if (staffId !== undefined) user.staffId = staffId;
  if (password && password.length >= 6) {
    user.password = password; // pre-save hook will hash
  }

  await user.save();

  await logAuditEvent({
    user: req.user,
    action: 'USER_UPDATED',
    targetType: 'User',
    targetId: user._id,
    details: { updatedFields: req.body },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      staffId: user.staffId,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
    },
  });
};

// @desc    Toggle user active status (activate/deactivate)
// @route   PATCH /api/users/:id/status
// @access  Admin only
const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot deactivate your own administrative account',
    });
  }

  user.isActive = !user.isActive;
  await user.save();

  await logAuditEvent({
    user: req.user,
    action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetType: 'User',
    targetId: user._id,
    details: { isActive: user.isActive },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    isActive: user.isActive,
  });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
};
