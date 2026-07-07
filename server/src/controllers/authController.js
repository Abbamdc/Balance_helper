const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens } = require('../middleware/authMiddleware');

// ── Helper: send validation errors ───────────────────────────
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

// ── POST /api/auth/register ───────────────────────────────────
const register = async (req, res) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { name, email, password } = req.body;

    // Check if email already used
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password gets hashed by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // will be hashed in pre-save
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store hashed refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens = [hashedRefresh];
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: user.toPublic(),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Could not create account.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { email, password } = req.body;

    // Fetch user WITH passwordHash (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash +refreshTokens');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Rotate refresh tokens — keep last 5 devices max
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), hashedRefresh];
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toPublic(),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    // Verify the refresh token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    // Check it's in our stored list
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens?.length) {
      return res.status(401).json({ success: false, message: 'Session not found. Please log in again.' });
    }

    // Compare against stored hashes
    let tokenIndex = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      const match = await bcrypt.compare(refreshToken, user.refreshTokens[i]);
      if (match) { tokenIndex = i; break; }
    }

    if (tokenIndex === -1) {
      // Token reuse detected — clear all tokens (security measure)
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({
        success: false,
        message: 'Token reuse detected. All sessions have been revoked.',
      });
    }

    // Issue new token pair (rotate refresh token)
    const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(user._id);
    const hashedNewRefresh = await bcrypt.hash(newRefresh, 10);

    // Replace old token with new one
    user.refreshTokens[tokenIndex] = hashedNewRefresh;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        accessToken: newAccess,
        refreshToken: newRefresh,
      },
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ success: false, message: 'Token refresh failed.' });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove this specific refresh token (logs out one device)
      const user = await User.findById(req.user._id).select('+refreshTokens');
      if (user) {
        const filtered = [];
        for (const stored of user.refreshTokens || []) {
          const match = await bcrypt.compare(refreshToken, stored);
          if (!match) filtered.push(stored);
        }
        user.refreshTokens = filtered;
        await user.save({ validateBeforeSave: false });
      }
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// ── POST /api/auth/logout-all ─────────────────────────────────
const logoutAll = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshTokens: [] });
    res.json({ success: true, message: 'Logged out from all devices.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublic() } });
};

// ── PUT /api/auth/profile ─────────────────────────────────────
const updateProfile = async (req, res) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { name, theme } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (theme) updates.theme = theme;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: { user: user.toPublic() } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
};

// ── PUT /api/auth/password ────────────────────────────────────
const changePassword = async (req, res) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword; // pre-save hook hashes it
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
};

// ── PUT /api/auth/pin ─────────────────────────────────────────
const updatePin = async (req, res) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { currentPin, newPin } = req.body;
    const user = await User.findById(req.user._id).select('+pinHash');

    // If a PIN is already set, verify current PIN before changing
    if (user.pinHash) {
      if (!currentPin) {
        return res.status(400).json({ success: false, message: 'Current PIN is required to change your PIN.' });
      }
      const pinValid = await user.comparePin(currentPin);
      if (!pinValid) {
        return res.status(400).json({ success: false, message: 'Current PIN is incorrect.' });
      }
    }

    await user.setPin(newPin || null); // null = disable PIN
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: newPin ? 'PIN updated successfully.' : 'PIN disabled.',
      data: { hasPin: !!newPin },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'PIN update failed.' });
  }
};

// ── POST /api/auth/verify-pin ─────────────────────────────────
const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'PIN required.' });

    const user = await User.findById(req.user._id).select('+pinHash');
    if (!user.pinHash) {
      return res.status(400).json({ success: false, message: 'No PIN is set.' });
    }

    const valid = await user.comparePin(pin);
    res.json({ success: true, data: { valid } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'PIN verification failed.' });
  }
};

module.exports = {
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
};
