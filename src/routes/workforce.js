const express = require('express');
const router = express.Router();
const { Site, WorkerProfile, Attendance } = require('../models');
const { protect } = require('../middleware/auth');

// Sites
router.get('/sites', protect, async (req, res) => {
  try {
    const sites = await Site.find({ $or: [{ owner: req.user._id }, { projectManager: req.user._id }] });
    res.json({ success: true, data: sites });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/sites', protect, async (req, res) => {
  try {
    const site = await Site.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: site });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Workers
router.get('/sites/:siteId/workers', protect, async (req, res) => {
  try {
    const workers = await WorkerProfile.find({ site: req.params.siteId, isActive: true })
      .populate('user', 'name phone');
    res.json({ success: true, data: workers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/workers', protect, async (req, res) => {
  try {
    const worker = await WorkerProfile.create(req.body);
    res.status(201).json({ success: true, data: worker });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Attendance
router.post('/attendance', protect, async (req, res) => {
  try {
    const { siteId, date, records } = req.body; // records: [{workerId, status, checkIn, checkOut}]
    const created = await Promise.all(
      records.map(r => Attendance.findOneAndUpdate(
        { worker: r.workerId, site: siteId, date: new Date(date) },
        { ...r, site: siteId, date: new Date(date), markedBy: req.user._id },
        { upsert: true, new: true }
      ))
    );
    res.json({ success: true, data: created });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/attendance/:siteId', protect, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { site: req.params.siteId };
    if (date) query.date = new Date(date);
    const records = await Attendance.find(query)
      .populate({ path: 'worker', populate: { path: 'user', select: 'name phone' } });
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
