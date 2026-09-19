// src/components/FloatingGuideWidget.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const guideSteps = [
  {
    id: 'home',
    icon: '🏠',
    title: '홈',
    tag: '카테고리 & 검색',
    desc: '다양한 카테고리와 인기 관광지를 바로 확인하고, 원하는 키워드로 검색해보세요.',
    path: '/',
    btnText: '홈으로 이동하기',
    textColor: '#6B589C',
    tagBg: '#F3EFFF',
    btnBg: 'linear-gradient(135deg, #9F8BD0 0%, #7E69B8 100%)'
  },
  {
    id: 'profile',
    icon: '🐾',
    title: '프로필 등록',
    tag: '반려동물 정보 등록',
    desc: '반려동물 프로필을 등록하면, 관광지별 동반 출입 가능 여부를 바로 확인할 수 있어요.',
    path: '/profile',
    btnText: '프로필 등록하러 가기',
    textColor: '#C26D45',
    tagBg: '#FFF2EB',
    btnBg: 'linear-gradient(135deg, #F6A57E 0%, #E37B50 100%)'
  },
  {
    id: 'search',
    icon: '🔍',
    title: '관광지 탐색',
    tag: '동반 출입 판정 & 상세정보',
    desc: '반려동물 동반 출입 판정을 확인하고, 관광지를 누르면 관광지별 상세페이지를 볼 수 있어요.',
    path: '/search',
    btnText: '관광지 탐색하기',
    textColor: '#3A7EC4',
    tagBg: '#EEF6FF',
    btnBg: 'linear-gradient(135deg, #7CB6F2 0%, #4D96E4 100%)'
  },
  {
    id: 'map',
    icon: '🗺️',
    title: '여행 동선',
    tag: '최적 경로 & 드래그',
    desc: '가고 싶은 장소들을 담아 지도 위 선으로 잇고 최적 이동 동선을 완성하세요.',
    path: '/map',
    btnText: '동선 플래너 가기',
    textColor: '#2E8F67',
    tagBg: '#EAF8F1',
    btnBg: 'linear-gradient(135deg, #6ECBA1 0%, #40A87C 100%)'
  },
  {
    id: 'favorites',
    icon: '❤️',
    title: '즐겨찾기',
    tag: '나의 찜 목록',
    desc: '마음에 드는 장소에 핑크 하트를 눌러 보관하고 언제든 모아보세요.',
    path: '/favorites',
    btnText: '즐겨찾기 보러가기',
    textColor: '#C44E7E',
    tagBg: '#FFF0F6',
    btnBg: 'linear-gradient(135deg, #F89BBF 0%, #E26895 100%)'
  },
  {
    id: 'support',
    icon: '📢',
    title: '고객센터',
    tag: '공지 & 질문과 답변',
    desc: '서비스 업데이트 소식과 대표 펫 설정 기준 등 자주 묻는 질문을 확인하세요.',
    path: '/support',
    btnText: '고객센터 바로가기',
    textColor: '#725AA6',
    tagBg: '#F5EFFF',
    btnBg: 'linear-gradient(135deg, #B59DE4 0%, #8E73C8 100%)'
  }
];

export default function FloatingGuideWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const bubbleRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // 스크롤 위치 감지 (상세 패널 열림 여부에 따라 패널 스크롤 또는 윈도우 스크롤 감지)
  useEffect(() => {
    let currentDrawerEl = null;

    const handleWindowScroll = () => {
      const drawerEl = document.getElementById('pawpass-drawer-scroll-container');
      if (drawerEl) {
        // 상세 패널이 열려있는 경우 상세 패널 스크롤 기준
        setShowScrollTop(drawerEl.scrollTop > 180);
      } else {
        // 상세 패널이 닫혀있는 경우 윈도우 스크롤 기준
        setShowScrollTop(window.scrollY > 180);
      }
    };

    const handleDrawerScroll = (e) => {
      setShowScrollTop(e.currentTarget.scrollTop > 180);
    };

    const updateScrollTarget = () => {
      const drawerEl = document.getElementById('pawpass-drawer-scroll-container');
      if (drawerEl !== currentDrawerEl) {
        if (currentDrawerEl) {
          currentDrawerEl.removeEventListener('scroll', handleDrawerScroll);
        }
        currentDrawerEl = drawerEl;
        if (currentDrawerEl) {
          currentDrawerEl.addEventListener('scroll', handleDrawerScroll, { passive: true });
          setShowScrollTop(currentDrawerEl.scrollTop > 180);
        } else {
          setShowScrollTop(window.scrollY > 180);
        }
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    
    // DOM 변화(상세 패널 열림/닫힘) 감지
    const observer = new MutationObserver(() => {
      updateScrollTarget();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    updateScrollTarget();

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (currentDrawerEl) {
        currentDrawerEl.removeEventListener('scroll', handleDrawerScroll);
      }
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    const drawerEl = document.getElementById('pawpass-drawer-scroll-container');
    if (drawerEl) {
      drawerEl.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 바깥 영역 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        bubbleRef.current &&
        !bubbleRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : guideSteps.length - 1));
  };

  const handleNext = () => {
    setCurrentStep((prev) => (prev < guideSteps.length - 1 ? prev + 1 : 0));
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const current = guideSteps[currentStep];
  const isFavoritesStep = current.id === 'favorites';

  return (
    <>
      <style>{`
        @keyframes miniBubbleIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scrollTopFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .floating-guide-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 10025;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transition: bottom 0.25s ease;
        }
        .floating-guide-bubble {
          position: fixed;
          bottom: 84px;
          right: 24px;
          z-index: 10026;
          width: 275px;
          background-color: #ffffff;
          border-radius: 20px;
          box-shadow: 0 15px 35px -8px rgba(126, 105, 184, 0.22), 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.85);
          padding: 14px 16px 12px 16px;
          animation: miniBubbleIn 0.2s ease-out forwards;
          box-sizing: border-box;
          transition: bottom 0.25s ease;
        }
        .floating-guide-bubble.with-scroll-top {
          bottom: 140px;
        }

        /* 📱 모바일 환경 (768px 이하): 하단 탭바(높이 약 60px) 위에 여유있게 배치 */
        @media (max-width: 768px) {
          .floating-guide-container {
            bottom: calc(68px + env(safe-area-inset-bottom, 8px)) !important;
            right: 14px !important;
          }
          .floating-guide-bubble {
            bottom: calc(128px + env(safe-area-inset-bottom, 8px)) !important;
            right: 14px !important;
            width: calc(100vw - 28px) !important;
            max-width: 290px !important;
          }
          .floating-guide-bubble.with-scroll-top {
            bottom: calc(184px + env(safe-area-inset-bottom, 8px)) !important;
          }
        }

        .scroll-to-top-btn {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .scroll-to-top-btn:hover {
          transform: translateY(-3px) scale(1.08) !important;
          background-color: #F3EEFA !important;
          box-shadow: 0 8px 22px rgba(95, 80, 169, 0.35) !important;
        }
        .mini-guide-btn {
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
        }
        .mini-guide-btn:hover {
          transform: scale(1.08) !important;
          box-shadow: 0 8px 22px rgba(159, 139, 208, 0.5) !important;
        }
        .mini-nav-btn {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          font-size: 13px;
          font-weight: bold;
          transition: all 0.15s ease;
        }
        .mini-nav-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
          transform: scale(1.08);
        }
        .mini-guide-dot {
          height: 5px;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mini-action-btn {
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        .mini-action-btn:hover {
          transform: translateY(-1px);
          filter: brightness(0.96);
        }
      `}</style>

      {/* 1. 하단 미니 말풍선 가이드 팝오버 */}
      {isOpen && (
        <div
          ref={bubbleRef}
          className={`floating-guide-bubble ${showScrollTop ? 'with-scroll-top' : ''}`}
        >
          {/* 말풍선 아래쪽 꼬리 */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              right: '20px',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #ffffff',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.05))'
            }}
          />

          {/* 상단 헤더 (스텝 카운터 + 태그 + 닫기) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#7E69B8', backgroundColor: '#F3EFFF', padding: '3px 8px', borderRadius: '50px' }}>
                {currentStep + 1} / {guideSteps.length}
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: current.textColor, backgroundColor: current.tagBg, padding: '3px 8px', borderRadius: '50px' }}>
                {current.tag}
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#1e293b')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
              title="닫기"
            >
              ✕
            </button>
          </div>

          {/* 슬라이드 본문 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '19px', lineHeight: 1 }}>{current.icon}</span>
              <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#1e293b' }}>
                {current.title}
              </h4>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5', minHeight: '38px', wordBreak: 'keep-all' }}>
              {current.desc}
            </p>
          </div>

          {/* 액션 버튼 영역 (즐겨찾기 단계에서 로그인 여부 처리) */}
          {isFavoritesStep && !user ? (
            <div>
              <button
                className="mini-action-btn"
                onClick={() => login()}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '50px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #F89BBF 0%, #E26895 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: '0 3px 10px rgba(226, 104, 149, 0.25)',
                  marginBottom: '4px'
                }}
              >
                <span>🔑 Google 로그인하기</span>
              </button>
              <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#94a3b8', marginBottom: '10px' }}>
                ※ 즐겨찾기는 로그인 후 이용 가능합니다
              </div>
            </div>
          ) : (
            <button
              className="mini-action-btn"
              onClick={() => handleNavigate(current.path)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '50px',
                border: 'none',
                background: current.btnBg,
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                marginBottom: '10px'
              }}
            >
              <span>{current.btnText}</span>
              <span style={{ fontSize: '12px' }}>→</span>
            </button>
          )}

          {/* 하단 좌우 넘기기 컨트롤러 & 도트 인디케이터 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #f8fafc' }}>
            <button
              className="mini-nav-btn"
              onClick={handlePrev}
              title="이전"
            >
              ‹
            </button>

            {/* 도트 인디케이터 */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {guideSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="mini-guide-dot"
                  onClick={() => setCurrentStep(idx)}
                  style={{
                    backgroundColor: idx === currentStep ? '#9F8BD0' : '#e2e8f0',
                    width: idx === currentStep ? '14px' : '5px'
                  }}
                />
              ))}
            </div>

            <button
              className="mini-nav-btn"
              onClick={handleNext}
              title="다음"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* 2. 우측 하단 플로팅 버튼 그룹: [맨 위로 이동 버튼 (스크롤 시 노출)] + [이용 가이드 버튼] */}
      <div 
        className="floating-guide-container"
      >
        {/* 🚀 맨 위로 올리기 버튼 (스크롤 시 부드럽게 등장) */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="scroll-to-top-btn"
            title="맨 위로 이동"
            aria-label="맨 위로 이동"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(95, 80, 169, 0.25)',
              color: '#5F50A9',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(95, 80, 169, 0.22), 0 2px 6px rgba(0, 0, 0, 0.04)',
              outline: 'none',
              animation: 'scrollTopFadeIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5F50A9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '-0.3px', marginTop: '1px', color: '#5F50A9', lineHeight: 1 }}>
              TOP
            </span>
          </button>
        )}

        {/* 🐾 이용 가이드 버튼 */}
        <button
          ref={buttonRef}
          className="mini-guide-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? '가이드 닫기' : 'PawPass 이용 가이드'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isOpen 
              ? '#334155' 
              : 'linear-gradient(135deg, #C9B6D7 0%, #F6CADD 50%, #C5E0FB 100%)',
            border: '2px solid #ffffff',
            color: isOpen ? '#ffffff' : '#4C3B78',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(159, 139, 208, 0.35)',
            outline: 'none'
          }}
        >
          {isOpen ? (
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>✕</span>
          ) : (
            <>
              <span style={{ fontSize: '17px', lineHeight: 1 }}>🐾</span>
              <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '-0.2px', marginTop: '1px' }}>
                가이드
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
