import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🏠 Rent & Flatmate Finder</Link>
      <div className="nav-links">
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        {user?.role === 'tenant' && (
          <>
            <Link to="/browse">Browse</Link>
            <Link to="/profile">My Profile</Link>
            <Link to="/interests">My Interests</Link>
            <Link to="/chat">Chats</Link>
          </>
        )}
        {user?.role === 'owner' && (
          <>
            <Link to="/owner">My Listings</Link>
            <Link to="/owner/new">Post Listing</Link>
            <Link to="/owner/interests">Received Interests</Link>
            <Link to="/chat">Chats</Link>
          </>
        )}
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user && (
          <button onClick={() => { logout(); navigate('/login'); }}>
            Logout ({user.name})
          </button>
        )}
      </div>
    </nav>
  );
}