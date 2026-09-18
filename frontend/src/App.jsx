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
    <header style={{
      position: 'sticky',
      top: '12px',
      zIndex: 1000,
      width: '100%',
      padding: '0 20px',
      boxSizing: 'border-box',
      pointerEvents: 'none'
    }}>
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
            fontWeight: '900', 
            fontSize: '23px', 
            letterSpacing: '-0.3px',
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 1
          }}>
            <span style={{ color: '#5F50A9' }}>Paw</span>
            <span style={{ 
              background: 'linear-gradient(135deg, #F472B6 0%, #60A5FA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '1000'
            }}>
              Pass
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              backgroundColor: '#f8fafc', 
              padding: '4px 12px 4px 6px', 
              borderRadius: '50px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="profile"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#C9B6D7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                  {user.name?.charAt(0) || '🐾'}
                </div>
              )}
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                {user.name}님
              </span>
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: '5px 12px', 
                  backgroundColor: '#fee2e2', 
                  color: '#ef4444', 
                  border: 'none', 
                  borderRadius: '50px', 
                  cursor: 'pointer', 
                  fontSize: '12px',
                  fontWeight: 'bold',
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
              style={{ 
                padding: '9px 20px', 
                backgroundColor: '#C9B6D7', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(201, 182, 215, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(201, 182, 215, 0.7)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 182, 215, 0.5)';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              구글 로그인
            </button>
          )}
        </div>
      </nav>
    </header>
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
              <div style={{ padding: '20px', flex: 1 }}>
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
            <ToastContainer />
          </BrowserRouter>
        </FavoritesProvider>
      </PetProvider>
    </AuthProvider>
  );
}

export default App;
