import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function FrontDogIllustration() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
      <svg width="110" height="110" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft Background Bubble */}
        <circle cx="60" cy="60" r="54" fill="#FDF5C9" />
        <circle cx="60" cy="60" r="46" fill="#FEE2E2" opacity="0.65" />
        
        {/* Left Ear */}
        <path d="M26 38 C20 48, 22 72, 34 76 C40 78, 42 62, 38 48 C36 40, 30 34, 26 38 Z" fill="#D97706" />
        <path d="M28 44 C24 52, 26 68, 34 70 C37 71, 38 60, 36 50 Z" fill="#B45309" opacity="0.3" />

        {/* Right Ear */}
        <path d="M94 38 C100 48, 98 72, 86 76 C80 78, 78 62, 82 48 C84 40, 90 34, 94 38 Z" fill="#D97706" />
        <path d="M92 44 C96 52, 94 68, 86 70 C83 71, 82 60, 84 50 Z" fill="#B45309" opacity="0.3" />

        {/* Dog Head */}
        <ellipse cx="60" cy="62" rx="34" ry="30" fill="#FBBF24" />

        {/* White Forehead Blaze */}
        <path d="M54 36 C54 36, 60 48, 60 54 C60 48, 66 36, 66 36 Z" fill="#FFFFFF" />

        {/* Snout */}
        <ellipse cx="60" cy="70" rx="17" ry="13" fill="#FFFFFF" />

        {/* Nose */}
        <path d="M55 64 C55 64, 60 62, 65 64 C67 67, 63 71, 60 71 C57 71, 53 67, 55 64 Z" fill="#1E293B" />
        <ellipse cx="58.5" cy="65" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.8" />

        {/* Mouth */}
        <path d="M60 71 L60 76 M54 75 C56 77, 60 77, 60 76 C60 77, 64 77, 66 75" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />

        {/* Cheeks Blush */}
        <ellipse cx="40" cy="68" rx="5" ry="3.5" fill="#F472B6" opacity="0.5" />
        <ellipse cx="80" cy="68" rx="5" ry="3.5" fill="#F472B6" opacity="0.5" />

        {/* Left Sparkling Eye */}
        <ellipse cx="45" cy="55" rx="5.5" ry="6.5" fill="#1E293B" />
        <circle cx="43" cy="52.5" r="2.2" fill="#FFFFFF" />
        <circle cx="47" cy="57" r="1.2" fill="#FFFFFF" />

        {/* Right Sparkling Eye */}
        <ellipse cx="75" cy="55" rx="5.5" ry="6.5" fill="#1E293B" />
        <circle cx="73" cy="52.5" r="2.2" fill="#FFFFFF" />
        <circle cx="77" cy="57" r="1.2" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M40 46 C42 44, 48 45, 49 47" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <path d="M80 46 C78 44, 72 45, 71 47" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />

        {/* Front Paws */}
        <g>
          <ellipse cx="46" cy="94" rx="8" ry="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <ellipse cx="46" cy="93" rx="4" ry="3" fill="#FFFFFF" />
          <line x1="43" y1="92" x2="43" y2="95" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
          <line x1="49" y1="92" x2="49" y2="95" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />

          <ellipse cx="74" cy="94" rx="8" ry="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <ellipse cx="74" cy="93" rx="4" ry="3" fill="#FFFFFF" />
          <line x1="71" y1="92" x2="71" y2="95" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
          <line x1="77" y1="92" x2="77" y2="95" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

function Footer() {
  const { user, withdraw } = useAuth();
  const navigate = useNavigate();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmWithdraw = async () => {
    setIsProcessing(true);
    try {
      await withdraw(() => {
        setShowWithdrawModal(false);
        navigate('/');
      });
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <footer 
        className="pawpass-footer"
        style={{ 
          backgroundColor: '#f1f5f9', 
          borderTop: '1px solid #e2e8f0', 
          padding: '36px 20px 32px 20px', 
          marginTop: 'auto',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
          margin: 0
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <img 
              src="/logo.png" 
              alt="PawPass 로고" 
              style={{ 
                width: '28px', 
                height: '28px', 
                objectFit: 'contain',
                display: 'block'
              }} 
            />
            <span style={{ 
              fontFamily: "'Nunito', 'Comfortaa', -apple-system, sans-serif",
              fontWeight: '1000', 
              fontSize: '20px', 
              letterSpacing: '-0.7px',
              display: 'inline-flex',
              alignItems: 'baseline',
              lineHeight: 1
            }}>
              <span style={{ color: '#5F50A9', fontWeight: '1000', display: 'inline-flex', alignItems: 'baseline' }}>
                <span style={{ marginRight: '-1.2px' }}>P</span>
                <span style={{ fontSize: '0.84em', letterSpacing: '-0.5px' }}>AW</span>
              </span>
              <span style={{ 
                background: 'linear-gradient(135deg, #F472B6 0%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '1000',
                display: 'inline-flex',
                alignItems: 'baseline'
              }}>
                <span style={{ marginRight: '-1.2px' }}>P</span>
                <span style={{ fontSize: '0.84em', letterSpacing: '-0.5px' }}>ASS</span>
              </span>
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>반려동물과 함께하는 완벽한 여행 설계</p>
          
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', margin: '10px 0', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link 
              to="/support" 
              style={{ color: '#475569', textDecoration: 'none' }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#1e293b'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#475569'; }}
            >
              고객센터
            </Link>

            <span style={{ color: '#cbd5e1' }}>|</span>
            <a 
              href="mailto:pawpass.support@gmail.com" 
              style={{ color: '#475569', textDecoration: 'none' }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#1e293b'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#475569'; }}
            >
              제휴 및 문의하기
            </a>
            
            {user && (
              <>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <button 
                  onClick={() => setShowWithdrawModal(true)}
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
                  onMouseOver={(e) => { e.currentTarget.style.color = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#475569'; }}
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

      {/* 화면 중앙 회원탈퇴 모달 */}
      {showWithdrawModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => !isProcessing && setShowWithdrawModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              maxWidth: '420px',
              width: '100%',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.92) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            {/* 강아지 정면 일러스트 */}
            <FrontDogIllustration />

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
              정말 PawPass를 떠나시겠어요?
            </h3>
            
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px 0', wordBreak: 'keep-all' }}>
              회원 탈퇴 시 등록하신 소중한 <strong style={{ color: '#1e293b' }}>반려동물 정보, 즐겨찾기 목록, 저장된 맞춤 동선</strong>이 모두 영구 삭제되며 복구할 수 없습니다.
            </p>

            {/* 액션 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                disabled={isProcessing}
                style={{
                  flex: 1.2,
                  padding: '13px 0',
                  backgroundColor: '#5F50A9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(95, 80, 169, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => !isProcessing && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !isProcessing && (e.currentTarget.style.transform = 'none')}
              >
                계속 함께하기 🐾
              </button>

              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={isProcessing}
                style={{
                  flex: 0.8,
                  padding: '13px 0',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#fecaca')}
                onMouseOut={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#fee2e2')}
              >
                {isProcessing ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;

