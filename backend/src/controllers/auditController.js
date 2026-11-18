const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs
// @route   GET /api/audit-logs
// @access  Admin only
const getAuditLogs = async (req, res) => {
  const { action, search, page = 1, limit = 20 } = req.query;

  const query = {};

  if (action) {
    query.action = action;
  }

  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
      { targetType: { $regex: search, $options: 'i' } },
      { targetId: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limitNum);

  // Distinct action types for easy filtering
  const actionTypes = await AuditLog.distinct('action');

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    actionTypes,
    logs,
  });
};

module.exports = {
  getAuditLogs,
};
