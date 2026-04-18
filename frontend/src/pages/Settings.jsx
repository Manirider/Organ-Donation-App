import { useState, useEffect } from 'react';

export default function Settings() {
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('notifications');
    const [hasChanges, setHasChanges] = useState(false);

    // Notification settings
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: true,
        emergencyOnly: false,
        dailyDigest: true,
        matchAlerts: true,
        lowStockAlerts: true,
        systemUpdates: false
    });

    // AI settings
    const [aiSettings, setAiSettings] = useState({
        bloodTypeWeight: 25,
        hlaWeight: 30,
        urgencyWeight: 20,
        distanceWeight: 15,
        waitTimeWeight: 10,
        autoMatch: false,
        minMatchScore: 75,
        maxDistance: 500
    });

    // Security settings
    const [security, setSecurity] = useState({
        twoFactor: true,
        sessionTimeout: 30,
        ipWhitelist: false,
        auditRetention: 90,
        passwordExpiry: 90
    });

    // Profile settings
    const [profile, setProfile] = useState({
        name: 'Dr. Administrator',
        email: 'admin@hospital.org',
        phone: '+91-98765-43210',
        hospital: 'AIIMS Delhi',
        role: 'System Administrator'
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = () => {
        showToast('Settings saved successfully!');
        setHasChanges(false);
    };

    const handleReset = () => {
        // Reset to defaults
        setNotifications({
            emailAlerts: true, smsAlerts: true, pushNotifications: true, emergencyOnly: false,
            dailyDigest: true, matchAlerts: true, lowStockAlerts: true, systemUpdates: false
        });
        setAiSettings({
            bloodTypeWeight: 25, hlaWeight: 30, urgencyWeight: 20, distanceWeight: 15, waitTimeWeight: 10,
            autoMatch: false, minMatchScore: 75, maxDistance: 500
        });
        setSecurity({ twoFactor: true, sessionTimeout: 30, ipWhitelist: false, auditRetention: 90, passwordExpiry: 90 });
        showToast('Settings reset to defaults', 'info');
        setHasChanges(false);
    };

    const updateNotification = (key, value) => {
        setNotifications({ ...notifications, [key]: value });
        setHasChanges(true);
    };

    const updateAI = (key, value) => {
        setAiSettings({ ...aiSettings, [key]: value });
        setHasChanges(true);
    };

    const updateSecurity = (key, value) => {
        setSecurity({ ...security, [key]: value });
        setHasChanges(true);
    };

    const updateProfile = (key, value) => {
        setProfile({ ...profile, [key]: value });
        setHasChanges(true);
    };

    const tabs = [
        { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
        { id: 'ai', label: '🤖 AI Settings', icon: '🤖' },
        { id: 'security', label: '🔒 Security', icon: '🔒' },
        { id: 'profile', label: '👤 Profile', icon: '👤' }
    ];

    const ToggleSwitch = ({ checked, onChange }) => (
        <label className="toggle">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className="toggle-slider"></span>
        </label>
    );

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                    padding: '1rem 1.5rem', borderRadius: '8px',
                    background: toast.type === 'success' ? 'rgba(0, 212, 170, 0.95)' : 'rgba(59, 130, 246, 0.95)',
                    color: 'white', fontWeight: 500, animation: 'slideIn 0.3s ease'
                }}>
                    {toast.type === 'success' ? '✓' : 'ℹ️'} {toast.message}
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title">⚙️ Settings</h1>
                    <p className="page-subtitle">Configure system preferences and notifications</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {hasChanges && (
                        <>
                            <button className="btn btn-secondary" onClick={handleReset}>
                                ↩️ Reset
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                💾 Save Changes
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
                {/* Tabs */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <div className="card-body" style={{ padding: '0.5rem' }}>
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                <span className="icon">{tab.icon}</span>
                                {tab.label.split(' ')[1]}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="card">
                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <>
                            <div className="card-header">
                                <h3 className="card-title">🔔 Notification Preferences</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    <div>
                                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Alert Channels</h4>
                                        {[
                                            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive notifications via email' },
                                            { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive critical alerts via SMS' },
                                            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' }
                                        ].map(item => (
                                            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <strong>{item.label}</strong>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                                                </div>
                                                <ToggleSwitch checked={notifications[item.key]} onChange={(v) => updateNotification(item.key, v)} />
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Alert Types</h4>
                                        {[
                                            { key: 'matchAlerts', label: 'Match Notifications', desc: 'When new matches are found' },
                                            { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Blood bank inventory warnings' },
                                            { key: 'emergencyOnly', label: 'Emergency Only', desc: 'Only receive critical alerts' },
                                            { key: 'dailyDigest', label: 'Daily Digest', desc: 'Summary email every morning' },
                                            { key: 'systemUpdates', label: 'System Updates', desc: 'Platform maintenance notifications' }
                                        ].map(item => (
                                            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <strong>{item.label}</strong>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                                                </div>
                                                <ToggleSwitch checked={notifications[item.key]} onChange={(v) => updateNotification(item.key, v)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* AI Settings Tab */}
                    {activeTab === 'ai' && (
                        <>
                            <div className="card-header">
                                <h3 className="card-title">🤖 AI Matching Configuration</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Algorithm Weights</h4>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Adjust how the AI weighs different factors when finding matches. Total: {
                                            aiSettings.bloodTypeWeight + aiSettings.hlaWeight + aiSettings.urgencyWeight + aiSettings.distanceWeight + aiSettings.waitTimeWeight
                                        }%
                                    </p>

                                    {[
                                        { key: 'bloodTypeWeight', label: 'Blood Type Match', color: 'var(--accent-primary)' },
                                        { key: 'hlaWeight', label: 'HLA Compatibility', color: 'var(--accent-secondary)' },
                                        { key: 'urgencyWeight', label: 'Urgency Score', color: 'var(--accent-warning)' },
                                        { key: 'distanceWeight', label: 'Geographic Distance', color: 'var(--accent-info)' },
                                        { key: 'waitTimeWeight', label: 'Wait Time', color: '#9333ea' }
                                    ].map(item => (
                                        <div key={item.key} style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span>{item.label}</span>
                                                <span style={{ fontWeight: 700, color: item.color }}>{aiSettings[item.key]}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={aiSettings[item.key]}
                                                onChange={(e) => updateAI(item.key, parseInt(e.target.value))}
                                                style={{ width: '100%', accentColor: item.color }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Matching Options</h4>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <div>
                                            <strong>Auto-Match</strong>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Automatically find matches when new donors/recipients register</p>
                                        </div>
                                        <ToggleSwitch checked={aiSettings.autoMatch} onChange={(v) => updateAI('autoMatch', v)} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Minimum Match Score</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="100"
                                                    value={aiSettings.minMatchScore}
                                                    onChange={(e) => updateAI('minMatchScore', parseInt(e.target.value))}
                                                    style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                                                />
                                                <span style={{ fontWeight: 700, minWidth: '50px' }}>{aiSettings.minMatchScore}%</span>
                                            </div>
                                        </div>
                                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Maximum Distance (km)</label>
                                            <input
                                                type="number"
                                                value={aiSettings.maxDistance}
                                                onChange={(e) => updateAI('maxDistance', parseInt(e.target.value))}
                                                style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <>
                            <div className="card-header">
                                <h3 className="card-title">🔒 Security Settings</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <div>
                                            <strong>Two-Factor Authentication</strong>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Require 2FA for all logins</p>
                                        </div>
                                        <ToggleSwitch checked={security.twoFactor} onChange={(v) => updateSecurity('twoFactor', v)} />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <div>
                                            <strong>IP Whitelist</strong>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Only allow access from approved IPs</p>
                                        </div>
                                        <ToggleSwitch checked={security.ipWhitelist} onChange={(v) => updateSecurity('ipWhitelist', v)} />
                                    </div>

                                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Session Timeout (minutes)</label>
                                        <select
                                            value={security.sessionTimeout}
                                            onChange={(e) => updateSecurity('sessionTimeout', parseInt(e.target.value))}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        >
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={120}>2 hours</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Audit Log Retention (days)</label>
                                            <input
                                                type="number"
                                                value={security.auditRetention}
                                                onChange={(e) => updateSecurity('auditRetention', parseInt(e.target.value))}
                                                style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password Expiry (days)</label>
                                            <input
                                                type="number"
                                                value={security.passwordExpiry}
                                                onChange={(e) => updateSecurity('passwordExpiry', parseInt(e.target.value))}
                                                style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                    </div>

                                    <button className="btn btn-secondary" onClick={() => showToast('Password reset link sent!')}>
                                        🔑 Reset Password
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <>
                            <div className="card-header">
                                <h3 className="card-title">👤 Profile Settings</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: 'var(--gradient-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '2rem', fontWeight: 700
                                    }}>
                                        {profile.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{profile.name}</h3>
                                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{profile.role}</p>
                                        <p style={{ margin: 0, color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>{profile.hospital}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => updateProfile('name', e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => updateProfile('email', e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone</label>
                                            <input
                                                type="tel"
                                                value={profile.phone}
                                                onChange={(e) => updateProfile('phone', e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Hospital/Organization</label>
                                        <input
                                            type="text"
                                            value={profile.hospital}
                                            onChange={(e) => updateProfile('hospital', e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
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
