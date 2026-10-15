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

async function fixSuggestedSellingPrices() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const result = await Product.updateMany(
      {
        suggestedSellingPrice: { $exists: false },
        supplierPrice: { $ne: null },
        displayedProfit: { $ne: null },
      },
      [
        {
          $set: {
            suggestedSellingPrice: {
              $add: ['$supplierPrice', '$displayedProfit'],
            },
          },
        },
      ],
      { updatePipeline: true },
    );

    console.log('Price repair completed.');
    console.log(`Matched products: ${result.matchedCount}`);
    console.log(`Modified products: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Price repair failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

fixSuggestedSellingPrices();
