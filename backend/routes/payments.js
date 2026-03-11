const express = require('express');
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const { verifyTransaction } = require('../services/paystack');
const axios = require("axios");

const router = express.Router();

router.post('/verify', protect, async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: 'Missing transaction reference' });
    }

    const verificationResult = await verifyTransaction(reference);

    // Check if payment was successful
    if (!verificationResult.status || verificationResult.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment was not successful' });
    }

    // Extract metadata from the transaction
    const metadata = verificationResult.data.metadata;
    const bookingId = metadata?.bookingId;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking information missing from payment.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for this payment.' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not allowed to update this booking.' });
    }

    booking.paymentStatus = 'paid';
    booking.paymentReference = verificationResult.data.reference;
    await booking.save();

    res.json({
      message: 'Payment verified successfully.',
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Payment verification failed.' });
  }
});

router.post("/initialize", async (req, res) => {
  try {
    const { bookingId, amount, email, name } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const reference = `booking_${bookingId}_${Date.now()}`;

    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(amount * 100), // Paystack expects kobo
        currency: "KES",
        reference,
        metadata: {
          bookingId,
          name
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const paymentLink = paystackResponse.data.data.authorization_url;

    // Save reference to booking
    booking.paymentReference = reference;
    await booking.save();

    res.status(200).json({
      paymentLink,
      reference
    });

  } catch (error) {
    console.error("PAYSTACK INIT ERROR:", error.response?.data || error.message);

    res.status(500).json({
      message: "Payment initialization failed"
    });
  }
});



module.exports = router;