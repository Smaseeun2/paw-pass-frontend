// src/components/ToastContainer.jsx
// 전역 토스트 알림 렌더링 컴포넌트 — App.jsx 최상위에 마운트

import { useState, useEffect } from 'react';
import { TOAST_EVENT } from '../utils/toast';

const TYPE_STYLES = {
  success: { 
    background: '#ECFDF5', 
    border: '#A7F3D0', 
    color: '#065F46', 
    icon: '✨' 
  },
  error: { 
    background: '#FEF2F2', 
    border: '#FECACA', 
    color: '#991B1B', 
    icon: '🚨' 
  },
  warning: { 
    background: '#FFFBEB', 
    border: '#FDE68A', 
    color: '#92400E', 
    icon: '⚠️' 
  },
  info: { 
    background: '#F0F9FF', 
    border: '#BAE6FD', 
    color: '#075985', 
    icon: '💡' 
  },
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
    <div className="pawpass-toast-container">
      <style>{`
        .pawpass-toast-container {
          position: fixed;
          bottom: 28px;
          left: 28px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 380px;
          pointer-events: none;
        }
        .pawpass-toast-item {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 18px;
          border-radius: 16px;
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.4;
          letter-spacing: -0.2px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(8px);
          animation: toastSlideInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          word-break: keep-all;
        }
        @keyframes toastSlideInLeft {
          from {
            opacity: 0;
            transform: translateX(-35px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @media (max-width: 768px) {
          .pawpass-toast-container {
            bottom: calc(72px + env(safe-area-inset-bottom, 8px));
            left: 14px;
            right: auto;
            max-width: calc(100vw - 28px);
          }
          .pawpass-toast-item {
            padding: 10px 15px;
            font-size: 12.5px;
            border-radius: 14px;
          }
        }
      `}</style>
      {toasts.map(toast => {
        const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
        return (
          <div
            key={toast.id}
            className="pawpass-toast-item"
            style={{
              backgroundColor: style.background,
              border: `1.5px solid ${style.border}`,
              color: style.color,
            }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>
              {style.icon}
            </span>
            <span style={{ flex: 1 }}>
              {toast.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
