const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, createUserRules } = require('../validators');

// All user management routes are restricted strictly to Administrators
router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.post('/', validate(createUserRules), createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);

module.exports = router;
