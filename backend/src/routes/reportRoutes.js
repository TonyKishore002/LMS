const express = require('express');
const router = express.Router();
const {
  getStudentDashboardStats,
  getAdminDashboardStats,
  getLibrarianDashboardStats,
  getInventoryReport,
  getCirculationReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/student-dashboard', authorize('student'), getStudentDashboardStats);
router.get('/admin-dashboard', authorize('admin'), getAdminDashboardStats);
router.get('/librarian-dashboard', authorize('librarian'), getLibrarianDashboardStats);

router.get('/inventory', authorize('librarian', 'admin'), getInventoryReport);
router.get('/circulation', authorize('librarian', 'admin'), getCirculationReport);

module.exports = router;
