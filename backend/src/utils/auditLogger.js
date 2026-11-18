const AuditLog = require('../models/AuditLog');

const logAuditEvent = async ({ user, action, targetType = '', targetId = '', details = {}, ipAddress = '' }) => {
  try {
    await AuditLog.create({
      user: user ? user._id : null,
      userName: user ? user.name : 'System',
      userRole: user ? user.role : 'system',
      action,
      targetType,
      targetId: String(targetId || ''),
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = { logAuditEvent };
