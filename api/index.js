const serverless = require('serverless-http');
const app = require('../nsheera-backend/src/app');
const connectDB = require('../nsheera-backend/src/config/db');

let dbPromise = null;

const ensureDbConnected = () => {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = null; // allow retry on next request
      throw err;
    });
  }
  return dbPromise;
};

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await ensureDbConnected();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ success: false, message: 'Database unavailable: ' + err.message }));
    return;
  }
  return handler(req, res);
};
