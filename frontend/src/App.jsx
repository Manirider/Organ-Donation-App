import { useState, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

// Pages
import Dashboard from './pages/Dashboard';
import OrganDonors from './pages/OrganDonors';
import BloodDonors from './pages/BloodDonors';
import Recipients from './pages/Recipients';
import Hospitals from './pages/Hospitals';
import BloodBanks from './pages/BloodBanks';
import Matching from './pages/Matching';
import Login from './pages/Login';

// Toast Context
const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const success = (message) => addToast(message, 'success');
  const error = (message) => addToast(message, 'error');
  const info = (message) => addToast(message, 'info');
  const warning = (message) => addToast(message, 'warning');

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              background: toast.type === 'success' ? 'rgba(0, 212, 170, 0.95)' :
                toast.type === 'error' ? 'rgba(233, 69, 96, 0.95)' :
                  toast.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' :
                    'rgba(59, 130, 246, 0.95)',
              color: 'white',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              minWidth: '250px'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>
              {toast.type === 'success' ? '✓' :
                toast.type === 'error' ? '✕' :
                  toast.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Sidebar({ currentPath }) {
  const navigate = useNavigate();

  const navItems = [
    {
      section: 'Main', items: [
        { path: '/', icon: '📊', label: 'Dashboard' },
        { path: '/matching', icon: '🔗', label: 'AI Matching' },
      ]
    },
    {
      section: 'Donors', items: [
        { path: '/organ-donors', icon: '❤️', label: 'Organ Donors' },
        { path: '/blood-donors', icon: '🩸', label: 'Blood Donors' },
      ]
    },
    {
      section: 'Management', items: [
        { path: '/recipients', icon: '👥', label: 'Recipients' },
        { path: '/hospitals', icon: '🏨', label: 'Hospitals' },
        { path: '/blood-banks', icon: '🏦', label: 'Blood Banks' },
      ]
    },
    {
      section: 'System', items: [
        { path: '/audit', icon: '📋', label: 'Audit Logs' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
      ]
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="icon">🏥</div>
        <h1>OrganDonate</h1>
      </div>

      <nav>
        {navItems.map((section, sIdx) => (
          <div className="nav-section" key={sIdx}>
            <div className="nav-label">{section.section}</div>
            {section.items.map((item, iIdx) => (
              <div
                key={iIdx}
                className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-hover)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600
          }}>
            A
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Admin User</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>System Admin</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              window.location.href = '/login';
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}

// Audit Logs Page
function AuditLogs() {
  const logs = [
    { id: 1, user: 'Admin', action: 'CREATE', resource: 'Donor', description: 'Registered new organ donor', time: '2 min ago', status: 'success' },
    { id: 2, user: 'Dr. Sharma', action: 'MATCH', resource: 'Match', description: 'Accepted kidney match M-2847', time: '15 min ago', status: 'success' },
    { id: 3, user: 'System', action: 'EMERGENCY', resource: 'Alert', description: 'O- blood emergency broadcast', time: '1 hour ago', status: 'success' },
    { id: 4, user: 'Admin', action: 'UPDATE', resource: 'Hospital', description: 'Updated AIIMS bed capacity', time: '2 hours ago', status: 'success' },
    { id: 5, user: 'Dr. Patel', action: 'LOGIN', resource: 'Session', description: 'User login from Mumbai', time: '3 hours ago', status: 'success' },
    { id: 6, user: 'System', action: 'VERIFY', resource: 'Donor', description: 'Donor eligibility verified', time: '4 hours ago', status: 'success' },
    { id: 7, user: 'Nurse Singh', action: 'READ', resource: 'Recipient', description: 'Viewed patient record', time: '5 hours ago', status: 'success' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Audit Logs</h1>
          <p className="page-subtitle">System activity and compliance tracking</p>
        </div>
        <button className="btn btn-secondary">Export Logs</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>User</th><th>Action</th><th>Resource</th><th>Description</th><th>Time</th><th>Status</th></tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td><strong>{log.user}</strong></td>
                <td><span className="badge active">{log.action}</span></td>
                <td>{log.resource}</td>
                <td>{log.description}</td>
                <td style={{ color: 'var(--text-muted)' }}>{log.time}</td>
                <td><span style={{ color: 'var(--accent-secondary)' }}>✓</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Settings Page
function Settings() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-subtitle">System configuration and preferences</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">🔔 Notifications</h3></div>
          <div className="card-body">
            {['Email Alerts', 'SMS Notifications', 'Push Notifications', 'Emergency Broadcasts'].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>{item}</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked={i < 3} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🤖 AI Configuration</h3></div>
          <div className="card-body">
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Match Confidence Threshold</label>
              <input type="range" min="50" max="100" defaultValue="80" style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>Current: 80%</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Max Search Radius (km)</label>
              <input type="number" defaultValue="500" style={{
                width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
              }} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🔐 Security</h3></div>
          <div className="card-body">
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Session Timeout (minutes)</label>
              <input type="number" defaultValue="30" style={{
                width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
              <span>Two-Factor Authentication</span>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">📧 Email Templates</h3></div>
          <div className="card-body">
            {['Welcome Email', 'OTP Verification', 'Match Notification', 'Emergency Alert'].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>{item}</span>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Edit</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('access_token'));

  if (!isAuthenticated && location.pathname !== '/login') {
    return (
      <ToastProvider>
        <Login onLogin={() => setIsAuthenticated(true)} />
      </ToastProvider>
    );
  }

  if (location.pathname === '/login') {
    return (
      <ToastProvider>
        <Login onLogin={() => {
          setIsAuthenticated(true);
          window.location.href = '/';
        }} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-container">
        <Sidebar currentPath={location.pathname} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/matching" element={<Matching />} />
            <Route path="/organ-donors" element={<OrganDonors />} />
            <Route path="/blood-donors" element={<BloodDonors />} />
            <Route path="/recipients" element={<Recipients />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/blood-banks" element={<BloodBanks />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--bg-secondary);
          transition: .3s;
          border-radius: 26px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        .toggle input:checked + .toggle-slider {
          background: var(--accent-secondary);
        }
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
      `}</style>
    </ToastProvider>
  );
}

export default App;
