import { useState } from 'react';

const initialLogs = [
    { id: 1, timestamp: '2024-03-15 14:32:45', user: 'admin@hospital.org', action: 'CREATE', resource: 'Donor', description: 'New organ donor registered: Rajesh Kumar', ip: '192.168.1.100' },
    { id: 2, timestamp: '2024-03-15 14:28:12', user: 'coordinator@aiims.in', action: 'UPDATE', resource: 'Recipient', description: 'Updated urgency score for Sunita Devi', ip: '10.0.0.45' },
    { id: 3, timestamp: '2024-03-15 14:15:33', user: 'system', action: 'MATCH', resource: 'Match', description: 'AI matching completed: 4 matches found', ip: 'system' },
    { id: 4, timestamp: '2024-03-15 14:10:20', user: 'admin@hospital.org', action: 'APPROVE', resource: 'Match', description: 'Match approved: #M-2024-001 (Heart)', ip: '192.168.1.100' },
    { id: 5, timestamp: '2024-03-15 13:55:00', user: 'bloodbank@redcross.org', action: 'UPDATE', resource: 'BloodBank', description: 'Inventory updated: O- stock increased by 10 units', ip: '172.16.0.25' },
    { id: 6, timestamp: '2024-03-15 13:42:18', user: 'coordinator@aiims.in', action: 'DELETE', resource: 'Recipient', description: 'Recipient removed from waitlist (transplant completed)', ip: '10.0.0.45' },
    { id: 7, timestamp: '2024-03-15 13:30:00', user: 'system', action: 'ALERT', resource: 'BloodBank', description: 'Low stock alert: AB- blood type critically low', ip: 'system' },
    { id: 8, timestamp: '2024-03-15 12:45:22', user: 'admin@hospital.org', action: 'LOGIN', resource: 'Auth', description: 'User logged in successfully', ip: '192.168.1.100' },
];

export default function AuditLogs() {
    const [logs, setLogs] = useState(initialLogs);
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterResource, setFilterResource] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showDetails, setShowDetails] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
            log.description.toLowerCase().includes(search.toLowerCase());
        const matchesAction = !filterAction || log.action === filterAction;
        const matchesResource = !filterResource || log.resource === filterResource;
        return matchesSearch && matchesAction && matchesResource;
    });

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'var(--accent-secondary)';
            case 'UPDATE': return 'var(--accent-info)';
            case 'DELETE': return 'var(--accent-primary)';
            case 'APPROVE': return 'var(--accent-secondary)';
            case 'MATCH': return '#9333ea';
            case 'ALERT': return 'var(--accent-warning)';
            case 'LOGIN': return 'var(--text-muted)';
            default: return 'var(--text-secondary)';
        }
    };

    const handleExport = () => {
        const data = filteredLogs.map(log => ({
            Timestamp: log.timestamp,
            User: log.user,
            Action: log.action,
            Resource: log.resource,
            Description: log.description,
            IP: log.ip
        }));
        const csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(data[0]).join(',') + '\n'
            + data.map(row => Object.values(row).join(',')).join('\n');

        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast('Audit logs exported!');
    };

    const handleClearOldLogs = () => {
        setLogs(logs.slice(0, 5));
        showToast('Old logs archived', 'info');
    };

    const handleRefresh = () => {
        showToast('Logs refreshed');
    };

    const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'MATCH', 'ALERT', 'LOGIN'];
    const resources = ['Donor', 'Recipient', 'Match', 'BloodBank', 'Hospital', 'Auth'];

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
                    <h1 className="page-title">📋 Audit Logs</h1>
                    <p className="page-subtitle">System activity and compliance tracking</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={handleRefresh}>
                        🔄 Refresh
                    </button>
                    <button className="btn btn-secondary" onClick={handleExport}>
                        📥 Export
                    </button>
                    <button className="btn btn-primary" onClick={handleClearOldLogs}>
                        🗑️ Archive Old
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-value">{logs.length}</div>
                    <div className="stat-label">Total Events</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-secondary)' }}>{logs.filter(l => l.action === 'CREATE').length}</div>
                    <div className="stat-label">Creates</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>{logs.filter(l => l.action === 'DELETE').length}</div>
                    <div className="stat-label">Deletes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{logs.filter(l => l.action === 'ALERT').length}</div>
                    <div className="stat-label">Alerts</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1, minWidth: '200px', padding: '0.75rem 1rem',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    />
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    >
                        <option value="">All Actions</option>
                        {actions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select
                        value={filterResource}
                        onChange={(e) => setFilterResource(e.target.value)}
                        style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    >
                        <option value="">All Resources</option>
                        {resources.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {(search || filterAction || filterResource) && (
                        <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterAction(''); setFilterResource(''); }}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Logs Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Activity Log ({filteredLogs.length})</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Resource</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No logs found
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {log.timestamp}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                width: '30px', height: '30px', borderRadius: '50%',
                                                background: log.user === 'system' ? 'var(--bg-secondary)' : 'var(--gradient-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontWeight: 600
                                            }}>
                                                {log.user === 'system' ? '🤖' : log.user.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '0.85rem' }}>{log.user}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '20px',
                                            background: `${getActionColor(log.action)}20`,
                                            color: getActionColor(log.action),
                                            fontSize: '0.75rem', fontWeight: 600
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{log.resource}</td>
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {log.description}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                            onClick={() => setShowDetails(log)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {showDetails && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowDetails(null)}>
                    <div className="card" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">📝 Log Details</h3>
                            <button onClick={() => setShowDetails(null)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Timestamp</label>
                                    <span style={{ fontFamily: 'monospace' }}>{showDetails.timestamp}</span>
                                </div>
                                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>User</label>
                                    <span>{showDetails.user}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Action</label>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '20px',
                                            background: `${getActionColor(showDetails.action)}20`,
                                            color: getActionColor(showDetails.action), fontSize: '0.85rem', fontWeight: 600
                                        }}>
                                            {showDetails.action}
                                        </span>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Resource</label>
                                        <span>{showDetails.resource}</span>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                                    <span>{showDetails.description}</span>
                                </div>
                                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>IP Address</label>
                                    <span style={{ fontFamily: 'monospace' }}>{showDetails.ip}</span>
                                </div>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setShowDetails(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
    );
}
