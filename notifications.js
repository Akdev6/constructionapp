const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, company, city, state, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, company, city, state, profileImage },
      { new: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
