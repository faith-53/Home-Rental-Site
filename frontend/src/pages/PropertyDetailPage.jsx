import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import BookingForm from '../components/BookingForm';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    api
      .get(`/homes/${id}`)
      .then(setHome)
      .catch(() => setError('Home not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBookingSuccess = () => {
    setBookingSuccess(true);
    navigate('/bookings');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-96 animate-pulse rounded-2xl bg-stone-200" />
        <div className="mt-8 h-48 animate-pulse rounded-2xl bg-stone-200" />
      </div>
    );
  }

  if (error || !home) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-stone-600">{error || 'Home not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-amber-600 hover:underline"
        >
          Back to listings
        </button>
      </div>
    );
  }

  const images = home.images?.length ? home.images : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-600">
          {home.location}
        </p>
        <h1 className="text-3xl font-bold text-stone-900">{home.title}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-stone-100">
            <img
              src={images[0]}
              alt={home.title}
              className="h-96 w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.slice(1, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${home.title} ${i + 2}`}
                  className="aspect-[4/3] rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">About this place</h2>
            <p className="mt-4 whitespace-pre-wrap text-stone-600">
              {home.description}
            </p>
          </div>

          {home.amenities?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-stone-900">Amenities</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {home.amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <h3 className="font-semibold text-stone-900">Availability calendar</h3>
            <p className="mt-2 text-sm text-stone-600">
              Select your dates in the booking form to check availability. Dates already booked by other guests are automatically blocked.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingForm home={home} onSuccess={handleBookingSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}
