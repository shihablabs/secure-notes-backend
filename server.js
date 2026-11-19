const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Interactive Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    database: states[dbState] || 'Unknown',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'Secure Notes API is running cleanly...' });
});

// Central Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Process safety handlers to prevent abrupt process termination
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err && err.message ? err.message : err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception caught:', err && err.message ? err.message : err);
});

// graceful shutdown
const shutdown = async () => {
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
