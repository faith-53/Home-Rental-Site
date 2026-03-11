const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  homeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home',
    required: [true, 'Home is required'],
  },
  checkInDate: {
    type: Date,
    required: [true, 'Check-in date is required'],
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Check-out date is required'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentReference: {
    type: String,
  },
}, { timestamps: true });

bookingSchema.index({ homeId: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ userId: 1 });

bookingSchema.pre('save', function () {
  if (this.checkOutDate <= this.checkInDate) {
    throw new Error('Check-out date must be after check-in date');
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
