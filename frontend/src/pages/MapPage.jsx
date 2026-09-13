// src/pages/MapPage.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchSuggestedRoute } from '../services/api';

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || '';

function MapPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // 💡 [린트 해결] useEffect 내부 setState 대신 초기값 함수로 로컬 스토리지 읽기 처리
  const [selectedSpots, setSelectedSpots] = useState(() => {
    try {
      const savedRoutes = JSON.parse(localStorage.getItem('paw_pass_routes') || '[]');
      return savedRoutes.filter(spot => spot.lat && spot.lng).slice(0, 8);
    } catch {
      return [];
    }
  });

  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 카카오 지도 초기화 및 동적 스크립트 로드
  useEffect(() => {
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps || !mapContainerRef.current) return;
      window.kakao.maps.load(() => {
        if (!mapContainerRef.current) return;
        const options = {
          center: new window.kakao.maps.LatLng(37.566826, 126.978656),
          level: 5
        };
        const map = new window.kakao.maps.Map(mapContainerRef.current, options);
        mapInstanceRef.current = map;
      });
    };

    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    }
  }, []);

  // 지도 위에 마커 및 경로 렌더링 함수
  const renderMapElements = useCallback((spotsToRender, orderedIndices = []) => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao || !window.kakao.maps) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (spotsToRender.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    const pathCoordinates = [];

    const displayList = orderedIndices.length > 0 
      ? orderedIndices.map(idx => spotsToRender[idx]).filter(Boolean)
      : spotsToRender;

    displayList.forEach((spot, index) => {
      const lat = Number(spot.lat);
      const lng = Number(spot.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const position = new window.kakao.maps.LatLng(lat, lng);
      bounds.extend(position);
      pathCoordinates.push(position);

      const markerContent = document.createElement('div');
      markerContent.style.cssText = `
        background-color: #2563eb; color: white; width: 30px; height: 30px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-size: 13px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      `;
      markerContent.innerText = index + 1;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerContent,
        yAnchor: 1
      });

      customOverlay.setMap(map);
      markersRef.current.push(customOverlay);
    });

    if (pathCoordinates.length > 1) {
      const polyline = new window.kakao.maps.Polyline({
        path: pathCoordinates,
        strokeWeight: 5,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      });
      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    map.setBounds(bounds);
  }, []);

  // 선택 장소 변경 시 마커 렌더링
  useEffect(() => {
    if (!routeResult && selectedSpots.length > 0) {
      renderMapElements(selectedSpots);
    }
  }, [selectedSpots, routeResult, renderMapElements]);

  // 동선 추천 API 호출 핸들러
  const handleSuggestRoute = async () => {
    if (selectedSpots.length < 2) {
      alert('최적 동선을 추천받으려면 최소 2개 이상의 장소가 필요합니다. (최대 8개)');
      return;
    }

    setIsLoading(true);
    try {
      const points = selectedSpots.map(spot => ({
        id: String(spot.id || spot.contentId),
        lat: Number(spot.lat),
        lng: Number(spot.lng)
      }));

      const result = await fetchSuggestedRoute(points);
      setRouteResult(result);

      if (result && Array.isArray(result.order)) {
        renderMapElements(selectedSpots, result.order);
      }
    } catch (err) {
      console.error('동선 추천 실패:', err);
      alert('최적 동선을 계산하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 동선 목록에서 개별 삭제
  const handleRemoveSpot = (spotId) => {
    try {
      const updated = selectedSpots.filter(item => String(item.id || item.contentId) !== String(spotId));
      setSelectedSpots(updated);
      localStorage.setItem('paw_pass_routes', JSON.stringify(updated));
      setRouteResult(null);
    } catch (err) {
      console.error('동선 삭제 실패:', err);
    }
  };

  return (
    <div style={{ padding: '20px 40px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '28px', color: '#1e293b' }}>🗺️ 나의 여행 동선 및 최적 지도</h2>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>
        상세 페이지에서 추가한 장소들을 지도에서 확인하고 AI 최적 방문 동선을 추천받아 보세요.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>
          동선에 추가된 장소: <span style={{ color: '#2563eb' }}>{selectedSpots.length}개</span> (2~8개 가능)
        </span>

        <button
          type="button"
          onClick={handleSuggestRoute}
          disabled={isLoading || selectedSpots.length < 2}
          style={{
            padding: '10px 20px', 
            backgroundColor: selectedSpots.length >= 2 ? '#2563eb' : '#cbd5e1',
            color: 'white', border: 'none', borderRadius: '8px', 
            cursor: selectedSpots.length >= 2 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          {isLoading ? '동선 계산 중...' : '✨ AI 최적 동선 추천받기'}
        </button>
      </div>

      {routeResult && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '15px 20px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1d4ed8', fontSize: '15px' }}>🎉 최적 동선 추천 완료!</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
            총 이동 거리: <strong>{routeResult.total_distance_km ?? 0} km</strong>
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '520px', borderRadius: '14px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
        />

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', maxHeight: '520px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            📋 내 동선 장소 리스트
          </h4>
          
          {selectedSpots.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSpots.map((spot, index) => (
                <div key={spot.id || spot.contentId || index} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: '0' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                      <span style={{ color: '#2563eb', marginRight: '6px' }}>{index + 1}.</span> {spot.name || spot.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📍 {spot.address || spot.addr}
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveSpot(spot.id || spot.contentId)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px', marginLeft: '8px' }}
                    title="동선에서 제거"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 10px', color: '#94a3b8' }}>
              <p style={{ fontSize: '15px', margin: '0 0 6px 0' }}>🗺️ 추가된 동선이 없습니다.</p>
              <p style={{ fontSize: '13px', margin: 0 }}>상세 페이지에서 '내 동선에 추가하기'를 눌러 나만의 여행 경로를 만들어보세요!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MapPage;