const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, bookRules } = require('../validators');

// Public / Authenticated catalog browsing
router.get('/', getBooks);
router.get('/:id', getBookById);

// Catalog modifications: Restricted to authorized Librarians and Admins
router.post('/', protect, authorize('librarian', 'admin'), validate(bookRules), createBook);
router.put('/:id', protect, authorize('librarian', 'admin'), updateBook);
router.delete('/:id', protect, authorize('librarian', 'admin'), deleteBook);

module.exports = router;
