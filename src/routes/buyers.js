// buyers.js
const express = require('express');
const router = express.Router();
const { BuyerRequirement } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, city, search, page = 1, limit = 20 } = req.query;
    const query = { isApproved: true, status: 'open' };
    if (category) query.category = category;
    if (city) query.city = new RegExp(city, 'i');
    if (search) query.title = new RegExp(search, 'i');
    const items = await BuyerRequirement.find(query)
      .populate('buyer', 'name phone city company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await BuyerRequirement.countDocuments(query);
    res.json({ success: true, data: items, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await BuyerRequirement.findById(req.params.id).populate('buyer', 'name phone city company');
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const item = await BuyerRequirement.create({ ...req.body, buyer: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/respond', protect, async (req, res) => {
  try {
    const item = await BuyerRequirement.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    item.responses.push({ supplier: req.user._id, ...req.body });
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my/requirements', protect, async (req, res) => {
  try {
    const items = await BuyerRequirement.find({ buyer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
