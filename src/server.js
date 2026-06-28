require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Routes — wrapped individually so one bad require doesn't kill the whole server
try { app.use('/api/auth', require('./routes/auth')); } catch(e) { console.error('auth route failed:', e.message); }
try { app.use('/api/users', require('./routes/users')); } catch(e) { console.error('users route failed:', e.message); }
try { app.use('/api/surplus', require('./routes/surplus')); } catch(e) { console.error('surplus route failed:', e.message); }
try { app.use('/api/equipment', require('./routes/equipment')); } catch(e) { console.error('equipment route failed:', e.message); }
try { app.use('/api/buyers', require('./routes/buyers')); } catch(e) { console.error('buyers route failed:', e.message); }
try { app.use('/api/circulars', require('./routes/circulars')); } catch(e) { console.error('circulars route failed:', e.message); }
try { app.use('/api/directory', require('./routes/directory')); } catch(e) { console.error('directory route failed:', e.message); }
try { app.use('/api/workforce', require('./routes/workforce')); } catch(e) { console.error('workforce route failed:', e.message); }
try { app.use('/api/promotions', require('./routes/promotions')); } catch(e) { console.error('promotions route failed:', e.message); }
try { app.use('/api/manpower', require('./routes/manpower')); } catch(e) { console.error('manpower route failed:', e.message); }
try { app.use('/api/admin', require('./routes/admin')); } catch(e) { console.error('admin route failed:', e.message); }
try { app.use('/api/notifications', require('./routes/notifications')); } catch(e) { console.error('notifications route failed:', e.message); }

app.get('/', (req, res) => res.json({ message: 'Contractor App API v1.0', status: 'running' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://developerankit0608_db_user:hhsQGXlrEhsq7BOG@contractor.dnpia3p.mongodb.net/?appName=contractor';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Start without DB for demo purposes
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (no DB)`));
  });

module.exports = app;
