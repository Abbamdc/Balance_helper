const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  updatePin,
  verifyPin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── Validation rules ──────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const pinRules = [
  body('newPin')
    .optional({ nullable: true })
    .if(body('newPin').exists({ checkFalsy: true }))
    .isLength({ min: 4, max: 6 }).withMessage('PIN must be 4–6 digits')
    .isNumeric().withMessage('PIN must be numeric only'),
];

const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number'),
];

const profileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }),
  body('theme').optional().isIn(['dark', 'light']).withMessage('Theme must be dark or light'),
];

// ── Public routes ─────────────────────────────────────────────
router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/refresh', refresh);

// ── Protected routes ──────────────────────────────────────────
router.use(protect); // all routes below require a valid access token

router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', getMe);
router.put('/profile', profileRules, updateProfile);
router.put('/password', passwordRules, changePassword);
router.put('/pin', pinRules, updatePin);
router.post('/verify-pin', verifyPin);

module.exports = router;
