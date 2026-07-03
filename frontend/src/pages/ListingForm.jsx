import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ListingForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', location: '', rent: '', availableFrom: '',
    roomType: 'private', furnishingStatus: 'furnished', description: ''
  });
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach((p) => fd.append('photos', p));
      await api.post('/api/listings', fd, { isForm: true });
      navigate('/owner');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="form-page">
      <h2>Post Room Listing</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Title</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>Location</label>
        <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <label>Rent (monthly)</label>
        <input type="number" required value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
        <label>Available From</label>
        <input type="date" required value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} />
        <label>Room Type</label>
        <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
          <option value="private">Private Room</option>
          <option value="shared">Shared Room</option>
          <option value="studio">Studio</option>
          <option value="entire_flat">Entire Flat</option>
        </select>
        <label>Furnishing Status</label>
        <select value={form.furnishingStatus} onChange={(e) => setForm({ ...form, furnishingStatus: e.target.value })}>
          <option value="furnished">Furnished</option>
          <option value="semi_furnished">Semi-Furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
        <label>Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label>Photos</label>
        <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(Array.from(e.target.files))} />
        <button type="submit">Post Listing</button>
      </form>
    </div>
  );
}