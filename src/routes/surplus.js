const express = require('express');
const router = express.Router();
const { Surplus } = require('../models');
const { protect } = require('../middleware/auth');

// GET all approved surplus listings
router.get('/', async (req, res) => {
  try {
    const { category, city, search, page = 1, limit = 20 } = req.query;
    const query = { isApproved: true, status: 'active' };
    if (category) query.category = category;
    if (city) query.city = new RegExp(city, 'i');
    if (search) query.title = new RegExp(search, 'i');
    const items = await Surplus.find(query)
      .populate('seller', 'name phone city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Surplus.countDocuments(query);
    res.json({ success: true, data: items, total, page: Number(page) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single listing
router.get('/:id', async (req, res) => {
  try {
    const item = await Surplus.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate('seller', 'name phone city company');
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST create listing
router.post('/', protect, async (req, res) => {
  try {
    const item = await Surplus.create({ ...req.body, seller: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT update
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await Surplus.findOne({ _id: req.params.id, seller: req.user._id });
    if (!item) return res.status(403).json({ success: false, message: 'Not authorized' });
    Object.assign(item, req.body);
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Surplus.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!item) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET my listings
router.get('/my/listings', protect, async (req, res) => {
  try {
    const items = await Surplus.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
