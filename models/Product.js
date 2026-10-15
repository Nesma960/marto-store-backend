import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    source: { type: String, default: 'M5zoon', trim: true },
    sourceProductId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },

    // Supplier cost and profit
    supplierPrice: { type: Number, required: true, min: 0 },
    supplierCurrency: { type: String, default: 'AED', trim: true },
    displayedProfit: { type: Number, default: null, min: 0 },

    // Suggested selling price = supplier price + profit
    suggestedSellingPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    // Final price displayed to customers
    price: { type: Number, default: null, min: 0 },

    imageUrl: { type: String, default: '', trim: true },
    sourceUrl: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    sku: { type: String, default: null, trim: true },
    category: { type: String, default: null, trim: true },
    stock: { type: Number, default: null, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('Product', productSchema);
