import React from 'react';

export default function Badge({ children, status = 'default', style = {} }) {
  let baseStyle = {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold',
    display: 'inline-block',
    ...style
  };

  if (status === '가능' || status === 'success') {
    baseStyle = { ...baseStyle, backgroundColor: '#dcfce7', color: '#15803d' };
  } else if (status === '조건부' || status === 'warning') {
    baseStyle = { ...baseStyle, backgroundColor: '#fef9c3', color: '#a16207' };
  } else if (status === '불가' || status === 'danger') {
    baseStyle = { ...baseStyle, backgroundColor: '#fee2e2', color: '#b91c1c' };
  } else {
    baseStyle = { ...baseStyle, backgroundColor: '#f1f5f9', color: '#64748b' };
  }

  return (
    <span style={baseStyle}>
      {children}
    </span>
  );
}
