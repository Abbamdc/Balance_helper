const { validationResult } = require('express-validator');
const Record = require('../models/Record');

// ── Helper ────────────────────────────────────────────────────
const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ── GET /api/records ──────────────────────────────────────────
// Returns all non-deleted records for the logged-in user
const getRecords = async (req, res) => {
  try {
    const { from, to, shift, limit = 200 } = req.query;

    const filter = { userId: req.user._id, isDeleted: false };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    if (shift && ['morning', 'afternoon'].includes(shift)) {
      filter.shift = shift;
    }

    const records = await Record.find(filter)
      .sort({ date: -1, shift: 1 })
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: { records, count: records.length } });
  } catch (err) {
    console.error('getRecords error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch records.' });
  }
};

// ── GET /api/records/:id ──────────────────────────────────────
const getRecord = async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    }).lean();

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    res.json({ success: true, data: { record } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch record.' });
  }
};

// ── POST /api/records ─────────────────────────────────────────
const createRecord = async (req, res) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const payload = buildPayload(req.body, req.user._id);
    const record = await Record.create(payload);

    res.status(201).json({
      success: true,
      message: 'Record saved.',
      data: { record },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A record for this date and shift already exists.',
        code: 'DUPLICATE_RECORD',
      });
    }
    console.error('createRecord error:', err);
    res.status(500).json({ success: false, message: 'Failed to save record.' });
  }
};

// ── PUT /api/records/:id ──────────────────────────────────────
const updateRecord = async (req, res) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      buildPayload(req.body, req.user._id),
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    res.json({ success: true, message: 'Record updated.', data: { record } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A record for this date and shift already exists.',
        code: 'DUPLICATE_RECORD',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update record.' });
  }
};

// ── DELETE /api/records/:id ───────────────────────────────────
// Soft delete — sets isDeleted: true
const deleteRecord = async (req, res) => {
  try {
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete record.' });
  }
};

// ── POST /api/records/sync ────────────────────────────────────
// Bulk upsert: client sends all local records, server merges them.
// Uses localId as the dedup key.
const syncRecords = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records provided.' });
    }

    if (records.length > 500) {
      return res.status(400).json({ success: false, message: 'Max 500 records per sync.' });
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    // Process in batches of 50
    const BATCH = 50;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);

      await Promise.all(
        batch.map(async (rec) => {
          try {
            if (!rec.localId) { results.skipped++; return; }

            const payload = buildPayload(rec, req.user._id);

            const result = await Record.findOneAndUpdate(
              { userId: req.user._id, localId: rec.localId },
              { $setOnInsert: payload },   // only write if new (client is source of truth)
              { upsert: true, new: false }
            );

            if (result === null) {
              results.created++;
            } else {
              results.skipped++; // already existed — server copy preserved
            }
          } catch (err) {
            results.errors.push({ localId: rec.localId, error: err.message });
          }
        })
      );
    }

    // Return the full updated list so client can replace its local cache
    const allRecords = await Record.find({
      userId: req.user._id,
      isDeleted: false,
    })
      .sort({ date: -1, shift: 1 })
      .lean();

    res.json({
      success: true,
      message: `Sync complete. Created: ${results.created}, Skipped: ${results.skipped}`,
      data: { records: allRecords, stats: results },
    });
  } catch (err) {
    console.error('syncRecords error:', err);
    res.status(500).json({ success: false, message: 'Sync failed.' });
  }
};

// ── GET /api/records/monthly ──────────────────────────────────
// Aggregated stats grouped by year-month
const getMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;

    const matchStage = {
      userId: req.user._id,
      isDeleted: false,
    };
    if (year) {
      matchStage.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          monthKey: { $substr: ['$date', 0, 7] }, // "2025-06"
        },
      },
      {
        $group: {
          _id: '$monthKey',
          totalLiters: { $sum: '$totalLiters' },
          totalAmountDue: { $sum: '$totalAmountDue' },
          totalDeposited: { $sum: '$totalDeposited' },
          totalOvers: {
            $sum: { $cond: [{ $gt: ['$diff', 0] }, '$diff', 0] },
          },
          totalShorts: {
            $sum: { $cond: [{ $lt: ['$diff', 0] }, { $abs: '$diff' }, 0] },
          },
          netBalance: { $sum: '$diff' },
          shiftCount: { $sum: 1 },
          shifts: {
            $push: {
              id: '$_id',
              localId: '$localId',
              date: '$date',
              shift: '$shift',
              totalLiters: '$totalLiters',
              totalAmountDue: '$totalAmountDue',
              totalDeposited: '$totalDeposited',
              diff: '$diff',
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ];

    const monthly = await Record.aggregate(pipeline);

    res.json({ success: true, data: { monthly } });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly summary.' });
  }
};

// ── Helper: build clean payload from request body ─────────────
const buildPayload = (body, userId) => ({
  userId,
  localId: body.localId,
  date: body.date,
  shift: body.shift,
  pumps: (body.pumps || []).map((p) => ({
    num: Number(p.num),
    open: Number(p.open),
    close: Number(p.close),
    price: Number(p.price),
    liters: Number(p.liters),
    amount: Number(p.amount),
  })),
  pos: Number(body.pos) || 0,
  deposits: (body.deposits || []).map((d) => ({
    label: String(d.label),
    value: Number(d.value),
  })),
  totalLiters: Number(body.totalLiters),
  totalAmountDue: Number(body.totalAmountDue),
  totalDeposited: Number(body.totalDeposited),
  diff: Number(body.diff),
});

module.exports = {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  syncRecords,
  getMonthlySummary,
};
