import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Footer() {
  const { user, withdraw } = useAuth();
  const navigate = useNavigate();

  const handleWithdraw = () => {
    const isConfirmed = window.confirm("정말로 탈퇴하시겠습니까? 모든 정보가 삭제되며 복구할 수 없습니다.");
    if (isConfirmed) {
      withdraw(() => navigate('/'));
    }
  };

  return (
    <footer style={{ 
      backgroundColor: '#f8fafc', 
      borderTop: '1px solid #e2e8f0', 
      padding: '40px 20px', 
      marginTop: 'auto',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
        
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>🐾 PawPass</h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>반려동물과 함께하는 완벽한 여행 설계</p>
        
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', margin: '10px 0', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/support" style={{ color: '#475569', textDecoration: 'none' }}>이용약관</Link>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Link to="/support" style={{ color: '#475569', textDecoration: 'none' }}>개인정보처리방침</Link>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <a href="mailto:pawpass.support@gmail.com" style={{ color: '#475569', textDecoration: 'none' }}>제휴 및 문의하기</a>
          
          {user && (
            <>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button 
                onClick={handleWithdraw}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  color: '#475569', 
                  textDecoration: 'none', 
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'inherit'
                }}
              >
                회원탈퇴
              </button>
            </>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
          이메일: <a href="mailto:pawpass.support@gmail.com" style={{ color: '#2563eb', textDecoration: 'none' }}>pawpass.support@gmail.com</a>
        </p>
        
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
          관광지 정보 출처: ⓒ한국관광공사 ⓒ한국문화정보원<br />
          © {new Date().getFullYear()} PawPass. All rights reserved.
        </p>

      </div>
    </footer>
  );
}

export default Footer;
