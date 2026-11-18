const express = require('express');
const router = express.Router();
const {
  getFines,
  getMyFines,
  payFine,
  waiveFine,
} = require('../controllers/fineController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-fines', authorize('student'), getMyFines);
router.get('/', authorize('librarian', 'admin'), getFines);
router.patch('/:id/pay', authorize('librarian'), payFine);
router.patch('/:id/waive', authorize('librarian'), waiveFine);

module.exports = router;
