import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 500,
    },
    image: { type: String, required: true },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be greater than zero'],
    },
    category: {
      type: String,
      required: [true, 'Menu category is required'],
      trim: true,
      maxlength: 80,
      index: true,
    },
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'egg'],
      default: 'veg',
    },
    isAvailable: { type: Boolean, default: true },
    isRecommended: { type: Boolean, default: false },
    preparationTime: { type: Number, min: 1, max: 120, default: 15 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

menuItemSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text', category: 'text' });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
