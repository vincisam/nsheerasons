const serverless = require('serverless-http');
const app = require('../nsheera-backend/src/app');

module.exports = serverless(app);
