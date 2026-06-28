const express = require('express');
const router = express.Router();
const { Job, JobProfile } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { trade, city, search, page = 1, limit = 20 } = req.query;
    const query = { status: 'open', isApproved: true };
    if (trade) query.trade = new RegExp(trade, 'i');
    if (city) query.city = new RegExp(city, 'i');
    if (search) query.title = new RegExp(search, 'i');
    const jobs = await Job.find(query)
      .populate('postedBy', 'name phone city company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await Job.countDocuments(query);
    res.json({ success: true, data: jobs, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name phone city company');
    if (!job) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/apply', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Not found' });
    const alreadyApplied = job.applications.find(a => a.applicant.toString() === req.user._id.toString());
    if (alreadyApplied) return res.status(400).json({ success: false, message: 'Already applied' });
    job.applications.push({ applicant: req.user._id, ...req.body });
    await job.save();
    res.json({ success: true, message: 'Applied successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update application status
router.put('/:jobId/applications/:applicantId', protect, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user._id });
    if (!job) return res.status(403).json({ success: false, message: 'Not authorized' });
    const app = job.applications.find(a => a.applicant.toString() === req.params.applicantId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    app.status = req.body.status;
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Job profile
router.get('/profile/me', protect, async (req, res) => {
  try {
    const profile = await JobProfile.findOne({ user: req.user._id });
    res.json({ success: true, data: profile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/profile', protect, async (req, res) => {
  try {
    const profile = await JobProfile.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, user: req.user._id },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
