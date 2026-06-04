const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

// ─── Critical environment variable check ──────────────────────────
// This runs BEFORE any route is registered so problems surface immediately
// at startup rather than mid-request with a confusing JWT error.
if (!process.env.JWT_SECRET) {
  console.error('\n❌ FATAL: JWT_SECRET is not set in your .env file.');
  console.error('   Register and login will not work without it.');
  console.error('   Fix: Add   JWT_SECRET=anyLongRandomString   to your .env file.\n');
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not set. PathGuider AI chat will use local-fallback mode only.');
}


const app = express();

// ─── CORS Configuration ───────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://161.118.176.145',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
  })
);

// ─── Security & Parsing Middleware ────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));      // disable CSP for API-only server
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Timestamp ────────────────────────────────────────────
app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/careers', require('./routes/careers'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/simulation', require('./routes/simulation'));
app.use('/api/github', require('./routes/github'));
app.use('/api/simchat', require('./routes/simchat'));
app.use('/api/nexus', require('./routes/nexus'));

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Career Pathway API is running',
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  // CORS error
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ success: false, error: err.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: 'Validation failed', details: messages });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, error: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired, please log in again' });
  }

  // Generic server error
  console.error(`[${new Date().toISOString()}] ERROR:`, err.stack);
  res.status(err.statusCode || err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Database Connection & Server Start ───────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/career_pathway_db';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const startServer = async () => {
  // Start HTTP server immediately regardless of DB state
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });

  const connectDB = async () => {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ MongoDB connected successfully');
      mongoose.connection.on('error', err => console.error('❌ MongoDB error:', err));
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected — retrying in 5s...');
        setTimeout(connectDB, 5000);
      });
      mongoose.connection.on('reconnected', () => console.log('🔄 MongoDB reconnected'));
    } catch (err) {
      console.error('❌ MongoDB not available:', err.message);
      console.log('🔄 Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    }
  };

  connectDB();
};


// ─── Graceful Shutdown ────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled Rejection:', reason);
});

startServer();

module.exports = app;
