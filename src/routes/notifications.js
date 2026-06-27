const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/read', protect, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json({ success: true });
});

router.put('/read-all', protect, async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

module.exports = router;
