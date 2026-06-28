const express = require('express');
const router = express.Router();
const { Directory } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { type, category, city, search, page = 1, limit = 20 } = req.query;
    const query = { isApproved: true };
    if (type) query.type = type;
    if (city) query.city = new RegExp(city, 'i');
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }];
    if (category) query.categories = { $in: [new RegExp(category, 'i')] };
    const items = await Directory.find(query)
      .sort({ isVerified: -1, createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await Directory.countDocuments(query);
    res.json({ success: true, data: items, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Directory.findById(req.params.id).populate('owner', 'name email phone');
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const item = await Directory.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const item = await Directory.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body, { new: true }
    );
    if (!item) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
