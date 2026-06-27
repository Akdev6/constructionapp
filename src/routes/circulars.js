const express = require('express');
const router = express.Router();
const { Circular } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (search) query.title = new RegExp(search, 'i');
    const items = await Circular.find(query)
      .populate('publishedBy', 'name')
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await Circular.countDocuments(query);
    res.json({ success: true, data: items, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Circular.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin: create circular
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const item = await Circular.create({ ...req.body, publishedBy: req.user._id, isPublished: true, publishDate: new Date() });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await Circular.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Circular.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
