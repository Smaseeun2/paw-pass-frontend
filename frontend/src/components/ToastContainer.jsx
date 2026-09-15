// src/components/ToastContainer.jsx
// 전역 토스트 알림 렌더링 컴포넌트 — App.jsx 최상위에 마운트

import { useState, useEffect } from 'react';
import { TOAST_EVENT } from '../utils/toast';

const TYPE_STYLES = {
  success: { background: '#16a34a', icon: '✅' },
  error:   { background: '#dc2626', icon: '❌' },
  warning: { background: '#d97706', icon: '⚠️' },
  info:    { background: '#2563eb', icon: 'ℹ️' },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const { id, message, type, duration } = e.detail;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration || 3000);
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '360px',
    }}>
      {toasts.map(toast => {
        const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: style.background,
              color: '#fff',
              padding: '12px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'toastIn 0.25s ease',
            }}
          >
            <span>{style.icon}</span>
            <span>{toast.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
