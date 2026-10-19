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

    // Suggested selling price
    suggestedSellingPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    // Final price displayed to customers
    price: { type: Number, default: null, min: 0 },

    // Product images
    imageUrl: { type: String, default: '', trim: true },
    images: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    // Product information
    sourceUrl: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },

    features: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    keywords: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    sku: { type: String, default: null, trim: true },
    category: { type: String, default: null, trim: true },
    stock: { type: Number, default: null, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('Product', productSchema);
