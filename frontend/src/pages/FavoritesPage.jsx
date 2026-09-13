// src/pages/FavoritesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { fetchTourDetail, fetchFacilityDetail } from '../services/api';

// 개별 즐겨찾기 카드 (이미지 개별 로딩 래퍼)
function FavoriteCard({ spot, onRemove }) {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(spot.imageUrl || spot.image || spot.firstimage || '');
  const [imageAttr, setImageAttr] = useState(spot.imageAttribution || '');

  const spotId = spot.content_id || spot.contentId || spot.id;
  const spotSource = spot.source || 'tourapi';
  const spotName = spot.name || spot.title || '장소명 없음';
  const spotAddress = spot.address || spot.addr || '주소 정보 없음';

  // 만약 즐겨찾기 목록에 이미지가 없다면, 상세 API를 살짝 찔러서 이미지를 가져옴
  useEffect(() => {
    if (imageUrl) return; // 이미지가 이미 있으면 패스

    const fetchImageIfNeeded = async () => {
      try {
        let res;
        if (spotSource === 'kcisa') {
          res = await fetchFacilityDetail(spotId);
        } else {
          res = await fetchTourDetail(spotId);
        }
        const data = res.data || res;
        const foundImg = (Array.isArray(data.images) && data.images[0]) || data.firstimage || data.image || '';
        if (foundImg) setImageUrl(foundImg);
      } catch (e) {
        console.warn('즐겨찾기 카드 이미지 추가 로드 실패:', e);
      }
    };

    if (spotId) {
      fetchImageIfNeeded();
    }
  }, [spotId, spotSource, imageUrl]);

  return (
    <div style={{ 
      border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', 
      overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative' 
    }}>
      <div style={{ height: '140px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', position: 'relative' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={spotName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>🖼️ 이미지 준비중</span>
        )}
        {imageAttr && (
          <span style={{ 
            position: 'absolute', bottom: '4px', right: '4px', 
            fontSize: '9px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
            padding: '2px 4px', borderRadius: '4px', maxWidth: '90%', 
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
          }}>
            {imageAttr}
          </span>
        )}
      </div>
      
      <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
            <h4 style={{ margin: 0, fontSize: '18px', color: '#1976d2' }}>{spotName}</h4>
            <span style={{ 
              fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
              backgroundColor: spotSource === 'kcisa' ? '#e0f2fe' : '#fef3c7',
              color: spotSource === 'kcisa' ? '#0369a1' : '#b45309'
            }}>
              {spotSource === 'kcisa' ? '반려동물 시설' : '관광공사'}
            </span>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555' }}>📍 {spotAddress}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            type="button"
            onClick={() => navigate(`/detail/${spotId}?source=${spotSource}`, {
              state: { previewImage: imageUrl }
            })}
            style={{ flex: 1, padding: '8px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            상세 보기
          </button>
          <button 
            type="button"
            onClick={() => onRemove(spotId)}
            style={{ padding: '8px 12px', backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

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
            const spotId = spot.content_id || spot.contentId || spot.id;
            return (
              <FavoriteCard 
                key={spotId ? `${spotId}-${index}` : index} 
                spot={spot} 
                onRemove={removeFavorite} 
              />
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