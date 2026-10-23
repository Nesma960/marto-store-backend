import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/categories
// Get all active categories.
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ _id: 1 }).lean();

    return res.status(200).json({
      success: true,
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to load categories.',
    });
  }
});

// GET /api/categories/:categoryId/products
// Get products linked to a category using categoryIds.
router.get('/:categoryId/products', async (req, res) => {
  try {
    const category = await Category.findOne({
      sourceCategoryId: req.params.categoryId,
      isActive: true,
    }).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const requestedLimit = Number.parseInt(req.query.limit, 10) || 12;

    const limit = Math.min(100, Math.max(1, requestedLimit));

    const search = String(req.query.search || '').trim();

    const filter = {
      isActive: true,
      categoryIds: String(category.sourceCategoryId),
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.name = {
        $regex: escapedSearch,
        $options: 'i',
      };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(
          'sourceProductId name price imageUrl category categoryIds stock createdAt updatedAt',
        )
        .sort({ createdAt: -1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      category: {
        id: category.sourceCategoryId,
        name: category.name,
        slug: category.slug,
      },
      results: products.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    console.error('Get category products error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to load category products.',
    });
  }
});

export default router;
