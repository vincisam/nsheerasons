const serverless = require('serverless-http');
const app = require('../nsheera-backend/src/app');
const connectDB = require('../nsheera-backend/src/config/db');

let isConnected = false;

const ensureDbConnected = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

const handler = serverless(app);

module.exports = async (req, res) => {
  await ensureDbConnected();
  return handler(req, res);
};
