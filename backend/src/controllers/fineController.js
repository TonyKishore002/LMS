const Fine = require('../models/Fine');
const BorrowTransaction = require('../models/BorrowTransaction');
const { logAuditEvent } = require('../utils/auditLogger');
const { broadcastEvent } = require('../utils/realtime');

// @desc    Get all fines (with filters)
// @route   GET /api/fines
// @access  Librarian / Admin
const getFines = async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;

  const query = {};
  if (status) query.paidStatus = status;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const skip = (pageNum - 1) * limitNum;

  const total = await Fine.countDocuments(query);
  const fines = await Fine.find(query)
    .populate('student', 'name email studentId department')
    .populate({
      path: 'transaction',
      populate: { path: 'book', select: 'title author isbn' },
    })
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    fines,
  });
};

// @desc    Get student's own fines
// @route   GET /api/fines/my-fines
// @access  Student only
const getMyFines = async (req, res) => {
  const fines = await Fine.find({ student: req.user._id })
    .populate({
      path: 'transaction',
      populate: { path: 'book', select: 'title author isbn' },
    })
    .sort({ createdAt: -1 });

  const totalUnpaid = fines
    .filter((f) => f.paidStatus === 'unpaid')
    .reduce((sum, f) => sum + f.amount, 0);

  res.status(200).json({
    success: true,
    count: fines.length,
    totalUnpaid,
    fines,
  });
};

// @desc    Record fine payment
// @route   PATCH /api/fines/:id/pay
// @access  Librarian only
const payFine = async (req, res) => {
  const fine = await Fine.findById(req.params.id).populate('student', 'name');
  if (!fine) {
    return res.status(404).json({
      success: false,
      message: 'Fine record not found',
    });
  }

  fine.paidStatus = 'paid';
  fine.paidAt = new Date();
  await fine.save();

  // Mark transaction fine as paid
  await BorrowTransaction.findByIdAndUpdate(fine.transaction, {
    isFinePaid: true,
  });

  await logAuditEvent({
    user: req.user,
    action: 'FINE_PAID',
    targetType: 'Fine',
    targetId: fine._id,
    details: { amount: fine.amount, studentName: fine.student?.name },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'FINE_MUTATION',
    action: 'pay',
    fineId: fine._id,
    studentId: fine.student?._id,
    message: `Fine of $${fine.amount} was marked as paid.`,
  });

  res.status(200).json({
    success: true,
    message: 'Fine payment recorded successfully',
    fine,
  });
};

// @desc    Waive a fine
// @route   PATCH /api/fines/:id/waive
// @access  Librarian only
const waiveFine = async (req, res) => {
  const fine = await Fine.findById(req.params.id).populate('student', 'name');
  if (!fine) {
    return res.status(404).json({
      success: false,
      message: 'Fine record not found',
    });
  }

  fine.paidStatus = 'waived';
  await fine.save();

  await BorrowTransaction.findByIdAndUpdate(fine.transaction, {
    isFinePaid: true,
  });

  await logAuditEvent({
    user: req.user,
    action: 'FINE_WAIVED',
    targetType: 'Fine',
    targetId: fine._id,
    details: { amount: fine.amount, studentName: fine.student?.name },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'FINE_MUTATION',
    action: 'waive',
    fineId: fine._id,
    studentId: fine.student?._id,
    message: `Fine of $${fine.amount} was waived.`,
  });

  res.status(200).json({
    success: true,
    message: 'Fine waived successfully',
    fine,
  });
};

module.exports = {
  getFines,
  getMyFines,
  payFine,
  waiveFine,
};
