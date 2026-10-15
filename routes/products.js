import { Router } from 'express';
import Product from '../models/Product.js';

const router = Router();

// GET /api/products?page=1&limit=12&search=watch
router.get('/', async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 12;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const search = String(req.query.search || '').trim();

    const filter = { isActive: true };
    if (search) {
      filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('-__v')
        .sort({ createdAt: -1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = /^[a-f\d]{24}$/i.test(id)
      ? { _id: id, isActive: true }
      : { sourceProductId: id, isActive: true };
    const product = await Product.findOne(filter).select('-__v').lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load product.' });
  }
});

export default router;
