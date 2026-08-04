const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const designRoutes = require('./routes/designRoutes');
const astroRoutes = require('./routes/astroRoutes');
const jewelleryRoutes = require('./routes/jewelleryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { razorpayWebhook } = require('./controllers/paymentController');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { uploadRoot } = require('./middleware/upload');
const connectDB = require('./config/db');

const app = express();

// Trust proxy headers from Railway
app.set('trust proxy', 1);

// Hardcoded CORS headers middleware - runs before everything
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-JSON-Response');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));

// IMPORTANT: Razorpay webhook needs the RAW request body to verify the
// signature, so it must be registered BEFORE express.json() with its own
// express.raw() parser. It cannot live inside paymentRoutes.js, which is
// mounted after the global json parser below.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serves catalog images (/uploads/jewellery/...) — invoice PDFs are served
// via the authenticated /api/invoices/:id/pdf route instead, not statically.
app.use('/uploads/jewellery', express.static(path.join(uploadRoot, 'jewellery')));

// Basic rate limiting on the AI endpoints (Gemini calls cost money/quota)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many AI requests, please try again later.' },
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Nsheera API is running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Nsheera API is running', timestamp: new Date().toISOString(), version: '1.0.2' });
});

const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
};

app.use('/api/auth', ensureDbConnected, authRoutes);
app.use('/api/client', ensureDbConnected, clientRoutes);
app.use('/api/ai/jewellery-design', aiLimiter, designRoutes);
app.use('/api/ai/stone-suggestion', aiLimiter, astroRoutes);
app.use('/api/jewellery', ensureDbConnected, jewelleryRoutes);
app.use('/api/orders', ensureDbConnected, orderRoutes);
app.use('/api/payments', ensureDbConnected, paymentRoutes); // /api/payments/webhook is mounted separately above
app.use('/api/invoices', ensureDbConnected, invoiceRoutes);
app.use('/api/admin', ensureDbConnected, adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
