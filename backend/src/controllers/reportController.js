const User = require('../models/User');
const Book = require('../models/Book');
const BorrowTransaction = require('../models/BorrowTransaction');
const Reservation = require('../models/Reservation');
const Fine = require('../models/Fine');
const AuditLog = require('../models/AuditLog');

// @desc    Get live analytics for Student Dashboard
// @route   GET /api/reports/student-dashboard
// @access  Student only
const getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const [
      currentIssued,
      dueSoon,
      overdue,
      activeReservations,
      pendingRequests,
      unpaidFines,
      recentLoans,
    ] = await Promise.all([
      BorrowTransaction.countDocuments({
        student: studentId,
        status: 'issued',
      }),
      BorrowTransaction.countDocuments({
        student: studentId,
        status: 'issued',
        dueDate: { $gte: now, $lte: threeDaysLater },
      }),
      BorrowTransaction.countDocuments({
        student: studentId,
        status: 'issued',
        dueDate: { $lt: now },
      }),
      Reservation.countDocuments({
        student: studentId,
        status: { $in: ['pending', 'available'] },
      }),
      BorrowTransaction.countDocuments({
        student: studentId,
        status: 'requested',
      }),
      Fine.find({
        student: studentId,
        paidStatus: 'unpaid',
      }),
      BorrowTransaction.find({ student: studentId })
        .populate('book', 'title author isbn')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const totalUnpaidFine = (unpaidFines || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        currentIssued,
        dueSoon,
        overdue,
        activeReservations,
        pendingRequests,
        totalUnpaidFine,
      },
      recentLoans,
    });
  } catch (err) {
    console.error('getStudentDashboardStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get live analytics for Admin Dashboard
// @route   GET /api/reports/admin-dashboard
// @access  Admin only
const getAdminDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      registeredStudents,
      activeLibrarians,
      totalTitles,
      allBooks,
      activeIssues,
      overdueIssues,
      pendingRequests,
      totalReservations,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'librarian', isActive: true }),
      Book.countDocuments({ isArchived: false }),
      Book.find({ isArchived: false }),
      BorrowTransaction.countDocuments({ status: 'issued' }),
      BorrowTransaction.countDocuments({ status: 'issued', dueDate: { $lt: now } }),
      BorrowTransaction.countDocuments({ status: 'requested' }),
      Reservation.countDocuments({ status: { $in: ['pending', 'available'] } }),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
    ]);

    let totalCopies = 0;
    let availableCopies = 0;
    for (const b of allBooks) {
      totalCopies += Number(b.totalCopies) || 0;
      availableCopies += Number(b.availableCopies) || 0;
    }

    // Monthly circulation breakdown (last 6 months from real transactions)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentTx = await BorrowTransaction.find({
      createdAt: { $gte: sixMonthsAgo },
    });

    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const name = d.toLocaleString('default', { month: 'short' });
      monthMap[key] = { name, issues: 0, returns: 0, requests: 0 };
    }

    for (const tx of recentTx || []) {
      const txDate = new Date(tx.createdAt || tx.requestDate || Date.now());
      const key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
      if (monthMap[key]) {
        monthMap[key].requests += 1;
        if (tx.status === 'issued' || tx.status === 'returned') {
          monthMap[key].issues += 1;
        }
        if (tx.status === 'returned') {
          monthMap[key].returns += 1;
        }
      }
    }

    const monthlyCirculation = Object.values(monthMap);

    res.status(200).json({
      success: true,
      stats: {
        registeredStudents,
        activeLibrarians,
        totalTitles,
        totalCopies,
        availableCopies,
        activeIssues,
        overdueIssues,
        pendingRequests,
        totalReservations,
      },
      monthlyCirculation,
      recentActivity,
    });
  } catch (err) {
    console.error('getAdminDashboardStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get live analytics for Librarian Dashboard
// @route   GET /api/reports/librarian-dashboard
// @access  Librarian only
const getLibrarianDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalTitles,
      allBooks,
      issuedCopies,
      pendingRequests,
      overdueCount,
      recentCirculation,
    ] = await Promise.all([
      Book.countDocuments({ isArchived: false }),
      Book.find({ isArchived: false }),
      BorrowTransaction.countDocuments({ status: 'issued' }),
      BorrowTransaction.countDocuments({ status: 'requested' }),
      BorrowTransaction.countDocuments({ status: 'issued', dueDate: { $lt: now } }),
      BorrowTransaction.find()
        .populate('book', 'title author isbn')
        .populate('student', 'name studentId email')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    let totalCopies = 0;
    let availableCopies = 0;
    const categoryMap = {};

    for (const b of allBooks) {
      const tc = Number(b.totalCopies) || 0;
      const ac = Number(b.availableCopies) || 0;
      totalCopies += tc;
      availableCopies += ac;

      const cat = b.category || 'Uncategorized';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { _id: cat, count: 0, copies: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].copies += tc;
    }

    const categoryBreakdown = Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.status(200).json({
      success: true,
      stats: {
        totalTitles,
        totalCopies,
        availableCopies,
        issuedCopies,
        pendingRequests,
        overdueBooks: overdueCount,
      },
      recentCirculation,
      categoryBreakdown,
    });
  } catch (err) {
    console.error('getLibrarianDashboardStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get detailed inventory report
// @route   GET /api/reports/inventory
// @access  Librarian / Admin
const getInventoryReport = async (req, res) => {
  try {
    const books = await Book.find({ isArchived: false })
      .select('title author isbn category totalCopies availableCopies shelfLocation publicationYear')
      .sort({ category: 1, title: 1 });

    let totalCopies = 0;
    let availableCopies = 0;
    for (const b of books) {
      totalCopies += Number(b.totalCopies) || 0;
      availableCopies += Number(b.availableCopies) || 0;
    }

    res.status(200).json({
      success: true,
      summary: {
        totalTitles: books.length,
        totalCopies,
        availableCopies,
      },
      books,
    });
  } catch (err) {
    console.error('getInventoryReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get detailed circulation report
// @route   GET /api/reports/circulation
// @access  Librarian / Admin
const getCirculationReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = {};
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await BorrowTransaction.find(query)
      .populate('book', 'title author isbn')
      .populate('student', 'name studentId email department')
      .populate('issuedBy', 'name')
      .populate('returnedTo', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error('getCirculationReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudentDashboardStats,
  getAdminDashboardStats,
  getLibrarianDashboardStats,
  getInventoryReport,
  getCirculationReport,
};
