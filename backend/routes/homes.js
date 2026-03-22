const express = require('express');
const { body } = require('express-validator');
const Home = require('../models/Home');
const Booking = require('../models/Booking');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require("../middleware/upload");

const router = express.Router();

router.get('/:id/available', async (req, res) => {
  try {
    // Mirror the same logic used in bookings availability: only paid or very recent pending bookings
    const pendingGraceMs = 30 * 60 * 1000; // 30 minutes
    const pendingSince = new Date(Date.now() - pendingGraceMs);

    const bookings = await Booking.find({
      homeId: req.params.id,
      $or: [
        { paymentStatus: 'paid' },
        { paymentStatus: 'pending', createdAt: { $gte: pendingSince } },
      ],
    }).select('checkInDate checkOutDate').lean();

    const bookedDates = bookings.flatMap((b) => {
      const dates = [];
      const start = new Date(b.checkInDate);
      const end = new Date(b.checkOutDate);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
      return dates;
    });

    res.json({ bookedDates: [...new Set(bookedDates)] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { location, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;

    let query = {};

    if (location) {
      query.location = new RegExp(location, 'i');
    }

    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const homes = await Home.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Home.countDocuments(query);

    res.json({
      homes,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/locations', async (req, res) => {
  try {
    const locations = await Home.distinct('location');
    res.json(locations.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const home = await Home.findById(req.params.id).lean();
    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }
    res.json(home);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Home not found' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Admin routes for managing homes
router.post(
  '/',
  protect,
  admin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const imageUrls = req.files.map(file => file.path);

      const home = await Home.create({
        ...req.body,
        images: imageUrls
      });

      res.status(201).json(home);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  '/:id',
  protect,
  admin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      let updateData = { ...req.body };

      if (req.files && req.files.length > 0) {
        updateData.images = req.files.map(file => file.path);
      }

      const home = await Home.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!home) {
        return res.status(404).json({ message: "Home not found" });
      }

      res.json(home);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const home = await Home.findByIdAndDelete(req.params.id);
    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }
    // Also delete associated bookings
    await Booking.deleteMany({ homeId: req.params.id });
    res.json({ message: 'Home deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Home not found' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
