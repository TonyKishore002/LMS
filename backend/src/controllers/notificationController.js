const Notification = require('../models/Notification');

// @desc    Get logged in user notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    unreadCount,
    notifications,
  });
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    notification,
  });
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
