const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Student reservations
router.post('/', authorize('student'), createReservation);
router.get('/my-reservations', authorize('student'), getMyReservations);
router.patch('/:id/cancel', cancelReservation);

// Librarian view
router.get('/', authorize('librarian'), getAllReservations);

module.exports = router;
