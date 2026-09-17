import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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

function AppNav() {
  const { user, login, logout } = useAuth();

  const handleLogout = () => {
    logout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    });
  };

  return (
    <nav style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '12px 25px', borderBottom: '1px solid #ddd', backgroundColor: '#fff',
      position: 'sticky', top: 0, zIndex: 1000 
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: '900', fontSize: '24px', letterSpacing: '-0.5px' }}>
        🐾 PawPass
      </Link>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/search" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>장소 탐색</Link>
          <Link to="/map" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>내 동선</Link>
          
          <Link to="/profile" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
            프로필 {user && '🐾'}
          </Link>
          
          {user && (
            <Link to="/favorites" style={{ textDecoration: 'none', color: '#e25555', fontWeight: 'bold' }}>
              즐겨찾기 ❤️
            </Link>
          )}

          <Link to="/support" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>고객센터</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user.picture ? (
              <img
                src={user.picture}
                alt="profile"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
              {user.name}님
            </span>
            <button 
              onClick={handleLogout}
              style={{ padding: '6px 12px', backgroundColor: '#f1f1f1', color: '#333', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button 
            onClick={() => login()}
            style={{ 
              padding: '8px 16px', backgroundColor: '#4285F4', color: 'white', 
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' 
            }}
          >
            구글 로그인
          </button>
        )}
      </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
