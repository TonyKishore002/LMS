const Book = require('../models/Book');
const BorrowTransaction = require('../models/BorrowTransaction');
const { logAuditEvent } = require('../utils/auditLogger');
const { broadcastEvent } = require('../utils/realtime');

// @desc    Get book catalog with searching, filtering, and pagination
// @route   GET /api/books
// @access  Public / Authenticated
const getBooks = async (req, res) => {
  const {
    search,
    category,
    availableOnly,
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeArchived = 'false',
  } = req.query;

  const query = {};

  if (includeArchived !== 'true') {
    query.isArchived = false;
  }

  if (category) {
    query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (availableOnly === 'true') {
    query.availableCopies = { $gt: 0 };
  }

  if (search && search.trim() !== '') {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { author: { $regex: s, $options: 'i' } },
      { isbn: { $regex: s, $options: 'i' } },
      { category: { $regex: s, $options: 'i' } },
      { publisher: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortOptions = {};
  sortOptions[sortBy] = sortDirection;

  const total = await Book.countDocuments(query);
  const books = await Book.find(query)
    .populate('addedBy', 'name email')
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum);

  // Get distinct categories for filtering
  const categories = await Book.distinct('category', { isArchived: false });

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    categories,
    books,
  });
};

// @desc    Get single book details
// @route   GET /api/books/:id
// @access  Public / Authenticated
const getBookById = async (req, res) => {
  const book = await Book.findById(req.params.id).populate('addedBy', 'name email');
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found in library catalog',
    });
  }

  // Active circulation details for librarians
  let activeCirculation = null;
  if (req.user && ['librarian', 'admin'].includes(req.user.role)) {
    activeCirculation = await BorrowTransaction.find({
      book: book._id,
      status: 'issued',
    })
      .populate('student', 'name email studentId')
      .select('student issueDate dueDate');
  }

  res.status(200).json({
    success: true,
    book,
    activeCirculation,
  });
};

// @desc    Add new book to catalog
// @route   POST /api/books
// @access  Librarian only
const createBook = async (req, res) => {
  const {
    title,
    author,
    isbn,
    publisher,
    edition,
    category,
    publicationYear,
    shelfLocation,
    description,
    totalCopies,
  } = req.body;

  const cleanIsbn = isbn.trim().toUpperCase();
  const existing = await Book.findOne({ isbn: cleanIsbn });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `A book with ISBN '${cleanIsbn}' already exists in catalog.`,
    });
  }

  const copies = parseInt(totalCopies, 10) || 1;

  const book = await Book.create({
    title,
    author,
    isbn: cleanIsbn,
    publisher: publisher || '',
    edition: edition || '',
    category,
    publicationYear: publicationYear ? parseInt(publicationYear, 10) : null,
    shelfLocation: shelfLocation || '',
    description: description || '',
    totalCopies: copies,
    availableCopies: copies,
    addedBy: req.user._id,
  });

  await logAuditEvent({
    user: req.user,
    action: 'BOOK_CREATED',
    targetType: 'Book',
    targetId: book._id,
    details: { title: book.title, isbn: book.isbn, totalCopies: copies },
    ipAddress: req.ip,
  });

  // Instantly broadcast book creation to student and admin dashboards
  broadcastEvent({
    type: 'BOOK_MUTATION',
    action: 'create',
    bookId: book._id,
    book: {
      _id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    },
    message: `New book "${book.title}" added to the library catalog.`,
  });

  res.status(201).json({
    success: true,
    message: 'Book added to catalog successfully',
    book,
  });
};

// @desc    Update book details
// @route   PUT /api/books/:id
// @access  Librarian only
const updateBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found',
    });
  }

  const {
    title,
    author,
    isbn,
    publisher,
    edition,
    category,
    publicationYear,
    shelfLocation,
    description,
    totalCopies,
    availableCopies,
  } = req.body;

  if (isbn && isbn.trim().toUpperCase() !== book.isbn) {
    const existing = await Book.findOne({ isbn: isbn.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'ISBN is already in use by another book.',
      });
    }
    book.isbn = isbn.trim().toUpperCase();
  }

  if (title) book.title = title;
  if (author) book.author = author;
  if (publisher !== undefined) book.publisher = publisher;
  if (edition !== undefined) book.edition = edition;
  if (category) book.category = category;
  if (publicationYear !== undefined) book.publicationYear = publicationYear;
  if (shelfLocation !== undefined) book.shelfLocation = shelfLocation;
  if (description !== undefined) book.description = description;

  if (totalCopies !== undefined) {
    const newTotal = parseInt(totalCopies, 10);
    const issuedCount = book.totalCopies - book.availableCopies;
    if (newTotal < issuedCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total copies below currently issued count (${issuedCount} copies currently on loan).`,
      });
    }
    // Adjust available copies proportionally if total changed
    const diff = newTotal - book.totalCopies;
    book.totalCopies = newTotal;
    book.availableCopies = Math.max(0, book.availableCopies + diff);
  }

  if (availableCopies !== undefined) {
    const newAvailable = parseInt(availableCopies, 10);
    if (newAvailable > book.totalCopies) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot exceed total copies.',
      });
    }
    book.availableCopies = newAvailable;
  }

  await book.save();

  await logAuditEvent({
    user: req.user,
    action: 'BOOK_UPDATED',
    targetType: 'Book',
    targetId: book._id,
    details: { title: book.title, isbn: book.isbn },
    ipAddress: req.ip,
  });

  // Instantly broadcast book update to student and admin dashboards
  broadcastEvent({
    type: 'BOOK_MUTATION',
    action: 'update',
    bookId: book._id,
    book: {
      _id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    },
    message: `Book "${book.title}" details updated.`,
  });

  res.status(200).json({
    success: true,
    message: 'Book updated successfully',
    book,
  });
};

// @desc    Delete or archive a book
// @route   DELETE /api/books/:id
// @access  Librarian only
const deleteBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found',
    });
  }

  // Safety check: verify no active issued copies exist
  const activeLoans = await BorrowTransaction.countDocuments({
    book: book._id,
    status: 'issued',
  });

  if (activeLoans > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete book while ${activeLoans} copies are currently on loan to students.`,
    });
  }

  // Soft-delete to preserve borrowing history integrity
  book.isArchived = true;
  await book.save();

  await logAuditEvent({
    user: req.user,
    action: 'BOOK_ARCHIVED',
    targetType: 'Book',
    targetId: book._id,
    details: { title: book.title, isbn: book.isbn },
    ipAddress: req.ip,
  });

  // Instantly broadcast book removal to all dashboards
  broadcastEvent({
    type: 'BOOK_MUTATION',
    action: 'delete',
    bookId: book._id,
    message: `Book "${book.title}" was removed from the active catalog.`,
  });

  res.status(200).json({
    success: true,
    message: 'Book archived from catalog successfully. Historical records preserved.',
  });
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
