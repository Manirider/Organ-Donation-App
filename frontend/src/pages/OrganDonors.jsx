import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialDonors = [
    { id: 1, name: 'Rajesh Kumar', age: 35, blood: 'O+', organs: ['Kidney', 'Liver'], city: 'New Delhi', status: 'Active', registered: '2024-01-15' },
    { id: 2, name: 'Priya Sharma', age: 28, blood: 'A+', organs: ['Kidney'], city: 'Mumbai', status: 'Active', registered: '2024-02-20' },
    { id: 3, name: 'Amit Patel', age: 42, blood: 'B-', organs: ['Heart', 'Lungs', 'Kidney'], city: 'Ahmedabad', status: 'Pending', registered: '2024-03-10' },
    { id: 4, name: 'Sunita Devi', age: 30, blood: 'AB+', organs: ['Cornea'], city: 'Kolkata', status: 'Active', registered: '2024-03-15' },
    { id: 5, name: 'Mohammed Khan', age: 38, blood: 'O-', organs: ['Kidney', 'Liver', 'Heart'], city: 'Hyderabad', status: 'Active', registered: '2024-04-01' },
];

const organOptions = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Cornea', 'Pancreas', 'Intestine', 'Bone Marrow'];
const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function OrganDonors() {
    const navigate = useNavigate();
    const [donors, setDonors] = useState(initialDonors);
    const [search, setSearch] = useState('');
    const [filterBlood, setFilterBlood] = useState('');
    const [filterOrgan, setFilterOrgan] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDonor, setEditingDonor] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '', age: '', blood: 'O+', city: '', organs: []
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredDonors = donors.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.city.toLowerCase().includes(search.toLowerCase());
        const matchesBlood = !filterBlood || d.blood === filterBlood;
        const matchesOrgan = !filterOrgan || d.organs.includes(filterOrgan);
        return matchesSearch && matchesBlood && matchesOrgan;
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.age || !formData.city || formData.organs.length === 0) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (editingDonor) {
            setDonors(donors.map(d => d.id === editingDonor.id ? { ...d, ...formData } : d));
            showToast('Donor updated successfully!');
        } else {
            const newDonor = {
                id: Date.now(),
                ...formData,
                age: parseInt(formData.age),
                status: 'Pending',
                registered: new Date().toISOString().split('T')[0]
            };
            setDonors([newDonor, ...donors]);
            showToast('New donor registered successfully!');
        }

        setShowModal(false);
        setEditingDonor(null);
        setFormData({ name: '', age: '', blood: 'O+', city: '', organs: [] });
    };

    const handleEdit = (donor) => {
        setEditingDonor(donor);
        setFormData({
            name: donor.name,
            age: donor.age.toString(),
            blood: donor.blood,
            city: donor.city,
            organs: [...donor.organs]
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setDonors(donors.filter(d => d.id !== id));
        setShowDeleteConfirm(null);
        showToast('Donor removed successfully!');
    };

    const toggleOrgan = (organ) => {
        setFormData(prev => ({
            ...prev,
            organs: prev.organs.includes(organ)
                ? prev.organs.filter(o => o !== organ)
                : [...prev.organs, organ]
        }));
    };

    const handleFindMatch = (donor) => {
        navigate('/matching', { state: { donor } });
    };

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
                    <h1 className="page-title">❤️ Organ Donors</h1>
                    <p className="page-subtitle">Registered organ donors and pledge management</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setEditingDonor(null);
                    setFormData({ name: '', age: '', blood: 'O+', city: '', organs: [] });
                    setShowModal(true);
                }}>
                    <span>+</span> Register Donor
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon donors">❤️</div>
                    <div className="stat-value">{donors.length}</div>
                    <div className="stat-label">Total Donors</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(0, 212, 170, 0.2)', color: 'var(--accent-secondary)' }}>✓</div>
                    <div className="stat-value">{donors.filter(d => d.status === 'Active').length}</div>
                    <div className="stat-label">Active Donors</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-info)' }}>⏳</div>
                    <div className="stat-value">{donors.filter(d => d.status === 'Pending').length}</div>
                    <div className="stat-label">Pending Verification</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-warning)' }}>🫀</div>
                    <div className="stat-value">{donors.reduce((a, d) => a + d.organs.length, 0)}</div>
                    <div className="stat-label">Organs Pledged</div>
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
                        value={filterBlood}
                        onChange={(e) => setFilterBlood(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Blood Types</option>
                        {bloodTypes.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select
                        value={filterOrgan}
                        onChange={(e) => setFilterOrgan(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Organs</option>
                        {organOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {(search || filterBlood || filterOrgan) && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => { setSearch(''); setFilterBlood(''); setFilterOrgan(''); }}
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
                            <th>Blood</th>
                            <th>Organs Pledged</th>
                            <th>City</th>
                            <th>Registered</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDonors.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No donors found matching your criteria
                                </td>
                            </tr>
                        ) : (
                            filteredDonors.map(donor => (
                                <tr key={donor.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: 'var(--gradient-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                                            }}>
                                                {donor.name.charAt(0)}
                                            </div>
                                            <div>
                                                <strong>{donor.name}</strong>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Age: {donor.age}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="blood-type">{donor.blood}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                            {donor.organs.map(o => (
                                                <span key={o} className="organ-badge">{o}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>{donor.city}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{donor.registered}</td>
                                    <td>
                                        <span className={`badge ${donor.status.toLowerCase()}`}>{donor.status}</span>
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
                                                onClick={() => handleFindMatch(donor)}
                                            >
                                                Find Match
                                            </button>
                                            <button
                                                style={{
                                                    padding: '0.4rem 0.75rem', background: 'rgba(233, 69, 96, 0.2)',
                                                    border: 'none', borderRadius: '8px', color: 'var(--accent-primary)',
                                                    cursor: 'pointer', fontSize: '0.8rem'
                                                }}
                                                onClick={() => setShowDeleteConfirm(donor.id)}
                                            >
                                                Delete
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
                    <div className="card" style={{ width: '500px', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">{editingDonor ? '✏️ Edit Donor' : '➕ Register New Donor'}</h3>
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
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Age *</label>
                                        <input
                                            type="number"
                                            placeholder="Age"
                                            min="18"
                                            max="65"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            style={{
                                                width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                                            }}
                                        />
                                    </div>
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

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Organs to Donate *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        {organOptions.map(organ => (
                                            <label
                                                key={organ}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    padding: '0.75rem', background: formData.organs.includes(organ) ? 'rgba(233, 69, 96, 0.2)' : 'var(--bg-secondary)',
                                                    borderRadius: '8px', cursor: 'pointer', border: formData.organs.includes(organ) ? '1px solid var(--accent-primary)' : '1px solid transparent'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.organs.includes(organ)}
                                                    onChange={() => toggleOrgan(organ)}
                                                    style={{ accentColor: 'var(--accent-primary)' }}
                                                />
                                                {organ}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {editingDonor ? 'Update Donor' : 'Register Donor'}
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
                                Are you sure you want to remove this donor? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, background: 'var(--accent-primary)' }}
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                >
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
      `}</style>
        </div>
    );
}
