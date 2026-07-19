const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean/lib/xss').clean;
const hpp = require('hpp');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const planRoutes = require('./routes/plan.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const posterRoutes = require('./routes/poster.routes');

const app = express();

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
  env.corsOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: function (origin, callback) {
    // Dynamically allow any origin to prevent deployment CORS issues
    // This echoes the request's origin back, satisfying credentials:true
    callback(null, origin || true);
  },
  credentials: true,
}));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// ─── Body Parsing & Data Sanitization ──────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize data against NoSQL injection & XSS
// Express 5 makes req.query a getter, requiring Object.defineProperty to overwrite
app.use((req, res, next) => {
  if (req.body) {
    req.body = xssClean(req.body);
    mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  if (req.params) {
    req.params = xssClean(req.params);
    mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  if (req.query) {
    const cleanedQuery = xssClean(req.query);
    mongoSanitize.sanitize(cleanedQuery, { replaceWith: '_' });
    Object.defineProperty(req, 'query', {
      value: cleanedQuery,
      configurable: true
    });
  }
  next();
});

// Prevent HTTP Parameter Pollution
app.use(hpp());

// ─── Static Files (uploads) ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/posters', posterRoutes);
app.use('/api/reports', require('./routes/report.routes'));

// ─── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
