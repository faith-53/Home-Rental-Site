import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function BookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api
      .get('/bookings')
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-stone-900">My Bookings</h1>
      <p className="mt-1 text-stone-600">
        Your upcoming and past reservations
      </p>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-stone-200 bg-white py-16 text-center">
          <p className="text-lg text-stone-600">You have no bookings yet.</p>
          <Link
            to="/"
            className="mt-4 inline-block text-amber-600 hover:underline"
          >
            Browse homes
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((b) => {
            const home = b.homeId;
            const image = home?.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
            const status = b.paymentStatus || 'pending';
            const isPaid = status === 'paid';
            
            // Check if payment is still pending and show retry option
            // Paystack uses 'reference' instead of 'txRef'
            const showRetry = !isPaid && !b.paymentReference;
            
            return (
              <div
                key={b._id}
                className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link to={`/homes/${home?._id}`} className="h-32 w-40 shrink-0 overflow-hidden bg-stone-100 sm:h-36 sm:w-48">
                  <img
                    src={image}
                    alt={home?.title}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <Link to={`/homes/${home?._id}`}>
                      <h3 className="font-semibold text-stone-900 hover:text-amber-600">
                        {home?.title || 'Home'}
                      </h3>
                    </Link>
                    <p className="text-sm text-stone-500">{home?.location}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-600">
                    <span>
                      {formatDate(b.checkInDate)} – {formatDate(b.checkOutDate)}
                    </span>
                    <span className="font-medium text-stone-900">
                      ${b.totalPrice} total
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                      }`}
                    >
                      {isPaid ? 'Paid' : 'Pending payment'}
                    </span>
                  </div>
                  {showRetry && (
                    <div className="mt-3">
                      <button
                        onClick={async () => {
                          try {
                            const paymentResponse = await api.post('/payments/initialize', {
                              bookingId: b._id,
                              amount: b.totalPrice,
                              email: user.email,
                              name: user.name,
                            });
                            // Paystack returns paymentLink and reference
                            window.location.href = paymentResponse.paymentLink;
                          } catch (error) {
                            alert('Failed to initialize payment. Please try again.');
                          }
                        }}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Complete payment →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}