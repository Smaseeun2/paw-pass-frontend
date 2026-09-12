// src/pages/MapPage.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchSuggestedRoute } from '../services/api';
import { useFavorites } from '../hooks/useFavorites';

function MapPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // 즐겨찾기 또는 사용자가 선택한 장소 목록 (예시로 즐겨찾기 연동 혹은 자체 상태 관리)
  const { favorites } = useFavorites();
  const [selectedSpots, setSelectedSpots] = useState([]);
  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 즐겨찾기 목록을 기본 선택 장소로 세팅 (최대 8개 제한)
  useEffect(() => {
    if (favorites.length > 0 && selectedSpots.length === 0) {
      // 위도, 경도가 유효한 장소만 필터링
      const validSpots = favorites.filter(spot => spot.lat && spot.lng).slice(0, 8);
      setSelectedSpots(validSpots);
    }
  }, [favorites, selectedSpots.length]);

  // 카카오 지도 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const container = mapContainerRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.566826, 126.978656), // 서울 중심 좌표
      level: 5
    };

    const map = new window.kakao.maps.Map(container, options);
    mapInstanceRef.current = map;
  }, []);

  // 지도 위에 마커 및 경로 렌더링 함수
  const renderMapElements = useCallback((spotsToRender, orderedIndices = []) => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao) return;

    // 기존 마커 및 폴리라인 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (spotsToRender.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    const pathCoordinates = [];

    // 정렬된 순서가 있으면 그 순서대로, 아니면 기본 순서대로 처리
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

      // 번호 마커 생성 (1번, 2번...)
      const markerContent = document.createElement('div');
      markerContent.style.cssText = `
        background-color: #1976d2; color: white; width: 28px; height: 28px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-size: 13px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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

    // 경로(Polyline) 그리기
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

    // 모든 마커가 보이도록 지도 범위 재설정
    map.setBounds(bounds);
  }, []);

  // 컴포넌트 마운트 및 선택 장소 변경 시 기본 마커 렌더링
  useEffect(() => {
    if (!routeResult) {
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

      // 백엔드가 내려준 순서(order) 배열을 바탕으로 지도 재렌더링
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

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>🗺️ 맞춤 지도 및 최적 동선</h2>
      <p style={{ textAlign: 'center', color: 'gray', marginBottom: '25px' }}>
        저장한 장소들을 한눈에 확인하고 인공지능 최적 방문 동선을 추천받아 보세요.
      </p>

      {/* 상단 액션 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
          선택된 장소: <span style={{ color: '#1976d2' }}>{selectedSpots.length}개</span> (2~8개 가능)
        </span>
        <button
          type="button"
          onClick={handleSuggestRoute}
          disabled={isLoading || selectedSpots.length < 2}
          style={{
            padding: '10px 20px', backgroundColor: selectedSpots.length >= 2 ? '#2563eb' : '#cbd5e1',
            color: 'white', border: 'none', borderRadius: '8px', cursor: selectedSpots.length >= 2 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          {isLoading ? '동선 계산 중...' : '✨ 최적 동선 추천받기'}
        </button>
      </div>

      {/* 동선 결과 요약 패널 */}
      {routeResult && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '15px 20px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1d4ed8', fontSize: '15px' }}>🎉 최적 동선 추천 완료!</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
            총 이동 거리: <strong>{routeResult.total_distance_km ?? 0} km</strong>
          </p>
        </div>
      )}

      {/* 지도 영역 + 장소 리스트 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* 카카오 지도 컨테이너 */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '1000px', height: '500px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }} 
        />

        {/* 장소 목록 사이드바 */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', maxHeight: '500px', overflowY: 'auto' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b' }}>📍 탐색 및 찜한 장소</h4>
          {selectedSpots.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSpots.map((spot, index) => (
                <div key={spot.id || index} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    {index + 1}. {spot.name || spot.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{spot.address || spot.addr}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>
              즐겨찾기에 등록된 장소가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapPage;