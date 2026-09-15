import React from 'react';

export default function Button({ children, variant = 'primary', onClick, style = {}, type = 'button', disabled = false }) {
  let baseStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    border: 'none',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  if (variant === 'primary') {
    baseStyle = { ...baseStyle, backgroundColor: '#2563eb', color: '#fff' };
  } else if (variant === 'outline') {
    baseStyle = { ...baseStyle, backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1' };
  } else if (variant === 'danger') {
    baseStyle = { ...baseStyle, backgroundColor: '#ef4444', color: '#fff' };
  } else if (variant === 'ghost') {
    baseStyle = { ...baseStyle, backgroundColor: 'transparent', color: '#334155' };
  }

  return (
    <button type={type} onClick={onClick} style={baseStyle} disabled={disabled}>
      {children}
    </button>
  );
}
