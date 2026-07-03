import { Routes, Route, Navigate } from 'react-router-dom';
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
    <div className="home">
      <h1>Welcome to Rent & Flatmate Finder</h1>
      <p>Find your perfect room or flatmate with AI-powered compatibility matching.</p>
      {!user && <p>Please <a href="/login">login</a> or <a href="/register">register</a> to get started.</p>}
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