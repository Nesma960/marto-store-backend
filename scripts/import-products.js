import dns from 'node:dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Product from '../models/Product.js';

dns.setServers(['8.8.8.8']);

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, '../.env') });

const jsonPath = resolve(currentDir, '../data/app-products.json');

async function importProducts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from app-backend/.env');
    }

    const fileContent = await readFile(jsonPath, 'utf8');
    const { products } = JSON.parse(fileContent);

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('The JSON file contains no products.');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const operations = products.map((product) => ({
      updateOne: {
        filter: { sourceProductId: String(product.sourceProductId) },
        update: {
          $setOnInsert: {
            ...product,
            sourceProductId: String(product.sourceProductId),
          },
        },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(operations, { ordered: true });

    console.log('Product import finished safely.');
    console.log(`Products in file: ${products.length}`);
    console.log(`New products inserted: ${result.upsertedCount}`);
    console.log('Existing products were not overwritten or deleted.');
    console.log('Store selling price (price) is left unset until you choose it.');
  } catch (error) {
    console.error('Product import failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

importProducts();
