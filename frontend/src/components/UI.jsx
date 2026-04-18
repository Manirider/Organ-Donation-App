export function StatCard({ icon, label, value, change, type, onClick }) {
    const iconColors = {
        donors: { bg: 'rgba(233, 69, 96, 0.2)', color: 'var(--accent-primary)' },
        recipients: { bg: 'rgba(0, 212, 170, 0.2)', color: 'var(--accent-secondary)' },
        matches: { bg: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-info)' },
        hospitals: { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-warning)' },
        default: { bg: 'var(--bg-secondary)', color: 'var(--text-primary)' }
    };

    const colors = iconColors[type] || iconColors.default;

    return (
        <div
            className="stat-card"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <div className="stat-header">
                <div
                    className="stat-icon"
                    style={{ background: colors.bg, color: colors.color }}
                >
                    {icon}
                </div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {change && (
                <div className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
                    {change.startsWith('+') ? '↑' : '↓'} {change} from last month
                </div>
            )}
        </div>
    );
}

export function Badge({ children, type = 'default' }) {
    const styles = {
        critical: { bg: 'rgba(233, 69, 96, 0.2)', color: 'var(--accent-primary)' },
        high: { bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-warning)' },
        active: { bg: 'rgba(0, 212, 170, 0.2)', color: 'var(--accent-secondary)' },
        pending: { bg: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-info)' },
        default: { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' }
    };

    const style = styles[type.toLowerCase()] || styles.default;

    return (
        <span style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: style.bg,
            color: style.color
        }}>
            {children}
        </span>
    );
}

export function BloodBadge({ type }) {
    return (
        <span style={{
            background: type === 'O-' ? 'rgba(233, 69, 96, 0.3)' : 'rgba(233, 69, 96, 0.2)',
            color: 'var(--accent-primary)',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontWeight: 600
        }}>
            {type}
        </span>
    );
}

export function Avatar({ name, size = 40, gradient = 'var(--gradient-primary)' }) {
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: size * 0.4
        }}>
            {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
    );
}

export function ProgressBar({ value, max = 100, color = 'var(--accent-secondary)', height = 8 }) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div style={{
            width: '100%',
            height,
            background: 'var(--bg-secondary)',
            borderRadius: height / 2,
            overflow: 'hidden'
        }}>
            <div style={{
                width: `${percentage}%`,
                height: '100%',
                background: color,
                borderRadius: height / 2,
                transition: 'width 0.5s ease'
            }} />
        </div>
    );
}

export function EmptyState({ icon = '📭', title, message, action }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)'
        }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</p>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ marginBottom: '1rem' }}>{message}</p>
            {action}
        </div>
    );
}
