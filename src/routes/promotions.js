const express = require('express');
const router = express.Router();
const { Promotion } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const ads = await Promotion.find({ status: 'active', startDate: { $lte: now }, endDate: { $gte: now } })
      .populate('advertiser', 'name');
    res.json({ success: true, data: ads });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const promo = await Promotion.create({ ...req.body, advertiser: req.user._id });
    res.status(201).json({ success: true, data: promo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/impression', async (req, res) => {
  await Promotion.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } });
  res.json({ success: true });
});

router.post('/:id/click', async (req, res) => {
  await Promotion.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
  res.json({ success: true });
});

router.get('/my', protect, async (req, res) => {
  try {
    const promos = await Promotion.find({ advertiser: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: promos });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
