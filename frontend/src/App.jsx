import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { loadKakaoMapSdk } from './utils/kakaoMapLoader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PetProvider } from './contexts/PetContext';
import { FavoritesProvider } from './contexts/FavoritesContext';

import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import MapPage from './pages/MapPage';
import FavoritesPage from './pages/FavoritesPage';
import SupportPage from './pages/SupportPage';
import NotFoundPage from './pages/NotFoundPage';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import FloatingGuideWidget from './components/FloatingGuideWidget';

function PawPassLogoIcon({ size = 38 }) {
  return (
    <img 
      src="/logo.png" 
      alt="PawPass 로고" 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block'
      }} 
    />
  );
}

function AppNav() {
  const { user, login, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    });
  };

  const navItems = [
    { 
      label: '프로필', 
      path: '/profile',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="16" rx="5" ry="4" />
          <ellipse cx="6" cy="10" rx="2.2" ry="3" transform="rotate(-15 6 10)" />
          <ellipse cx="18" cy="10" rx="2.2" ry="3" transform="rotate(15 18 10)" />
          <ellipse cx="9.5" cy="6" rx="2.2" ry="3" transform="rotate(-5 9.5 6)" />
          <ellipse cx="14.5" cy="6" rx="2.2" ry="3" transform="rotate(5 14.5 6)" />
        </svg>
      )
    },
    ...(user ? [{ 
      label: '즐겨찾기', 
      path: '/favorites', 
      isFav: true,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      )
    }] : []),
    { 
      label: '관광지 탐색', 
      path: '/search', 
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    { 
      label: '여행 동선', 
      path: '/map', 
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
      )
    },
    { 
      label: '고객센터', 
      path: '/support',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
      )
    }
  ];

  return (
    <header 
      className="pawpass-global-header"
      style={{
        position: 'sticky',
        top: '12px',
        zIndex: 1000,
        width: '100%',
        padding: '0 20px',
        boxSizing: 'border-box',
        pointerEvents: 'none'
      }}
    >
      <style>{`
        .nav-island-container {
          pointer-events: auto;
          background-color: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(16px);
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(201, 182, 215, 0.25);
          transition: all 0.3s ease;
        }
        .nav-link-btn {
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nav-link-btn:hover {
          background-color: rgba(201, 182, 215, 0.25);
          color: #5F50A9 !important;
          transform: translateY(-1px);
        }
        .nav-brand-logo {
          transition: transform 0.2s ease;
        }
        .nav-brand-logo:hover {
          transform: scale(1.04);
        }
        @media (max-width: 768px) {
          .nav-links-menu {
            gap: 2px !important;
          }
          .nav-link-btn {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
      
      <nav 
        className="nav-island-container"
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '8px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* 브랜드 로고 */}
        <Link 
          to="/" 
          className="nav-brand-logo"
          style={{ 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '9px' 
          }}
        >
          <PawPassLogoIcon size={38} />
          <span style={{ 
            fontFamily: "'Nunito', 'Comfortaa', -apple-system, sans-serif",
            fontWeight: '1000', 
            fontSize: '23px', 
            letterSpacing: '-0.8px',
            display: 'inline-flex',
            alignItems: 'baseline',
            lineHeight: 1
          }}>
            <span style={{ color: '#5F50A9', fontWeight: '1000', display: 'inline-flex', alignItems: 'baseline' }}>
              <span style={{ marginRight: '-1.5px' }}>P</span>
              <span style={{ fontSize: '0.84em', letterSpacing: '-0.6px' }}>AW</span>
            </span>
            <span style={{ 
              background: 'linear-gradient(135deg, #F472B6 0%, #60A5FA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '1000',
              display: 'inline-flex',
              alignItems: 'baseline'
            }}>
              <span style={{ marginRight: '-1.5px' }}>P</span>
              <span style={{ fontSize: '0.84em', letterSpacing: '-0.6px' }}>ASS</span>
            </span>
          </span>
        </Link>
        
        {/* 네비게이션 메뉴 캡슐 */}
        <div 
          className="nav-links-menu"
          style={{ 
            display: 'flex', 
            gap: '6px', 
            alignItems: 'center',
            backgroundColor: 'rgba(248, 250, 252, 0.8)',
            padding: '4px 8px',
            borderRadius: '50px',
            border: '1px solid rgba(226, 232, 240, 0.7)'
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="nav-link-btn"
                style={{ 
                  backgroundColor: isActive 
                    ? (item.isFav ? 'rgba(247, 157, 196, 0.25)' : 'rgba(201, 182, 215, 0.35)') 
                    : 'transparent',
                  color: isActive 
                    ? (item.isFav ? '#e11d48' : '#5F50A9') 
                    : '#475569',
                  boxShadow: isActive ? '0 2px 8px rgba(201, 182, 215, 0.3)' : 'none'
                }}
              >
                {item.icon && (
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* 사용자 정보 / 로그인 버튼 */}
        <div className="nav-user-auth-box" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: '#f8fafc', 
              padding: '4px 10px 4px 6px', 
              borderRadius: '50px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="profile"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#C9B6D7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>
                  {user.name?.charAt(0) || '🐾'}
                </div>
              )}
              <span 
                className="nav-user-nickname"
                title={user.name}
                style={{ 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: '#1e293b',
                  maxWidth: '120px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block'
                }}
              >
                {user.name}님
              </span>
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: '4px 10px', 
                  backgroundColor: '#fee2e2', 
                  color: '#ef4444', 
                  border: 'none', 
                  borderRadius: '50px', 
                  cursor: 'pointer', 
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button 
              onClick={() => login()}
              className="nav-login-btn"
              style={{ 
                padding: '7px 16px', 
                backgroundColor: '#ffffff', 
                color: '#1e293b', 
                border: '1.5px solid #e2e8f0', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: '800', 
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span style={{ color: '#1e293b', fontWeight: '800' }}>구글 로그인</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  const bottomNavItems = [
    {
      label: '홈',
      path: '/',
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      label: '탐색',
      path: '/search',
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    {
      label: '동선',
      path: '/map',
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
      )
    },
    {
      label: '프로필',
      path: '/profile',
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <ellipse cx="12" cy="16" rx="5" ry="4" />
          <ellipse cx="6" cy="10" rx="2.2" ry="3" transform="rotate(-15 6 10)" />
          <ellipse cx="18" cy="10" rx="2.2" ry="3" transform="rotate(15 18 10)" />
          <ellipse cx="9.5" cy="6" rx="2.2" ry="3" transform="rotate(-5 9.5 6)" />
          <ellipse cx="14.5" cy="6" rx="2.2" ry="3" transform="rotate(5 14.5 6)" />
        </svg>
      )
    },
    {
      label: '즐겨찾기',
      path: '/favorites',
      isFav: true,
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      )
    }
  ];

  return (
    <nav className="mobile-bottom-nav-bar">
      {bottomNavItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-bottom-tab-item ${isActive ? 'active' : ''}`}
            style={{
              color: isActive ? (item.isFav ? '#e11d48' : '#5F50A9') : '#94a3b8'
            }}
          >
            <div className="mobile-tab-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </div>
            <span className="mobile-tab-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function App() {
  useEffect(() => {
    loadKakaoMapSdk().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <PetProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
              <AppNav />
              <div className="pawpass-main-content" style={{ padding: '20px', flex: 1 }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/detail/:id" element={<DetailPage />} />
                  <Route path="/map" element={<MapPage />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="/favorites" element={<FavoritesPage />} />
                  </Route>
                  
                  <Route path="/support" element={<SupportPage />} /> 
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
              <Footer />
            </div>
            <FloatingGuideWidget />
            <MobileBottomNav />
            <ToastContainer />
          </BrowserRouter>
        </FavoritesProvider>
      </PetProvider>
    </AuthProvider>
  );
}

export default App;

