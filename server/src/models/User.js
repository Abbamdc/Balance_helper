const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    pinHash: {
      type: String,
      default: null,
      select: false,
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark',
    },
    // Stores hashed refresh tokens so we can invalidate on logout
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Hash password before save ─────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// ── Instance methods ──────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.comparePin = async function (plainPin) {
  if (!this.pinHash) return false;
  return bcrypt.compare(plainPin, this.pinHash);
};

userSchema.methods.setPin = async function (plainPin) {
  if (!plainPin) {
    this.pinHash = null;
  } else {
    this.pinHash = await bcrypt.hash(plainPin, 12);
  }
};

// ── Safe public representation ────────────────────────────────
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    theme: this.theme,
    hasPin: !!this.pinHash,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
