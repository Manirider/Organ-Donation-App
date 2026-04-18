import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const mockMatches = [
    { id: 1, donor: 'Rajesh Kumar', donorBlood: 'O+', recipient: 'Sunita Devi', recipientBlood: 'O+', organ: 'Kidney', score: 94, compatibility: 'Excellent', hospital: 'AIIMS Delhi', distance: '12 km' },
    { id: 2, donor: 'Mohammed Khan', donorBlood: 'O-', recipient: 'Priya Nair', recipientBlood: 'O-', organ: 'Kidney', score: 91, compatibility: 'Excellent', hospital: 'CMC Vellore', distance: '45 km' },
    { id: 3, donor: 'Priya Sharma', donorBlood: 'A+', recipient: 'Meera Rajan', recipientBlood: 'A+', organ: 'Liver', score: 87, compatibility: 'Good', hospital: 'Apollo Chennai', distance: '78 km' },
    { id: 4, donor: 'Amit Patel', donorBlood: 'B-', recipient: 'Gopal Singh', recipientBlood: 'B+', organ: 'Heart', score: 82, compatibility: 'Good', hospital: 'Fortis Gurgaon', distance: '120 km' },
];

const algorithmWeights = [
    { name: 'Blood Type Match', weight: 25, color: 'var(--accent-primary)' },
    { name: 'HLA Compatibility', weight: 30, color: 'var(--accent-secondary)' },
    { name: 'Urgency Score', weight: 20, color: 'var(--accent-warning)' },
    { name: 'Geographic Distance', weight: 15, color: 'var(--accent-info)' },
    { name: 'Wait Time', weight: 10, color: '#9333ea' },
];

export default function Matching() {
    const location = useLocation();
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOrgan, setSelectedOrgan] = useState('');
    const [minScore, setMinScore] = useState(70);
    const [showExplanation, setShowExplanation] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [weights, setWeights] = useState([...algorithmWeights]);

    useEffect(() => {
        // If navigated from another page with donor/recipient data
        if (location.state?.donor || location.state?.recipient) {
            runMatching();
        }
    }, [location.state]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const runMatching = () => {
        setIsLoading(true);
        setTimeout(() => {
            let results = [...mockMatches];
            if (selectedOrgan) {
                results = results.filter(m => m.organ === selectedOrgan);
            }
            results = results.filter(m => m.score >= minScore);
            setMatches(results);
            setIsLoading(false);
            showToast(`Found ${results.length} matches!`);
        }, 1500);
    };

    const handleApprove = (match) => {
        setShowApproveModal(null);
        showToast(`Match approved! Notifying ${match.hospital}...`);
        setMatches(matches.filter(m => m.id !== match.id));
    };

    const handleReject = (match) => {
        setMatches(matches.filter(m => m.id !== match.id));
        showToast('Match rejected');
    };

    const handleExport = () => {
        const data = matches.map(m => ({
            Donor: m.donor,
            Recipient: m.recipient,
            Organ: m.organ,
            Score: m.score,
            Hospital: m.hospital
        }));
        const csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(data[0]).join(',') + '\n'
            + data.map(row => Object.values(row).join(',')).join('\n');

        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = 'matches_export.csv';
        link.click();
        showToast('Matches exported to CSV!');
    };

    const updateWeight = (index, newWeight) => {
        setWeights(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], weight: newWeight };
            return updated;
        });
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'var(--accent-secondary)';
        if (score >= 80) return 'var(--accent-warning)';
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
                    <h1 className="page-title">🤖 AI Matching Engine</h1>
                    <p className="page-subtitle">Intelligent donor-recipient matching with explainable AI</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {matches.length > 0 && (
                        <button className="btn btn-secondary" onClick={handleExport}>
                            📥 Export CSV
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={runMatching} disabled={isLoading}>
                        {isLoading ? '⏳ Running...' : '🔄 Run Matching'}
                    </button>
                </div>
            </div>

            {/* Algorithm Weights */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">⚙️ Algorithm Weights</h3>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Adjust weights to customize matching priorities</span>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                        {weights.map((w, i) => (
                            <div key={w.name} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: `conic-gradient(${w.color} ${w.weight * 3.6}deg, var(--bg-secondary) 0deg)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 0.5rem', position: 'relative'
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.9rem'
                                    }}>
                                        {w.weight}%
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{w.name}</p>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={w.weight}
                                    onChange={(e) => updateWeight(i, parseInt(e.target.value))}
                                    style={{ width: '80%', marginTop: '0.5rem', accentColor: w.color }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={selectedOrgan}
                        onChange={(e) => setSelectedOrgan(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Organs</option>
                        <option value="Kidney">Kidney</option>
                        <option value="Liver">Liver</option>
                        <option value="Heart">Heart</option>
                        <option value="Lung">Lung</option>
                        <option value="Cornea">Cornea</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Min Score:</span>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            value={minScore}
                            onChange={(e) => setMinScore(parseInt(e.target.value))}
                            style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
                        />
                        <span style={{ fontWeight: 700, color: getScoreColor(minScore) }}>{minScore}%</span>
                    </div>

                    {location.state?.donor && (
                        <div style={{ background: 'rgba(233, 69, 96, 0.2)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                            Donor: <strong>{location.state.donor.name}</strong>
                        </div>
                    )}
                    {location.state?.recipient && (
                        <div style={{ background: 'rgba(0, 212, 170, 0.2)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                            Recipient: <strong>{location.state.recipient.name}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{
                        width: '60px', height: '60px', border: '4px solid var(--border-color)',
                        borderTop: '4px solid var(--accent-primary)', borderRadius: '50%',
                        animation: 'spin 1s linear infinite', margin: '0 auto 1rem'
                    }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Running AI matching algorithm...</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Analyzing compatibility factors</p>
                </div>
            )}

            {/* Results */}
            {!isLoading && matches.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No Matches Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Click "Run Matching" to find donor-recipient matches
                    </p>
                    <button className="btn btn-primary" onClick={runMatching}>
                        🔄 Run Matching Now
                    </button>
                </div>
            )}

            {!isLoading && matches.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🎯 Match Results ({matches.length})</h3>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Donor</th>
                                <th>Recipient</th>
                                <th>Organ</th>
                                <th>Score</th>
                                <th>Hospital</th>
                                <th>Distance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map(match => (
                                <tr key={match.id}>
                                    <td>
                                        <div>
                                            <strong>{match.donor}</strong>
                                            <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                                <span className="blood-type" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{match.donorBlood}</span>
                                            </p>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <strong>{match.recipient}</strong>
                                            <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                                <span className="blood-type" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{match.recipientBlood}</span>
                                            </p>
                                        </div>
                                    </td>
                                    <td><span className="organ-badge">{match.organ}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                width: '60px', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${match.score}%`, height: '100%',
                                                    background: getScoreColor(match.score), borderRadius: '4px'
                                                }}></div>
                                            </div>
                                            <span style={{ fontWeight: 700, color: getScoreColor(match.score) }}>{match.score}%</span>
                                        </div>
                                    </td>
                                    <td>{match.hospital}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{match.distance}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => setShowExplanation(match)}
                                            >
                                                🧠 Why?
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => setShowApproveModal(match)}
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                style={{
                                                    padding: '0.4rem 0.75rem', background: 'rgba(233, 69, 96, 0.2)',
                                                    border: 'none', borderRadius: '8px', color: 'var(--accent-primary)',
                                                    cursor: 'pointer', fontSize: '0.8rem'
                                                }}
                                                onClick={() => handleReject(match)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Explanation Modal */}
            {showExplanation && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowExplanation(null)}>
                    <div className="card" style={{ width: '550px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">🧠 Match Explanation</h3>
                            <button onClick={() => setShowExplanation(null)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="card-body">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{
                                    fontSize: '3rem', fontWeight: 700,
                                    color: getScoreColor(showExplanation.score)
                                }}>
                                    {showExplanation.score}%
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>Overall Compatibility Score</p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Score Breakdown:</h4>
                                {weights.map(w => {
                                    const contribution = Math.round((w.weight / 100) * showExplanation.score);
                                    return (
                                        <div key={w.name} style={{ marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.9rem' }}>{w.name}</span>
                                                <span style={{ fontWeight: 600, color: w.color }}>+{contribution}</span>
                                            </div>
                                            <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${w.weight}%`, height: '100%', background: w.color, borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem' }}>✅ Favorable Factors:</h4>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                                    <li>Compatible blood types ({showExplanation.donorBlood} → {showExplanation.recipientBlood})</li>
                                    <li>Good HLA antigen matching</li>
                                    <li>Within acceptable transport distance</li>
                                    <li>Recipient has high medical urgency</li>
                                </ul>
                            </div>

                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--accent-warning)' }}>⚠️ Considerations:</h4>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                                    <li>Cross-match test required before final approval</li>
                                    <li>Verify latest antibody screening results</li>
                                </ul>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => { setShowExplanation(null); setShowApproveModal(showExplanation); }}>
                                ✓ Proceed to Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            {showApproveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '450px' }}>
                        <div className="card-header">
                            <h3 className="card-title">✓ Approve Match</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <p style={{ margin: '0 0 0.5rem' }}><strong>Donor:</strong> {showApproveModal.donor}</p>
                                <p style={{ margin: '0 0 0.5rem' }}><strong>Recipient:</strong> {showApproveModal.recipient}</p>
                                <p style={{ margin: '0 0 0.5rem' }}><strong>Organ:</strong> {showApproveModal.organ}</p>
                                <p style={{ margin: 0 }}><strong>Hospital:</strong> {showApproveModal.hospital}</p>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                This will notify the hospital and initiate the transplant coordination process.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowApproveModal(null)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleApprove(showApproveModal)}>
                                    ✓ Confirm Approval
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
