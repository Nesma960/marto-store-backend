import { authenticateAdmin } from '../middleware/auth.js';
import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

const DELIVERY_FEE = 25;

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

function normalizeUaePhone(value) {
  if (typeof value !== 'string') return '';

  return value.replace(/[\s()-]/g, '');
}

function isValidUaeMobile(value) {
  const phone = normalizeUaePhone(value);

  return /^(?:05\d{8}|\+9715\d{8}|009715\d{8}|9715\d{8})$/.test(phone);
}

router.post('/', async (req, res) => {
  try {
    const { customerName, phone, alternatePhone, email, shippingAddress, notes, items } = req.body;

    // Validate customer information
    if (
      typeof customerName !== 'string' ||
      customerName.trim().length < 2 ||
      customerName.trim().length > 100 ||
      typeof phone !== 'string' ||
      !isValidUaeMobile(phone)
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid customer name and UAE mobile number are required.',
      });
    }

    // Validate optional customer information
    if (
      (alternatePhone != null &&
        (typeof alternatePhone !== 'string' ||
          (alternatePhone.trim() && !isValidUaeMobile(alternatePhone)))) ||
      (email != null && typeof email !== 'string') ||
      (notes != null && typeof notes !== 'string')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid optional customer information.',
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Validate UAE shipping address
    if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required.',
      });
    }

    const country = shippingAddress.country || 'United Arab Emirates';
    const { emirate, address } = shippingAddress;

    if (country !== 'United Arab Emirates') {
      return res.status(400).json({
        success: false,
        message: 'Shipping is currently available only within the UAE.',
      });
    }

    if (!UAE_EMIRATES.includes(emirate)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid UAE emirate.',
      });
    }

    if (typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a detailed address (5–500 characters).',
      });
    }

    // Validate order items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one product.',
      });
    }

    for (const item of items) {
      if (
        !item ||
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID or quantity.',
        });
      }
    }

    // Prevent duplicate product entries
    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds.map((id) => id.toString()));

    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Each product should appear only once.',
      });
    }

    // Get trusted product details and prices from MongoDB
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select('_id name price sourceProductId')
      .lean();

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products are unavailable.',
      });
    }

    const productsMap = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = [];

    for (const item of items) {
      const product = productsMap.get(item.productId.toString());

      if (
        !product ||
        typeof product.price !== 'number' ||
        !Number.isFinite(product.price) ||
        product.price < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'A product has an invalid selling price.',
        });
      }

      if (product.sourceProductId == null || String(product.sourceProductId).trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Product code is missing for ${product.name}.`,
        });
      }

      orderItems.push({
        product: product._id,
        productName: product.name,
        productCode: String(product.sourceProductId),
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Calculate totals on the server
    const subtotal = Number(
      orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2),
    );

    const total = Number((subtotal + DELIVERY_FEE).toFixed(2));

    // Save the order
    const order = await Order.create({
      customerName: customerName.trim(),
      phone: normalizeUaePhone(phone),
      alternatePhone: alternatePhone?.trim() ? normalizeUaePhone(alternatePhone) : null,
      email: email?.trim() || null,

      shippingAddress: {
        country: 'United Arab Emirates',
        emirate,
        address: address.trim(),
      },

      notes: notes?.trim() || null,

      items: orderItems,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total,
      currency: 'AED',
      paymentMethod: 'cash_on_delivery',
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error.message);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create order.',
    });
  }
});

// نجيب الطلبات المحفوظة
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Get orders error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders.',
    });
  }
});

router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status.',
        allowedStatuses,
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { orderStatus } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
    });
  }
});

// نجيب طلبًا واحدًا بالـ ID

router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order.',
    });
  }
});

export default router;
