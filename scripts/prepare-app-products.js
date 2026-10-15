import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(currentDir, '../data');

const inputFiles = ['m5zoon-products-page1.json', 'm5zoon-products-pages2-12.json'];

async function prepareProducts() {
  const allProducts = [];

  for (const fileName of inputFiles) {
    const filePath = resolve(dataDir, fileName);
    const fileContent = await readFile(filePath, 'utf8');
    const { products } = JSON.parse(fileContent);

    if (!Array.isArray(products)) {
      throw new Error(`${fileName} does not contain a products array.`);
    }

    console.log(`${fileName}: ${products.length} products`);
    allProducts.push(...products);
  }

  const uniqueProducts = new Map();

  for (const product of allProducts) {
    if (
      product.sourceProductId === undefined ||
      product.sourceProductId === null ||
      String(product.sourceProductId).trim() === ''
    ) {
      throw new Error('A product is missing sourceProductId. No output file was written.');
    }

    const id = String(product.sourceProductId);

    if (!uniqueProducts.has(id)) {
      const suggestedSellingPrice =
        product.suggestedSellingPrice ??
        (product.supplierPrice != null && product.displayedProfit != null
          ? product.supplierPrice + product.displayedProfit
          : null);

      uniqueProducts.set(id, {
        ...product,
        sourceProductId: id,
        suggestedSellingPrice,
      });
    }
  }

  const products = [...uniqueProducts.values()];
  const outputPath = resolve(dataDir, 'app-products.json');

  await writeFile(outputPath, JSON.stringify({ products }, null, 2), 'utf8');

  console.log('Products file prepared successfully.');
  console.log(`Total products before deduplication: ${allProducts.length}`);
  console.log(`Unique products: ${products.length}`);
  console.log(`Saved to: ${outputPath}`);
}

prepareProducts().catch((error) => {
  console.error('Failed to prepare products:', error.message);
  process.exitCode = 1;
});
