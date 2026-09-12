// src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { loginWithGoogleCode, logoutBackend } from './services/api';

import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import MapPage from './pages/MapPage';
import FavoritesPage from './pages/FavoritesPage';
import SupportPage from './pages/SupportPage';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const kakaoAppKey = import.meta.env.VITE_KAKAO_APP_KEY;
  if (kakaoAppKey && !document.getElementById('kakao-map-sdk')) {
    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    script.type = 'text/javascript';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false&libraries=services`;
    document.head.appendChild(script);
  }

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const response = await loginWithGoogleCode(codeResponse.code);
        // 백엔드 감싸기 구조 대응 (response.data 또는 response)
        const result = response.data || response;

        if (result.access_token) {
          localStorage.setItem('paw_pass_access_token', result.access_token);
        }
        if (result.refresh_token) {
          localStorage.setItem('paw_pass_refresh_token', result.refresh_token);
        }

        if (result.user) {
          setUser(result.user);
          localStorage.setItem('paw_pass_user', JSON.stringify(result.user));
          alert(`환영합니다, ${result.user.name}님! 🐾`);
          window.location.reload();
        }
      } catch (error) {
        console.error('로그인 실패:', error);
        alert('로그인 처리에 실패했습니다.');
      }
    }
  });

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('paw_pass_refresh_token');
    if (refreshToken) {
      await logoutBackend(refreshToken);
    }

    googleLogout();
    setUser(null);

    // 세션 및 토큰 정리
    localStorage.removeItem('paw_pass_user');
    localStorage.removeItem('paw_pass_access_token');
    localStorage.removeItem('paw_pass_refresh_token');
    localStorage.removeItem('paw_pass_pets_guest');

    alert('로그아웃 되었습니다.');
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <div>
        <nav style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '12px 25px', borderBottom: '1px solid #ddd', backgroundColor: '#fff',
          position: 'sticky', top: 0, zIndex: 1000 
        }}>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '20px', color: '#2196F3' }}>
              🐾 PawPass
            </Link>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>프로필 등록</Link>
              <Link to="/search" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>관광지 탐색</Link>
              <Link to="/map" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>지도 및 동선</Link>
              
              {user && (
                <Link to="/favorites" style={{ textDecoration: 'none', color: '#ff4081', fontWeight: 'bold' }}>
                  즐겨찾기 ❤️
                </Link>
              )}

              <Link to="/support" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>고객센터</Link>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.picture && (
                  <img src={user.picture} alt="profile" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
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
                onClick={() => googleLogin()}
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

        <div style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/support" element={<SupportPage />} /> 
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;