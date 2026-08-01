require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    console.log('Starting Nsheera backend...');
    console.log('Node env:', process.env.NODE_ENV);
    console.log('Mongo URI present:', !!process.env.MONGO_URI);
    
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`✓ Nsheera backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
};

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});
