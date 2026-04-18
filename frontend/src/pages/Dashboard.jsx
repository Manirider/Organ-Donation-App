import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [apiStatus, setApiStatus] = useState('checking');
    const [stats, setStats] = useState([
        { icon: '❤️', label: 'Active Donors', value: '2,847', change: '+12%', type: 'donors' },
        { icon: '🏥', label: 'Recipients', value: '1,234', change: '+8%', type: 'recipients' },
        { icon: '🔗', label: 'Matches Made', value: '342', change: '+23%', type: 'matches' },
        { icon: '🏨', label: 'Hospitals', value: '156', change: '+5%', type: 'hospitals' },
    ]);

    const [recentMatches] = useState([
        { id: 'M-2847', donor: 'Rajesh K.', recipient: 'Sunita D.', organ: 'Kidney', score: 0.92, status: 'Critical' },
        { id: 'M-2846', donor: 'Priya S.', recipient: 'Mohammed K.', organ: 'Blood (A+)', score: 0.88, status: 'Active' },
        { id: 'M-2845', donor: 'Amit P.', recipient: 'Lakshmi R.', organ: 'Liver', score: 0.85, status: 'Pending' },
        { id: 'M-2844', donor: 'Neha G.', recipient: 'Vikram S.', organ: 'Blood (O-)', score: 0.95, status: 'Active' },
    ]);

    const [urgentRecipients] = useState([
        { name: 'Sunita Devi', organ: 'Kidney', urgency: 9, days: 365, city: 'Noida' },
        { name: 'Ravi Kumar', organ: 'Heart', urgency: 10, days: 180, city: 'Delhi' },
        { name: 'Fatima B.', organ: 'Liver', urgency: 8, days: 240, city: 'Mumbai' },
    ]);

    useEffect(() => {
        // Check API status
        fetch('http://localhost:8000/health')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'healthy') {
                    setApiStatus('online');
                }
            })
            .catch(() => {
                setApiStatus('offline');
            });
    }, []);

    return (
        <div>
            {/* API Status Banner */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.5rem 1rem',
                background: apiStatus === 'online' ? 'rgba(0, 212, 170, 0.1)' :
                    apiStatus === 'offline' ? 'rgba(233, 69, 96, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                fontSize: '0.85rem'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: apiStatus === 'online' ? 'var(--accent-secondary)' :
                        apiStatus === 'offline' ? 'var(--accent-primary)' : 'var(--accent-info)',
                    animation: apiStatus === 'checking' ? 'pulse 1s infinite' : 'none'
                }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                    Backend API: {apiStatus === 'online' ? '✓ Connected' :
                        apiStatus === 'offline' ? '✕ Offline (Demo Mode)' : 'Checking...'}
                </span>
                {apiStatus === 'online' && (
                    <a
                        href="http://localhost:8000/api/v1/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-info)', marginLeft: 'auto' }}
                    >
                        View API Docs →
                    </a>
                )}
            </div>

            {/* Emergency Banner */}
            <div className="emergency-banner">
                <div className="text">
                    <span className="icon">🚨</span>
                    <div>
                        <strong>EMERGENCY:</strong> O- Blood urgently needed at AIIMS Delhi
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/blood-banks')}>
                    Respond Now
                </button>
            </div>

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">AI-Powered Organ & Blood Donation Platform</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/matching')}>
                    <span>+</span> New Emergency Request
                </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div
                        className="stat-card"
                        key={index}
                        onClick={() => {
                            if (stat.type === 'donors') navigate('/organ-donors');
                            if (stat.type === 'recipients') navigate('/recipients');
                            if (stat.type === 'matches') navigate('/matching');
                            if (stat.type === 'hospitals') navigate('/hospitals');
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-header">
                            <div className={`stat-icon ${stat.type}`}>{stat.icon}</div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                        <div className="stat-change positive">↑ {stat.change} from last month</div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid-2">
                {/* Recent Matches */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Matches</h3>
                        <button className="btn btn-secondary" onClick={() => navigate('/matching')}>View All</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Donor</th>
                                <th>Recipient</th>
                                <th>Type</th>
                                <th>Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMatches.map((match, index) => (
                                <tr key={index} style={{ cursor: 'pointer' }} onClick={() => navigate('/matching')}>
                                    <td><strong>{match.id}</strong></td>
                                    <td>{match.donor}</td>
                                    <td>{match.recipient}</td>
                                    <td>{match.organ}</td>
                                    <td>{(match.score * 100).toFixed(0)}%</td>
                                    <td>
                                        <span className={`badge ${match.status.toLowerCase()}`}>{match.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Urgent Recipients */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🚨 Urgent Recipients</h3>
                        <button className="btn btn-secondary" onClick={() => navigate('/recipients')}>Find Donors</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Need</th>
                                <th>Urgency</th>
                                <th>Wait Time</th>
                                <th>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {urgentRecipients.map((recipient, index) => (
                                <tr key={index} style={{ cursor: 'pointer' }} onClick={() => navigate('/recipients')}>
                                    <td><strong>{recipient.name}</strong></td>
                                    <td>{recipient.organ}</td>
                                    <td>
                                        <span className={`badge ${recipient.urgency >= 9 ? 'critical' : 'high'}`}>
                                            {recipient.urgency}/10
                                        </span>
                                    </td>
                                    <td>{recipient.days} days</td>
                                    <td>{recipient.city}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">⚡ Quick Actions</h3>
                </div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                        onClick={() => navigate('/matching')}
                    >
                        <span style={{ fontSize: '1.5rem' }}>🔗</span>
                        <span>Find Match</span>
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                        onClick={() => navigate('/organ-donors')}
                    >
                        <span style={{ fontSize: '1.5rem' }}>❤️</span>
                        <span>Register Donor</span>
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                        onClick={() => navigate('/blood-banks')}
                    >
                        <span style={{ fontSize: '1.5rem' }}>🩸</span>
                        <span>Blood Request</span>
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                        onClick={() => navigate('/audit')}
                    >
                        <span style={{ fontSize: '1.5rem' }}>📊</span>
                        <span>View Reports</span>
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}
