import mongoose from 'mongoose';
import slugify from 'slugify';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: 100,
    },
    slug: { type: String, unique: true, lowercase: true, index: true },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 800,
    },
    image: { type: String, required: true },
    bannerImage: { type: String, required: true },
    cuisines: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: 'At least one cuisine is required',
      },
    },
    tags: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 4.2 },
    ratingCount: { type: Number, min: 0, default: 0 },
    deliveryTime: {
      min: { type: Number, min: 5, max: 180, default: 25 },
      max: { type: Number, min: 5, max: 240, default: 40 },
    },
    deliveryFee: { type: Number, min: 0, default: 29 },
    minOrder: { type: Number, min: 0, default: 149 },
    priceForTwo: { type: Number, min: 0, default: 400 },
    offer: { type: String, trim: true, maxlength: 120, default: '' },
    address: {
      line1: { type: String, required: true, trim: true },
      area: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true, index: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [77.5946, 12.9716],
      },
    },
    isActive: { type: Boolean, default: true, index: true },
    isOpen: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

restaurantSchema.index({ 'address.city': 1, isActive: 1, rating: -1 });
restaurantSchema.index({ cuisines: 1 });
restaurantSchema.index({ name: 'text', description: 'text', cuisines: 'text', tags: 'text' });
restaurantSchema.index({ location: '2dsphere' });

restaurantSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
