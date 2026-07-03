import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function TenantProfile() {
  const [form, setForm] = useState({ preferredLocation: '', budgetMin: '', budgetMax: '', moveInDate: '', bio: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/tenant/profile').then(({ profile }) => {
      if (profile) {
        setForm({
          preferredLocation: profile.preferredLocation || '',
          budgetMin: profile.budgetMin || '',
          budgetMax: profile.budgetMax || '',
          moveInDate: profile.moveInDate || '',
          bio: profile.bio || ''
        });
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/api/tenant/profile', form);
      setMessage('Profile saved successfully!');
    } catch (err) { setMessage(err.message); }
  };

  return (
    <div className="form-page">
      <h2>My Tenant Profile</h2>
      {message && <p className="info">{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Preferred Location</label>
        <input required value={form.preferredLocation}
          onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })} />
        <label>Budget Min</label>
        <input type="number" required value={form.budgetMin}
          onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} />
        <label>Budget Max</label>
        <input type="number" required value={form.budgetMax}
          onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} />
        <label>Move-in Date</label>
        <input type="date" required value={form.moveInDate}
          onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} />
        <label>Bio (lifestyle, preferences)</label>
        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}