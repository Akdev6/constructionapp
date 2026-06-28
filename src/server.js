require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const mongoose = require('mongoose');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// ─── MongoDB Atlas connection (cached for serverless) ─────────────────────────
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://developerankit0608_db_user:hhsQGXlrEhsq7BOG@contractor.dnpia3p.mongodb.net/contractorapp?retryWrites=true&w=majority&appName=contractor';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✓ MongoDB Atlas connected');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    isConnected = false;
    throw err;
  }
};

// Connect on startup
connectDB().catch(err => console.error('Initial DB connect failed:', err.message));

// ─── DB connection middleware (ensures connection on every request for serverless) ─
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unavailable. Try again shortly.' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  message: 'ContractorApp API v1.0',
  status:  'running',
  db:      mongoose.connection.readyState === 1 ? 'connected ✓' : 'disconnected ✗',
  time:    new Date().toISOString(),
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
const routes = [
  ['/api/auth',          './routes/auth'],
  ['/api/users',         './routes/users'],
  ['/api/surplus',       './routes/surplus'],
  ['/api/equipment',     './routes/equipment'],
  ['/api/buyers',        './routes/buyers'],
  ['/api/circulars',     './routes/circulars'],
  ['/api/directory',     './routes/directory'],
  ['/api/workforce',     './routes/workforce'],
  ['/api/promotions',    './routes/promotions'],
  ['/api/manpower',      './routes/manpower'],
  ['/api/admin',         './routes/admin'],
  ['/api/notifications', './routes/notifications'],
];

routes.forEach(([path, file]) => {
  try {
    app.use(path, require(file));
    console.log(`✓ Route: ${path}`);
  } catch (e) {
    console.error(`✗ Route ${path} failed: ${e.message}`);
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Local server start (not used on Vercel) ──────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server: http://localhost:${PORT}`);
    console.log(`   Seed:   http://localhost:${PORT}/api/admin/seed\n`);
  });
}

module.exports = app;
