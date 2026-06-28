require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: '*', allowedHeaders: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── MongoDB ────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://developerankit0608_db_user:hhsQGXlrEhsq7BOG@contractor.dnpia3p.mongodb.net/contractorapp?retryWrites=true&w=majority&appName=contractor';

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  mongoose.set('strictQuery', false);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 20000,
    bufferCommands: false,
  });
  isConnected = true;
}

// Connect immediately
connectDB().catch(e => console.error('Startup connect error:', e.message));

// ── Health check (no auth needed) ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'running',
    db:      mongoose.connection.readyState === 1 ? 'connected ✓' : 'disconnected ✗',
    time:    new Date().toISOString(),
  });
});

// ── DB middleware (all /api routes) ───────────────────────────────────────────
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(503).json({ success: false, message: 'DB error: ' + err.message });
  }
});

// ── Test route to confirm routing works ───────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API routing works!', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ── Load all routes ───────────────────────────────────────────────────────────
const routeFiles = [
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

routeFiles.forEach(([path, file]) => {
  try {
    app.use(path, require(file));
    console.log(`✓ ${path}`);
  } catch (e) {
    console.error(`✗ ${path}: ${e.message}`);
  }
});

// ── Error handlers ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
});

// ── Local dev ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`\n🚀 http://localhost:${PORT}\n`)))
    .catch(console.error);
}

module.exports = app;
