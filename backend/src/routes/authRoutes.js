const express = require('express');
const router = express.Router();
const {
  login,
  registerStudent,
  getMe,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  loginRules,
  studentRegisterRules,
  changePasswordRules,
} = require('../validators');

router.post('/login', loginLimiter, validate(loginRules), login);
router.post('/register-student', validate(studentRegisterRules), registerStudent);
router.get('/me', protect, getMe);
router.put('/change-password', protect, validate(changePasswordRules), changePassword);

module.exports = router;
