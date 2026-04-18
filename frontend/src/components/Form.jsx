export function Input({ label, type = 'text', placeholder, value, onChange, error, required, ...props }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    {label} {required && <span style={{ color: 'var(--accent-primary)' }}>*</span>}
                </label>
            )}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${error ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease'
                }}
                {...props}
            />
            {error && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export function Select({ label, value, onChange, options, placeholder, error, required }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    {label} {required && <span style={{ color: 'var(--accent-primary)' }}>*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${error ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                }}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt, i) => (
                    <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
                        {typeof opt === 'object' ? opt.label : opt}
                    </option>
                ))}
            </select>
            {error && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export function Checkbox({ label, checked, onChange, disabled }) {
    return (
        <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            background: checked ? 'rgba(233, 69, 96, 0.1)' : 'var(--bg-secondary)',
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'background 0.2s ease'
        }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>{label}</span>
        </label>
    );
}

export function TextArea({ label, placeholder, value, onChange, rows = 4, error }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    {label}
                </label>
            )}
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                rows={rows}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${error ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical'
                }}
            />
        </div>
    );
}

export function FormRow({ children }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {children}
        </div>
    );
}
