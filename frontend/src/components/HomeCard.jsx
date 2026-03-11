import { Link } from 'react-router-dom';

export default function HomeCard({ home }) {
  const image = home.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
  return (
    <Link
      to={`/homes/${home._id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:shadow-lg hover:ring-stone-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={image}
          alt={home.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-sm font-semibold text-stone-800 shadow">
          KES{home.pricePerNight}<span className="text-stone-500">/night</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-600">
          {home.location}
        </p>
        <h3 className="mt-1 font-semibold text-stone-900 group-hover:text-amber-600">
          {home.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-stone-600">
          {home.description}
        </p>
        {home.amenities?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {home.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
