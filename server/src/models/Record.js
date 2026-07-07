const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────
const pumpSchema = new mongoose.Schema(
  {
    num: { type: Number, required: true },
    open: { type: Number, required: true, min: 0 },
    close: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    liters: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const depositSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// ── Main record schema ────────────────────────────────────────
const recordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Client-generated UUID — used to deduplicate sync uploads
    localId: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    shift: {
      type: String,
      enum: ['morning', 'afternoon'],
      required: [true, 'Shift is required'],
    },
    pumps: {
      type: [pumpSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 20,
        message: 'At least 1 pump is required (max 20)',
      },
    },
    pos: {
      type: Number,
      default: 0,
      min: 0,
    },
    deposits: {
      type: [depositSchema],
      default: [],
    },
    totalLiters: { type: Number, required: true },
    totalAmountDue: { type: Number, required: true },
    totalDeposited: { type: Number, required: true },
    // positive = over, negative = short, 0 = balanced
    diff: { type: Number, required: true },
    // Soft delete — records marked deleted are hidden but kept for audit
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound index: one record per user per date+shift ────────
recordSchema.index({ userId: 1, date: 1, shift: 1 }, { unique: true });

// ── Index for sync queries ────────────────────────────────────
recordSchema.index({ userId: 1, localId: 1 }, { unique: true });
recordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Record', recordSchema);
