import { useState } from 'react';

const initialBloodBanks = [
    { id: 1, name: 'Indian Red Cross Society', city: 'New Delhi', phone: '+91-11-23711551', inventory: { 'O+': 45, 'O-': 12, 'A+': 38, 'A-': 8, 'B+': 35, 'B-': 6, 'AB+': 15, 'AB-': 3 }, verified: true },
    { id: 2, name: 'Rotary Blood Bank', city: 'New Delhi', phone: '+91-11-26167676', inventory: { 'O+': 52, 'O-': 15, 'A+': 40, 'A-': 10, 'B+': 42, 'B-': 8, 'AB+': 18, 'AB-': 4 }, verified: true },
    { id: 3, name: 'Prathama Blood Centre', city: 'Ahmedabad', phone: '+91-79-26858585', inventory: { 'O+': 60, 'O-': 18, 'A+': 45, 'A-': 5, 'B+': 50, 'B-': 7, 'AB+': 12, 'AB-': 2 }, verified: true },
    { id: 4, name: 'Tata Memorial Blood Bank', city: 'Mumbai', phone: '+91-22-24177000', inventory: { 'O+': 75, 'O-': 20, 'A+': 55, 'A-': 12, 'B+': 48, 'B-': 9, 'AB+': 22, 'AB-': 5 }, verified: true },
];

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function BloodBanks() {
    const [bloodBanks, setBloodBanks] = useState(initialBloodBanks);
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBank, setEditingBank] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showInventoryModal, setShowInventoryModal] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '', city: '', phone: '', inventory: { 'O+': 0, 'O-': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0 }
    });

    const [requestData, setRequestData] = useState({ bloodType: 'O+', units: 1, hospital: '', urgency: 'normal' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getTotalUnits = (type) => bloodBanks.reduce((a, b) => a + (b.inventory[type] || 0), 0);
    const getTotalAllUnits = () => bloodTypes.reduce((a, t) => a + getTotalUnits(t), 0);

    const filteredBanks = bloodBanks.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.city.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.city || !formData.phone) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (editingBank) {
            setBloodBanks(bloodBanks.map(b => b.id === editingBank.id ? { ...b, ...formData, verified: b.verified } : b));
            showToast('Blood bank updated successfully!');
        } else {
            const newBank = { id: Date.now(), ...formData, verified: false };
            setBloodBanks([newBank, ...bloodBanks]);
            showToast('New blood bank added!');
        }

        setShowModal(false);
        setEditingBank(null);
        setFormData({ name: '', city: '', phone: '', inventory: { 'O+': 0, 'O-': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0 } });
    };

    const handleEdit = (bank) => {
        setEditingBank(bank);
        setFormData({ name: bank.name, city: bank.city, phone: bank.phone, inventory: { ...bank.inventory } });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setBloodBanks(bloodBanks.filter(b => b.id !== id));
        setShowDeleteConfirm(null);
        showToast('Blood bank removed!');
    };

    const updateInventory = (type, delta) => {
        const bank = bloodBanks.find(b => b.id === showInventoryModal);
        if (!bank) return;

        const newValue = Math.max(0, (bank.inventory[type] || 0) + delta);
        setBloodBanks(bloodBanks.map(b =>
            b.id === showInventoryModal
                ? { ...b, inventory: { ...b.inventory, [type]: newValue } }
                : b
        ));
    };

    const handleRequest = (e) => {
        e.preventDefault();
        if (!requestData.hospital) {
            showToast('Please enter hospital name', 'error');
            return;
        }
        showToast(`Request for ${requestData.units} units of ${requestData.bloodType} sent to ${showRequestModal.name}!`);
        setShowRequestModal(null);
        setRequestData({ bloodType: 'O+', units: 1, hospital: '', urgency: 'normal' });
    };

    const handleEmergencyBroadcast = () => {
        const lowTypes = bloodTypes.filter(t => getTotalUnits(t) < 15);
        if (lowTypes.length > 0) {
            showToast(`Emergency broadcast sent for ${lowTypes.join(', ')} blood types!`);
        } else {
            showToast('All blood types are adequately stocked', 'info');
        }
    };

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                    padding: '1rem 1.5rem', borderRadius: '8px',
                    background: toast.type === 'success' ? 'rgba(0, 212, 170, 0.95)' : toast.type === 'error' ? 'rgba(233, 69, 96, 0.95)' : 'rgba(59, 130, 246, 0.95)',
                    color: 'white', fontWeight: 500, animation: 'slideIn 0.3s ease'
                }}>
                    {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ️'} {toast.message}
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title">🏦 Blood Banks</h1>
                    <p className="page-subtitle">Blood bank inventory and management</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={handleEmergencyBroadcast}>
                        🚨 Emergency Broadcast
                    </button>
                    <button className="btn btn-primary" onClick={() => {
                        setEditingBank(null);
                        setFormData({ name: '', city: '', phone: '', inventory: { 'O+': 0, 'O-': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0 } });
                        setShowModal(true);
                    }}>
                        <span>+</span> Add Blood Bank
                    </button>
                </div>
            </div>

            {/* Blood Type Overview */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">📊 Total Blood Inventory</h3>
                    <span style={{ color: 'var(--text-secondary)' }}>{getTotalAllUnits()} units across all banks</span>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '1rem' }}>
                        {bloodTypes.map((type) => {
                            const units = getTotalUnits(type);
                            const isLow = units < 20;
                            const isCritical = units < 10;
                            return (
                                <div
                                    key={type}
                                    style={{
                                        textAlign: 'center', padding: '1rem',
                                        background: isCritical ? 'rgba(233, 69, 96, 0.2)' : isLow ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-secondary)',
                                        borderRadius: '12px',
                                        border: `2px solid ${selectedType === type ? 'var(--accent-primary)' : isCritical ? 'var(--accent-primary)' : isLow ? 'var(--accent-warning)' : 'transparent'}`,
                                        cursor: 'pointer', transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => setSelectedType(selectedType === type ? '' : type)}
                                >
                                    <p style={{
                                        margin: 0, fontSize: '1.5rem', fontWeight: 700,
                                        color: isCritical ? 'var(--accent-primary)' : isLow ? 'var(--accent-warning)' : 'var(--accent-secondary)'
                                    }}>
                                        {units}
                                    </p>
                                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-primary)' }}>{type}</p>
                                    {isCritical && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>⚠️ Critical</span>}
                                    {isLow && !isCritical && <span style={{ fontSize: '0.7rem', color: 'var(--accent-warning)' }}>Low</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search blood banks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1, padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    />
                    {(search || selectedType) && (
                        <button className="btn btn-secondary" onClick={() => { setSearch(''); setSelectedType(''); }}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Blood Banks List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
                {filteredBanks.map((bank) => (
                    <div key={bank.id} className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">{bank.name}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📍 {bank.city} • 📞 {bank.phone}</p>
                            </div>
                            {bank.verified && (
                                <span style={{
                                    background: 'rgba(0, 212, 170, 0.2)', color: 'var(--accent-secondary)',
                                    padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem'
                                }}>
                                    ✓ Verified
                                </span>
                            )}
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                                {bloodTypes.map((type) => {
                                    const units = bank.inventory[type] || 0;
                                    const isLow = units < 10;
                                    const highlight = selectedType === type;
                                    return (
                                        <div
                                            key={type}
                                            style={{
                                                textAlign: 'center', padding: '0.5rem',
                                                background: highlight ? 'rgba(233, 69, 96, 0.3)' : isLow ? 'rgba(233, 69, 96, 0.1)' : 'var(--bg-secondary)',
                                                borderRadius: '8px', border: highlight ? '1px solid var(--accent-primary)' : 'none'
                                            }}
                                        >
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{type}</p>
                                            <p style={{ margin: 0, fontWeight: 700, color: isLow ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{units}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowInventoryModal(bank.id)}>
                                    📦 Manage Stock
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowRequestModal(bank)}>
                                    🩸 Request Blood
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.75rem' }} onClick={() => handleEdit(bank)}>✏️</button>
                                <button
                                    style={{ padding: '0.75rem', background: 'rgba(233, 69, 96, 0.2)', border: 'none', borderRadius: '8px', color: 'var(--accent-primary)', cursor: 'pointer' }}
                                    onClick={() => setShowDeleteConfirm(bank.id)}
                                >🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
                    <div className="card" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">{editingBank ? '✏️ Edit Blood Bank' : '➕ Add Blood Bank'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body">
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name *</label>
                                    <input type="text" placeholder="Blood bank name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>City *</label>
                                        <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone *</label>
                                        <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingBank ? 'Update' : 'Add'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inventory Management Modal */}
            {showInventoryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowInventoryModal(null)}>
                    <div className="card" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">📦 Manage Inventory</h3>
                            <button onClick={() => setShowInventoryModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                {bloodTypes.map(type => {
                                    const bank = bloodBanks.find(b => b.id === showInventoryModal);
                                    const units = bank?.inventory[type] || 0;
                                    return (
                                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <span className="blood-type">{type}</span>
                                            <button onClick={() => updateInventory(type, -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>-</button>
                                            <span style={{ fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>{units}</span>
                                            <button onClick={() => updateInventory(type, 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--accent-secondary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                        </div>
                                    );
                                })}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => { setShowInventoryModal(null); showToast('Inventory updated!'); }}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Blood Modal */}
            {showRequestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowRequestModal(null)}>
                    <div className="card" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">🩸 Request Blood</h3>
                            <button onClick={() => setShowRequestModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleRequest}>
                            <div className="card-body">
                                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>From: <strong>{showRequestModal.name}</strong></p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Blood Type</label>
                                        <select value={requestData.bloodType} onChange={(e) => setRequestData({ ...requestData, bloodType: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                            {bloodTypes.map(t => <option key={t} value={t}>{t} ({showRequestModal.inventory[t] || 0} avail)</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Units</label>
                                        <input type="number" min="1" value={requestData.units} onChange={(e) => setRequestData({ ...requestData, units: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Requesting Hospital *</label>
                                    <input type="text" placeholder="Hospital name" value={requestData.hospital} onChange={(e) => setRequestData({ ...requestData, hospital: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Urgency</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['normal', 'urgent', 'critical'].map(u => (
                                            <button key={u} type="button" onClick={() => setRequestData({ ...requestData, urgency: u })}
                                                style={{
                                                    flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize',
                                                    background: requestData.urgency === u ? (u === 'critical' ? 'var(--accent-primary)' : u === 'urgent' ? 'var(--accent-warning)' : 'var(--accent-secondary)') : 'var(--bg-secondary)',
                                                    color: requestData.urgency === u ? 'white' : 'var(--text-primary)'
                                                }}>
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowRequestModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Request</button>
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
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Remove this blood bank?</p>
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
