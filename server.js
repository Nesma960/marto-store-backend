import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns';

import productsRouter from './routes/products.js';
import ordersRouter from './routes/order.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
dotenv.config();

if (!process.env.RENDER && !process.env.VERCEL) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Cache the MongoDB connection for serverless requests.
let connectionPromise;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

// Connect to MongoDB before handling API requests.
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);

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

// Vercel uses the exported Express app.
// Locally, start a regular Express server.
if (process.env.VERCEL) {
  // Vercel handles incoming requests.
} else {
  connectToDatabase()
    .then(() => {
      console.log('MongoDB connected successfully');

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Server startup failed:', error.message);
      process.exitCode = 1;
    });
}

export default app;
