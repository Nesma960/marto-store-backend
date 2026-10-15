import dns from 'node:dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Product from '../models/Product.js';

dns.setServers(['8.8.8.8']);

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDir, '../.env'),
});

async function setSellingPrices() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const result = await Product.updateMany(
      {
        suggestedSellingPrice: {
          $type: 'number',
          $gte: 0,
        },
      },
      [
        {
          $set: {
            price: '$suggestedSellingPrice',
          },
        },
      ],
      { updatePipeline: true },
    );

    console.log('Selling prices updated successfully.');
    console.log(`Matched products: ${result.matchedCount}`);
    console.log(`Modified products: ${result.modifiedCount}`);
    console.log('Currency: AED');
  } catch (error) {
    console.error('Failed to update selling prices:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

setSellingPrices();
