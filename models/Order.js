import mongoose from 'mongoose';

const shippingAddressSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    street: {
      type: String,
      required: true,
      trim: true,
    },

    building: {
      type: String,
      required: true,
      trim: true,
    },

    floor: {
      type: String,
      default: '',
      trim: true,
    },

    apartment: {
      type: String,
      default: '',
      trim: true,
    },

    landmark: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      default: null,
      trim: true,
    },

    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    notes: {
      type: String,
      default: null,
      trim: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'An order must contain at least one product.',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'AED',
    },

    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery'],
      default: 'cash_on_delivery',
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },

    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
