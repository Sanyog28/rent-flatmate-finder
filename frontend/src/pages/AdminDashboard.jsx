import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);

  const load = async () => {
    const [act, u, l] = await Promise.all([
      api.get('/api/admin/activity'),
      api.get('/api/admin/users'),
      api.get('/api/admin/listings')
    ]);
    setStats(act.stats);
    setUsers(u.users);
    setListings(l.listings);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (id, isActive) => {
    await api.patch(`/api/admin/users/${id}`, { isActive: !isActive });
    load();
  };
  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/api/admin/users/${id}`);
    load();
  };
  const deleteListing = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/api/admin/listings/${id}`);
    load();
  };

  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div className="stats">
        <div>Users: {stats.userCount}</div>
        <div>Listings: {stats.listingCount}</div>
        <div>Interests: {stats.interestCount} (pending {stats.pendingInterests}, accepted {stats.acceptedInterests})</div>
        <div>Messages: {stats.messageCount}</div>
      </div>

      <h3>Users</h3>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => toggleActive(u.id, u.isActive)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                <button onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Listings</h3>
      <table className="table">
        <thead><tr><th>Title</th><th>Owner</th><th>Location</th><th>Rent</th><th>Filled</th><th>Actions</th></tr></thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td>{l.title}</td><td>{l.owner?.name}</td><td>{l.location}</td><td>{l.rent}</td><td>{l.isFilled ? 'Yes' : 'No'}</td>
              <td><button onClick={() => deleteListing(l.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}