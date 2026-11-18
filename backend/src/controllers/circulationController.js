const BorrowTransaction = require('../models/BorrowTransaction');
const Book = require('../models/Book');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Reservation = require('../models/Reservation');
const Fine = require('../models/Fine');
const Notification = require('../models/Notification');
const { logAuditEvent } = require('../utils/auditLogger');
const { broadcastEvent } = require('../utils/realtime');

// Helper to get active library configuration
const getLibrarySettings = async () => {
  let settings = await Setting.findOne({ key: 'library_config' });
  if (!settings) {
    settings = await Setting.create({ key: 'library_config' });
  }
  return settings;
};

// ==========================================
// STUDENT ACTIONS
// ==========================================

// @desc    Student requests to borrow a book
// @route   POST /api/circulation/request
// @access  Student only
const requestBorrow = async (req, res) => {
  const { bookId, notes } = req.body;
  const studentId = req.user._id;

  const book = await Book.findById(bookId);
  if (!book || book.isArchived) {
    return res.status(404).json({
      success: false,
      message: 'Book not found or unavailable in library catalog',
    });
  }

  if (book.availableCopies <= 0) {
    return res.status(400).json({
      success: false,
      message: 'No physical copies currently available. You may place a reservation instead.',
    });
  }

  const settings = await getLibrarySettings();

  // Check student active borrow limit
  const activeCount = await BorrowTransaction.countDocuments({
    student: studentId,
    status: { $in: ['issued', 'requested'] },
  });

  if (activeCount >= settings.maxBorrowLimit) {
    return res.status(400).json({
      success: false,
      message: `Borrowing limit reached. You can have at most ${settings.maxBorrowLimit} active loans/requests.`,
    });
  }

  // Check if student already has this book active
  const existingActive = await BorrowTransaction.findOne({
    student: studentId,
    book: bookId,
    status: { $in: ['issued', 'requested'] },
  });

  if (existingActive) {
    return res.status(400).json({
      success: false,
      message: 'You already have an active request or loan for this book.',
    });
  }

  const transaction = await BorrowTransaction.create({
    book: book._id,
    student: studentId,
    status: 'requested',
    notes: notes || '',
  });

  await Notification.create({
    recipient: studentId,
    title: 'Borrow Request Submitted',
    message: `Your request to borrow "${book.title}" has been submitted for librarian review.`,
    type: 'info',
  });

  await logAuditEvent({
    user: req.user,
    action: 'BORROW_REQUESTED',
    targetType: 'BorrowTransaction',
    targetId: transaction._id,
    details: { bookId: book._id, bookTitle: book.title },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'CIRCULATION_MUTATION',
    action: 'request',
    transactionId: transaction._id,
    bookId: book._id,
    studentId: req.user._id,
    message: `New borrow request for "${book.title}" submitted by student.`,
  });

  res.status(201).json({
    success: true,
    message: 'Book borrow request submitted successfully',
    transaction,
  });
};

// @desc    Get student's currently issued books
// @route   GET /api/circulation/my-issued
// @access  Student only
const getMyIssuedBooks = async (req, res) => {
  const transactions = await BorrowTransaction.find({
    student: req.user._id,
    status: 'issued',
  })
    .populate('book', 'title author isbn category shelfLocation')
    .sort({ dueDate: 1 });

  const now = new Date();
  const formatted = transactions.map((t) => {
    const isOverdue = t.dueDate && new Date(t.dueDate) < now;
    const diffTime = t.dueDate ? new Date(t.dueDate).getTime() - now.getTime() : 0;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      ...t.toObject(),
      isOverdue,
      daysRemaining,
    };
  });

  res.status(200).json({
    success: true,
    count: formatted.length,
    transactions: formatted,
  });
};

// @desc    Get student's borrowing history
// @route   GET /api/circulation/my-history
// @access  Student only
const getMyHistory = async (req, res) => {
  const transactions = await BorrowTransaction.find({
    student: req.user._id,
  })
    .populate('book', 'title author isbn category')
    .populate('issuedBy', 'name')
    .populate('returnedTo', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: transactions.length,
    transactions,
  });
};

// ==========================================
// LIBRARIAN ACTIONS
// ==========================================

// @desc    Get all circulation records (filterable)
// @route   GET /api/circulation
// @access  Librarian only
const getCirculationRecords = async (req, res) => {
  const { status, search, page = 1, limit = 15 } = req.query;

  const query = {};
  if (status) {
    if (status === 'overdue') {
      query.status = 'issued';
      query.dueDate = { $lt: new Date() };
    } else {
      query.status = status;
    }
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const skip = (pageNum - 1) * limitNum;

  const total = await BorrowTransaction.countDocuments(query);
  const transactions = await BorrowTransaction.find(query)
    .populate('book', 'title author isbn shelfLocation availableCopies totalCopies')
    .populate('student', 'name email studentId department')
    .populate('issuedBy', 'name')
    .populate('returnedTo', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    transactions,
  });
};

// @desc    Approve a student's borrow request
// @route   POST /api/circulation/:id/approve
// @access  Librarian only
const approveRequest = async (req, res) => {
  const transaction = await BorrowTransaction.findById(req.params.id)
    .populate('book')
    .populate('student');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Borrow transaction record not found',
    });
  }

  if (transaction.status !== 'requested') {
    return res.status(400).json({
      success: false,
      message: `Transaction is in status '${transaction.status}' and cannot be approved.`,
    });
  }

  // Atomic update to decrement availableCopies safely
  const updatedBook = await Book.findOneAndUpdate(
    { _id: transaction.book._id, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );

  if (!updatedBook) {
    return res.status(400).json({
      success: false,
      message: 'No available copies left in stock to issue this book.',
    });
  }

  const settings = await getLibrarySettings();
  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + settings.loanPeriodDays);

  transaction.status = 'issued';
  transaction.issueDate = issueDate;
  transaction.dueDate = dueDate;
  transaction.issuedBy = req.user._id;
  await transaction.save();

  await Notification.create({
    recipient: transaction.student._id,
    title: 'Borrow Request Approved',
    message: `Your request for "${transaction.book.title}" was approved! Please collect it from ${transaction.book.shelfLocation || 'the library counter'}. Due date: ${dueDate.toLocaleDateString()}.`,
    type: 'success',
  });

  await logAuditEvent({
    user: req.user,
    action: 'BORROW_APPROVED',
    targetType: 'BorrowTransaction',
    targetId: transaction._id,
    details: {
      bookTitle: transaction.book.title,
      studentName: transaction.student.name,
      dueDate,
    },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'CIRCULATION_MUTATION',
    action: 'approve',
    transactionId: transaction._id,
    bookId: transaction.book._id,
    studentId: transaction.student._id,
    message: `Borrow request approved for "${transaction.book.title}".`,
  });

  res.status(200).json({
    success: true,
    message: 'Book issued successfully',
    transaction,
  });
};

// @desc    Reject a student's borrow request
// @route   POST /api/circulation/:id/reject
// @access  Librarian only
const rejectRequest = async (req, res) => {
  const { reason } = req.body;
  const transaction = await BorrowTransaction.findById(req.params.id)
    .populate('book')
    .populate('student');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Borrow transaction not found',
    });
  }

  if (transaction.status !== 'requested') {
    return res.status(400).json({
      success: false,
      message: 'Only pending requests can be rejected',
    });
  }

  transaction.status = 'rejected';
  transaction.rejectionReason = reason || 'Request declined by librarian';
  await transaction.save();

  await Notification.create({
    recipient: transaction.student._id,
    title: 'Borrow Request Declined',
    message: `Your request for "${transaction.book.title}" was declined. Reason: ${transaction.rejectionReason}`,
    type: 'warning',
  });

  await logAuditEvent({
    user: req.user,
    action: 'BORROW_REJECTED',
    targetType: 'BorrowTransaction',
    targetId: transaction._id,
    details: { reason: transaction.rejectionReason },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'CIRCULATION_MUTATION',
    action: 'reject',
    transactionId: transaction._id,
    studentId: transaction.student._id,
    message: `Borrow request for "${transaction.book.title}" was declined.`,
  });

  res.status(200).json({
    success: true,
    message: 'Request rejected',
    transaction,
  });
};

// @desc    Directly issue book to student (Counter checkout)
// @route   POST /api/circulation/issue-direct
// @access  Librarian only
const directIssue = async (req, res) => {
  const { bookId, studentIdentifier, notes } = req.body;

  const book = await Book.findById(bookId);
  if (!book || book.isArchived) {
    return res.status(404).json({
      success: false,
      message: 'Book not found or archived',
    });
  }

  if (book.availableCopies <= 0) {
    return res.status(400).json({
      success: false,
      message: 'No available copies left for this book',
    });
  }

  // Find student by StudentId or Email
  const student = await User.findOne({
    $or: [{ studentId: studentIdentifier }, { email: studentIdentifier }],
    role: 'student',
  });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student account not found with the provided Student ID or email',
    });
  }

  if (!student.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Student account is currently inactive/suspended',
    });
  }

  const settings = await getLibrarySettings();
  const currentLoans = await BorrowTransaction.countDocuments({
    student: student._id,
    status: 'issued',
  });

  if (currentLoans >= settings.maxBorrowLimit) {
    return res.status(400).json({
      success: false,
      message: `Student has reached the maximum borrowing limit of ${settings.maxBorrowLimit} books.`,
    });
  }

  // Atomic decrement of inventory
  const updatedBook = await Book.findOneAndUpdate(
    { _id: book._id, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );

  if (!updatedBook) {
    return res.status(400).json({
      success: false,
      message: 'Unable to issue: no available physical copies left.',
    });
  }

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + settings.loanPeriodDays);

  const transaction = await BorrowTransaction.create({
    book: book._id,
    student: student._id,
    issuedBy: req.user._id,
    status: 'issued',
    issueDate,
    dueDate,
    notes: notes || '',
  });

  await Notification.create({
    recipient: student._id,
    title: 'Book Issued',
    message: `"${book.title}" was issued to you by the librarian. Due date: ${dueDate.toLocaleDateString()}.`,
    type: 'success',
  });

  await logAuditEvent({
    user: req.user,
    action: 'BOOK_ISSUED_DIRECT',
    targetType: 'BorrowTransaction',
    targetId: transaction._id,
    details: { bookTitle: book.title, studentName: student.name, dueDate },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'CIRCULATION_MUTATION',
    action: 'issue_direct',
    transactionId: transaction._id,
    bookId: book._id,
    studentId: student._id,
    message: `Book "${book.title}" issued to student ${student.name}.`,
  });

  res.status(201).json({
    success: true,
    message: 'Book issued to student successfully',
    transaction,
  });
};

// @desc    Record book return & calculate fines
// @route   POST /api/circulation/:id/return
// @access  Librarian only
const returnBook = async (req, res) => {
  const transaction = await BorrowTransaction.findById(req.params.id)
    .populate('book')
    .populate('student');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Borrow transaction not found',
    });
  }

  if (transaction.status !== 'issued') {
    return res.status(400).json({
      success: false,
      message: `Book cannot be returned because current transaction status is '${transaction.status}'.`,
    });
  }

  const returnDate = new Date();
  const settings = await getLibrarySettings();

  // Atomic increment of available copies
  await Book.findByIdAndUpdate(transaction.book._id, {
    $inc: { availableCopies: 1 },
  });

  transaction.status = 'returned';
  transaction.returnDate = returnDate;
  transaction.returnedTo = req.user._id;

  // Calculate overdue fines
  let fineAmount = 0;
  if (settings.isFineEnabled && transaction.dueDate && returnDate > transaction.dueDate) {
    const diffTime = returnDate.getTime() - new Date(transaction.dueDate).getTime();
    const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fineAmount = overdueDays * settings.finePerDay;

    transaction.fineAmount = fineAmount;

    // Create Fine record
    await Fine.create({
      transaction: transaction._id,
      student: transaction.student._id,
      amount: fineAmount,
      reason: `Returned ${overdueDays} day(s) late ($${settings.finePerDay}/day)`,
      recordedBy: req.user._id,
    });
  }

  await transaction.save();

  // Check if someone has reserved this book!
  const nextReservation = await Reservation.findOne({
    book: transaction.book._id,
    status: 'pending',
  }).sort({ reservationDate: 1 });

  if (nextReservation) {
    nextReservation.status = 'available';
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 2); // 48-hour hold window
    nextReservation.expiryDate = expiry;
    await nextReservation.save();

    await Notification.create({
      recipient: nextReservation.student,
      title: 'Reserved Book Available!',
      message: `The book "${transaction.book.title}" you reserved is now returned and held for you until ${expiry.toLocaleDateString()}. Please visit the library counter to borrow it.`,
      type: 'info',
    });
  }

  await Notification.create({
    recipient: transaction.student._id,
    title: 'Book Returned',
    message: `"${transaction.book.title}" has been successfully checked in.${
      fineAmount > 0 ? ` An overdue fine of $${fineAmount} has been applied.` : ''
    }`,
    type: fineAmount > 0 ? 'warning' : 'success',
  });

  await logAuditEvent({
    user: req.user,
    action: 'BOOK_RETURNED',
    targetType: 'BorrowTransaction',
    targetId: transaction._id,
    details: {
      bookTitle: transaction.book.title,
      studentName: transaction.student.name,
      fineAmount,
    },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'CIRCULATION_MUTATION',
    action: 'return',
    transactionId: transaction._id,
    bookId: transaction.book._id,
    studentId: transaction.student._id,
    message: `Book "${transaction.book.title}" returned by student ${transaction.student.name}.`,
  });

  res.status(200).json({
    success: true,
    message: 'Book returned successfully',
    transaction,
    fineAmount,
  });
};

// @desc    Get overdue books
// @route   GET /api/circulation/overdue
// @access  Librarian only
const getOverdueBooks = async (req, res) => {
  const overdueTransactions = await BorrowTransaction.find({
    status: 'issued',
    dueDate: { $lt: new Date() },
  })
    .populate('book', 'title author isbn shelfLocation')
    .populate('student', 'name email studentId phone')
    .sort({ dueDate: 1 });

  const settings = await getLibrarySettings();
  const now = new Date();

  const formatted = overdueTransactions.map((t) => {
    const diffTime = now.getTime() - new Date(t.dueDate).getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const estimatedFine = settings.isFineEnabled ? daysOverdue * settings.finePerDay : 0;

    return {
      ...t.toObject(),
      daysOverdue,
      estimatedFine,
    };
  });

  res.status(200).json({
    success: true,
    count: formatted.length,
    overdueTransactions: formatted,
  });
};

module.exports = {
  requestBorrow,
  getMyIssuedBooks,
  getMyHistory,
  getCirculationRecords,
  approveRequest,
  rejectRequest,
  directIssue,
  returnBook,
  getOverdueBooks,
};
