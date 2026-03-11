const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Price per night is required'],
    min: [0, 'Price cannot be negative'],
  },
  images: [{
    type: String,
    trim: true,
  }],
  amenities: [{
    type: String,
    trim: true,
  }],
}, { timestamps: true });

homeSchema.index({ title: 'text', description: 'text', location: 'text' });
homeSchema.index({ location: 1 });
homeSchema.index({ pricePerNight: 1 });

module.exports = mongoose.model('Home', homeSchema);
