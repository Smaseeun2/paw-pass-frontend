// src/pages/HomePage.jsx
import { useNavigate } from 'react-router-dom';
import mockSpots from '../mocks/tourist-spots.json'; // 기본 추천 관광지를 바로 보여주기 위해 불러옴

function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* 상단: 환영 및 프로필 유도 영역 */}
      <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: '#e3f2fd', borderRadius: '12px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '30px', color: '#1976d2', margin: '0 0 10px 0' }}>🐾 Paw Pass</h1>
        <p style={{ fontSize: '16px', color: '#555', marginBottom: '20px' }}>
          반려동물과 함께 떠나는 맞춤형 여행의 시작, 지금 프로필을 등록하고 최적의 장소를 찾아보세요!
        </p>
        <button 
          onClick={() => navigate('/profile')} 
          style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          내 반려동물 프로필 등록/수정하기
        </button>
      </div>

      {/* 하단: 누르기 전부터 바로 보이는 추천 관광지 탭 (와이어프레임 홈 화면 반영) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#333' }}>🌟 실시간 추천 동반 관광지</h3>
        <button 
          onClick={() => navigate('/search')} 
          style={{ background: 'none', border: 'none', color: '#2196F3', cursor: 'pointer', fontWeight: 'bold' }}
        >
          지역/유형별 더 찾아보기 →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '15px' }}>
        {mockSpots.slice(0, 3).map((spot) => (
          <div 
            key={spot.contentId}
            onClick={() => navigate(`/detail/${spot.contentId}`)}
            style={{ 
              border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', 
              backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
            }}
          >
            {spot.imageUrl && (
              <img src={spot.imageUrl} alt={spot.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '12px' }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{spot.name}</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>📍 {spot.address}</p>
              <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontWeight: 'bold' }}>
                {spot.matchStatus === 'OK' ? '방문 가능' : '조건부 가능'}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default HomePage;