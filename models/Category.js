import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    source: {
      type: String,
      default: 'M5zoon',
      trim: true,
    },

    sourceCategoryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
