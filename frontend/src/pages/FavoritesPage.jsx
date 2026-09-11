// src/pages/FavoritesPage.jsx
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';

function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>❤️ 나의 즐겨찾기 (찜한 관광지)</h2>
      <p style={{ textAlign: 'center', color: 'gray', marginBottom: '30px' }}>
        관심 있는 반려동물 동반 장소를 모아보고 여행 계획을 세워보세요.
      </p>

      {favorites.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {favorites.map((spot, index) => {
            // 💡 id 기준 식별자 설정 (contentId 대신 id 사용)
            const spotId = spot.id || spot.contentId;
            const spotSource = spot.source || 'tourapi';

            return (
              <div 
                key={spotId ? `${spotId}-${index}` : index} 
                style={{ 
                  border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', 
                  overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative' 
                }}
              >
                <div style={{ height: '140px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', position: 'relative' }}>
                  {spot.imageUrl ? (
                    <img src={spot.imageUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>🖼️ 이미지 준비중</span>
                  )}
                  {/* 구글 이미지 저작자 표기 (정책 반영) */}
                  {spot.imageAttribution && (
                    <span style={{ 
                      position: 'absolute', bottom: '4px', right: '4px', 
                      fontSize: '9px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
                      padding: '2px 4px', borderRadius: '4px', maxWidth: '90%', 
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                    }}>
                      {spot.imageAttribution}
                    </span>
                  )}
                </div>
                
                <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', color: '#1976d2' }}>{spot.name}</h4>
                      <span style={{ 
                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
                        backgroundColor: spotSource === 'kcisa' ? '#e0f2fe' : '#fef3c7',
                        color: spotSource === 'kcisa' ? '#0369a1' : '#b45309'
                      }}>
                        {spotSource === 'kcisa' ? '반려동물 시설' : '관광공사'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555' }}>📍 {spot.address}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button 
                      type="button"
                      // 💡 상세 보기 시 id와 source를 정확히 전달
                      onClick={() => navigate(`/detail/${spotId}?source=${spotSource}`, {
                        state: { previewImage: spot.imageUrl || '' }
                      })}
                      style={{ flex: 1, padding: '8px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      상세 보기
                    </button>
                    <button 
                      type="button"
                      // 💡 삭제 시에도 id 기준 전달
                      onClick={() => removeFavorite(spotId)}
                      style={{ padding: '8px 12px', backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
          <p style={{ fontSize: '16px' }}>💔 찜한 관광지가 없습니다.</p>
          <p style={{ fontSize: '14px', marginTop: '5px' }}>관광지 탐색이나 상세 페이지에서 하트(❤️)를 눌러 추가해 보세요!</p>
          <button 
            type="button"
            onClick={() => navigate('/search')}
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            관광지 보러 가기 →
          </button>
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;