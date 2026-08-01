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

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false })); // allow serving /uploads images cross-origin
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'https://nsheerasons-crnr.vercel.app',
        'https://nsheerasons.vercel.app',
        process.env.CORS_ORIGIN,
        'https://vincisam.github.io',
        'http://localhost:3000',
        'http://localhost:5173',
      ].filter(Boolean);
      
      // Allow requests without origin (like mobile apps or non-browser clients)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS rejected origin:', origin);
        callback(null, true); // Allow for now
      }
    },
    credentials: true,
  })
);

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

app.options('*', cors()); // enable pre-flight

app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/ai/jewellery-design', aiLimiter, designRoutes);
app.use('/api/ai/stone-suggestion', aiLimiter, astroRoutes);
app.use('/api/jewellery', jewelleryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes); // /api/payments/webhook is mounted separately above
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
