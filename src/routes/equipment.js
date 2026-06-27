const express = require('express');
const router = express.Router();
const { Equipment, RentalBooking } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, city, search, page = 1, limit = 20 } = req.query;
    const query = { isApproved: true, status: 'available' };
    if (category) query.category = category;
    if (city) query.city = new RegExp(city, 'i');
    if (search) query.title = new RegExp(search, 'i');
    const items = await Equipment.find(query)
      .populate('owner', 'name phone city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Equipment.countDocuments(query);
    res.json({ success: true, data: items, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id).populate('owner', 'name phone city company');
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const item = await Equipment.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const item = await Equipment.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body, { new: true }
    );
    if (!item) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Booking routes
router.post('/:id/book', protect, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    const booking = await RentalBooking.create({
      equipment: equipment._id,
      renter: req.user._id,
      ...req.body
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my/listings', protect, async (req, res) => {
  try {
    const items = await Equipment.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my/bookings', protect, async (req, res) => {
  try {
    const bookings = await RentalBooking.find({ renter: req.user._id })
      .populate('equipment', 'title dailyRate images')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
