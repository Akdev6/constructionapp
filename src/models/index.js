const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── USER ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['contractor', 'supplier', 'worker', 'admin'], default: 'contractor' },
  company: String,
  city: String,
  state: String,
  profileImage: String,
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  fcmToken: String,
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

// ─── SURPLUS MATERIAL ─────────────────────────────────────────────────────────
const surplusSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true }, // cement, steel, bricks, tiles, pipes, paint, other
  quantity: { type: Number, required: true },
  unit: String, // bags, kg, tons, pieces, liters
  price: { type: Number, required: true },
  negotiable: { type: Boolean, default: false },
  images: [String],
  city: String,
  state: String,
  address: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'sold', 'inactive'], default: 'active' },
  views: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
}, { timestamps: true });

// ─── EQUIPMENT RENTAL ─────────────────────────────────────────────────────────
const equipmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String, // excavator, crane, mixer, compactor, generator, scaffolding
  brand: String,
  year: Number,
  dailyRate: { type: Number, required: true },
  weeklyRate: Number,
  monthlyRate: Number,
  deposit: Number,
  images: [String],
  city: String,
  state: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'rented', 'maintenance', 'inactive'], default: 'available' },
  isApproved: { type: Boolean, default: false },
}, { timestamps: true });

const rentalBookingSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: Date,
  endDate: Date,
  totalAmount: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'], default: 'pending' },
  message: String,
}, { timestamps: true });

// ─── BUYER REQUIREMENTS ───────────────────────────────────────────────────────
const buyerRequirementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  quantity: Number,
  unit: String,
  budget: Number,
  deadline: Date,
  city: String,
  state: String,
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'closed', 'fulfilled'], default: 'open' },
  responses: [{
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    price: Number,
    createdAt: { type: Date, default: Date.now },
  }],
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

// ─── CIRCULARS ────────────────────────────────────────────────────────────────
const circularSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: String, // GST, Labour, Safety, Tender, General
  attachmentUrl: String,
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: false },
  publishDate: Date,
  tags: [String],
  views: { type: Number, default: 0 },
}, { timestamps: true });

// ─── MANUFACTURER DIRECTORY ───────────────────────────────────────────────────
const directorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['manufacturer', 'distributor', 'dealer', 'supplier', 'service'] },
  description: String,
  categories: [String], // what they deal in
  logo: String,
  images: [String],
  address: String,
  city: String,
  state: String,
  phone: String,
  email: String,
  website: String,
  gstNumber: String,
  yearEstablished: Number,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

// ─── WORKFORCE / DIGITAL ENTRY ────────────────────────────────────────────────
const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: String,
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
}, { timestamps: true });

const workerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeId: String,
  trade: String, // mason, electrician, plumber, carpenter, helper
  dailyWage: Number,
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  aadhar: String,
  emergencyContact: String,
  joiningDate: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile' },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  date: { type: Date, required: true },
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ['present', 'absent', 'half-day', 'holiday'], default: 'present' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  overtimeHours: { type: Number, default: 0 },
}, { timestamps: true });

// ─── PROMOTIONS / ADS ─────────────────────────────────────────────────────────
const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  directoryListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Directory' },
  type: { type: String, enum: ['banner', 'featured', 'spotlight'], default: 'banner' },
  imageUrl: String,
  targetUrl: String,
  targetCategory: String,
  targetCity: String,
  startDate: Date,
  endDate: Date,
  budget: Number,
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'active', 'expired', 'rejected'], default: 'pending' },
}, { timestamps: true });

// ─── MANPOWER / JOBS ──────────────────────────────────────────────────────────
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  trade: String, // mason, electrician, plumber, carpenter, painter, welder
  experience: String,
  dailyWage: Number,
  duration: String,
  openings: { type: Number, default: 1 },
  city: String,
  state: String,
  site: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'filled', 'closed'], default: 'open' },
  applications: [{
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    coverNote: String,
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'hired'], default: 'applied' },
    appliedAt: { type: Date, default: Date.now },
  }],
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

const jobProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  trade: String,
  experience: Number, // years
  skills: [String],
  currentCity: String,
  willingToRelocate: Boolean,
  expectedWage: Number,
  bio: String,
  portfolio: [String],
  rating: { type: Number, default: 0 },
}, { timestamps: true });

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  body: String,
  type: String, // circular, job, requirement, promotion, system
  referenceId: String,
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Surplus: mongoose.model('Surplus', surplusSchema),
  Equipment: mongoose.model('Equipment', equipmentSchema),
  RentalBooking: mongoose.model('RentalBooking', rentalBookingSchema),
  BuyerRequirement: mongoose.model('BuyerRequirement', buyerRequirementSchema),
  Circular: mongoose.model('Circular', circularSchema),
  Directory: mongoose.model('Directory', directorySchema),
  Site: mongoose.model('Site', siteSchema),
  WorkerProfile: mongoose.model('WorkerProfile', workerProfileSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Promotion: mongoose.model('Promotion', promotionSchema),
  Job: mongoose.model('Job', jobSchema),
  JobProfile: mongoose.model('JobProfile', jobProfileSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
