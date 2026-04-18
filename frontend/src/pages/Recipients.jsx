import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialRecipients = [
    { id: 1, name: 'Sunita Devi', age: 45, blood: 'O+', organ: 'Kidney', urgency: 9, waitDays: 365, city: 'Noida', hospital: 'AIIMS Delhi', status: 'Waiting' },
    { id: 2, name: 'Ravi Kumar', age: 52, blood: 'A-', organ: 'Heart', urgency: 10, waitDays: 180, city: 'Delhi', hospital: 'Fortis', status: 'Critical' },
    { id: 3, name: 'Fatima Begum', age: 38, blood: 'B+', organ: 'Liver', urgency: 8, waitDays: 240, city: 'Mumbai', hospital: 'Lilavati', status: 'Waiting' },
    { id: 4, name: 'Gopal Reddy', age: 60, blood: 'AB+', organ: 'Kidney', urgency: 7, waitDays: 420, city: 'Hyderabad', hospital: 'Apollo', status: 'Waiting' },
    { id: 5, name: 'Priya Nair', age: 28, blood: 'O-', organ: 'Cornea', urgency: 5, waitDays: 90, city: 'Chennai', hospital: 'Sankara', status: 'Waiting' },
];

const organOptions = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Cornea', 'Pancreas', 'Bone Marrow'];
const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function Recipients() {
    const navigate = useNavigate();
    const [recipients, setRecipients] = useState(initialRecipients);
    const [search, setSearch] = useState('');
    const [filterOrgan, setFilterOrgan] = useState('');
    const [filterUrgency, setFilterUrgency] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '', age: '', blood: 'O+', organ: 'Kidney', city: '', hospital: '', urgency: '5'
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredRecipients = recipients.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.city.toLowerCase().includes(search.toLowerCase());
        const matchesOrgan = !filterOrgan || r.organ === filterOrgan;
        const matchesUrgency = !filterUrgency ||
            (filterUrgency === 'critical' && r.urgency >= 9) ||
            (filterUrgency === 'high' && r.urgency >= 7 && r.urgency < 9) ||
            (filterUrgency === 'medium' && r.urgency < 7);
        return matchesSearch && matchesOrgan && matchesUrgency;
    }).sort((a, b) => b.urgency - a.urgency);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.age || !formData.city || !formData.hospital) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (editingRecipient) {
            setRecipients(recipients.map(r => r.id === editingRecipient.id ? {
                ...r,
                ...formData,
                age: parseInt(formData.age),
                urgency: parseInt(formData.urgency),
                status: parseInt(formData.urgency) >= 9 ? 'Critical' : 'Waiting'
            } : r));
            showToast('Recipient updated successfully!');
        } else {
            const newRecipient = {
                id: Date.now(),
                ...formData,
                age: parseInt(formData.age),
                urgency: parseInt(formData.urgency),
                waitDays: 0,
                status: parseInt(formData.urgency) >= 9 ? 'Critical' : 'Waiting'
            };
            setRecipients([newRecipient, ...recipients]);
            showToast('New recipient registered!');
        }

        setShowModal(false);
        setEditingRecipient(null);
        setFormData({ name: '', age: '', blood: 'O+', organ: 'Kidney', city: '', hospital: '', urgency: '5' });
    };

    const handleEdit = (recipient) => {
        setEditingRecipient(recipient);
        setFormData({
            name: recipient.name,
            age: recipient.age.toString(),
            blood: recipient.blood,
            organ: recipient.organ,
            city: recipient.city,
            hospital: recipient.hospital,
            urgency: recipient.urgency.toString()
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setRecipients(recipients.filter(r => r.id !== id));
        setShowDeleteConfirm(null);
        showToast('Recipient removed successfully!');
    };

    const handleFindDonor = (recipient) => {
        navigate('/matching', { state: { recipient } });
    };

    const getUrgencyColor = (urgency) => {
        if (urgency >= 9) return 'var(--accent-primary)';
        if (urgency >= 7) return 'var(--accent-warning)';
        return 'var(--accent-info)';
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
                    <h1 className="page-title">👥 Recipients</h1>
                    <p className="page-subtitle">Transplant waiting list and urgency management</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setEditingRecipient(null);
                    setFormData({ name: '', age: '', blood: 'O+', organ: 'Kidney', city: '', hospital: '', urgency: '5' });
                    setShowModal(true);
                }}>
                    <span>+</span> Add Recipient
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                    <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                        {recipients.filter(r => r.urgency >= 9).length}
                    </div>
                    <div className="stat-label">Critical (9-10)</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
                    <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>
                        {recipients.filter(r => r.urgency >= 7 && r.urgency < 9).length}
                    </div>
                    <div className="stat-label">High Priority (7-8)</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-info)' }}>
                    <div className="stat-value" style={{ color: 'var(--accent-info)' }}>
                        {recipients.filter(r => r.urgency < 7).length}
                    </div>
                    <div className="stat-label">Standard (&lt;7)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{recipients.length}</div>
                    <div className="stat-label">Total Waiting</div>
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
                    <select
                        value={filterUrgency}
                        onChange={(e) => setFilterUrgency(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Urgency</option>
                        <option value="critical">Critical (9-10)</option>
                        <option value="high">High (7-8)</option>
                        <option value="medium">Standard (&lt;7)</option>
                    </select>
                    {(search || filterOrgan || filterUrgency) && (
                        <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterOrgan(''); setFilterUrgency(''); }}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Recipients Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {filteredRecipients.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No recipients found</p>
                    </div>
                ) : (
                    filteredRecipients.map(recipient => (
                        <div key={recipient.id} className="card" style={{ borderLeft: `4px solid ${getUrgencyColor(recipient.urgency)}` }}>
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '50px', height: '50px', borderRadius: '12px',
                                            background: 'var(--gradient-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem'
                                        }}>
                                            {recipient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{recipient.name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {recipient.age} years • {recipient.city}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.5rem 1rem', borderRadius: '20px',
                                        background: getUrgencyColor(recipient.urgency),
                                        color: 'white', fontWeight: 700
                                    }}>
                                        {recipient.urgency}/10
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Needs</p>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-secondary)' }}>{recipient.organ}</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blood Type</p>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-primary)' }}>{recipient.blood}</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wait Time</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{recipient.waitDays} days</p>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hospital</p>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{recipient.hospital}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleFindDonor(recipient)}>
                                        🔍 Find Donor
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '0.75rem' }} onClick={() => handleEdit(recipient)}>
                                        ✏️
                                    </button>
                                    <button
                                        style={{ padding: '0.75rem', background: 'rgba(233, 69, 96, 0.2)', border: 'none', borderRadius: '8px', color: 'var(--accent-primary)', cursor: 'pointer' }}
                                        onClick={() => setShowDeleteConfirm(recipient.id)}
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
                    <div className="card" style={{ width: '500px', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">{editingRecipient ? '✏️ Edit Recipient' : '➕ Add Recipient'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body">
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Patient Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter patient name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Age *</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Blood Type *</label>
                                        <select
                                            value={formData.blood}
                                            onChange={(e) => setFormData({ ...formData, blood: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        >
                                            {bloodTypes.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Organ Needed *</label>
                                        <select
                                            value={formData.organ}
                                            onChange={(e) => setFormData({ ...formData, organ: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        >
                                            {organOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>City *</label>
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Hospital *</label>
                                        <input
                                            type="text"
                                            placeholder="Hospital name"
                                            value={formData.hospital}
                                            onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        Urgency Level: <strong style={{ color: getUrgencyColor(parseInt(formData.urgency)) }}>{formData.urgency}/10</strong>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.urgency}
                                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                        style={{ width: '100%', accentColor: getUrgencyColor(parseInt(formData.urgency)) }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span>Low</span>
                                        <span>Critical</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingRecipient ? 'Update' : 'Add'}</button>
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
                        <div className="card-header"><h3 className="card-title">⚠️ Confirm Delete</h3></div>
                        <div className="card-body">
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Remove this recipient from the waiting list?</p>
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
