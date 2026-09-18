// src/pages/SearchPage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTouristSpots } from '../hooks/useTouristSpots';
import { useFavoritesContext as useFavorites } from '../contexts/FavoritesContext';
import { fetchPetsFromDB } from '../services/api';
import LazyImage from '../components/LazyImage';
import { useSpotDetail } from '../hooks/useSpotDetail';
import { toast } from '../utils/toast';
import { loadKakaoMapSdk } from '../utils/kakaoMapLoader';

const CATEGORY_OPTIONS = [
  { label: '자연/풍경', value: 'NATURE' },
  { label: '카페', value: 'CAFE' },
  { label: '음식점/식당', value: 'FOOD' },
  { label: '문화/예술', value: 'CULTURE' },
  { label: '숙박시설', value: 'STAY' },
  { label: '동물병원', value: 'HOSPITAL' }
];

import { REGION_OPTIONS, findRegion } from '../constants/regions';

const MATCH_STATUS_BUTTONS = [
  { label: '전체 판정', value: '' },
  { label: '🟢 방문 가능', value: '가능' },
  { label: '🟡 조건부 가능', value: '조건부' },
  { label: '🔴 방문 불가', value: '불가' }
];

function DrawerContent({ spot, onClose, navigate, user, myPets, selectedPetIds = [] }) {
  const { detail, isLoading, error } = useSpotDetail(spot.id, spot.source);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!detail) return;
    const apiLat = Number(detail.lat || detail.map_y || detail.mapy || detail.y);
    const apiLng = Number(detail.lng || detail.map_x || detail.mapx || detail.x);
    const hasValidCoords = !isNaN(apiLat) && !isNaN(apiLng) && apiLat !== 0 && apiLng !== 0;

    let isMounted = true;
    loadKakaoMapSdk().then(() => {
      if (!isMounted || !mapRef.current) return;
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      const createMap = (lat, lng) => {
        if (!mapRef.current) return;
        mapRef.current.innerHTML = '';
        const center = new kakao.maps.LatLng(lat, lng);
        const map = new kakao.maps.Map(mapRef.current, { center, level: 4 });
        new kakao.maps.Marker({ position: center }).setMap(map);
      };

      if (hasValidCoords) {
        createMap(apiLat, apiLng);
      } else if (detail.address && kakao.maps.services) {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(detail.address, (result, status) => {
          if (!isMounted) return;
          if (status === kakao.maps.services.Status.OK && result[0]) {
            createMap(Number(result[0].y), Number(result[0].x));
          } else {
            createMap(37.566826, 126.978656);
          }
        });
      } else {
        createMap(37.566826, 126.978656);
      }
    }).catch(err => console.error('맵 로드 오류:', err));

    return () => { isMounted = false; };
  }, [detail]);
  
  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🐾</div>
        <p style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>장소 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#ef4444' }}>
        <p style={{ fontWeight: 'bold' }}>{error}</p>
        <button onClick={onClose} style={{ marginTop: '16px', padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>닫기</button>
      </div>
    );
  }

  const d = detail || {};
  const cond = d.petCondition || {};
  const spotName = d.title || d.name || spot.title || spot.name || '이름 없음';
  const spotAddress = d.address || spot.address || '주소 정보 없음';

  const lat = Number(d.lat || spot.lat);
  const lng = Number(d.lng || spot.lng);
  const kakaoMapUrl = (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0)
    ? `https://map.kakao.com/link/map/${encodeURIComponent(spotName)},${lat},${lng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(spotAddress || spotName)}`;
  const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(spotName)}`;

  const isMatchPossible = spot.matchStatus === '가능';
  const isMatchConditional = spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* 1. 스크롤 가능한 본문 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 상단 액션 바 (카테고리 뱃지 & 원형 닫기 버튼) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '800', 
            letterSpacing: '0.6px', 
            backgroundColor: '#F3EEFA', 
            color: '#5F50A9', 
            padding: '5px 14px', 
            borderRadius: '50px' 
          }}>
            {spot.source === 'kcisa' ? '🏥 한국문화정보원' : '🏞️ 한국관광공사'}
          </span>
          
          <button 
            onClick={onClose}
            aria-label="닫기"
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              color: '#475569', 
              cursor: 'pointer', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* 히어로 이미지 & 플로팅 판정 뱃지 */}
        <div style={{ 
          width: '100%', 
          height: '240px', 
          backgroundColor: '#f1f5f9', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          position: 'relative',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          flexShrink: 0
        }}>
          <LazyImage spot={d.image ? d : spot} fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>🖼️ 대표 이미지 준비중</div>} />
          
          {/* 플로팅 글래스 출입 판정 뱃지 */}
          <div style={{ 
            position: 'absolute', 
            bottom: '14px', 
            left: '14px', 
            backdropFilter: 'blur(10px)', 
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: isMatchPossible ? 'rgba(220, 252, 231, 0.92)' : isMatchConditional ? 'rgba(254, 249, 195, 0.92)' : 'rgba(241, 245, 249, 0.92)',
            color: isMatchPossible ? '#15803d' : isMatchConditional ? '#a16207' : '#334155',
            border: isMatchPossible ? '1px solid rgba(187, 247, 208, 0.8)' : isMatchConditional ? '1px solid rgba(253, 230, 138, 0.8)' : '1px solid rgba(226, 232, 240, 0.8)',
            padding: '6px 14px',
            borderRadius: '50px',
            fontSize: '12px',
            fontWeight: '800',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>{isMatchPossible ? '🟢' : isMatchConditional ? '🟡' : '⚪'}</span>
            <span>출입 판정: {spot.matchStatus}</span>
          </div>
        </div>

        {/* 타이틀 및 주소 */}
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: '1.3', letterSpacing: '-0.3px', wordBreak: 'keep-all' }}>
            {spotName}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📍</span>
            <span>{spotAddress}</span>
          </p>
        </div>

        {/* AI 맞춤 판정 결과 카드 */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: isMatchPossible ? '#f0fdf4' : isMatchConditional ? '#fffbeb' : '#f8fafc', 
          borderRadius: '24px', 
          border: isMatchPossible ? '1.5px solid #bbf7d0' : isMatchConditional ? '1.5px solid #fde68a' : '1.5px solid #e2e8f0',
          boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🐾</span>
            <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>
              내 반려동물 맞춤 판정 사유
            </span>
          </div>

          {spot.matchReason ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              {spot.matchReason}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              현장 방문 시 시설의 동반 수칙을 준수해주세요.
            </p>
          )}

          {myPets.length === 0 && spot.matchStatus === '동반 확인 필요' && (
            <div 
              onClick={() => navigate(user ? '/profile' : '/login')}
              style={{ 
                marginTop: '12px', 
                padding: '12px 16px', 
                backgroundColor: '#ffffff', 
                borderRadius: '16px', 
                border: '1px solid #bae6fd', 
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <p style={{ margin: 0, fontSize: '12px', color: '#0369a1', lineHeight: '1.5', fontWeight: 'bold' }}>
                💡 펫 프로필을 등록하면 아이 맞춤 출입 조건을 AI가 실시간으로 분석해드립니다! 🚀
              </p>
            </div>
          )}
        </div>

        {/* 핵심 기본 정보 그리드 (주소, 전화, 영업시간, 주차) */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '24px', 
          padding: '20px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
              📞
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>전화번호</span>
              <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{d.phone || spot.tel || '정보 미제공'}</span>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: '#f1f5f9' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
              ⏰
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>운영시간</span>
              <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{d.hours || '현장 또는 전화 문의'}</span>
            </div>
          </div>

          {cond.parkingAvailable && (
            <>
              <div style={{ height: '1px', backgroundColor: '#f1f5f9' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                  🚗
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>주차 정보</span>
                  <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{cond.parkingAvailable}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 상세 동반 규정 카드 */}
        {cond.petPolicy && (
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '24px', 
            padding: '20px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🐶</span>
              <span>상세 동반 규정 및 안내</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
              {cond.petPolicy && <p style={{ margin: 0 }}><strong>규정:</strong> {cond.petPolicy}</p>}
              {cond.petRestriction && <p style={{ margin: 0, color: '#e11d48' }}><strong>제한사항:</strong> {cond.petRestriction}</p>}
              {cond.needItem && <p style={{ margin: 0, color: '#5F50A9' }}><strong>필요 용품:</strong> {cond.needItem}</p>}
            </div>
          </div>
        )}

        {/* 미니 지도 및 길찾기 액션 */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '24px', 
          padding: '20px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 6px 20px rgba(0,0,0,0.03)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📍</span>
              <span>위치 & 길찾기</span>
            </h4>
            <div style={{ display: 'flex', gap: '6px' }}>
              <a 
                href={kakaoMapUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  padding: '5px 12px', 
                  backgroundColor: '#A2B9EE', 
                  color: '#1e3a8a', 
                  borderRadius: '50px', 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  textDecoration: 'none' 
                }}
              >
                카카오맵 ↗
              </a>
              <a 
                href={naverMapUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  padding: '5px 12px', 
                  backgroundColor: '#CBF5AF', 
                  color: '#166534', 
                  borderRadius: '50px', 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  textDecoration: 'none' 
                }}
              >
                네이버 지도 ↗
              </a>
            </div>
          </div>

          <div 
            ref={mapRef} 
            style={{ width: '100%', height: '180px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflow: 'hidden' }}
          />
        </div>
      </div>

      {/* 2. 패널 하단에 항상 고정된 플로팅 액션 바 (스크롤 불필요) */}
      <div style={{ 
        padding: '16px 28px 24px 28px', 
        backgroundColor: '#ffffff', 
        borderTop: '1px solid #f1f5f9', 
        boxShadow: '0 -8px 24px rgba(0,0,0,0.06)',
        zIndex: 10,
        flexShrink: 0
      }}>
        <button 
          type="button"
          onClick={() => {
            const petIdsQuery = selectedPetIds?.length > 0 ? `&petIds=${selectedPetIds.join(',')}` : '';
            navigate(`/detail/${spot.id}?source=${spot.source}${petIdsQuery}`);
          }}
          style={{ 
            width: '100%', 
            height: '52px',
            padding: '0 24px', 
            backgroundColor: '#5F50A9', 
            color: 'white', 
            border: 'none', 
            borderRadius: '50px', 
            cursor: 'pointer', 
            fontWeight: '800', 
            fontSize: '15px', 
            boxShadow: '0 8px 24px rgba(95, 80, 169, 0.35)', 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(95, 80, 169, 0.45)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(95, 80, 169, 0.35)'; }}
        >
          <span>전체 상세 페이지 보기</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

function SearchMapView({ 
  spots, 
  selectedSpotId, 
  onSpotSelect, 
  navigate, 
  selectedPetIds = [],
  user 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [activeSpot, setActiveSpot] = useState(null);

  // 선택된 spot이 변경되면 activeSpot 동기화
  useEffect(() => {
    if (selectedSpotId) {
      const found = spots.find(s => String(s.id) === String(selectedSpotId));
      if (found) setActiveSpot(found);
    }
  }, [selectedSpotId, spots]);

  // 카카오맵 렌더링 및 마커 등록
  useEffect(() => {
    let isMounted = true;
    loadKakaoMapSdk().then(() => {
      if (!isMounted || !mapContainerRef.current) return;
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      const validSpots = spots.filter(s => {
        const lat = Number(s.lat);
        const lng = Number(s.lng);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });

      const initialLat = validSpots.length > 0 ? Number(validSpots[0].lat) : 37.566826;
      const initialLng = validSpots.length > 0 ? Number(validSpots[0].lng) : 126.978656;

      let map = mapInstanceRef.current;
      if (!map) {
        const options = {
          center: new kakao.maps.LatLng(initialLat, initialLng),
          level: 7
        };
        map = new kakao.maps.Map(mapContainerRef.current, options);
        mapInstanceRef.current = map;
      }

      // 기존 마커 및 오버레이 제거
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      if (validSpots.length === 0) return;

      const bounds = new kakao.maps.LatLngBounds();

      validSpots.forEach((spot) => {
        const lat = Number(spot.lat);
        const lng = Number(spot.lng);
        const position = new kakao.maps.LatLng(lat, lng);
        bounds.extend(position);

        const isPossible = spot.matchStatus === '가능';
        const isConditional = spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부';
        const isRestricted = spot.matchStatus === '불가' || spot.matchStatus === '방문 불가';
        
        const pinBg = isPossible ? '#16A34A' : isConditional ? '#D97706' : isRestricted ? '#DC2626' : '#5F50A9';
        const isSelected = selectedSpotId && String(selectedSpotId) === String(spot.id);

        const markerDiv = document.createElement('div');
        markerDiv.style.cssText = `
          background-color: ${pinBg};
          color: #ffffff;
          width: ${isSelected ? '38px' : '32px'};
          height: ${isSelected ? '38px' : '32px'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease, width 0.2s ease, height 0.2s ease;
          position: relative;
        `;
        markerDiv.innerHTML = `<span>🐾</span>`;
        markerDiv.title = `${spot.name} (${spot.matchStatus || '동반 확인'})`;

        markerDiv.onclick = (e) => {
          e.stopPropagation();
          onSpotSelect(spot.id);
          setActiveSpot(spot);
          map.panTo(position);
        };

        const customOverlay = new kakao.maps.CustomOverlay({
          position,
          content: markerDiv,
          yAnchor: 0.5,
          zIndex: isSelected ? 10 : 2
        });

        customOverlay.setMap(map);
        markersRef.current.push(customOverlay);
      });

      // 영역 자동 맞춤
      if (validSpots.length > 0) {
        map.setBounds(bounds);
      }
    }).catch(err => console.error('지도 로드 오류:', err));

    return () => { isMounted = false; };
  }, [spots, selectedSpotId]);

  const handleSpotCardClick = (spot) => {
    onSpotSelect(spot.id);
    setActiveSpot(spot);
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current && window.kakao) {
      mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(lat, lng));
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '16px',
      height: '660px',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
      position: 'relative'
    }}>
      {/* 1. 좌측 관광지 미니 리스트 패널 */}
      <div style={{
        width: '320px',
        minWidth: '280px',
        height: '100%',
        overflowY: 'auto',
        borderRight: '1px solid #f1f5f9',
        backgroundColor: '#fafbfc',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        <div style={{ padding: '16px 18px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 5 }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
            📍 지도 표시 장소 ({spots.length}개)
          </span>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
            장소를 누르면 지도가 해당 위치로 이동합니다
          </p>
        </div>

        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {spots.length > 0 ? (
            spots.map((spot, idx) => {
              const isSelected = activeSpot?.id === spot.id || selectedSpotId === spot.id;
              const isPossible = spot.matchStatus === '가능';
              const isConditional = spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부';
              const spotImg = spot.image || spot.imageUrl || spot.first_image || '';

              return (
                <div
                  key={`${spot.id}-${idx}`}
                  onClick={() => handleSpotCardClick(spot)}
                  style={{
                    backgroundColor: isSelected ? '#F3EEFA' : '#ffffff',
                    border: isSelected ? '1.5px solid #5F50A9' : '1px solid #f1f5f9',
                    borderRadius: '16px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    boxShadow: isSelected ? '0 4px 14px rgba(95, 80, 169, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {spotImg ? (
                      <img src={spotImg} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '18px' }}>🏞️</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {spot.name}
                      </strong>
                      <span style={{
                        fontSize: '9.5px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        backgroundColor: isPossible ? '#dcfce7' : isConditional ? '#fef9c3' : '#f1f5f9',
                        color: isPossible ? '#15803d' : isConditional ? '#a16207' : '#64748b',
                        flexShrink: 0
                      }}>
                        {spot.matchStatus}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {spot.address}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '12px' }}>
              검색된 장소가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 2. 우측 메인 인터랙티브 지도 */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* 지도 위 플로팅 장소 프리뷰 팝오버 카드 */}
        {activeSpot && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 30,
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
            border: '1px solid rgba(226, 232, 240, 0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  backgroundColor: activeSpot.matchStatus === '가능' ? '#dcfce7' : activeSpot.matchStatus === '조건부 가능' || activeSpot.matchStatus === '조건부' ? '#fef9c3' : '#f1f5f9',
                  color: activeSpot.matchStatus === '가능' ? '#15803d' : activeSpot.matchStatus === '조건부 가능' || activeSpot.matchStatus === '조건부' ? '#a16207' : '#64748b'
                }}>
                  {activeSpot.matchStatus}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{activeSpot.source === 'kcisa' ? '한국문화정보원' : '한국관광공사'}</span>
              </div>

              <button
                onClick={() => setActiveSpot(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                title="닫기"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              {(activeSpot.image || activeSpot.imageUrl || activeSpot.first_image) && (
                <img
                  src={activeSpot.image || activeSpot.imageUrl || activeSpot.first_image}
                  alt={activeSpot.name}
                  style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeSpot.name}
                </h4>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  📍 {activeSpot.address}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => onSpotSelect(activeSpot.id)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '50px',
                  backgroundColor: '#5F50A9',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(95, 80, 169, 0.25)'
                }}
              >
                📖 빠른 요약 드로어
              </button>
              <button
                type="button"
                onClick={() => {
                  const petIdsQuery = selectedPetIds?.length > 0 ? `&petIds=${selectedPetIds.join(',')}` : '';
                  navigate(`/detail/${activeSpot.id}?source=${activeSpot.source}${petIdsQuery}`);
                }}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '50px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                상세보기 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchPage() {
  const { spots, isInitialLoading, isFetchingMore, hasMore, fetchSpots, loadMore } = useTouristSpots();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'map'

  // location.state(홈에서 넘어온 값) 우선 → 없으면 URL 쿼리 파라미터 사용
  const queryState = location.state || {};

  const [user] = useState(() => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [myPets, setMyPets] = useState([]);

  // URL 파라미터와 location.state를 합쳐서 초기값 결정 (state 우선)
  const initKeyword = queryState.keyword || searchParams.get('keyword') || '';
  const initMatchStatus = queryState.matchStatus || searchParams.get('matchStatus') || '';
  const initRawRegion = queryState.regionCode || queryState.region || searchParams.get('region') || '';
  const initRawCategory = queryState.category || queryState.type || searchParams.get('category') || '';
  const getInitialPetIds = () => {
    let ids = queryState.selectedPetIds || (queryState.petId ? [queryState.petId] : null);
    if (!ids && searchParams.get('petIds')) {
      ids = searchParams.get('petIds').split(',');
    }
    if (!ids || ids.length === 0) {
      try {
        const guestPets = JSON.parse(localStorage.getItem('paw_pass_pets_guest') || '[]');
        const userPets = JSON.parse(localStorage.getItem('paw_pass_pets') || '[]');
        const userLocalPets = user ? JSON.parse(localStorage.getItem(`paw_pass_user_pets_${user.id}`) || '[]') : [];
        const allPets = [...userLocalPets, ...userPets, ...guestPets];
        if (allPets.length > 0) {
          const rep = allPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || allPets[0];
          if (rep && rep.id) ids = [rep.id];
        }
      } catch (e) {
        // 무시
      }
    }
    return ids || [];
  };
  const initPetIds = getInitialPetIds();

  const [selectedPetIds, setSelectedPetIds] = useState(initPetIds);
  const [keyword, setKeyword] = useState(initKeyword);
  const [selectedMatchStatus, setSelectedMatchStatus] = useState(initMatchStatus);

  // 💡 지역 코드 및 지역명 표준화 파싱
  const matchedRegion = findRegion(initRawRegion);
  const matchedCategory = CATEGORY_OPTIONS.find(c => c.value === String(initRawCategory) || c.label === String(initRawCategory));

  const [selectedRegionCode, setSelectedRegionCode] = useState(matchedRegion.code || '');
  const [selectedRegionName, setSelectedRegionName] = useState(matchedRegion.code ? matchedRegion.label : '');

  const [selectedCategory, setSelectedCategory] = useState(matchedCategory ? matchedCategory.value : initRawCategory);
  const [selectedCategoryName, setSelectedCategoryName] = useState(matchedCategory ? matchedCategory.label : (initRawCategory ? String(initRawCategory) : ''));

  const [petCounts, setPetCounts] = useState(queryState.petCounts || { small: 0, medium: 0, large: 0 });

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);

  const dropdownRef = useRef(null);
  const observerTarget = useRef(null);
  // 선택된 펫 IDs를 ref에도 동기화 (클로저 캡처 문제 방지 → 검색 시 최신값 보장)
  const selectedPetIdsRef = useRef(selectedPetIds);
  useEffect(() => { selectedPetIdsRef.current = selectedPetIds; }, [selectedPetIds]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadUserPets = async () => {
      const token = localStorage.getItem('paw_pass_access_token');
      if (user && token) {
        try {
          const res = await fetchPetsFromDB();
          const serverPets = Array.isArray(res) ? res : (res?.data || []);
          setMyPets(serverPets);

          // 현재 선택된 펫이 없을 때만 대표 펫 자동 지정
          setSelectedPetIds(prev => {
            if (prev.length > 0) return prev; // 이미 선택 있으면 유지
            if (serverPets.length === 0) return prev;
            const rep = serverPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || serverPets[0];
            return rep ? [rep.id] : prev;
          });
        } catch {
          setMyPets([]);
        }
      } else {
        try {
          const guestPets = JSON.parse(localStorage.getItem('paw_pass_pets_guest') || '[]');
          setMyPets(guestPets);
          
          setSelectedPetIds(prev => {
            if (prev.length > 0) return prev;
            if (guestPets.length === 0) return prev;
            const rep = guestPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || guestPets[0];
            return rep ? [rep.id] : prev;
          });
        } catch {
          setMyPets([]);
        }
      }
    };
    loadUserPets();
  }, [user]);

  const [randomPlaceholder, setRandomPlaceholder] = useState('예: 남이섬');

  // API로부터 로드된 실제 관광지 이름들을 기반으로 랜덤 플레이스홀더 순환
  useEffect(() => {
    const defaultList = ['남이섬', '해운대해수욕장', '순천만국가정원', '아침고요수목원', '스타필드 하남', '안면도자연휴양림', '경포대'];
    let spotNames = defaultList;

    if (spots && spots.length > 0) {
      const apiNames = spots
        .map(s => s.title || s.name)
        .filter(n => n && n !== '장소명 없음' && n.trim().length > 1);
      if (apiNames.length > 0) {
        spotNames = apiNames;
      }
    }

    let currentIndex = Math.floor(Math.random() * spotNames.length);
    setRandomPlaceholder(`예: ${spotNames[currentIndex]}`);

    const timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % spotNames.length;
      setRandomPlaceholder(`예: ${spotNames[currentIndex]}`);
    }, 3500);

    return () => clearInterval(timer);
  }, [spots]);

  useEffect(() => {
    const currentState = location.state || {};
    const curKeyword = currentState.keyword || searchParams.get('keyword') || '';
    const curMatchStatus = currentState.matchStatus || searchParams.get('matchStatus') || '';
    const curRawRegion = currentState.regionCode || currentState.region || searchParams.get('region') || '';
    const curRawCategory = currentState.category || currentState.type || searchParams.get('category') || '';
    
    const curMatchedRegion = findRegion(curRawRegion);
    const curMatchedCategory = CATEGORY_OPTIONS.find(c => c.value === String(curRawCategory) || c.label === String(curRawCategory));

    let curPetIds = currentState.selectedPetIds || (currentState.petId ? [currentState.petId] : null);
    if (!curPetIds && searchParams.get('petIds')) {
      curPetIds = searchParams.get('petIds').split(',');
    }
    if (!curPetIds || curPetIds.length === 0) {
      curPetIds = selectedPetIdsRef.current;
    }

    const curGuestSize = currentState.guestSizeHint ||
      (curPetIds.length === 0
        ? (currentState.petCounts?.large > 0 ? 'large' : currentState.petCounts?.medium > 0 ? 'medium' : currentState.petCounts?.small > 0 ? 'small' : '')
        : '');

    // State 동기화
    setSelectedRegionCode(curMatchedRegion.code || '');
    setSelectedRegionName(curMatchedRegion.code ? curMatchedRegion.label : '');
    setSelectedCategory(curMatchedCategory ? curMatchedCategory.value : (curRawCategory || ''));
    setSelectedCategoryName(curMatchedCategory ? curMatchedCategory.label : (curRawCategory ? String(curRawCategory) : ''));
    setKeyword(curKeyword);
    setSelectedMatchStatus(curMatchStatus);
    if (curPetIds && curPetIds.length > 0) setSelectedPetIds(curPetIds);

    // 즉시 검색 실행
    fetchSpots({
      regionCode: curMatchedRegion.code || curRawRegion,
      category: curMatchedCategory ? curMatchedCategory.value : curRawCategory,
      matchStatus: curMatchStatus,
      petIds: curPetIds,
      guestSizeHint: curGuestSize,
      keyword: curKeyword
    }, false);
    setSelectedSpotId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isInitialLoading && !isFetchingMore && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, isInitialLoading, isFetchingMore, hasMore]);

  // 💡 3-3 검색 디바운싱: 키워드 입력 후 500ms 대기 시 자동 검색 (한글 자모 완성 처리 방어)
  useEffect(() => {
    // keyword 초기화 시에는 불필요한 API 호출 생략
    if (keyword === initKeyword) return;
    
    const timerId = setTimeout(() => {
      fetchSpots({
        regionCode: selectedRegionCode,
        category: selectedCategory,
        matchStatus: selectedMatchStatus,
        petIds: selectedPetIds,
        keyword: keyword.trim()
      }, false);

      const newParams = {};
      if (keyword.trim()) newParams.keyword = keyword.trim();
      if (selectedRegionCode) newParams.region = selectedRegionCode;
      if (selectedCategory) newParams.category = selectedCategory;
      if (selectedMatchStatus) newParams.matchStatus = selectedMatchStatus;
      if (selectedPetIds.length > 0) newParams.petIds = selectedPetIds.join(',');
      setSearchParams(newParams, { replace: true });
      
      // 검색 시 디테일 패널 초기화 (드롭다운은 건드리지 않음)
      setSelectedSpotId(null);
    }, 500);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const handleCountChange = (size, delta, e) => {
    e.stopPropagation();
    setPetCounts(prev => ({ ...prev, [size]: Math.max(0, prev[size] + delta) }));
  };

  const handlePetToggle = (petId, e) => {
    e.stopPropagation();
    setSelectedPetIds(prev => 
      prev.includes(petId) ? prev.filter(id => id !== petId) : [...prev, petId]
    );
  };

  const getPetFilterLabel = () => {
    const parts = [];
    if (myPets.length > 0 && selectedPetIds.length > 0) {
      const selectedNames = myPets.filter(p => selectedPetIds.includes(p.id)).map(p => p.name);
      if (selectedNames.length > 0) parts.push(selectedNames.join(', '));
    }
    const extraParts = [];
    if (petCounts.small > 0) extraParts.push(`소형 ${petCounts.small}`);
    if (petCounts.medium > 0) extraParts.push(`중형 ${petCounts.medium}`);
    if (petCounts.large > 0) extraParts.push(`대형 ${petCounts.large}`);
    if (extraParts.length > 0) parts.push(extraParts.join('+'));

    return parts.length > 0 ? parts.join(' + ') : '반려동물 선택';
  };

  const handleSearchButtonClick = (overrideMatchStatus) => {
    const statusToUse = overrideMatchStatus !== undefined ? overrideMatchStatus : selectedMatchStatus;
    // ref에서 최신 펫 IDs 읽기 (클로저 stale 문제 방지)
    const latestPetIds = selectedPetIdsRef.current;

    // 비로그인 유저가 크기 카운터를 선택한 경우 guestSizeHint 계산
    // 우선순위: large > medium > small (가장 제한적인 크기를 대표로 사용)
    let guestSizeHint = '';
    if (latestPetIds.length === 0) {
      if (petCounts.large > 0) guestSizeHint = 'large';
      else if (petCounts.medium > 0) guestSizeHint = 'medium';
      else if (petCounts.small > 0) guestSizeHint = 'small';
    }

    fetchSpots({
      regionCode: selectedRegionCode,
      category: selectedCategory,
      matchStatus: statusToUse,
      petIds: latestPetIds,
      guestSizeHint,
      keyword: keyword.trim()
    }, false);

    // 검색 조건을 URL 쿼리 파라미터에 반영 (새로고침/링크 공유 시 필터 유지)
    const newParams = {};
    if (keyword.trim()) newParams.keyword = keyword.trim();
    if (selectedRegionCode) newParams.region = selectedRegionCode;
    if (selectedCategory) newParams.category = selectedCategory;
    if (statusToUse) newParams.matchStatus = statusToUse;
    if (latestPetIds.length > 0) newParams.petIds = latestPetIds.join(',');
    setSearchParams(newParams, { replace: true });

    setActiveDropdown(null);
    setSelectedSpotId(null);
  };

  const handleMatchStatusButtonClick = (statusValue) => {
    setSelectedMatchStatus(statusValue);
    handleSearchButtonClick(statusValue);
  };

  const goToDetail = (spotId) => {
    const targetSpot = spots.find(s => String(s.id) === String(spotId));
    if (!targetSpot) return;

    const source = targetSpot.source || 'tourapi';
    const currentPetId = selectedPetIds[0] || '';
    const spotImage = targetSpot.image || targetSpot.imageUrl || '';

    // 비로그인 크기 힌트 계산
    let guestSizeHint = '';
    if (!currentPetId) {
      if (petCounts.large > 0) guestSizeHint = 'large';
      else if (petCounts.medium > 0) guestSizeHint = 'medium';
      else if (petCounts.small > 0) guestSizeHint = 'small';
    }

    const query = [`source=${source}`];
    if (currentPetId) query.push(`petId=${currentPetId}`);
    if (guestSizeHint) query.push(`guestSize=${guestSizeHint}`);

    navigate(`/detail/${spotId}?${query.join('&')}`, {
      state: {
        previewImage: spotImage,
        petId: currentPetId,
        guestSizeHint,
        selectedPetIds: selectedPetIds,
        lat: targetSpot.lat,
        lng: targetSpot.lng
      }
    });
  };

  const selectedSpotDetail = spots.find(s => String(s.id) === String(selectedSpotId));

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
      <div className="pawpass-search-container" style={{ padding: '40px 20px 60px 20px', minHeight: 'calc(100vh - 120px)', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      {/* 반응형 스타일 처리 (3-4 상세 패널 모바일 바텀시트 화) */}
      <style>{`
        @media (max-width: 768px) {
          .search-layout-wrapper {
            flex-direction: column !important;
          }
          .search-list-panel {
            width: 100% !important;
          }
          .search-detail-panel {
            position: fixed !important;
            bottom: 0;
            left: 0;
            width: 100%;
            margin: 0;
            border-radius: 20px 20px 0 0 !important;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15) !important;
            z-index: 1000;
            max-height: 40vh;
            overflow-y: auto;
            transform: translateY(100%);
            transition: transform 0.3s ease-out;
            padding: 20px !important;
          }
          .search-detail-panel.active {
            transform: translateY(0);
          }
        }
        @media (min-width: 769px) {
          .mobile-close-btn {
            display: none !important;
          }
        }
      `}</style>
      
      {/* 상단 모던 히어로 & 플로팅 검색창 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '44px 20px 40px 20px', 
        background: 'linear-gradient(135deg, rgba(201, 182, 215, 0.45) 0%, rgba(246, 202, 221, 0.35) 35%, rgba(197, 224, 251, 0.45) 70%, rgba(174, 210, 249, 0.4) 100%)',
        borderRadius: '32px',
        boxShadow: '0 12px 35px rgba(201, 182, 215, 0.22)',
        marginBottom: '32px',
        position: 'relative',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.7)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#5F50A9', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '5px 16px', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          Explore Destinations
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          우리 아이 맞춤 관광지 탐색
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 28px 0' }}>
          아이와 딱 맞는 관광지를 찾아보세요
        </p>

        {/* 플로팅 검색창 (모던 웹 Pill 스타일) */}
        <div 
          ref={dropdownRef} 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '50px', 
            padding: '6px 8px 6px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            boxShadow: '0 20px 40px -10px rgba(95, 80, 169, 0.16), 0 4px 12px rgba(0, 0, 0, 0.05)', 
            width: '100%', 
            maxWidth: '960px', 
            margin: '0 auto',
            color: '#333',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 20
          }}
        >
          <style>{`
            .search-segment-btn {
              padding: 6px 14px;
              border-radius: 40px;
              transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              cursor: pointer;
              text-align: left;
            }
            .search-segment-btn:hover {
              background-color: #f8fafc;
            }
          `}</style>

          {/* 1. 키워드 / 여행지 */}
          <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', padding: '6px 12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '2px' }}>
              여행지
            </span>
              <input 
                type="text" 
                value={keyword} 
                onChange={(e) => setKeyword(e.target.value)} 
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    if (e.nativeEvent.isComposing) return;
                    handleSearchButtonClick(); 
                  } 
                }} 
                placeholder={randomPlaceholder} 
                style={{ fontSize: '14px', fontWeight: '600', border: 'none', background: 'transparent', width: '100%', padding: '2px 0', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} 
              />
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

          {/* 2. 지역 */}
          <div 
            className="search-segment-btn" 
            style={{ flex: 1, position: 'relative' }} 
            onClick={() => setActiveDropdown(activeDropdown === 'region' ? null : 'region')}
          >
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '2px', display: 'block' }}>
              지역
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: selectedRegionCode ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedRegionName || '전체 지역'}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
            
            {activeDropdown === 'region' && (
              <div style={{ position: 'absolute', top: '56px', left: 0, width: '270px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', zIndex: 40, padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                {REGION_OPTIONS.map(r => {
                  const isSelected = (!selectedRegionCode && !r.code) || (selectedRegionCode === r.code);
                  return (
                    <div 
                      key={r.code || 'all'}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedRegionCode(r.code); 
                        setSelectedRegionName(r.code ? r.label : ''); 
                        setActiveDropdown(null);
                        fetchSpots({
                          regionCode: r.code,
                          category: selectedCategory,
                          matchStatus: selectedMatchStatus,
                          petIds: selectedPetIdsRef.current,
                          keyword: keyword.trim()
                        }, false);
                      }}
                      style={{ 
                        padding: '7px 4px', 
                        fontSize: '12.5px', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        textAlign: 'center', 
                        backgroundColor: isSelected ? '#5F50A9' : 'transparent', 
                        color: isSelected ? '#fff' : '#334155', 
                        fontWeight: isSelected ? 'bold' : '600',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {r.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

          {/* 3. 카테고리 */}
          <div 
            className="search-segment-btn" 
            style={{ flex: 1, position: 'relative' }} 
            onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
          >
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '2px', display: 'block' }}>
              테마
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: selectedCategory ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedCategoryName || '모든 테마'}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
            
            {activeDropdown === 'category' && (
              <div style={{ position: 'absolute', top: '56px', left: 0, width: '220px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', zIndex: 40, padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedCategory(''); 
                    setSelectedCategoryName(''); 
                    setActiveDropdown(null); 
                    fetchSpots({
                      regionCode: selectedRegionCode,
                      category: '',
                      matchStatus: selectedMatchStatus,
                      petIds: selectedPetIdsRef.current,
                      keyword: keyword.trim()
                    }, false);
                  }}
                  style={{ gridColumn: '1 / -1', padding: '7px 8px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', backgroundColor: selectedCategory === '' ? '#5F50A9' : '#f8fafc', color: selectedCategory === '' ? '#fff' : '#334155', fontWeight: selectedCategory === '' ? 'bold' : '600', transition: 'all 0.15s ease' }}
                >
                  전체 테마
                </div>
                {CATEGORY_OPTIONS.map(c => (
                  <div 
                    key={c.value}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedCategory(c.value); 
                      setSelectedCategoryName(c.label); 
                      setActiveDropdown(null); 
                      fetchSpots({
                        regionCode: selectedRegionCode,
                        category: c.value,
                        matchStatus: selectedMatchStatus,
                        petIds: selectedPetIdsRef.current,
                        keyword: keyword.trim()
                      }, false);
                    }}
                    style={{ padding: '7px 6px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', backgroundColor: selectedCategory === c.value ? '#5F50A9' : 'transparent', color: selectedCategory === c.value ? '#fff' : '#334155', fontWeight: selectedCategory === c.value ? 'bold' : '600', transition: 'all 0.15s ease' }}
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

          {/* 4. 반려동물 */}
          <div 
            className="search-segment-btn" 
            style={{ flex: 1.2, position: 'relative' }} 
            onClick={() => setActiveDropdown(activeDropdown === 'pet' ? null : 'pet')}
          >
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '2px', display: 'block' }}>
              반려동물
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: (selectedPetIds.length > 0 || petCounts.small > 0 || petCounts.medium > 0 || petCounts.large > 0) ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getPetFilterLabel()}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
            
            {activeDropdown === 'pet' && (
              <div style={{ position: 'absolute', top: '56px', right: 0, width: '260px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', zIndex: 40, padding: '12px' }}>
                <div onClick={(e) => { e.stopPropagation(); navigate('/profile'); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '10px', color: '#fff', backgroundColor: '#5F50A9', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px', fontSize: '12px', boxShadow: '0 3px 10px rgba(95, 80, 169, 0.2)' }}>
                  + 내 반려동물 프로필 등록
                </div>

                {myPets.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>등록된 우리 아이</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                      {myPets.map((pet) => (
                        <div 
                          key={pet.id} 
                          onClick={(e) => handlePetToggle(pet.id, e)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedPetIds.includes(pet.id) ? 'rgba(95, 80, 169, 0.1)' : '#f8fafc', border: selectedPetIds.includes(pet.id) ? '1px solid #5F50A9' : '1px solid #e2e8f0' }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px', color: selectedPetIds.includes(pet.id) ? '#5F50A9' : '#333' }}>{pet.name}</p>
                          </div>
                          <span style={{ color: '#5F50A9', fontWeight: 'bold', fontSize: '12px' }}>{selectedPetIds.includes(pet.id) ? '✓' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#333' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>다른 반려동물 친구</div>
                  {[["소형 (10kg 미만)", 'small'], ["중형 (10~25kg)", 'medium'], ["대형 (25kg 이상)", 'large']].map(([title, key]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button type="button" onClick={(e) => handleCountChange(key, -1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>-</button>
                        <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts[key]}</span>
                        <button type="button" onClick={(e) => handleCountChange(key, 1, e)} style={{ width: '24px', height: '24px', border: 'none', background: '#5F50A9', color: '#fff', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 검색 버튼 */}
          <button 
            type="button"
            onClick={() => handleSearchButtonClick()} 
            style={{ 
              width: '48px', 
              height: '48px', 
              minWidth: '48px',
              backgroundColor: '#5F50A9', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginLeft: '6px', 
              boxShadow: '0 4px 14px rgba(95, 80, 169, 0.35)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(95, 80, 169, 0.45)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(95, 80, 169, 0.35)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* 방문 판정 필터 버튼 바 & 뷰 모드 전환 토글 (카드형 / 지도형) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '28px', padding: '0 4px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginRight: '6px' }}>💡 방문 판정:</span>
          {MATCH_STATUS_BUTTONS.map((btn) => {
            const isActive = selectedMatchStatus === btn.value;
            return (
              <button
                key={btn.value || 'all'}
                type="button"
                onClick={() => handleMatchStatusButtonClick(btn.value)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '50px',
                  border: isActive ? 'none' : '1.5px solid #e2e8f0',
                  backgroundColor: isActive ? '#5F50A9' : '#fff',
                  color: isActive ? '#fff' : '#475569',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 4px 14px rgba(95, 80, 169, 0.35)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* 🔲 카드형 vs 🗺️ 지도형 뷰 모드 토글 */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: '#ffffff', 
          padding: '4px', 
          borderRadius: '50px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1.5px solid #e2e8f0'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('card')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: viewMode === 'card' ? '#5F50A9' : 'transparent',
              color: viewMode === 'card' ? '#ffffff' : '#64748b',
              fontWeight: viewMode === 'card' ? 'bold' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: viewMode === 'card' ? '0 2px 8px rgba(95, 80, 169, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🔲</span>
            <span>카드형</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: viewMode === 'map' ? '#5F50A9' : 'transparent',
              color: viewMode === 'map' ? '#ffffff' : '#64748b',
              fontWeight: viewMode === 'map' ? 'bold' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: viewMode === 'map' ? '0 2px 8px rgba(95, 80, 169, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🗺️</span>
            <span>지도형</span>
          </button>
        </div>
      </div>

      {/* 뷰 모드별 렌더링 (지도형 vs 카드형) */}
      {viewMode === 'map' ? (
        <div style={{ marginBottom: '24px' }}>
          <SearchMapView
            spots={spots}
            selectedSpotId={selectedSpotId}
            onSpotSelect={setSelectedSpotId}
            navigate={navigate}
            selectedPetIds={selectedPetIds}
            user={user}
          />

          <div 
            className="search-detail-drawer" 
            style={{ 
              position: 'fixed', top: 0, right: selectedSpotDetail ? 0 : '-620px', 
              width: '540px', maxWidth: '92vw', height: '100vh', 
              backgroundColor: '#ffffff', 
              borderRadius: '28px 0 0 28px',
              borderLeft: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '-15px 0 45px rgba(95, 80, 169, 0.15)', 
              zIndex: 100, 
              transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)', 
              boxSizing: 'border-box', 
              paddingTop: '60px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {selectedSpotDetail && (
              <DrawerContent 
                spot={selectedSpotDetail} 
                onClose={() => setSelectedSpotId(null)} 
                navigate={navigate} 
                user={user} 
                myPets={myPets} 
                selectedPetIds={selectedPetIds}
              />
            )}
          </div>
        </div>
      ) : isInitialLoading ? (
        <div className="search-layout-wrapper" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div className="search-list-panel" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            <style>{`
              @keyframes skeleton-pulse {
                0% { background-position: -400px 0; }
                100% { background-position: 400px 0; }
              }
              .skeleton-card { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
              .skeleton-block {
                background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
                background-size: 800px 100%;
                animation: skeleton-pulse 1.4s infinite linear;
              }
            `}</style>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ padding: '18px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="skeleton-block" style={{ width: '100%', height: '182px', borderRadius: '16px', marginBottom: '14px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '60%' }}>
                      <div className="skeleton-block" style={{ height: '22px', borderRadius: '4px', width: '100%' }} />
                      <div className="skeleton-block" style={{ height: '14px', borderRadius: '4px', width: '60%' }} />
                    </div>
                    <div className="skeleton-block" style={{ height: '22px', borderRadius: '4px', width: '25%' }} />
                  </div>
                  <div className="skeleton-block" style={{ height: '14px', borderRadius: '4px', width: '80%', marginTop: '14px' }} />
                  <div className="skeleton-block" style={{ height: '14px', borderRadius: '4px', width: '50%', marginTop: '8px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                  <div className="skeleton-block" style={{ height: '38px', borderRadius: '20px', flex: 1 }} />
                  <div className="skeleton-block" style={{ height: '38px', borderRadius: '20px', flex: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="search-layout-wrapper" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div className="search-list-panel" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {spots.length > 0 ? (
              spots.map((spot, idx) => {
                const isSelected = selectedSpotId === spot.id;
                const liked = isFavorite(spot.id);
                const spotImg = spot.image || spot.imageUrl || spot.first_image || '';

                // 카카오맵 및 네이버 지도 링크 생성
                const lat = Number(spot.lat);
                const lng = Number(spot.lng);
                const kakaoMapUrl = (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0)
                  ? `https://map.kakao.com/link/map/${encodeURIComponent(spot.name)},${lat},${lng}`
                  : `https://map.kakao.com/link/search/${encodeURIComponent(spot.address || spot.name)}`;

                const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(spot.name)}`;

                return (
                  <div 
                    key={`${spot.id}-${idx}`}
                    onClick={() => setSelectedSpotId(spot.id)}
                    onDoubleClick={() => {
                      const petIdsQuery = selectedPetIds?.length > 0 ? `&petIds=${selectedPetIds.join(',')}` : '';
                      navigate(`/detail/${spot.id}?source=${spot.source}${petIdsQuery}`);
                    }}
                    style={{ 
                      borderRadius: '24px', 
                      backgroundColor: '#fff', 
                      padding: '16px', 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      border: isSelected ? '2.5px solid #C9B6D7' : 'none',
                      boxShadow: isSelected ? '0 12px 35px rgba(201, 182, 215, 0.45)' : '0 10px 30px rgba(0, 0, 0, 0.06)'
                    }}
                    onMouseOver={(e) => { 
                      e.currentTarget.style.transform = 'translateY(-4px)'; 
                      e.currentTarget.style.boxShadow = isSelected ? '0 16px 40px rgba(201, 182, 215, 0.55)' : '0 14px 30px rgba(0, 0, 0, 0.12)'; 
                    }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.transform = 'none'; 
                      e.currentTarget.style.boxShadow = isSelected ? '0 12px 35px rgba(201, 182, 215, 0.45)' : '0 10px 30px rgba(0, 0, 0, 0.06)'; 
                    }}
                    title="클릭하여 요약 보기, 더블 클릭하여 상세 페이지로 이동"
                  >
                    <div>
                      <div style={{ position: 'relative', width: '100%', height: '208px', backgroundColor: spot.source === 'kcisa' ? '#C5E0FB' : '#fef3c7', borderRadius: '18px', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <LazyImage 
                          spot={spot} 
                          fallback={<div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '24px' }}>🖼️</span><span>대표 이미지 준비중</span></div>}
                        />

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(spot); }}
                          style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'transform 0.15s ease' }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          {liked ? '❤️' : '🤍'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>{spot.name}</h4>
                          <span style={{ fontSize: '10px', backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>
                            {spot.source === 'kcisa' ? '🏥 한국문화정보원' : '🏞️ 한국관광공사'}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', 
                          backgroundColor: spot.matchStatus === '가능' ? '#dcfce7' : spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부' ? '#fef9c3' : '#f1f5f9', 
                          color: spot.matchStatus === '가능' ? '#15803d' : spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부' ? '#a16207' : '#64748b' 
                        }}>
                          {spot.matchStatus}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>📍 {spot.address}</p>
                    </div>

                    {/* 💡 카드 하단 지도 연동 버튼 그룹 (파란색 카카오맵 + 초록색 네이버 지도) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '16px' }}>
                      <a 
                        href={kakaoMapUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          display: 'inline-block', padding: '6px 10px', 
                          backgroundColor: '#A2B9EE', color: '#1e3a8a', borderRadius: '20px', 
                          fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', 
                          boxSizing: 'border-box' 
                        }}
                      >
                        카카오맵 ↗
                      </a>
                      <a 
                        href={naverMapUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          display: 'inline-block', padding: '6px 10px', 
                          backgroundColor: '#CBF5AF', color: '#166534', borderRadius: '20px', 
                          fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', 
                          boxSizing: 'border-box' 
                        }}
                      >
                        네이버 지도 & 리뷰 ↗
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', padding: '40px' }}>검색 조건에 일치하는 장소가 없습니다.</p>
            )}

            {spots.length > 0 && (
              <div ref={observerTarget} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: '14px' }}>
                {isFetchingMore ? <span>⏳ 추가 장소를 불러오는 중...</span> : !hasMore ? <span>✨ 모든 장소를 다 확인하셨습니다!</span> : null}
              </div>
            )}
          </div>

          <div 
            className="search-detail-drawer" 
            style={{ 
              position: 'fixed', top: 0, right: selectedSpotDetail ? 0 : '-620px', 
              width: '540px', maxWidth: '92vw', height: '100vh', 
              backgroundColor: '#ffffff', 
              borderRadius: '28px 0 0 28px',
              borderLeft: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '-15px 0 45px rgba(95, 80, 169, 0.15)', 
              zIndex: 100, 
              transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)', 
              boxSizing: 'border-box', 
              paddingTop: '60px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {selectedSpotDetail && (
              <DrawerContent 
                spot={selectedSpotDetail} 
                onClose={() => setSelectedSpotId(null)} 
                navigate={navigate} 
                user={user} 
                myPets={myPets} 
                selectedPetIds={selectedPetIds}
              />
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default SearchPage;