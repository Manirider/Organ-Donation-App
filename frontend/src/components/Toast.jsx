import { useState, createContext, useContext } from 'react';

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
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
                            background: toast.type === 'success' ? 'rgba(0, 212, 170, 0.9)' :
                                toast.type === 'error' ? 'rgba(233, 69, 96, 0.9)' :
                                    toast.type === 'warning' ? 'rgba(245, 158, 11, 0.9)' :
                                        'rgba(59, 130, 246, 0.9)',
                            color: 'white',
                            fontWeight: 500,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            animation: 'slideIn 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <span>
                            {toast.type === 'success' ? '✓' :
                                toast.type === 'error' ? '✕' :
                                    toast.type === 'warning' ? '⚠' : 'ℹ'}
                        </span>
                        {toast.message}
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </ToastContext.Provider>
    );
}
