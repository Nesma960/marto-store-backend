import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/Order.js';
import authRouter from './routes/auth.js';

dotenv.config();

// Use the custom DNS resolver only in local development.
if (!process.env.RENDER && !process.env.VERCEL) {
  dns.setServers(['62.240.110.198']);
}
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

// API routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Marto Store API is running!',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'M5zoon Backend is running!',
  });
});

// Start server after connecting to MongoDB
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exitCode = 1;
  }
}

startServer();
