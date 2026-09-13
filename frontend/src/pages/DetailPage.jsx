// src/pages/DetailPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSpotDetail } from '../hooks/useSpotDetail';
import { useFavorites } from '../hooks/useFavorites';
import { usePetMatching } from '../hooks/usePetMatching';

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || '';

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'tourapi';

  const { detail, isLoading, error } = useSpotDetail(id, source);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { matchResult } = usePetMatching(detail?.petCondition);

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const mapContainerRef = useRef(null);

  const [isRouteAdded, setIsRouteAdded] = useState(() => {
    if (!id) return false;
    try {
      const savedRoutes = JSON.parse(localStorage.getItem('paw_pass_routes') || '[]');
      return savedRoutes.some(item => String(item.id || item.contentId) === String(id));
    } catch {
      return false;
    }
  });

  // 카카오맵 SDK 로드 및 정확한 좌표 기반 핀 렌더링 (주소 기반 Geocoder 자동 변환 지원)
  useEffect(() => {
    if (!detail || !mapContainerRef.current) return;

    const initMap = () => {
      if (!window.kakao || !window.kakao.maps || !mapContainerRef.current) return;
      
      window.kakao.maps.load(() => {
        if (!mapContainerRef.current) return;

        // 우선순위: 1. 이전 페이지(목록 등)에서 넘겨준 state 좌표 -> 2. 상세 API의 각종 위경도 필드
        const stateLat = location.state?.lat;
        const stateLng = location.state?.lng;

        const apiLat = Number(stateLat || detail.lat || detail.latitude || detail.mapy || detail.y || detail.mapY);
        const apiLng = Number(stateLng || detail.lng || detail.longitude || detail.mapx || detail.x || detail.mapX);

        const hasValidCoords = !isNaN(apiLat) && !isNaN(apiLng) && apiLat !== 0 && apiLng !== 0;

        const renderMapAt = (targetLat, targetLng) => {
          if (!mapContainerRef.current) return;
          const centerLatLng = new window.kakao.maps.LatLng(targetLat, targetLng);
          const options = { center: centerLatLng, level: 4 };
          
          const map = new window.kakao.maps.Map(mapContainerRef.current, options);
          const marker = new window.kakao.maps.Marker({ position: centerLatLng });
          marker.setMap(map);
        };

        if (hasValidCoords) {
          // 1. 유효한 위경도가 있는 경우 즉시 핀 생성
          renderMapAt(apiLat, apiLng);
        } else if (detail.address && window.kakao.maps.services) {
          // 2. 위경도가 없더라도 주소(address)가 있다면 카카오 Geocoder로 주소를 좌표로 자동 변환
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(detail.address, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
              renderMapAt(Number(result[0].y), Number(result[0].x));
            } else {
              // 주소 변환도 실패할 경우에만 기본 서울시청 좌표 적용
              renderMapAt(37.566826, 126.978656);
            }
          });
        } else {
          renderMapAt(37.566826, 126.978656);
        }
      });
    };

    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      // 💡 libraries=services 추가하여 주소->좌표 변환(Geocoder) 기능 활성화
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    }
  }, [detail, location.state]);

  const handleToggleRoute = () => {
    try {
      const savedRoutes = JSON.parse(localStorage.getItem('paw_pass_routes') || '[]');
      const spotId = String(detail.id || detail.contentId);
      
      const targetLat = Number(detail.lat || detail.latitude || detail.mapy || detail.y) || 37.566826;
      const targetLng = Number(detail.lng || detail.longitude || detail.mapx || detail.x) || 126.978656;

      let updated;
      if (isRouteAdded) {
        updated = savedRoutes.filter(item => String(item.id || item.contentId) !== spotId);
        setIsRouteAdded(false);
        alert('나의 동선에서 제거되었습니다.');
      } else {
        updated = [...savedRoutes, {
          id: spotId,
          contentId: spotId,
          name: detail.name,
          address: detail.address,
          lat: targetLat,
          lng: targetLng,
          imageUrl: detail.imageUrl || '',
          source: detail.source
        }];
        setIsRouteAdded(true);
        alert('❤️ 나의 동선에 추가되었습니다!');
      }
      localStorage.setItem('paw_pass_routes', JSON.stringify(updated));
    } catch (err) {
      console.error('동선 저장 중 오류 발생:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
        장소 상세 정보를 실시간으로 불러오는 중입니다...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '20px', fontWeight: 'bold' }}>
          {error || '장소 정보를 찾을 수 없습니다.'}
        </p>
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          style={{ padding: '10px 18px', backgroundColor: '#4b5563', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ← 뒤로 가기
        </button>
      </div>
    );
  }

  const liked = isFavorite(detail.id || detail.contentId);
  const cond = detail.petCondition || {};

  const previewImage = location.state?.previewImage;
  let imageList = Array.isArray(detail.images) ? [...detail.images] : [];
  if (previewImage && !imageList.includes(previewImage)) {
    imageList.unshift(previewImage);
  }
  if (imageList.length === 0 && detail.imageUrl) {
    imageList = [detail.imageUrl];
  }

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const currentLat = Number(detail.lat || detail.latitude || detail.mapy || detail.y);
  const currentLng = Number(detail.lng || detail.longitude || detail.mapx || detail.x);
  const mapSearchUrl = !isNaN(currentLat) && !isNaN(currentLng) && currentLat !== 0 
    ? `https://map.kakao.com/link/map/${encodeURIComponent(detail.name)},${currentLat},${currentLng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(detail.address || detail.name)}`;

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '680px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}
        >
          ← 뒤로 가기
        </button>
        
        <button 
          type="button"
          onClick={() => toggleFavorite(detail)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: liked ? '#ef4444' : '#fff', 
            color: liked ? '#fff' : '#ef4444', 
            border: '1.5px solid #ef4444', 
            borderRadius: '20px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {liked ? '❤️ 찜 완료' : '🤍 찜하기'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', color: '#1e293b' }}>{detail.name}</h2>
        <span style={{ 
          fontSize: '12px', padding: '4px 8px', borderRadius: '6px', 
          backgroundColor: detail.source === 'kcisa' ? '#e0f2fe' : '#fef3c7', 
          color: detail.source === 'kcisa' ? '#0369a1' : '#b45309', fontWeight: 'bold' 
        }}>
          {detail.source === 'kcisa' ? '반려동물 시설' : '관광공사 여행지'}
        </span>
      </div>

      {imageList.length > 0 ? (
        <div style={{ position: 'relative', width: '100%', height: '340px', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1e293b', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <img 
            src={imageList[currentImageIdx]} 
            alt={`${detail.name} 슬라이더 이미지 ${currentImageIdx + 1}`} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />

          {imageList.length > 1 && (
            <>
              <button 
                type="button" 
                onClick={handlePrevImage}
                style={{
                  position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                }}
              >
                ‹
              </button>
              <button 
                type="button" 
                onClick={handleNextImage}
                style={{
                  position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                }}
              >
                ›
              </button>
              <div style={{
                position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', zIndex: 10
              }}>
                {currentImageIdx + 1} / {imageList.length}
              </div>
            </>
          )}

          {detail.imageAttribution && (
            <span style={{ 
              position: 'absolute', top: '12px', right: '12px', 
              fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
              padding: '3px 6px', borderRadius: '4px', maxWidth: '80%', 
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', zIndex: 10
            }}>
              {detail.imageAttribution}
            </span>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', height: '180px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '20px', border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>등록된 대표 이미지가 없습니다</span>
        </div>
      )}

      {imageList.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '6px' }}>
          {imageList.map((imgUrl, idx) => (
            <button 
              key={idx}
              type="button"
              onClick={() => setCurrentImageIdx(idx)}
              style={{
                width: '70px', height: '54px', padding: 0, border: currentImageIdx === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, backgroundColor: '#f1f5f9'
              }}
            >
              <img src={imgUrl} alt={`썸네일 ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ lineHeight: '1.7', backgroundColor: '#fff', padding: '18px 20px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ margin: '0 0 8px 0', flex: 1 }}><strong>📍 주소:</strong> {detail.address}</p>
          <a 
            href={mapSearchUrl} 
            target="_blank" 
            rel="noreferrer" 
            style={{ fontSize: '13px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'none', marginLeft: '12px', whiteSpace: 'nowrap' }}
          >
            카카오맵 크게보기 ↗
          </a>
        </div>
        <p style={{ margin: '0 0 8px 0' }}><strong>📞 전화번호:</strong> {detail.phone || '정보 미제공'}</p>
        <p style={{ margin: '0 0 8px 0' }}><strong>⏰ 운영시간:</strong> {detail.hours || '현장 또는 전화 문의'}</p>
        {cond.parkingAvailable && (
          <p style={{ margin: '0 0 8px 0' }}><strong>🚗 주차 정보:</strong> {cond.parkingAvailable}</p>
        )}
        {detail.description && (
          <p style={{ margin: '8px 0 0 0', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            {detail.description}
          </p>
        )}
      </div>

      <div style={{ backgroundColor: '#fff', padding: '18px 20px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b', margin: 0 }}>📍 위치 및 동선 관리</h3>
          <button 
            type="button"
            onClick={handleToggleRoute}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: isRouteAdded ? '#10b981' : '#2563eb', 
              color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
            }}
          >
            {isRouteAdded ? '🗺️ 동선에서 제거하기' : '➕ 내 동선에 추가하기'}
          </button>
        </div>
        
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '280px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}
        />
      </div>

      {matchResult && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐾 내 반려동물 맞춤 방문 판정</h3>
          <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: matchResult.color || '#0284c7', margin: '0 0 6px 0' }}>
              판정 결과: {matchResult.status}
            </p>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>
              근거: {matchResult.reason}
            </p>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐶 반려동물 동반 조건 안내</h3>
      <div style={{ backgroundColor: '#f0fdf4', padding: '18px 20px', borderRadius: '12px', border: '1px solid #bbf7d0', lineHeight: '1.7', color: '#166534' }}>
        {detail.source === 'tourapi' ? (
          <>
            <p style={{ margin: '0 0 8px 0' }}><strong>동반 가능 유형:</strong> {cond.acmpyType || '현장 문의 필요'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>입장 가능 크기/견종:</strong> {cond.possibleBreeds || '제한 없음 (현장 확인 권장)'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>필수 준비물:</strong> {cond.needItem || '목줄 및 배변봉투 지참'}</p>
            {cond.etcInfo && (
              <p style={{ margin: '0' }}><strong>기타 안내:</strong> {cond.etcInfo}</p>
            )}
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 8px 0' }}><strong>동반 안내 규정:</strong> {cond.petPolicy || '현장 규정 확인 필요'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>입장 제한 조건:</strong> {cond.petRestriction || '특이 제한 없음'}</p>
            <p style={{ margin: '0' }}><strong>시설 비치물품:</strong> {cond.petAmenities || '기본 지참 필요'}</p>
          </>
        )}
      </div>

    </div>
  );
}

export default DetailPage;