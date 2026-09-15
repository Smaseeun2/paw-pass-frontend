// src/pages/MapPage.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSuggestedRoute, fetchExploreSpots } from '../services/api';
import { loadKakaoMapSdk } from '../utils/kakaoMapLoader';
import { toast } from '../utils/toast';

// 💡 현재 로그인된 유저의 이메일(또는 식별자)을 가져오는 헬퍼 함수
const getCurrentUserEmail = () => {
  try {
    const saved = localStorage.getItem('paw_pass_user');
    const user = saved ? JSON.parse(saved) : null;
    return user?.email || user?.id || null;
  } catch {
    return null;
  }
};

function MapPage() {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // 💡 유저별 고유 동선 스토리지 키 생성 (비로그인 상태면 guest 키 사용)
  const userEmail = getCurrentUserEmail();
  const storageKey = userEmail ? `paw_pass_routes_${userEmail}` : 'paw_pass_routes_guest';

  // 💡 전용 키로 로컬 스토리지에서 동선 데이터 로드
  const [selectedSpots, setSelectedSpots] = useState(() => {
    if (!storageKey) return [];

    try {
      const savedRoutes = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return savedRoutes.filter(spot => {
        const lat = Number(spot.lat || spot.latitude);
        const lng = Number(spot.lng || spot.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      }).map(spot => ({
        ...spot,
        lat: Number(spot.lat || spot.latitude),
        lng: Number(spot.lng || spot.longitude)
      })).slice(0, 8);
    } catch {
      return [];
    }
  });

  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 직접 검색 관련 State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 드래그 앤 드롭 중인 항목 인덱스 추적
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // 1. 카카오맵 SDK 안전 로드
  useEffect(() => {
    let isMounted = true;
    loadKakaoMapSdk()
      .then(() => {
        if (isMounted) {
          setMapLoaded(true);
        }
      })
      .catch((err) => {
        console.error('❌ 카카오맵 SDK 로드 실패:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. 카카오 지도 초기화
  useEffect(() => {
    if (!mapLoaded || !window.kakao || !window.kakao.maps) return;

    const container = mapContainerRef.current;
    if (!container) return;

    const initialLat = selectedSpots.length > 0 ? selectedSpots[0].lat : 37.566826;
    const initialLng = selectedSpots.length > 0 ? selectedSpots[0].lng : 126.978656;

    const options = {
      center: new window.kakao.maps.LatLng(initialLat, initialLng),
      level: 6
    };

    const map = new window.kakao.maps.Map(container, options);
    mapInstanceRef.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // 3. 지도 위에 번호 마커 및 단일 말풍선 카드 렌더링 함수
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
        background-color: #2563eb; color: white; width: 32px; height: 32px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-size: 13px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        cursor: pointer; transition: transform 0.2s;
      `;
      markerContent.innerText = index + 1;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerContent,
        yAnchor: 1.2
      });

      const infoCardContent = document.createElement('div');
      infoCardContent.className = 'map-info-card';
      infoCardContent.style.cssText = `
        background: white; border-radius: 12px; padding: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        width: 220px; font-family: sans-serif; position: relative; bottom: 45px; border: 1px solid #e2e8f0;
        display: none; z-index: 100;
      `;
      infoCardContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <strong style="font-size: 14px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">${spot.name}</strong>
          <button type="button" class="close-card" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px; font-weight:bold;">✕</button>
        </div>
        ${spot.imageUrl ? `<img src="${spot.imageUrl}" style="width:100%; height:90px; object-fit:cover; border-radius:6px; margin-bottom:6px;" />` : ''}
        <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📍 ${spot.address}</p>
        <button type="button" class="go-detail" style="width: 100%; padding: 6px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">상세보기 →</button>
      `;

      const infoOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: infoCardContent,
        yAnchor: 1
      });

      infoOverlay.setMap(map);

      markerContent.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyOpen = infoCardContent.style.display === 'block';

        document.querySelectorAll('.map-info-card').forEach(el => {
          el.style.display = 'none';
        });

        if (!isCurrentlyOpen) {
          infoCardContent.style.display = 'block';
        }
      });

      infoCardContent.querySelector('.close-card').addEventListener('click', (e) => {
        e.stopPropagation();
        infoCardContent.style.display = 'none';
      });

      infoCardContent.querySelector('.go-detail').addEventListener('click', (e) => {
        e.stopPropagation();
        const source = spot.source || 'tourapi';
        navigate(`/detail/${spot.id || spot.contentId}?source=${source}`);
      });

      customOverlay.setMap(map);
      markersRef.current.push(customOverlay);
      // 💡 4-6 메모리 누수 방지: infoOverlay도 markersRef에 넣어서 setMap(null) 시 클린업되도록 처리
      markersRef.current.push(infoOverlay);
    });

    if (pathCoordinates.length > 1) {
      // 💡 4-5 동선 경로 선 커스텀 (도보/차량 애니메이션 느낌의 점선 스타일)
      const polyline = new window.kakao.maps.Polyline({
        path: pathCoordinates,
        strokeWeight: 6,
        strokeColor: '#f59e0b', // 호박색(Amber)으로 변경하여 눈에 더 띄게
        strokeOpacity: 0.9,
        strokeStyle: 'shortdash'
      });
      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    map.setBounds(bounds);
  }, [navigate]);

  useEffect(() => {
    if (mapLoaded && !routeResult && selectedSpots.length > 0) {
      renderMapElements(selectedSpots);
    }
  }, [mapLoaded, selectedSpots, routeResult, renderMapElements]);

  // 드래그 앤 드롭 순서 변경 핸들러
  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    const updated = [...selectedSpots];
    const [movedItem] = updated.splice(draggedItemIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setDraggedItemIndex(null);
    setSelectedSpots(updated);
    
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
    setRouteResult(null);
    renderMapElements(updated);
  };

  // 💡 4-3 터치 기기(모바일)를 위한 순서 변경 버튼 핸들러
  const handleMoveSpot = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === selectedSpots.length - 1) return;

    const updated = [...selectedSpots];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;

    setSelectedSpots(updated);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
    setRouteResult(null);
    renderMapElements(updated);
  };

  // 직접 검색 핸들러
  const handleDirectSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      const data = await fetchExploreSpots({ keyword: searchKeyword.trim(), page: 1 });
      const rawList = Array.isArray(data) ? data : (data?.data || []);
      
      const mapped = rawList.map(spot => ({
        id: String(spot.id || spot.content_id),
        name: spot.title || spot.name || '장소명 없음',
        address: spot.addr || spot.address || '주소 정보 없음',
        lat: Number(spot.lat),
        lng: Number(spot.lng),
        imageUrl: spot.image || spot.first_image || '',
        source: spot.source || 'tourapi'
      })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));

      setSearchResults(mapped);
    } catch (err) {
      console.error('장소 직접 검색 실패:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSpotToRoute = (spot) => {
    if (!storageKey) {
      toast.warning('로그인 후 동선을 추가할 수 있습니다.');
      return;
    }

    if (selectedSpots.length >= 8) {
      toast.warning('동선은 최대 8개까지 추가할 수 있습니다.');
      return;
    }

    const spotId = String(spot.id);
    const exists = selectedSpots.some(item => String(item.id || item.contentId) === spotId);
    if (exists) {
      toast.info('이미 동선에 포함된 장소입니다.');
      return;
    }

    const updated = [...selectedSpots, spot];
    setSelectedSpots(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setRouteResult(null);
    renderMapElements(updated);
    toast.success(`❤️ "${spot.name}"이(가) 동선에 추가되었습니다!`);
  };

  const handleSuggestRoute = async () => {
    if (selectedSpots.length < 2) {
      toast.warning('최적 동선을 계산하려면 최소 2개 이상의 장소가 필요합니다. (최대 8개)');
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
        // 💡 4-4: 백엔드 명세 반영 - order는 ID 배열임
        const reorderedSpots = result.order
          .map(spotId => selectedSpots.find(s => String(s.id || s.contentId) === String(spotId)))
          .filter(Boolean);
          
        // 혹시 백엔드에서 일부 ID를 누락했다면 나머지를 뒤에 붙임
        const missingSpots = selectedSpots.filter(s => !result.order.includes(String(s.id || s.contentId)));
        const finalSpots = [...reorderedSpots, ...missingSpots];

        setSelectedSpots(finalSpots);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(finalSpots));
        }
        renderMapElements(finalSpots);
      }
    } catch (err) {
      console.error('동선 계산 실패:', err);
      toast.error('최적 동선을 계산하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSpot = (spotId) => {
    try {
      const updated = selectedSpots.filter(item => String(item.id || item.contentId) !== String(spotId));
      setSelectedSpots(updated);
      
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
      setRouteResult(null);

      if (updated.length > 0) {
        renderMapElements(updated);
      } else {
        if (mapInstanceRef.current && window.kakao) {
          markersRef.current.forEach(m => m.setMap(null));
          markersRef.current = [];
          if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('동선 삭제 실패:', err);
    }
  };

  return (
    <div style={{ padding: '20px 40px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '28px', color: '#1e293b' }}>🗺️ 나의 여행 동선 및 최적 지도</h2>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '25px' }}>
        장소를 검색해 추가하고, 리스트를 꾹 누르고 드래그하여 순서를 변경해보세요. 핀을 누르면 <strong>하나의 말풍선 정보 카드</strong>가 나타납니다.
      </p>

      {/* 장소 검색 바 */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleDirectSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="추가하고 싶은 관광지나 시설 이름 검색 (예: 강릉, 카페 등)"
            style={{ flex: 1, padding: '10px 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
          <button 
            type="submit"
            disabled={isSearching}
            style={{ padding: '0 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            {isSearching ? '검색 중...' : '🔍 장소 찾기'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: '12px', maxHeight: '180px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px', paddingLeft: '4px' }}>검색 결과 (클릭하여 동선에 추가)</div>
            {searchResults.map(spot => (
              <div 
                key={spot.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px' }}
              >
                <div>
                  <strong>{spot.name}</strong> <span style={{ color: '#64748b', fontSize: '12px' }}>({spot.address})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddSpotToRoute(spot)}
                  style={{ padding: '4px 10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  + 동선에 추가
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상단 액션 바 */}
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
          {isLoading ? '동선 계산 중...' : '✨ 최적 방문 동선 계산하기'}
        </button>
      </div>

      {routeResult && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '15px 20px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1d4ed8', fontSize: '15px' }}>🎉 최적 동선 계산 완료!</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
            총 이동 거리: <strong>{routeResult.total_distance_km ?? 0} km</strong>
          </p>
        </div>
      )}

      {/* 지도 영역 + 장소 리스트 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* 카카오 지도 컨테이너 */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '520px', borderRadius: '14px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
        />

        {/* 장소 목록 사이드바 */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', maxHeight: '520px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            📋 내 동선 순서 변경 (드래그)
          </h4>
          
          {selectedSpots.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSpots.map((spot, index) => {
                const spotId = String(spot.id || spot.contentId);
                let legDistance = null;
                if (index > 0 && routeResult && Array.isArray(routeResult.legs)) {
                  const prevId = String(selectedSpots[index-1].id || selectedSpots[index-1].contentId);
                  const leg = routeResult.legs.find(l => String(l.from_id) === prevId && String(l.to_id) === spotId);
                  if (leg) legDistance = leg.distance_km;
                }

                return (
                  <React.Fragment key={spotId || index}>
                    {legDistance != null && (
                      <div style={{ textAlign: 'center', color: '#3b82f6', fontSize: '12px', margin: '-2px 0', padding: '4px 0', fontWeight: 'bold' }}>
                        ⬇ 약 {legDistance.toFixed(2)} km 이동
                      </div>
                    )}
                    <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{ 
                        padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', 
                        border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', 
                        alignItems: 'center', cursor: 'grab', userSelect: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                      title="꾹 누르고 드래그하여 순서를 변경하세요"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <button 
                            onClick={() => handleMoveSpot(index, -1)} 
                            disabled={index === 0}
                            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#cbd5e1' : '#64748b', fontSize: '12px', padding: '0 4px' }}
                          >▲</button>
                          <button 
                            onClick={() => handleMoveSpot(index, 1)} 
                            disabled={index === selectedSpots.length - 1}
                            style={{ background: 'none', border: 'none', cursor: index === selectedSpots.length - 1 ? 'not-allowed' : 'pointer', color: index === selectedSpots.length - 1 ? '#cbd5e1' : '#64748b', fontSize: '12px', padding: '0 4px' }}
                          >▼</button>
                        </div>
                        <div style={{ flex: 1, minWidth: '0' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '2px' }}>
                            <span style={{ color: '#2563eb', marginRight: '4px' }}>{index + 1}.</span> {spot.name || spot.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {spot.address || spot.addr}
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSpot(spot.id || spot.contentId)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '4px', marginLeft: '6px' }}
                        title="동선에서 제거"
                      >
                        삭제
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 10px', color: '#94a3b8' }}>
              <p style={{ fontSize: '15px', margin: '0 0 6px 0' }}>🗺️ 추가된 동선이 없습니다.</p>
              <p style={{ fontSize: '13px', margin: 0 }}>상단 검색창에서 장소를 찾아 추가해보세요!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MapPage;