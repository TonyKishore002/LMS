const express = require('express');
const router = express.Router();
const {
  requestBorrow,
  getMyIssuedBooks,
  getMyHistory,
  getCirculationRecords,
  approveRequest,
  rejectRequest,
  directIssue,
  returnBook,
  getOverdueBooks,
} = require('../controllers/circulationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Student circulation endpoints
router.post('/request', authorize('student'), requestBorrow);
router.get('/my-issued', authorize('student'), getMyIssuedBooks);
router.get('/my-history', authorize('student'), getMyHistory);

// Librarian circulation endpoints
router.get('/', authorize('librarian'), getCirculationRecords);
router.post('/issue-direct', authorize('librarian'), directIssue);
router.post('/:id/approve', authorize('librarian'), approveRequest);
router.post('/:id/reject', authorize('librarian'), rejectRequest);
router.post('/:id/return', authorize('librarian'), returnBook);
router.get('/overdue', authorize('librarian'), getOverdueBooks);

module.exports = router;
