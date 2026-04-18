import { useState } from 'react';

const initialDonors = [
    { id: 1, name: 'Vikram Singh', blood: 'O+', phone: '+91-98765-43210', city: 'New Delhi', available: true, lastDonation: '2024-01-15', hemoglobin: 14.5 },
    { id: 2, name: 'Anita Gupta', blood: 'A+', phone: '+91-98765-43211', city: 'Mumbai', available: true, lastDonation: '2024-02-20', hemoglobin: 13.2 },
    { id: 3, name: 'Ravi Patel', blood: 'B-', phone: '+91-98765-43212', city: 'Ahmedabad', available: false, lastDonation: '2024-03-10', hemoglobin: 15.1 },
    { id: 4, name: 'Meera Sharma', blood: 'AB+', phone: '+91-98765-43213', city: 'Kolkata', available: true, lastDonation: '2024-03-15', hemoglobin: 12.8 },
    { id: 5, name: 'Farhan Khan', blood: 'O-', phone: '+91-98765-43214', city: 'Hyderabad', available: true, lastDonation: '2024-04-01', hemoglobin: 14.0 },
    { id: 6, name: 'Lakshmi Nair', blood: 'A-', phone: '+91-98765-43215', city: 'Chennai', available: true, lastDonation: '2024-03-25', hemoglobin: 13.5 },
];

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function BloodDonors() {
    const [donors, setDonors] = useState(initialDonors);
    const [search, setSearch] = useState('');
    const [filterBlood, setFilterBlood] = useState('');
    const [filterAvailable, setFilterAvailable] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDonor, setEditingDonor] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '', blood: 'O+', phone: '', city: '', hemoglobin: ''
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredDonors = donors.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.city.toLowerCase().includes(search.toLowerCase());
        const matchesBlood = !filterBlood || d.blood === filterBlood;
        const matchesAvailable = filterAvailable === '' || d.available === (filterAvailable === 'true');
        return matchesSearch && matchesBlood && matchesAvailable;
    });

    const toggleAvailability = (id) => {
        setDonors(donors.map(d => {
            if (d.id === id) {
                const newStatus = !d.available;
                showToast(newStatus ? 'Donor marked as available' : 'Donor marked as unavailable');
                return { ...d, available: newStatus };
            }
            return d;
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.city || !formData.hemoglobin) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (parseFloat(formData.hemoglobin) < 12.5) {
            showToast('Hemoglobin level too low for donation', 'error');
            return;
        }

        if (editingDonor) {
            setDonors(donors.map(d => d.id === editingDonor.id ? {
                ...d,
                ...formData,
                hemoglobin: parseFloat(formData.hemoglobin)
            } : d));
            showToast('Donor updated successfully!');
        } else {
            const newDonor = {
                id: Date.now(),
                ...formData,
                hemoglobin: parseFloat(formData.hemoglobin),
                available: true,
                lastDonation: null
            };
            setDonors([newDonor, ...donors]);
            showToast('New blood donor registered!');
        }

        setShowModal(false);
        setEditingDonor(null);
        setFormData({ name: '', blood: 'O+', phone: '', city: '', hemoglobin: '' });
    };

    const handleEdit = (donor) => {
        setEditingDonor(donor);
        setFormData({
            name: donor.name,
            blood: donor.blood,
            phone: donor.phone,
            city: donor.city,
            hemoglobin: donor.hemoglobin.toString()
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setDonors(donors.filter(d => d.id !== id));
        setShowDeleteConfirm(null);
        showToast('Donor removed successfully!');
    };

    const handleRequestBlood = (donor) => {
        showToast(`Blood request sent to ${donor.name}!`);
    };

    const getBloodTypeStats = (type) => donors.filter(d => d.blood === type && d.available).length;

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                    padding: '1rem 1.5rem', borderRadius: '8px',
                    background: toast.type === 'success' ? 'rgba(0, 212, 170, 0.95)' : 'rgba(233, 69, 96, 0.95)',
                    color: 'white', fontWeight: 500, animation: 'slideIn 0.3s ease'
                }}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title">🩸 Blood Donors</h1>
                    <p className="page-subtitle">Blood donor registry and availability management</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setEditingDonor(null);
                    setFormData({ name: '', blood: 'O+', phone: '', city: '', hemoglobin: '' });
                    setShowModal(true);
                }}>
                    <span>+</span> Register Blood Donor
                </button>
            </div>

            {/* Blood Type Stats */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">📊 Available by Blood Type</h3>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {donors.filter(d => d.available).length} available / {donors.length} total
                    </span>
                </div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '1rem' }}>
                    {bloodTypes.map(type => {
                        const count = getBloodTypeStats(type);
                        const isLow = count < 2;
                        return (
                            <div
                                key={type}
                                style={{
                                    textAlign: 'center', padding: '1rem',
                                    background: isLow ? 'rgba(233, 69, 96, 0.2)' : 'var(--bg-secondary)',
                                    borderRadius: '12px', cursor: 'pointer',
                                    border: filterBlood === type ? '2px solid var(--accent-primary)' : '2px solid transparent'
                                }}
                                onClick={() => setFilterBlood(filterBlood === type ? '' : type)}
                            >
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: isLow ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                                    {count}
                                </p>
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-primary)' }}>{type}</p>
                                {isLow && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>Low</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search by name or city..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1, minWidth: '200px', padding: '0.75rem 1rem',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    />
                    <select
                        value={filterAvailable}
                        onChange={(e) => setFilterAvailable(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="true">Available</option>
                        <option value="false">Unavailable</option>
                    </select>
                    {(search || filterBlood || filterAvailable) && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => { setSearch(''); setFilterBlood(''); setFilterAvailable(''); }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Donors Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Registered Donors ({filteredDonors.length})</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Donor</th>
                            <th>Blood Type</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Hemoglobin</th>
                            <th>Last Donation</th>
                            <th>Available</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDonors.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No donors found
                                </td>
                            </tr>
                        ) : (
                            filteredDonors.map(donor => (
                                <tr key={donor.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: donor.available ? 'var(--gradient-success)' : 'var(--bg-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                                            }}>
                                                {donor.name.charAt(0)}
                                            </div>
                                            <strong>{donor.name}</strong>
                                        </div>
                                    </td>
                                    <td><span className="blood-type">{donor.blood}</span></td>
                                    <td>{donor.phone}</td>
                                    <td>{donor.city}</td>
                                    <td style={{ color: donor.hemoglobin >= 12.5 ? 'var(--accent-secondary)' : 'var(--accent-primary)' }}>
                                        {donor.hemoglobin} g/dL
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {donor.lastDonation || 'Never'}
                                    </td>
                                    <td>
                                        <label className="toggle">
                                            <input
                                                type="checkbox"
                                                checked={donor.available}
                                                onChange={() => toggleAvailability(donor.id)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => handleEdit(donor)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => handleRequestBlood(donor)}
                                                disabled={!donor.available}
                                            >
                                                Request
                                            </button>
                                            <button
                                                style={{
                                                    padding: '0.4rem 0.75rem', background: 'rgba(233, 69, 96, 0.2)',
                                                    border: 'none', borderRadius: '8px', color: 'var(--accent-primary)',
                                                    cursor: 'pointer', fontSize: '0.8rem'
                                                }}
                                                onClick={() => setShowDeleteConfirm(donor.id)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div className="card" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">{editingDonor ? '✏️ Edit Donor' : '➕ Register Blood Donor'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body">
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Blood Type *</label>
                                        <select
                                            value={formData.blood}
                                            onChange={(e) => setFormData({ ...formData, blood: e.target.value })}
                                            style={{
                                                width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                                            }}
                                        >
                                            {bloodTypes.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Hemoglobin (g/dL) *</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="10"
                                            max="20"
                                            placeholder="e.g. 14.5"
                                            value={formData.hemoglobin}
                                            onChange={(e) => setFormData({ ...formData, hemoglobin: e.target.value })}
                                            style={{
                                                width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone *</label>
                                    <input
                                        type="tel"
                                        placeholder="+91-XXXXX-XXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>City *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        style={{
                                            width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {editingDonor ? 'Update' : 'Register'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px' }}>
                        <div className="card-header">
                            <h3 className="card-title">⚠️ Confirm Delete</h3>
                        </div>
                        <div className="card-body">
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                                Are you sure you want to remove this donor?
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleDelete(showDeleteConfirm)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toggle { position: relative; display: inline-block; width: 50px; height: 26px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--bg-secondary); transition: .3s; border-radius: 26px;
        }
        .toggle-slider:before {
          position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px;
          background-color: white; transition: .3s; border-radius: 50%;
        }
        .toggle input:checked + .toggle-slider { background: var(--accent-secondary); }
        .toggle input:checked + .toggle-slider:before { transform: translateX(24px); }
      `}</style>
        </div>
    );
}
