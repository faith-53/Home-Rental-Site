import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export default function BookingForm({ home, onSuccess }) {
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(true);

  useEffect(() => {
    api
      .get(`/homes/${home._id}/available`)
      .then(({ bookedDates: b }) => setBookedDates(b || []))
      .catch(() => setBookedDates([]))
      .finally(() => setLoadingDates(false));
  }, [home._id]);

  const isDateDisabled = (dateStr) => {
    return bookedDates.includes(dateStr);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleCheckInChange = (val) => {
    setCheckIn(val);
    if (checkOut && val && new Date(checkOut) <= new Date(val)) {
      setCheckOut('');
    }
    setError('');
  };

  const handleCheckOutChange = (val) => {
    setCheckOut(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!checkIn || !checkOut) {
      setError('Please select both check-in and check-out dates');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out must be after check-in');
      return;
    }

    const dates = [];
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    const hasOverlap = dates.some((d) => bookedDates.includes(d));
    if (hasOverlap) {
      setError('Some selected dates are no longer available');
      return;
    }

    setLoading(true);
    try {
      const booking = await api.post('/bookings', {
        homeId: home._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      });

      if (booking.paymentInitError) {
        setError(booking.paymentInitError);
        return;
      }

      // Paystack returns paymentLink and reference 
      const paymentLink = booking.payment?.paymentLink;
      const reference = booking.payment?.reference;

      if (!paymentLink || !reference) {
        setError('Could not start payment. Please try again.');
        return;
      }

      onSuccess?.();
      window.location.href = paymentLink;
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-stone-900">Reserve</h3>
        <p className="mt-2 text-sm text-stone-600">
          Please log in to make a booking.
        </p>
        <Link
          to="/login"
          className="mt-4 block w-full rounded-lg bg-amber-500 py-2.5 text-center font-medium text-white hover:bg-amber-600"
        >
          Log in
        </Link>
      </div>
    );
  }

  const nights = checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
    ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = nights * (home.pricePerNight || 0);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-stone-900">Reserve</h3>
      <p className="mt-1 text-sm text-stone-600">
        KES{home.pricePerNight} / night
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Check-in
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => handleCheckInChange(e.target.value)}
            min={getMinDate()}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Check-out
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => handleCheckOutChange(e.target.value)}
            min={checkIn || getMinDate()}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {loadingDates && (
        <p className="mt-2 text-xs text-stone-500">Loading availability...</p>
      )}

      {nights > 0 && (
        <div className="mt-6 space-y-1 border-t border-stone-200 pt-4">
          <div className="flex justify-between text-sm">
            <span>KES{home.pricePerNight} x {nights} nights</span>
            <span>KES{totalPrice}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>KES{totalPrice}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !checkIn || !checkOut || nights <= 0}
        className="mt-6 w-full rounded-lg bg-amber-500 py-2.5 font-medium text-dark hover:bg-amber-600 disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Reserve'}
      </button>
    </form>
  );
}