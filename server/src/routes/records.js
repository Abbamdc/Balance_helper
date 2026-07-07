const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  syncRecords,
  getMonthlySummary,
} = require('../controllers/recordsController');
const { protect } = require('../middleware/authMiddleware');

// All record routes require authentication
router.use(protect);

// ── Validation helpers ────────────────────────────────────────
const recordBodyRules = [
  body('localId').notEmpty().withMessage('localId is required'),
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be YYYY-MM-DD'),
  body('shift')
    .isIn(['morning', 'afternoon'])
    .withMessage('Shift must be morning or afternoon'),
  body('pumps')
    .isArray({ min: 1 })
    .withMessage('At least one pump is required'),
  body('pumps.*.num').isNumeric().withMessage('Pump number must be numeric'),
  body('pumps.*.open').isNumeric().withMessage('Opening meter must be numeric'),
  body('pumps.*.close').isNumeric().withMessage('Closing meter must be numeric'),
  body('pumps.*.price').isNumeric().withMessage('Price must be numeric'),
  body('totalLiters').isNumeric().withMessage('totalLiters must be numeric'),
  body('totalAmountDue').isNumeric().withMessage('totalAmountDue must be numeric'),
  body('totalDeposited').isNumeric().withMessage('totalDeposited must be numeric'),
  body('diff').isNumeric().withMessage('diff must be numeric'),
];

const mongoIdRule = param('id').isMongoId().withMessage('Invalid record ID');

// ── Routes ────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('from').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('to').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('shift').optional().isIn(['morning', 'afternoon']),
  ],
  getRecords
);

router.get('/monthly', getMonthlySummary);

router.get('/:id', mongoIdRule, getRecord);

router.post('/', recordBodyRules, createRecord);

router.post('/sync', syncRecords);

router.put('/:id', [mongoIdRule, ...recordBodyRules], updateRecord);

router.delete('/:id', mongoIdRule, deleteRecord);

module.exports = router;
