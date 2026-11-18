const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  };
};

const loginRules = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .custom((val) => {
      if (!val.toLowerCase().endsWith('@college.edu')) {
        throw new Error('Only @college.edu email addresses are permitted in this LMS.');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password is required'),
  body('role')
    .optional()
    .isIn(['student', 'librarian', 'admin'])
    .withMessage('Role must be student, librarian, or admin'),
];

const studentRegisterRules = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email')
    .isEmail()
    .withMessage('Valid college email is required')
    .custom((val) => {
      if (!val.toLowerCase().endsWith('@college.edu')) {
        throw new Error('Only official @college.edu email addresses are permitted in this LMS.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('studentId').trim().notEmpty().withMessage('Student ID number is required'),
  body('department').optional().trim(),
  body('phone').optional().trim(),
  body('role')
    .optional()
    .custom((val) => {
      if (val && val !== 'student') {
        throw new Error('Public registration is only permitted for students. Admin or librarian accounts cannot be registered publicly.');
      }
      return true;
    }),
];

const createUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .custom((val) => {
      if (!val.toLowerCase().endsWith('@college.edu')) {
        throw new Error('Only official @college.edu email addresses are permitted in this LMS.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['student', 'librarian', 'admin'])
    .withMessage('Role must be student, librarian, or admin'),
];

const bookRules = [
  body('title').trim().notEmpty().withMessage('Book title is required'),
  body('author').trim().notEmpty().withMessage('Author name is required'),
  body('isbn').trim().notEmpty().withMessage('ISBN is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('totalCopies')
    .isInt({ min: 0 })
    .withMessage('Total copies must be a non-negative integer'),
  body('availableCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative integer'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

module.exports = {
  validate,
  loginRules,
  studentRegisterRules,
  createUserRules,
  bookRules,
  changePasswordRules,
};
