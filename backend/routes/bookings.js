const express = require('express');
const { body } = require('express-validator');
const Booking = require('../models/Booking');
const Home = require('../models/Home');
const { initializePayment } = require('../services/paystack');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

const checkAvailability = async (homeId, checkIn, checkOut, excludeBookingId = null) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Pending bookings only reserve the dates for a short grace period.
  const pendingGraceMs = 30 * 60 * 1000; // 30 minutes
  const pendingSince = new Date(Date.now() - pendingGraceMs);

  const overlappingQuery = {
    homeId,
    $or: [
      { checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } },
    ],
    $and: [
      {
        $or: [
          { paymentStatus: 'paid' },
          { paymentStatus: 'pending', createdAt: { $gte: pendingSince } },
        ],
      },
    ],
  };

  if (excludeBookingId) {
    overlappingQuery._id = { $ne: excludeBookingId };
  }

  const overlapping = await Booking.find(overlappingQuery);
  return overlapping.length === 0;
};

router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('homeId', 'title location images pricePerNight')
      .sort({ checkInDate: -1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  '/',
  [
    body('homeId').notEmpty().withMessage('Home ID is required'),
    body('checkInDate').notEmpty().withMessage('Check-in date is required').isDate().withMessage('Invalid check-in date'),
    body('checkOutDate').notEmpty().withMessage('Check-out date is required').isDate().withMessage('Invalid check-out date'),
  ],
  validate,
  async (req, res) => {
    try {
      const { homeId, checkInDate, checkOutDate } = req.body;

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      if (checkOut <= checkIn) {
        return res.status(400).json({ message: 'Check-out date must be after check-in date' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkIn < today) {
        return res.status(400).json({ message: 'Check-in date cannot be in the past' });
      }

      const home = await Home.findById(homeId);
      if (!home) {
        return res.status(404).json({ message: 'Home not found' });
      }

      const available = await checkAvailability(homeId, checkIn, checkOut);
      if (!available) {
        return res.status(400).json({ message: 'Property is not available for the selected dates' });
      }

      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * home.pricePerNight;

      const booking = await Booking.create({
        userId: req.user._id,
        homeId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPrice,
      });

      const populated = await Booking.findById(booking._id)
        .populate('homeId', 'title location images pricePerNight')
        .lean();

      let payment = null;
      try {
        payment = await initializePayment({
          amount: totalPrice,
          email: req.user.email,
          name: req.user.name,
          bookingId: booking._id.toString(),
        });
      } catch (paymentError) {
        // If payment initialization fails, return booking but surface error
        console.error("PAYSTACK INIT ERROR:", paymentError.response?.data || paymentError.message);
        return res.status(201).json({
          ...populated,
          paymentInitError: paymentError.message || 'Unable to start payment. Please try again.',
        });
      }

      res.status(201).json({
        ...populated,
        payment,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Admin routes for managing all bookings
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('homeId', 'title location images pricePerNight')
      .sort({ checkInDate: -1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put(
  '/admin/:id',
  protect,
  admin,
  [
    body('checkInDate').optional().isDate().withMessage('Invalid check-in date'),
    body('checkOutDate').optional().isDate().withMessage('Invalid check-out date'),
    body('totalPrice').optional().isNumeric().withMessage('Total price must be a number').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  ],
  validate,
  async (req, res) => {
    try {
      const { checkInDate, checkOutDate, totalPrice } = req.body;
      const booking = await Booking.findById(req.params.id).populate('homeId');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const updates = {};
      if (checkInDate) updates.checkInDate = new Date(checkInDate);
      if (checkOutDate) updates.checkOutDate = new Date(checkOutDate);
      if (totalPrice !== undefined) updates.totalPrice = totalPrice;

      // Validate dates if both are provided
      if (updates.checkInDate && updates.checkOutDate) {
        if (updates.checkOutDate <= updates.checkInDate) {
          return res.status(400).json({ message: 'Check-out date must be after check-in date' });
        }
      } else if (updates.checkInDate && booking.checkOutDate) {
        if (booking.checkOutDate <= updates.checkInDate) {
          return res.status(400).json({ message: 'Check-out date must be after check-in date' });
        }
      } else if (updates.checkOutDate && booking.checkInDate) {
        if (updates.checkOutDate <= booking.checkInDate) {
          return res.status(400).json({ message: 'Check-out date must be after check-in date' });
        }
      }

      // Check availability if dates are being changed
      if (updates.checkInDate || updates.checkOutDate) {
        const finalCheckIn = updates.checkInDate || booking.checkInDate;
        const finalCheckOut = updates.checkOutDate || booking.checkOutDate;
        const available = await checkAvailability(booking.homeId._id, finalCheckIn, finalCheckOut, req.params.id);
        if (!available) {
          return res.status(400).json({ message: 'Property is not available for the selected dates' });
        }
      }

      // Recalculate price if dates changed
      if (updates.checkInDate || updates.checkOutDate) {
        const finalCheckIn = updates.checkInDate || booking.checkInDate;
        const finalCheckOut = updates.checkOutDate || booking.checkOutDate;
        const nights = Math.ceil((finalCheckOut - finalCheckIn) / (1000 * 60 * 60 * 24));
        updates.totalPrice = nights * booking.homeId.pricePerNight;
      }

      const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
        .populate('userId', 'name email')
        .populate('homeId', 'title location images pricePerNight')
        .lean();

      res.json(updatedBooking);
    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(404).json({ message: 'Booking not found' });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete('/admin/:id', protect, admin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
