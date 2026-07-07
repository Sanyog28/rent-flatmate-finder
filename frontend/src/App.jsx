import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import TenantProfile from './pages/TenantProfile';
import Interests from './pages/Interests';
import OwnerDashboard from './pages/OwnerDashboard';
import ListingForm from './pages/ListingForm';
import OwnerInterests from './pages/OwnerInterests';
import ChatList from './pages/ChatList';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

function Home({ user }) {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Find Your Perfect <span className="highlight">Room</span> or <span className="highlight">Flatmate</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered compatibility matching that helps you discover the ideal living space
            based on your budget, location, and lifestyle preferences.
          </p>
          {!user ? (
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary">Get Started Free</Link>
              <Link to="/login" className="btn btn-secondary">Login</Link>
            </div>
          ) : (
            <div className="hero-buttons">
              {user.role === 'tenant' && <Link to="/browse" className="btn btn-primary">Browse Rooms</Link>}
              {user.role === 'owner' && <Link to="/owner" className="btn btn-primary">My Listings</Link>}
              {user.role === 'admin' && <Link to="/admin" className="btn btn-primary">Admin Dashboard</Link>}
            </div>
          )}
        </div>
        <div className="hero-image">
          <div className="hero-emoji">🏠</div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-item">
          <div className="stat-number">100+</div>
          <div className="stat-label">Active Listings</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">AI</div>
          <div className="stat-label">Smart Matching</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Real-time Chat</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">100%</div>
          <div className="stat-label">Verified Users</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Compatibility Score</h3>
            <p>Our smart AI analyzes your preferences and ranks listings based on how well they match your budget, location, and lifestyle.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Real-time Chat</h3>
            <p>Once your interest is accepted, chat instantly with owners or tenants using our real-time messaging system.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📧</div>
            <h3>Instant Notifications</h3>
            <p>Get email alerts when your interest is accepted or when a great tenant expresses interest in your listing.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your data is safe with role-based authentication and secure JWT-based sessions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Photo Listings</h3>
            <p>Browse rooms with real photos uploaded by verified owners for a complete visual experience.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Quick Interest</h3>
            <p>Express interest with a single click and get matched with the perfect room or tenant fast.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your account as a Tenant or Owner in seconds.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Create Profile / Listing</h3>
            <p>Tenants set preferences. Owners post room details with photos.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Get Matched</h3>
            <p>Our AI ranks the best matches based on compatibility scores.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Connect & Chat</h3>
            <p>Express interest, get accepted, and start chatting in real-time.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="cta-section">
          <h2>Ready to Find Your Perfect Match?</h2>
          <p>Join thousands of happy tenants and owners today.</p>
          <Link to="/register" className="btn btn-primary btn-large">Sign Up Now — It's Free</Link>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Rent & Flatmate Finder · Built with AI-powered matching</p>
      </footer>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/browse" element={<ProtectedRoute roles={['tenant']}><Browse /></ProtectedRoute>} />
          <Route path="/listings/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={['tenant']}><TenantProfile /></ProtectedRoute>} />
          <Route path="/interests" element={<ProtectedRoute roles={['tenant']}><Interests /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute roles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner/new" element={<ProtectedRoute roles={['owner']}><ListingForm /></ProtectedRoute>} />
          <Route path="/owner/interests" element={<ProtectedRoute roles={['owner']}><OwnerInterests /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute roles={['tenant', 'owner']}><ChatList /></ProtectedRoute>} />
          <Route path="/chat/:interestId" element={<ProtectedRoute roles={['tenant', 'owner']}><Chat /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
