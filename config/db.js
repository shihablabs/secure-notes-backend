const dns = require('dns');
const mongoose = require('mongoose');

// Use public DNS to resolve MongoDB Atlas SRV records smoothly across all networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Connect to MongoDB Atlas (freeCodeCamp standard pattern)
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
