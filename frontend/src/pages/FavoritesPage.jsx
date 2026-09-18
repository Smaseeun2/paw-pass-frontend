import { useNavigate } from 'react-router-dom';
import { useFavoritesContext as useFavorites } from '../contexts/FavoritesContext';
import LazyImage from '../components/LazyImage';
import { useSpotDetail } from '../hooks/useSpotDetail';

// 개별 즐겨찾기 카드 (홈페이지 추천 관광지 카드 스타일과 동일하게 적용)
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
    <div 
      className="favorite-spot-card"
      onClick={() => navigate(`/detail/${spotId}?source=${spotSource}`, {
        state: { previewImage: imageUrl }
      })}
      style={{ 
        borderRadius: '24px', 
        backgroundColor: '#fff', 
        cursor: 'pointer', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)', 
        padding: '16px', 
        border: 'none', 
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: isLoading ? 0.7 : 1
      }}
      onMouseOver={(e) => { 
        e.currentTarget.style.transform = 'translateY(-4px)'; 
        e.currentTarget.style.boxShadow = '0 14px 28px rgba(0,0,0,0.1)'; 
      }}
      onMouseOut={(e) => { 
        e.currentTarget.style.transform = 'none'; 
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)'; 
      }}
    >
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '160px', 
        backgroundColor: spotSource === 'kcisa' ? '#C5E0FB' : '#fef3c7', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: '16px', 
        marginBottom: '16px', 
        overflow: 'hidden' 
      }}>
        <LazyImage 
          spot={displaySpot} 
          fallback={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '36px', marginBottom: '4px' }}>{spotSource === 'kcisa' ? '🏛️' : '🌲'}</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: spotSource === 'kcisa' ? '#0369a1' : '#b45309' }}>
                {spotSource === 'kcisa' ? '한국문화정보원' : '한국관광공사'}
              </span>
            </div>
          } 
        />
        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            onRemove(spotId); 
          }}
          style={{ 
            position: 'absolute', 
            top: '12px', 
            right: '12px', 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            border: 'none', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          title="즐겨찾기 해제"
        >
          ❤️
        </button>
      </div>

      <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isLoading && spotName === '장소명 없음' ? '불러오는 중...' : spotName}
          </h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📍 {isLoading && spotAddress === '주소 정보 없음' ? '...' : spotAddress}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ 
            fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold',
            backgroundColor: spotSource === 'kcisa' ? '#e0f2fe' : '#fef3c7',
            color: spotSource === 'kcisa' ? '#0369a1' : '#b45309'
          }}>
            {spotSource === 'kcisa' ? '반려동물 시설' : '한국관광공사'}
          </span>
          <span style={{ color: '#C9B6D7', fontSize: '13px', fontWeight: 'bold' }}>자세히 보기 →</span>
        </div>
      </div>
    </div>
  );
}

function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, #C9B6D7 0%, #F6CADD 35%, #C5E0FB 70%, #AED2F9 100%)',
        zIndex: 0,
        opacity: 0.35,
        pointerEvents: 'none'
      }} />
      <div className="pawpass-favorites-container" style={{ padding: '40px 20px 30px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative', zIndex: 1 }}>
      {/* 상단 모던 히어로 카드 배너 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '36px 20px 32px 20px', 
        background: 'linear-gradient(135deg, rgba(201, 182, 215, 0.45) 0%, rgba(246, 202, 221, 0.35) 35%, rgba(197, 224, 251, 0.45) 70%, rgba(174, 210, 249, 0.4) 100%)',
        borderRadius: '32px',
        boxShadow: '0 12px 35px rgba(201, 182, 215, 0.22)',
        marginBottom: '36px',
        position: 'relative',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.7)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#5F50A9', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '5px 16px', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          My Favorites
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          ❤️ 나의 즐겨찾기 목록
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '0' }}>
          관심 있는 반려동물 동반 장소를 모아보고 나만의 여행 계획을 세워보세요
        </p>
      </div>

      {favorites.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
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
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 20px', 
          backgroundColor: '#fff', 
          borderRadius: '24px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>💔</span>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>즐겨찾기한 관광지가 없습니다.</p>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' }}>관광지 탐색이나 상세 페이지에서 하트(❤️)를 눌러 추가해 보세요!</p>
          <button 
            type="button"
            onClick={() => navigate('/search')}
            style={{ 
              padding: '12px 28px', 
              backgroundColor: '#5F50A9', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(95, 80, 169, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(201, 182, 215, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 182, 215, 0.4)';
            }}
          >
            관광지 보러 가기 →
          </button>
        </div>
      )}
    </div>
    </>
  );
}

export default FavoritesPage;