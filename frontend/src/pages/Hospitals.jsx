import { useState } from 'react';

const initialHospitals = [
    { id: 1, name: 'AIIMS Delhi', city: 'New Delhi', type: 'Government', beds: 2500, icuBeds: 150, transplants: ['Kidney', 'Liver', 'Heart', 'Lung'], readiness: 95, activeTeams: 8, phone: '+91-11-26588500' },
    { id: 2, name: 'Fortis Hospital', city: 'Gurgaon', type: 'Private', beds: 1000, icuBeds: 80, transplants: ['Kidney', 'Liver'], readiness: 88, activeTeams: 5, phone: '+91-124-4962200' },
    { id: 3, name: 'Apollo Hospital', city: 'Chennai', type: 'Private', beds: 600, icuBeds: 60, transplants: ['Kidney', 'Liver', 'Heart'], readiness: 92, activeTeams: 6, phone: '+91-44-28293333' },
    { id: 4, name: 'Lilavati Hospital', city: 'Mumbai', type: 'Private', beds: 300, icuBeds: 40, transplants: ['Kidney', 'Liver'], readiness: 85, activeTeams: 4, phone: '+91-22-26751000' },
    { id: 5, name: 'CMC Vellore', city: 'Vellore', type: 'Private', beds: 2200, icuBeds: 130, transplants: ['Kidney', 'Liver', 'Heart', 'Lung', 'Bone Marrow'], readiness: 97, activeTeams: 10, phone: '+91-416-2281000' },
];

const transplantOptions = ['Kidney', 'Liver', 'Heart', 'Lung', 'Cornea', 'Pancreas', 'Bone Marrow'];

export default function Hospitals() {
    const [hospitals, setHospitals] = useState(initialHospitals);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTransplant, setFilterTransplant] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingHospital, setEditingHospital] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '', city: '', type: 'Private', beds: '', icuBeds: '', phone: '', transplants: [], readiness: '80', activeTeams: ''
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredHospitals = hospitals.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
            h.city.toLowerCase().includes(search.toLowerCase());
        const matchesType = !filterType || h.type === filterType;
        const matchesTransplant = !filterTransplant || h.transplants.includes(filterTransplant);
        return matchesSearch && matchesType && matchesTransplant;
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.city || !formData.beds || !formData.phone || formData.transplants.length === 0) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (editingHospital) {
            setHospitals(hospitals.map(h => h.id === editingHospital.id ? {
                ...h,
                ...formData,
                beds: parseInt(formData.beds),
                icuBeds: parseInt(formData.icuBeds) || 0,
                readiness: parseInt(formData.readiness),
                activeTeams: parseInt(formData.activeTeams) || 0
            } : h));
            showToast('Hospital updated successfully!');
        } else {
            const newHospital = {
                id: Date.now(),
                ...formData,
                beds: parseInt(formData.beds),
                icuBeds: parseInt(formData.icuBeds) || 0,
                readiness: parseInt(formData.readiness),
                activeTeams: parseInt(formData.activeTeams) || 1
            };
            setHospitals([newHospital, ...hospitals]);
            showToast('New hospital added!');
        }

        setShowModal(false);
        setEditingHospital(null);
        setFormData({ name: '', city: '', type: 'Private', beds: '', icuBeds: '', phone: '', transplants: [], readiness: '80', activeTeams: '' });
    };

    const handleEdit = (hospital) => {
        setEditingHospital(hospital);
        setFormData({
            name: hospital.name,
            city: hospital.city,
            type: hospital.type,
            beds: hospital.beds.toString(),
            icuBeds: hospital.icuBeds.toString(),
            phone: hospital.phone,
            transplants: [...hospital.transplants],
            readiness: hospital.readiness.toString(),
            activeTeams: hospital.activeTeams.toString()
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setHospitals(hospitals.filter(h => h.id !== id));
        setShowDeleteConfirm(null);
        showToast('Hospital removed successfully!');
    };

    const toggleTransplant = (transplant) => {
        setFormData(prev => ({
            ...prev,
            transplants: prev.transplants.includes(transplant)
                ? prev.transplants.filter(t => t !== transplant)
                : [...prev.transplants, transplant]
        }));
    };

    const handleContact = (hospital) => {
        showToast(`Calling ${hospital.name}...`);
    };

    const getReadinessColor = (readiness) => {
        if (readiness >= 90) return 'var(--accent-secondary)';
        if (readiness >= 70) return 'var(--accent-warning)';
        return 'var(--accent-primary)';
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
                    <h1 className="page-title">🏨 Hospitals</h1>
                    <p className="page-subtitle">Transplant center management and readiness tracking</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setEditingHospital(null);
                    setFormData({ name: '', city: '', type: 'Private', beds: '', icuBeds: '', phone: '', transplants: [], readiness: '80', activeTeams: '' });
                    setShowModal(true);
                }}>
                    <span>+</span> Add Hospital
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon hospitals">🏨</div>
                    <div className="stat-value">{hospitals.length}</div>
                    <div className="stat-label">Total Hospitals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(0, 212, 170, 0.2)', color: 'var(--accent-secondary)' }}>👥</div>
                    <div className="stat-value">{hospitals.reduce((a, h) => a + h.activeTeams, 0)}</div>
                    <div className="stat-label">Active Teams</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-info)' }}>🛏️</div>
                    <div className="stat-value">{hospitals.reduce((a, h) => a + h.icuBeds, 0)}</div>
                    <div className="stat-label">ICU Beds</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-warning)' }}>📊</div>
                    <div className="stat-value">{Math.round(hospitals.reduce((a, h) => a + h.readiness, 0) / hospitals.length)}%</div>
                    <div className="stat-label">Avg Readiness</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search hospitals..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1, minWidth: '200px', padding: '0.75rem 1rem',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    >
                        <option value="">All Types</option>
                        <option value="Government">Government</option>
                        <option value="Private">Private</option>
                    </select>
                    <select
                        value={filterTransplant}
                        onChange={(e) => setFilterTransplant(e.target.value)}
                        style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    >
                        <option value="">All Transplants</option>
                        {transplantOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {(search || filterType || filterTransplant) && (
                        <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterType(''); setFilterTransplant(''); }}>Clear</button>
                    )}
                </div>
            </div>

            {/* Hospitals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {filteredHospitals.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No hospitals found</p>
                    </div>
                ) : (
                    filteredHospitals.map(hospital => (
                        <div key={hospital.id} className="card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{hospital.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        📍 {hospital.city} • {hospital.type}
                                    </p>
                                </div>
                                <div style={{
                                    padding: '0.5rem 1rem', borderRadius: '20px',
                                    background: getReadinessColor(hospital.readiness),
                                    color: 'white', fontWeight: 700, fontSize: '0.85rem'
                                }}>
                                    {hospital.readiness}% Ready
                                </div>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>{hospital.beds}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Beds</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-primary)' }}>{hospital.icuBeds}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ICU Beds</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-secondary)' }}>{hospital.activeTeams}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Teams</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transplant Capabilities:</p>
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                        {hospital.transplants.map(t => (
                                            <span key={t} className="organ-badge">{t}</span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleContact(hospital)}>
                                        📞 Contact
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '0.75rem' }} onClick={() => handleEdit(hospital)}>
                                        ✏️
                                    </button>
                                    <button
                                        style={{ padding: '0.75rem', background: 'rgba(233, 69, 96, 0.2)', border: 'none', borderRadius: '8px', color: 'var(--accent-primary)', cursor: 'pointer' }}
                                        onClick={() => setShowDeleteConfirm(hospital.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div className="card" style={{ width: '550px', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">{editingHospital ? '✏️ Edit Hospital' : '➕ Add Hospital'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body">
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Hospital Name *</label>
                                    <input type="text" placeholder="Hospital name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>City *</label>
                                        <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Type *</label>
                                        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                            <option value="Private">Private</option>
                                            <option value="Government">Government</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Total Beds *</label>
                                        <input type="number" value={formData.beds} onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>ICU Beds</label>
                                        <input type="number" value={formData.icuBeds} onChange={(e) => setFormData({ ...formData, icuBeds: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Teams</label>
                                        <input type="number" value={formData.activeTeams} onChange={(e) => setFormData({ ...formData, activeTeams: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone *</label>
                                    <input type="tel" placeholder="+91-XX-XXXXXXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        Readiness: <strong style={{ color: getReadinessColor(parseInt(formData.readiness)) }}>{formData.readiness}%</strong>
                                    </label>
                                    <input type="range" min="0" max="100" value={formData.readiness} onChange={(e) => setFormData({ ...formData, readiness: e.target.value })}
                                        style={{ width: '100%', accentColor: getReadinessColor(parseInt(formData.readiness)) }} />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Transplant Capabilities *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        {transplantOptions.map(t => (
                                            <label key={t} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                                                background: formData.transplants.includes(t) ? 'rgba(0, 212, 170, 0.2)' : 'var(--bg-secondary)',
                                                borderRadius: '8px', cursor: 'pointer', border: formData.transplants.includes(t) ? '1px solid var(--accent-secondary)' : '1px solid transparent'
                                            }}>
                                                <input type="checkbox" checked={formData.transplants.includes(t)} onChange={() => toggleTransplant(t)} style={{ accentColor: 'var(--accent-secondary)' }} />
                                                {t}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingHospital ? 'Update' : 'Add'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <div className="card-header"><h3 className="card-title">⚠️ Confirm Delete</h3></div>
                        <div className="card-body">
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Remove this hospital?</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
    );
}
