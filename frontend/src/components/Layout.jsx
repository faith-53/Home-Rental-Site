import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-stone-800">
              <span className="text-2xl">🏠</span>
              HomeStay
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-stone-600 hover:text-stone-900">
                Browse
              </Link>
              {user ? (
                <>
                  <Link to="/bookings" className="text-stone-600 hover:text-stone-900">
                    My Bookings
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-stone-600 hover:text-stone-900">
                      Admin
                    </Link>
                  )}
                  <span className="text-sm text-stone-500">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-stone-600 hover:text-stone-900"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="mt-auto border-t border-stone-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-stone-500">
          © {new Date().getFullYear()} HomeStay. Find your perfect getaway.
        </div>
      </footer>
    </div>
  );
}
