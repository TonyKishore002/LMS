const Setting = require('../models/Setting');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Get current library configuration
// @route   GET /api/settings
// @access  Authenticated
const getSettings = async (req, res) => {
  let settings = await Setting.findOne({ key: 'library_config' });
  if (!settings) {
    settings = await Setting.create({ key: 'library_config' });
  }

  res.status(200).json({
    success: true,
    settings,
  });
};

// @desc    Update library configuration
// @route   PUT /api/settings
// @access  Admin only
const updateSettings = async (req, res) => {
  const { maxBorrowLimit, loanPeriodDays, finePerDay, isFineEnabled, maxReservationLimit } = req.body;

  let settings = await Setting.findOne({ key: 'library_config' });
  if (!settings) {
    settings = new Setting({ key: 'library_config' });
  }

  if (maxBorrowLimit !== undefined) settings.maxBorrowLimit = Number(maxBorrowLimit);
  if (loanPeriodDays !== undefined) settings.loanPeriodDays = Number(loanPeriodDays);
  if (finePerDay !== undefined) settings.finePerDay = Number(finePerDay);
  if (isFineEnabled !== undefined) settings.isFineEnabled = Boolean(isFineEnabled);
  if (maxReservationLimit !== undefined) settings.maxReservationLimit = Number(maxReservationLimit);

  await settings.save();

  await logAuditEvent({
    user: req.user,
    action: 'SETTINGS_UPDATED',
    targetType: 'Setting',
    targetId: settings._id,
    details: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Library configuration updated successfully',
    settings,
  });
};

module.exports = {
  getSettings,
  updateSettings,
};
