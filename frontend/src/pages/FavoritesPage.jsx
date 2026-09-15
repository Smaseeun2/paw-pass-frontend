import { useNavigate } from 'react-router-dom';
import { useFavoritesContext as useFavorites } from '../contexts/FavoritesContext';
import { fetchTourDetail, fetchFacilityDetail, authFetch } from '../services/api';
import { BASE_URL } from '../config/env';
import { toast } from '../utils/toast';
import LazyImage from '../components/LazyImage';
import { useState } from 'react';
import { useSpotDetail } from '../hooks/useSpotDetail';

// 개별 즐겨찾기 카드 (이미지 개별 로딩 래퍼)
function FavoriteCard({ spot, onRemove }) {
  const navigate = useNavigate();
  const spotId = spot.content_id || spot.contentId || spot.id;
  const spotSource = spot.source || 'tourapi';

  // 서버에서 불러온 즐겨찾기는 보통 id와 source만 있으므로 상세 정보를 가져와 채웁니다.
  const { detail, isLoading } = useSpotDetail(spotId, spotSource);

  // 낙관적 업데이트된 spot(이름, 이미지 포함) 혹은 fetch된 detail 데이터 사용
  const spotName = spot.name || spot.title || detail?.name || detail?.title || '장소명 없음';
  const spotAddress = spot.address || spot.addr || detail?.address || detail?.addr || '주소 정보 없음';
  const imageUrl = spot.imageUrl || spot.image || spot.firstimage || detail?.image || detail?.imageUrl || '';
  
  // LazyImage에 넘겨줄 통합 객체
  const displaySpot = {
    ...spot,
    ...detail,
    image: imageUrl,
    name: spotName,
    address: spotAddress
  };

  return (
    <div style={{ 
      border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fff', 
      overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative',
      opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s'
    }}>
      <div style={{ height: '140px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', position: 'relative' }}>
        <LazyImage spot={displaySpot} fallback={<span>🖼️ 이미지 없음</span>} />
      </div>
      
      <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
            <h4 style={{ margin: 0, fontSize: '18px', color: '#1976d2' }}>
              {isLoading && spotName === '장소명 없음' ? '불러오는 중...' : spotName}
            </h4>
            <span style={{ 
              fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
              backgroundColor: spotSource === 'kcisa' ? '#e0f2fe' : '#fef3c7',
              color: spotSource === 'kcisa' ? '#0369a1' : '#b45309',
              whiteSpace: 'nowrap', marginLeft: '6px'
            }}>
              {spotSource === 'kcisa' ? '반려동물 시설' : '관광공사'}
            </span>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555' }}>
            📍 {isLoading && spotAddress === '주소 정보 없음' ? '...' : spotAddress}
          </p>
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