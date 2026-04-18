import { useState } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    if (!isOpen) return null;

    const widths = {
        sm: '400px',
        md: '500px',
        lg: '700px',
        xl: '900px'
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    width: widths[size],
                    maxHeight: '85vh',
                    overflow: 'auto',
                    animation: 'slideUp 0.3s ease'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="card-header">
                    <h3 className="card-title">{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>
                <div className="card-body">
                    {children}
                </div>
            </div>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{message}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    style={{
                        flex: 1,
                        background: danger ? 'var(--accent-primary)' : undefined
                    }}
                    onClick={() => { onConfirm(); onClose(); }}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}
