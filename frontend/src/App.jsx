// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { loginWithBackend } from './services/authService';

import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import MapPage from './pages/MapPage';
import FavoritesPage from './pages/FavoritesPage';
import SupportPage from './pages/SupportPage';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('paw_pass_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('paw_pass_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('paw_pass_user');
    }
  }, [user]);

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        console.log('구글 인가 코드 획득:', codeResponse.code);
        const backendData = await loginWithBackend(codeResponse.code);
        
        if (backendData && backendData.user) {
          const loggedUser = {
            name: backendData.user.name,
            email: backendData.user.email,
            picture: backendData.user.picture
          };
          setUser(loggedUser);
          alert(`환영합니다, ${loggedUser.name}님! 🐾`);
        }
      } catch (error) {
        console.error('백엔드 로그인 처리 실패:', error);
        alert('구글 로그인 중 오류가 발생했습니다.');
      }
    },
    onError: (errorResponse) => {
      console.error('구글 로그인 실패:', errorResponse);
      alert('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
    },
  });

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem('paw_pass_user');
    alert('로그아웃 되었습니다.');
  };

  return (
    <BrowserRouter>
      <div>
        {/* 상단 네비게이션 바 */}
        <nav style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '12px 25px', borderBottom: '1px solid #ddd', backgroundColor: '#fff',
          position: 'sticky', top: 0, zIndex: 1000 
        }}>
          {/* 왼쪽: 로고 및 메뉴 (홈 글자 제거, 로고 클릭 시 홈으로 이동) */}
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '20px', color: '#2196F3' }}>
              🐾 PawPass
            </Link>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>프로필 등록</Link>
              <Link to="/search" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>관광지 탐색</Link>
              <Link to="/map" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>지도 및 동선</Link>
              
              {/* 로그인이 되었을 때만 뜨는 즐겨찾기 메뉴 */}
              {user && (
                <Link to="/favorites" style={{ textDecoration: 'none', color: '#ff4081', fontWeight: 'bold' }}>
                  즐겨찾기 ❤️
                </Link>
              )}

              <Link to="/support" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>고객센터</Link>
            </div>
          </div>

          {/* 오른쪽: 구글 로그인 버튼 / 유저 프로필 */}
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

        {/* 페이지 라우팅 설정 */}
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