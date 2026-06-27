const express = require('express');
const router = express.Router();
const { User, Surplus, Equipment, BuyerRequirement, Directory, Promotion, Circular, Job, Notification } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

const guard = [protect, adminOnly];

// ─── Dashboard stats ────────────────────────────────────────────────────────
router.get('/stats', guard, async (req, res) => {
  try {
    const [users, surplus, equipment, requirements, directories, jobs, promotions, circulars] = await Promise.all([
      User.countDocuments(),
      Surplus.countDocuments(),
      Equipment.countDocuments(),
      BuyerRequirement.countDocuments(),
      Directory.countDocuments(),
      Job.countDocuments(),
      Promotion.countDocuments(),
      Circular.countDocuments(),
    ]);
    const pendingApprovals = await Promise.all([
      Surplus.countDocuments({ isApproved: false }),
      Equipment.countDocuments({ isApproved: false }),
      Directory.countDocuments({ isApproved: false }),
      Promotion.countDocuments({ status: 'pending' }),
    ]);
    res.json({
      success: true,
      data: {
        users, surplus, equipment, requirements, directories, jobs, promotions, circulars,
        pendingApprovals: pendingApprovals.reduce((a, b) => a + b, 0),
        pendingBreakdown: {
          surplus: pendingApprovals[0],
          equipment: pendingApprovals[1],
          directory: pendingApprovals[2],
          promotions: pendingApprovals[3],
        }
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── Users ───────────────────────────────────────────────────────────────────
router.get('/users', guard, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, data: users, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/toggle-active', guard, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/role', guard, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── Content Approvals ────────────────────────────────────────────────────────
router.get('/pending/surplus', guard, async (req, res) => {
  const items = await Surplus.find({ isApproved: false }).populate('seller', 'name phone').sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

router.put('/approve/surplus/:id', guard, async (req, res) => {
  const item = await Surplus.findByIdAndUpdate(req.params.id, { isApproved: req.body.approve !== false }, { new: true });
  res.json({ success: true, data: item });
});

router.get('/pending/equipment', guard, async (req, res) => {
  const items = await Equipment.find({ isApproved: false }).populate('owner', 'name phone').sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

router.put('/approve/equipment/:id', guard, async (req, res) => {
  const item = await Equipment.findByIdAndUpdate(req.params.id, { isApproved: req.body.approve !== false }, { new: true });
  res.json({ success: true, data: item });
});

router.get('/pending/directory', guard, async (req, res) => {
  const items = await Directory.find({ isApproved: false }).populate('owner', 'name phone').sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

router.put('/approve/directory/:id', guard, async (req, res) => {
  const item = await Directory.findByIdAndUpdate(req.params.id, {
    isApproved: req.body.approve !== false,
    isVerified: req.body.verify === true,
  }, { new: true });
  res.json({ success: true, data: item });
});

// ─── Promotions Management ────────────────────────────────────────────────────
router.get('/promotions', guard, async (req, res) => {
  const promos = await Promotion.find().populate('advertiser', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: promos });
});

router.put('/promotions/:id/status', guard, async (req, res) => {
  const promo = await Promotion.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, data: promo });
});

// ─── Circulars ────────────────────────────────────────────────────────────────
router.get('/circulars', guard, async (req, res) => {
  const circulars = await Circular.find().populate('publishedBy', 'name').sort({ createdAt: -1 });
  res.json({ success: true, data: circulars });
});

// ─── Broadcast Notification ────────────────────────────────────────────────────
router.post('/broadcast', guard, async (req, res) => {
  try {
    const { title, body, type, targetRole } = req.body;
    const query = targetRole ? { role: targetRole } : {};
    const users = await User.find(query).select('_id');
    const notifs = users.map(u => ({ user: u._id, title, body, type: type || 'system' }));
    await Notification.insertMany(notifs);
    res.json({ success: true, message: `Notification sent to ${notifs.length} users` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── All listings for admin view ─────────────────────────────────────────────
router.get('/surplus', guard, async (req, res) => {
  const items = await Surplus.find().populate('seller', 'name phone').sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

router.get('/equipment', guard, async (req, res) => {
  const items = await Equipment.find().populate('owner', 'name phone').sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

router.get('/directory', guard, async (req, res) => {
  const items = await Directory.find().populate('owner', 'name phone').sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

router.get('/jobs', guard, async (req, res) => {
  const items = await Job.find().populate('postedBy', 'name phone').sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

// Seed admin user — supports both GET and POST so you can hit it from a browser
async function seedHandler(req, res) {
  try {
    const existing = await User.findOne({ email: 'admin@contractorapp.com' });
    if (existing) {
      return res.json({
        success: true,
        message: 'Admin already exists — use these credentials to log in',
        email: 'admin@contractorapp.com',
        password: 'Admin@123',
      });
    }
    await User.create({
      name: 'Super Admin',
      email: 'admin@contractorapp.com',
      phone: '9999999999',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    res.json({
      success: true,
      message: 'Admin account created successfully',
      email: 'admin@contractorapp.com',
      password: 'Admin@123',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      hint: 'Make sure MongoDB is running. Check your MONGO_URI in .env',
    });
  }
}

router.get('/seed', seedHandler);
router.post('/seed', seedHandler);

module.exports = router;
