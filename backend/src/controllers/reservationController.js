const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const { logAuditEvent } = require('../utils/auditLogger');
const { broadcastEvent } = require('../utils/realtime');

// @desc    Student places a reservation for a book
// @route   POST /api/reservations
// @access  Student only
const createReservation = async (req, res) => {
  const { bookId, notes } = req.body;
  const studentId = req.user._id;

  const book = await Book.findById(bookId);
  if (!book || book.isArchived) {
    return res.status(404).json({
      success: false,
      message: 'Book not found or unavailable for reservation',
    });
  }

  let settings = await Setting.findOne({ key: 'library_config' });
  if (!settings) {
    settings = await Setting.create({ key: 'library_config' });
  }

  const activeReservationsCount = await Reservation.countDocuments({
    student: studentId,
    status: { $in: ['pending', 'available'] },
  });

  if (activeReservationsCount >= settings.maxReservationLimit) {
    return res.status(400).json({
      success: false,
      message: `Reservation limit reached. You can only have up to ${settings.maxReservationLimit} active reservations.`,
    });
  }

  const existing = await Reservation.findOne({
    student: studentId,
    book: bookId,
    status: { $in: ['pending', 'available'] },
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'You already have an active reservation for this book.',
    });
  }

  // Count existing queue for this book to set priority number
  const queueCount = await Reservation.countDocuments({
    book: bookId,
    status: 'pending',
  });

  const reservation = await Reservation.create({
    book: bookId,
    student: studentId,
    priorityNumber: queueCount + 1,
    notes: notes || '',
  });

  await Notification.create({
    recipient: studentId,
    title: 'Book Reserved',
    message: `You are #${queueCount + 1} in line for "${book.title}". You will be alerted when a copy is returned.`,
    type: 'info',
  });

  await logAuditEvent({
    user: req.user,
    action: 'BOOK_RESERVED',
    targetType: 'Reservation',
    targetId: reservation._id,
    details: { bookTitle: book.title, priority: queueCount + 1 },
    ipAddress: req.ip,
  });

  broadcastEvent({
    type: 'RESERVATION_MUTATION',
    action: 'create',
    reservationId: reservation._id,
    bookId: book._id,
    studentId: studentId,
    message: `Book "${book.title}" was reserved by a student.`,
  });

  res.status(201).json({
    success: true,
    message: `Book reserved successfully. Your queue position is #${queueCount + 1}.`,
    reservation,
  });
};

// @desc    Get student's reservations
// @route   GET /api/reservations/my-reservations
// @access  Student only
const getMyReservations = async (req, res) => {
  const reservations = await Reservation.find({
    student: req.user._id,
  })
    .populate('book', 'title author isbn availableCopies shelfLocation')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reservations.length,
    reservations,
  });
};

// @desc    Cancel a reservation
// @route   PATCH /api/reservations/:id/cancel
// @access  Student / Librarian
const cancelReservation = async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate('book');
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation record not found',
    });
  }

  // If student, check ownership
  if (req.user.role === 'student' && reservation.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this reservation',
    });
  }

  reservation.status = 'cancelled';
  await reservation.save();

  await logAuditEvent({
    user: req.user,
    action: 'RESERVATION_CANCELLED',
    targetType: 'Reservation',
    targetId: reservation._id,
    details: { bookTitle: reservation.book?.title },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Reservation cancelled successfully',
    reservation,
  });
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Librarian only
const getAllReservations = async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;

  const query = {};
  if (status) query.status = status;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const skip = (pageNum - 1) * limitNum;

  const total = await Reservation.countDocuments(query);
  const reservations = await Reservation.find(query)
    .populate('book', 'title author isbn availableCopies shelfLocation')
    .populate('student', 'name email studentId department')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    reservations,
  });
};

module.exports = {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
};
