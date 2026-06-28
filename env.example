const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { User } = require('../models');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, company, city, state } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone and password are required',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      phone:    phone.trim(),
      password,
      role:     role || 'contractor',
      company:  company?.trim() || '',
      city:     city?.trim()    || '',
      state:    state?.trim()   || '',
      isActive: true,
    });

    const token = signToken(user._id);
    return res.status(201).json({
      success: true,
      token,
      user: {
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        phone:   user.phone,
        city:    user.city,
        company: user.company,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    // Mongoose duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
    }
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email' });
    }
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    const token = signToken(user._id);
    return res.json({
      success: true,
      token,
      user: {
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        phone:   user.phone,
        city:    user.city,
        company: user.company,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/update-fcm
router.put('/update-fcm', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
