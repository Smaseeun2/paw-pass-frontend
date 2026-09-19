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

  // 직접 검색 관련 State 및 Ref
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchSectionRef = useRef(null);

  // 💡 화면 바깥(다른 영역) 터치/클릭 시 검색 결과 리스트 닫기 (모바일 & 웹)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchResults.length > 0 &&
        searchSectionRef.current &&
        !searchSectionRef.current.contains(e.target)
      ) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [searchResults.length]);

  // 드래그 앤 드롭 중인 항목 인덱스 추적
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

      // 📍 1) 모바일: 완벽한 정원형(30px x 30px, xAnchor: 0.5, yAnchor: 0.5) / PC: 핀 형태 마커 (xAnchor: 0.5, yAnchor: 1.0)
      const markerContainer = document.createElement('div');
      markerContainer.className = 'pawpass-map-pin';
      markerContainer.style.cssText = `
        width: 30px;
        height: ${isMobile ? '30px' : '36px'};
        min-width: 30px;
        min-height: ${isMobile ? '30px' : '36px'};
        max-width: 30px;
        max-height: ${isMobile ? '30px' : '36px'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: ${isMobile ? 'center' : 'flex-start'};
        cursor: pointer;
        transform: translate3d(0, 0, 0);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: ${10 + index};
        position: relative;
        box-sizing: border-box;
      `;

      const markerBadge = document.createElement('div');
      markerBadge.className = 'pawpass-map-pin-badge';
      markerBadge.style.cssText = `
        background: linear-gradient(135deg, #5F50A9 0%, #7C6BC6 100%);
        color: #ffffff;
        width: 30px;
        height: 30px;
        min-width: 30px;
        min-height: 30px;
        max-width: 30px;
        max-height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 13.5px;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 12px rgba(95, 80, 169, 0.4), 0 2px 5px rgba(0,0,0,0.15);
        box-sizing: border-box;
        aspect-ratio: 1 / 1;
        flex-shrink: 0;
      `;
      markerBadge.innerText = index + 1;

      markerContainer.appendChild(markerBadge);

      if (!isMobile) {
        const markerPointer = document.createElement('div');
        markerPointer.className = 'pawpass-map-pin-pointer';
        markerPointer.style.cssText = `
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #5F50A9;
          margin-top: -1.5px;
        `;
        markerContainer.appendChild(markerPointer);
      }

      markerContainer.onmouseenter = () => {
        markerContainer.style.transform = 'scale(1.18) translateY(-4px)';
        markerContainer.style.zIndex = '999';
      };
      markerContainer.onmouseleave = () => {
        markerContainer.style.transform = 'translate3d(0, 0, 0)';
        markerContainer.style.zIndex = String(10 + index);
      };

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerContainer,
        xAnchor: 0.5,
        yAnchor: isMobile ? 0.5 : 1.0
      });

      const infoCardContent = document.createElement('div');
      infoCardContent.className = 'map-info-card';
      infoCardContent.style.cssText = `
        background: #ffffff; border-radius: 14px; padding: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);
        width: 210px; position: relative; border: 1.5px solid #e2e8f0;
        display: none; z-index: 100; box-sizing: border-box;
      `;
      infoCardContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <strong style="font-size: 13.5px; font-weight: 800; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">${spot.name}</strong>
          <button type="button" class="close-card" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px; font-weight:bold; padding: 0 4px;">✕</button>
        </div>
        ${spot.imageUrl ? `<img src="${spot.imageUrl}" style="width:100%; height:88px; object-fit:cover; border-radius:8px; margin-bottom:6px; display:block;" />` : ''}
        <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📍 ${spot.address}</p>
        <button type="button" class="go-detail" style="width: 100%; padding: 7px 0; background: #5F50A9; color: white; border: none; border-radius: 8px; font-size: 11.5px; font-weight: 800; cursor: pointer;">상세보기 →</button>
      `;

      const infoOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: infoCardContent,
        xAnchor: 0.5,
        yAnchor: 1.35
      });

      infoOverlay.setMap(map);

      markerContainer.addEventListener('click', (e) => {
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
      markersRef.current.push(infoOverlay);
    });

    if (pathCoordinates.length > 1) {
      // 💡 동선 경로 선 (두께 및 화살표 방향 개선)
      const polyline = new window.kakao.maps.Polyline({
        path: pathCoordinates,
        strokeWeight: 5,
        strokeColor: '#5F50A9',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        endArrow: true
      });
      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    map.setBounds(bounds, 40, 40, 40, 40);
    setTimeout(() => {
      if (map) map.relayout();
    }, 80);
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
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
      setDraggedItemIndex(null);
      return;
    }

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

  // 직접 검색 핸들러 (API + 카카오맵 로컬 검색 병합)
  const handleDirectSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      // 1. 우리 API(통합 검색) 조회
      const apiPromise = fetchExploreSpots({ keyword: searchKeyword.trim(), page: 1 })
        .then(data => {
          const rawList = Array.isArray(data) ? data : (data?.data || []);
          return rawList.map(spot => ({
            id: String(spot.id || spot.content_id),
            name: spot.title || spot.name || '장소명 없음',
            address: spot.addr1 || spot.addr || spot.address || '주소 정보 없음',
            lat: Number(spot.lat),
            lng: Number(spot.lng),
            imageUrl: spot.image || spot.first_image || '',
            source: spot.source || 'tourapi'
          })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
        }).catch(err => {
          console.error('API 장소 직접 검색 실패:', err);
          return [];
        });

      // 2. 카카오맵 장소 검색 조회
      const kakaoPromise = new Promise((resolve) => {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
          resolve([]);
          return;
        }
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(searchKeyword.trim(), (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const mapped = data.map(place => ({
              id: `kakao_${place.id}`,
              name: place.place_name,
              address: place.road_address_name || place.address_name,
              lat: Number(place.y),
              lng: Number(place.x),
              imageUrl: '', // 카카오맵은 이미지 기본 미제공
              source: 'kakao'
            })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
            resolve(mapped);
          } else {
            resolve([]);
          }
        });
      });

      const [apiSpots, kakaoSpots] = await Promise.all([apiPromise, kakaoPromise]);

      // 중복 제거 (이름 기반 또는 좌표 기반 간이 처리)
      const merged = [...apiSpots];
      kakaoSpots.forEach(kSpot => {
        // 이미 API에 동일한 이름이 있으면 제외
        if (!merged.some(aSpot => aSpot.name.includes(kSpot.name) || kSpot.name.includes(aSpot.name))) {
          merged.push(kSpot);
        }
      });

      setSearchResults(merged);
    } catch (err) {
      console.error('장소 검색 중 오류 발생:', err);
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
      // 💡 백엔드 명세: { points: [ { id, lat, lng }, ... ] } (2~8개)
      const points = selectedSpots.map(spot => ({
        id: String(spot.id ?? spot.contentId ?? spot.content_id),
        lat: Number(spot.lat),
        lng: Number(spot.lng)
      }));

      const result = await fetchSuggestedRoute(points);
      setRouteResult(result);

      if (result && Array.isArray(result.order)) {
        // 💡 백엔드 응답 명세: { order: [...], total_distance_km, legs: [...] }
        let reorderedSpots = result.order
          .map(spotId => selectedSpots.find(s => String(s.id ?? s.contentId ?? s.content_id) === String(spotId)))
          .filter(Boolean);

        // 만약 ID 대신 인덱스 번호 배열로 응답했을 경우에 대한 유연한 방어
        if (reorderedSpots.length === 0 && result.order.length > 0 && typeof result.order[0] === 'number') {
          reorderedSpots = result.order
            .map(idx => selectedSpots[idx])
            .filter(Boolean);
        }

        // 혹시 백엔드 응답에서 누락된 장소가 있다면 끝에 보존
        const missingSpots = selectedSpots.filter(
          s => !reorderedSpots.some(r => String(r.id ?? r.contentId ?? r.content_id) === String(s.id ?? s.contentId ?? s.content_id))
        );
        const finalSpots = [...reorderedSpots, ...missingSpots];

        if (finalSpots.length > 0) {
          setSelectedSpots(finalSpots);
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(finalSpots));
          }
          renderMapElements(finalSpots);
          toast.success('✨ 최적 동선이 계산되어 장소 순서가 자동 정렬되었습니다!');
        }
      } else {
        toast.success('✨ 최적 동선 계산이 완료되었습니다!');
      }
    } catch (err) {
      console.error('동선 계산 실패:', err);
      toast.error(err.message || '최적 동선을 계산하는 중 오류가 발생했습니다.');
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
    <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, #C9B6D7 0%, #F6CADD 35%, #C5E0FB 70%, #AED2F9 100%)',
        zIndex: 0,
        opacity: 0.35,
        pointerEvents: 'none'
      }} />
      <div className="pawpass-map-container" style={{ padding: '36px 20px 60px 20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <style>{`
        .route-spot-card { 
          transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease; 
          border: 1.5px solid #F6CADD !important; 
          border-radius: 20px !important; 
          box-shadow: 0 4px 14px rgba(246, 202, 221, 0.25) !important; 
          background-color: #fff !important; 
          cursor: grab !important;
        }
        .route-spot-card:hover:not(.dragging) { 
          transform: translateY(-3px); 
          box-shadow: 0 12px 25px rgba(247, 157, 196, 0.4) !important; 
          border-color: #F79DC4 !important;
        }
        .route-spot-card:active {
          cursor: grabbing !important;
        }
        .route-spot-card.dragging {
          opacity: 0.85;
          transform: scale(1.04) rotate(1.5deg) translateY(-6px) !important;
          box-shadow: 0 20px 35px rgba(247, 157, 196, 0.4), 0 8px 16px rgba(0, 0, 0, 0.08) !important;
          border: 1.5px solid #F79DC4 !important;
          background-color: #fffafc !important;
          z-index: 50;
          cursor: grabbing !important;
        }
        .route-spot-card.drag-over {
          border-top: 3.5px solid #F79DC4 !important;
          transform: translateY(2px);
          background-color: #fffafc !important;
        }
        
        .summary-card { 
          border-radius: 24px !important; 
          border: none !important; 
          background-color: #fff !important; 
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important; 
        }
        .map-brand-btn { border-radius: 50px !important; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .map-brand-btn:hover { transform: translateY(-2px); filter: brightness(0.95); box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important; }
      `}</style>
      
      {/* 상단 모던 히어로 카드 배너 */}
      <div 
        className="map-header-banner"
        style={{ 
          textAlign: 'center', 
          padding: '34px 20px 28px 20px', 
          background: 'linear-gradient(135deg, rgba(201, 182, 215, 0.45) 0%, rgba(246, 202, 221, 0.35) 35%, rgba(197, 224, 251, 0.45) 70%, rgba(174, 210, 249, 0.4) 100%)',
          borderRadius: '28px',
          boxShadow: '0 12px 35px rgba(201, 182, 215, 0.22)',
          marginBottom: '24px',
          position: 'relative',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#5F50A9', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '5px 16px', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          Trip Route Planner
        </span>
        <h1 
          className="map-header-title"
          style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px', wordBreak: 'keep-all', lineHeight: '1.3' }}
        >
          🗺️ 나의 여행 동선 및 최적 지도
        </h1>
        <p 
          className="map-header-desc"
          style={{ fontSize: '15px', color: '#64748b', margin: '0', wordBreak: 'keep-all', lineHeight: '1.55' }}
        >
          장소를 검색해 추가하고 드래그하여<br />최적의 이동 동선을 편리하게 완성해보세요
        </p>
      </div>

      {/* 장소 검색 바 */}
      <div 
        ref={searchSectionRef}
        className="map-search-bar-container"
        style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '8px 10px 8px 18px', 
          boxShadow: '0 6px 24px rgba(95, 80, 169, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)', 
          border: '1.5px solid rgba(226, 232, 240, 0.95)',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 50,
          boxSizing: 'border-box'
        }}
      >
        <form onSubmit={handleDirectSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <input 
            type="text"
            className="map-search-input"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="가고 싶은 관광지나 장소 검색 (예: 강릉, 카페)"
            style={{ 
              flex: 1, 
              padding: '8px 0', 
              backgroundColor: 'transparent', 
              border: 'none', 
              fontSize: '14.5px', 
              fontWeight: '600',
              outline: 'none',
              color: '#1e293b',
              minWidth: '100px'
            }}
          />
          <button 
            type="submit" 
            className="map-search-submit-btn"
            disabled={isSearching} 
            title="장소 검색"
            style={{ 
              width: '38px', 
              height: '38px', 
              minWidth: '38px',
              minHeight: '38px',
              maxWidth: '38px',
              maxHeight: '38px',
              padding: 0,
              borderRadius: '50%', 
              backgroundColor: '#5F50A9', 
              color: '#fff', 
              border: 'none', 
              cursor: isSearching ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 3px 12px rgba(95, 80, 169, 0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = '0 5px 16px rgba(95, 80, 169, 0.45)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 3px 12px rgba(95, 80, 169, 0.3)';
            }}
          >
            {isSearching ? (
              <span style={{ fontSize: '13px' }}>⏳</span>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            )}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ 
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#ffffff', 
            border: '1.5px solid #e2e8f0', 
            borderRadius: '14px', 
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              padding: '10px 14px', 
              fontSize: '12px', 
              fontWeight: '800', 
              color: '#64748b', 
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🔍 검색 결과 ({searchResults.length}개)</span>
              <button 
                type="button" 
                onClick={() => setSearchResults([])}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#94a3b8', 
                  fontSize: '11px', 
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontWeight: '600'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#e11d48'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
              >
                닫기 ✕
              </button>
            </div>
            <div style={{ 
              maxHeight: '230px', 
              overflowY: 'auto', 
              padding: '6px',
              boxSizing: 'border-box'
            }}>
              {searchResults.map(spot => (
                <div 
                  key={spot.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '8px 10px', 
                    borderRadius: '8px',
                    borderBottom: '1px solid #f8fafc', 
                    fontSize: '13px', 
                    gap: '10px',
                    boxSizing: 'border-box',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <strong style={{ color: '#1e293b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {spot.name}
                    </strong> 
                    <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {spot.address}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="map-brand-btn" 
                    onClick={() => handleAddSpotToRoute(spot)} 
                    style={{ 
                      padding: "6px 12px", 
                      backgroundColor: "#5F50A9", 
                      color: "#fff", 
                      border: "none", 
                      fontSize: "11.5px", 
                      fontWeight: "800", 
                      cursor: "pointer", 
                      borderRadius: "50px", 
                      boxShadow: "0 2px 6px rgba(95, 80, 169, 0.25)", 
                      flexShrink: 0, 
                      whiteSpace: 'nowrap' 
                    }}
                  >
                    + 추가
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 상단 액션 바 (동일 선상 1줄 정렬 유지) */}
      <div 
        className="map-action-bar"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'nowrap', 
          gap: '10px', 
          marginBottom: '16px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#334155', whiteSpace: 'nowrap' }}>
          동선에 추가된 장소: <span style={{ color: '#5F50A9', fontWeight: '900' }}>{selectedSpots.length}개</span> <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>(2~8개 가능)</span>
        </span>

        <button 
          type="button" 
          className="map-brand-btn map-optimize-btn" 
          onClick={handleSuggestRoute} 
          disabled={isLoading || selectedSpots.length < 2} 
          style={{
            padding: '9px 18px', 
            backgroundColor: selectedSpots.length >= 2 ? '#5F50A9' : '#e2e8f0', 
            color: selectedSpots.length >= 2 ? '#fff' : '#94a3b8', 
            border: 'none', 
            borderRadius: '50px',
            cursor: selectedSpots.length >= 2 ? 'pointer' : 'not-allowed',
            fontWeight: '800', 
            fontSize: '13px', 
            minWidth: '140px',
            textAlign: 'center',
            boxShadow: selectedSpots.length >= 2 ? '0 4px 14px rgba(95, 80, 169, 0.35)' : 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {isLoading ? '동선 계산 중...' : '✨ 최적 방문 동선 계산하기'}
        </button>
      </div>

      {routeResult && (
        <div className="summary-card" style={{ backgroundColor: "#fff", border: "none", padding: "20px 25px", marginBottom: "20px" }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1d4ed8', fontSize: '15px' }}>🎉 최적 동선 계산 완료!</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
            총 이동 거리: <strong>{routeResult.total_distance_km ?? 0} km</strong>
          </p>
        </div>
      )}

      {/* 지도 영역 + 장소 리스트 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* 카카오 지도 컨테이너 */}
        <div 
          ref={mapContainerRef} 
          style={{ order: 2, width: '100%', height: '520px', borderRadius: '24px', border: 'none', backgroundColor: '#e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }} 
        />

        {/* 장소 목록 사이드바 */}
        <div style={{ order: 1, backgroundColor: '#f8fafc', border: 'none', borderRadius: '24px', padding: '20px', maxHeight: '520px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1e293b', fontWeight: 'bold' }}>
              📋 여행 동선 순서 변경
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              💡 카드를 꾹 누르고 드래그하여 순서를 변경해보세요
            </p>
          </div>
          
          {selectedSpots.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSpots.map((spot, index) => {
                const spotId = String(spot.id ?? spot.contentId ?? spot.content_id);
                let legDistance = null;
                if (index > 0 && routeResult && Array.isArray(routeResult.legs)) {
                  const prevId = String(selectedSpots[index-1].id ?? selectedSpots[index-1].contentId ?? selectedSpots[index-1].content_id);
                  const leg = routeResult.legs.find(l => 
                    (String(l.from_id ?? l.from ?? '') === prevId && String(l.to_id ?? l.to ?? '') === spotId) ||
                    (String(l.from_id ?? l.from ?? '') === spotId && String(l.to_id ?? l.to ?? '') === prevId)
                  );
                  if (leg && (leg.distance_km != null || leg.distance != null)) {
                    legDistance = Number(leg.distance_km ?? leg.distance);
                  }
                }

                return (
                  <React.Fragment key={spotId || index}>
                    {legDistance != null && (
                      <div style={{ textAlign: 'center', color: '#5F50A9', fontSize: '12px', margin: '-2px 0', padding: '4px 0', fontWeight: 'bold' }}>
                        ⬇ 약 {legDistance.toFixed(2)} km 이동
                      </div>
                    )}
                    <div 
                      className={`route-spot-card ${draggedItemIndex === index ? 'dragging' : ''} ${dragOverIndex === index && draggedItemIndex !== index ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{ 
                        padding: '16px', display: 'flex', justifyContent: 'space-between', 
                        alignItems: 'center', userSelect: 'none',
                        position: 'relative'
                      }}
                      title="꾹 누르고 드래그하여 순서를 변경하세요"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '0' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', backgroundColor: '#fff', padding: '3px 2px', borderRadius: '10px', border: 'none', boxShadow: 'none' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMoveSpot(index, -1); }} 
                            disabled={index === 0}
                            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#e2e8f0' : '#e11d48', fontSize: '10px', padding: '0 4px', lineHeight: 1 }}
                            title="위로 순서 이동"
                          >▲</button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMoveSpot(index, 1); }} 
                            disabled={index === selectedSpots.length - 1}
                            style={{ background: 'none', border: 'none', cursor: index === selectedSpots.length - 1 ? 'not-allowed' : 'pointer', color: index === selectedSpots.length - 1 ? '#e2e8f0' : '#e11d48', fontSize: '10px', padding: '0 4px', lineHeight: 1 }}
                            title="아래로 순서 이동"
                          >▼</button>
                        </div>
                        <div style={{ flex: 1, minWidth: '0' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '2px' }}>
                            <span style={{ color: '#5F50A9', marginRight: '4px' }}>{index + 1}.</span> {spot.name || spot.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {spot.address || spot.addr}
                          </div>
                        </div>
                      </div>
                                            <button 
                        type="button"
                        onClick={() => handleRemoveSpot(spot.id || spot.contentId)}
                        style={{ 
                          backgroundColor: '#fff', 
                          border: '1.5px solid #F6CADD', 
                          cursor: 'pointer', 
                          padding: '6px', 
                          marginLeft: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          color: '#ef4444',
                          boxShadow: '0 2px 6px rgba(246, 202, 221, 0.3)',
                          transition: 'transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease'
                        }}
                        onMouseOver={(e) => { 
                          e.currentTarget.style.transform = 'scale(1.15)'; 
                          e.currentTarget.style.backgroundColor = '#fff0f5'; 
                          e.currentTarget.style.borderColor = '#F79DC4';
                        }}
                        onMouseOut={(e) => { 
                          e.currentTarget.style.transform = 'scale(1)'; 
                          e.currentTarget.style.backgroundColor = '#fff'; 
                          e.currentTarget.style.borderColor = '#F6CADD';
                        }}
                        title="동선에서 제거"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
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
    </>
  );
}

export default MapPage;