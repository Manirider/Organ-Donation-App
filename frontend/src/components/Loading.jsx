import { useState, useEffect } from 'react';

export default function LoadingSpinner({ size = 40 }) {
    return (
        <div style={{
            width: size,
            height: size,
            border: '3px solid var(--bg-secondary)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }}>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export function PageLoader() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <LoadingSpinner size={50} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
    );
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '4px' }) {
    return (
        <div style={{
            width,
            height,
            borderRadius,
            background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
        }}>
            <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
        </div>
    );
}
