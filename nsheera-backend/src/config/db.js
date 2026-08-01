const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`✗ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
