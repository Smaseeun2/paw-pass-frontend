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

import { CATEGORY_OPTIONS, findCategory } from '../constants/categories';
import { REGION_OPTIONS, findRegion } from '../constants/regions';

const MATCH_STATUS_BUTTONS = [
  { label: '전체 판정', value: '' },
  { label: '🟢 방문 가능', value: '가능' },
  { label: '🟡 조건부 가능', value: '조건부' },
  { label: '🔴 방문 불가', value: '불가' }
];

function DrawerContent({ spot, onClose, navigate, user, myPets, selectedPetIds = [] }) {
  const { detail, isLoading, error } = useSpotDetail(spot.id, spot.source);
  const [showDrawerScrollTop, setShowDrawerScrollTop] = useState(false);
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
      <div 
        id="pawpass-drawer-scroll-container"
        onScroll={(e) => setShowDrawerScrollTop(e.currentTarget.scrollTop > 80)}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px 24px 30px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '18px',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        
        {/* 모바일 바텀시트 드래그 핸들 (모바일에서만 시각적 가이드, 웹에서는 완전 숨김) */}
        <div 
          className="drawer-drag-handle"
          onClick={onClose}
        />
        <style>{`
          .drawer-drag-handle {
            display: none !important;
          }
          @media (max-width: 768px) {
            .drawer-drag-handle {
              display: block !important;
              width: 40px !important;
              height: 4.5px !important;
              background-color: #cbd5e1 !important;
              border-radius: 10px !important;
              margin: 0 auto 6px auto !important;
              cursor: pointer !important;
              flex-shrink: 0 !important;
            }
          }
        `}</style>

        {/* 상단 액션 바 (카테고리 뱃지 & 원형 닫기 버튼) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '11.5px', 
            fontWeight: '800', 
            letterSpacing: '0.5px', 
            backgroundColor: '#F3EEFA', 
            color: '#5F50A9', 
            padding: '5px 14px', 
            borderRadius: '50px' 
          }}>
            {spot.source === 'kcisa' ? '🏥 한국문화정보원' : '🏞️ 한국관광공사'}
          </span>
          
          <button 
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="drawer-close-circle-btn"
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              color: '#334155', 
              cursor: 'pointer', 
              width: '36px', 
              height: '36px', 
              minWidth: '36px',
              minHeight: '36px',
              maxWidth: '36px',
              maxHeight: '36px',
              padding: 0,
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
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
          <LazyImage 
            spot={d.image ? d : spot} 
            categoryHint={selectedCategory}
            fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>🖼️ 대표 이미지 준비중</div>} 
          />
          
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

      {/* 🚀 상세패널 전용 TOP 버튼 (패널 내부 스크롤 시 부드럽게 노출) */}
      {showDrawerScrollTop && (
        <button
          type="button"
          onClick={() => {
            const container = document.getElementById('pawpass-drawer-scroll-container');
            if (container) {
              container.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="drawer-panel-top-btn"
          title="상세 패널 맨 위로 이동"
          aria-label="상세 패널 맨 위로 이동"
          style={{
            position: 'absolute',
            right: '20px',
            bottom: '88px',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1.5px solid rgba(95, 80, 169, 0.25)',
            color: '#5F50A9',
            boxShadow: '0 6px 18px rgba(95, 80, 169, 0.22), 0 2px 6px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            outline: 'none',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 22px rgba(95, 80, 169, 0.32)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(95, 80, 169, 0.22)';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5F50A9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
          <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '-0.3px', marginTop: '1px', color: '#5F50A9', lineHeight: 1 }}>
            TOP
          </span>
        </button>
      )}

      {/* 2. 패널 하단에 항상 고정된 플로팅 액션 바 (네비게이션 위에 항상 노출) */}
      <div 
        className="drawer-bottom-action-bar"
        style={{ 
          padding: '14px 24px 20px 24px', 
          backgroundColor: '#ffffff', 
          borderTop: '1px solid #f1f5f9', 
          boxShadow: '0 -8px 24px rgba(0,0,0,0.06)',
          zIndex: 20,
          flexShrink: 0
        }}
      >
        <button 
          type="button"
          onClick={() => {
            const petIdsQuery = selectedPetIds?.length > 0 ? `&petIds=${selectedPetIds.join(',')}` : '';
            navigate(`/detail/${spot.id}?source=${spot.source}${petIdsQuery}`);
          }}
          style={{ 
            width: '100%', 
            height: '50px',
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
          <span>장소 상세정보 보기</span>
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
  user,
  userLocation = null,
  loadMore,
  isFetchingMore = false,
  hasMore = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const mapObserverTarget = useRef(null);
  const [activeSpot, setActiveSpot] = useState(null);

  // 0. 좌측 리스트 무한 스크롤 연동
  useEffect(() => {
    const target = mapObserverTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore && hasMore && loadMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, isFetchingMore, hasMore]);

  // 1. 관광지 선택 토글 핸들러
  const handleSpotSelection = useCallback((spot) => {
    if (!spot) {
      onSpotSelect(null);
      return;
    }
    if (String(selectedSpotId) === String(spot.id)) {
      // 이미 선택된 관광지 클릭 시 해제
      onSpotSelect(null);
      return;
    }
    onSpotSelect(spot.id);
  }, [selectedSpotId, onSpotSelect]);

  // 2. 카카오맵 인스턴스 초기화 및 전체 마커 등록 (spots 변경 시에만 최초 1회 실행)
  useEffect(() => {
    let isMounted = true;
    loadKakaoMapSdk().then(() => {
      if (!isMounted || !mapContainerRef.current) return;
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      // 기존 오버레이 정리
      markersRef.current.forEach(item => {
        if (item?.overlay) item.overlay.setMap(null);
      });
      markersRef.current.clear();

      let map = mapInstanceRef.current;
      if (!map || !mapContainerRef.current.hasChildNodes()) {
        mapContainerRef.current.innerHTML = '';
        const options = {
          center: new kakao.maps.LatLng(35.9, 127.8),
          level: 13
        };
        map = new kakao.maps.Map(mapContainerRef.current, options);
        mapInstanceRef.current = map;

        // 줌 컨트롤러 추가
        const zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
      }

      setTimeout(() => {
        if (map) map.relayout();
      }, 60);

      if (!spots || spots.length === 0) {
        map.setCenter(new kakao.maps.LatLng(35.9, 127.8));
        map.setLevel(13);
        return;
      }

      // 개별 스팟에 대해 마커 생성 함수
      const createMarkerForSpot = (spot, position) => {
        if (!isMounted || !map) return;

        const isPossible = spot.matchStatus === '가능';
        const isConditional = spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부';
        const isRestricted = spot.matchStatus === '불가' || spot.matchStatus === '방문 불가';
        const pinBg = isPossible ? '#16A34A' : isConditional ? '#EAB308' : isRestricted ? '#DC2626' : '#5F50A9';
        const isSelected = String(selectedSpotId) === String(spot.id);

        // 마커 컨테이너 (핀 + 상단 명칭 말풍선 태그)
        const containerDiv = document.createElement('div');
        containerDiv.id = `marker-pin-${spot.id}`;
        containerDiv.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transform: translate3d(0, 0, 0);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: ${isSelected ? 50 : 10};
        `;

        // 1) 상단 장소명 말풍선 라벨
        const labelDiv = document.createElement('div');
        labelDiv.className = 'pawpass-pin-label';
        labelDiv.style.cssText = `
          background: rgba(15, 23, 42, 0.9);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
          margin-bottom: 4px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          display: ${isSelected ? 'block' : 'none'};
          pointer-events: none;
          letter-spacing: -0.2px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        labelDiv.innerText = spot.name;
        containerDiv.appendChild(labelDiv);

        // 2) 눈에 띄는 핀 본체 (물방울/핀 형태)
        const pinBody = document.createElement('div');
        pinBody.className = 'pawpass-pin-body';
        pinBody.style.cssText = `
          position: relative;
          width: ${isSelected ? '38px' : '32px'};
          height: ${isSelected ? '38px' : '32px'};
          background: ${pinBg};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        `;

        // 3) 핀 내부 발자국 아이콘
        const iconSpan = document.createElement('span');
        iconSpan.style.cssText = `
          transform: rotate(45deg);
          font-size: ${isSelected ? '16px' : '14px'};
          line-height: 1;
          display: inline-block;
          user-select: none;
        `;
        iconSpan.innerText = '🐾';
        pinBody.appendChild(iconSpan);
        containerDiv.appendChild(pinBody);

        containerDiv.title = `${spot.name} (${spot.matchStatus || '동반 확인'})`;

        // 마우스 호버 인터랙션
        containerDiv.onmouseenter = () => {
          if (String(selectedSpotId) !== String(spot.id)) {
            labelDiv.style.display = 'block';
            containerDiv.style.transform = 'translateY(-4px) scale(1.1)';
            containerDiv.style.zIndex = '40';
          }
        };
        containerDiv.onmouseleave = () => {
          if (String(selectedSpotId) !== String(spot.id)) {
            labelDiv.style.display = 'none';
            containerDiv.style.transform = 'none';
            containerDiv.style.zIndex = '10';
          }
        };

        // 클릭 이벤트
        containerDiv.onclick = (e) => {
          e.stopPropagation();
          handleSpotSelection(spot);
        };

        const customOverlay = new kakao.maps.CustomOverlay({
          position,
          content: containerDiv,
          clickable: true,
          xAnchor: 0.5,
          yAnchor: 1.0, // 핀 끝점이 정확한 좌표를 가리킴
          zIndex: isSelected ? 50 : 10
        });

        customOverlay.setMap(map);
        markersRef.current.set(String(spot.id), { 
          overlay: customOverlay, 
          element: containerDiv, 
          labelElement: labelDiv,
          bodyElement: pinBody,
          position, 
          spot 
        });
      };

      // 스팟 목록 순회 및 좌표 등록 (좌표 없는 경우 Geocoder 폴백)
      const geocoder = kakao.maps.services ? new kakao.maps.services.Geocoder() : null;

      spots.forEach((spot) => {
        const lat = Number(spot.lat);
        const lng = Number(spot.lng);
        const hasCoords = !isNaN(lat) && !isNaN(lng) && lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 132.0;

        if (hasCoords) {
          const position = new kakao.maps.LatLng(lat, lng);
          createMarkerForSpot(spot, position);
        } else if (spot.address && geocoder) {
          // 좌표가 없을 경우 주소 지오코딩으로 마커 자동 생성
          geocoder.addressSearch(spot.address, (result, status) => {
            if (!isMounted || !map) return;
            if (status === kakao.maps.services.Status.OK && result[0]) {
              const geoLat = Number(result[0].y);
              const geoLng = Number(result[0].x);
              spot.lat = geoLat;
              spot.lng = geoLng;
              const position = new kakao.maps.LatLng(geoLat, geoLng);
              createMarkerForSpot(spot, position);
              if (!selectedSpotId) {
                fitAllMarkersToBounds();
              }
            }
          });
        }
      });

      // 💡 지도에 표시된 모든 핀들이 한눈에 쏙 들어오도록 맞춤형 줌아웃 & 경계 자동 조정
      const fitAllMarkersToBounds = () => {
        if (!isMounted || !map || !window.kakao) return;
        const kakao = window.kakao;
        const validCoords = Array.from(markersRef.current.values()).map(m => m.position);
        if (validCoords.length === 0) {
          map.setCenter(new kakao.maps.LatLng(35.9, 127.8));
          map.setLevel(13);
        } else if (validCoords.length === 1) {
          map.setCenter(validCoords[0]);
          map.setLevel(5);
        } else {
          const fitBounds = new kakao.maps.LatLngBounds();
          validCoords.forEach(p => fitBounds.extend(p));
          // 상하좌우 60px 여백을 주어 외곽 핀이 잘리지 않고 깔끔하게 보이도록 자동 맞춤
          map.setBounds(fitBounds, 60, 60, 60, 60);
        }
      };

      // 전체 뷰 영역 자동 맞춤 (선택된 스팟이 없을 때 실행)
      if (!selectedSpotId) {
        setTimeout(fitAllMarkersToBounds, 120);
      }

    }).catch(err => console.error('지도 로드 오류:', err));

    return () => { 
      isMounted = false; 
      markersRef.current.forEach(item => {
        if (item?.overlay) item.overlay.setMap(null);
      });
      markersRef.current.clear();
    };
  }, [spots]);

  // 3. 선택된 관광지 중심 이동 및 마커 핀 하이라이트 동기화
  useEffect(() => {
    const map = mapInstanceRef.current;
    const kakao = window.kakao;

    if (selectedSpotId) {
      const found = spots.find(s => String(s.id) === String(selectedSpotId));
      setActiveSpot(found || null);

      if (map && kakao && found) {
        const lat = Number(found.lat);
        const lng = Number(found.lng);
        const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat >= 33.0 && lat <= 38.9 && lng >= 124.5 && lng <= 132.0;

        if (hasValidCoords) {
          const targetPos = new kakao.maps.LatLng(lat, lng);
          map.setLevel(4);
          map.setCenter(targetPos);
          map.panTo(targetPos);
        } else if (found.address && kakao.maps.services) {
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(found.address, (result, status) => {
            if (status === kakao.maps.services.Status.OK && result[0]) {
              const targetPos = new kakao.maps.LatLng(Number(result[0].y), Number(result[0].x));
              map.setLevel(4);
              map.setCenter(targetPos);
              map.panTo(targetPos);
            }
          });
        }
      }
    } else {
      setActiveSpot(null);
      // 선택 해제 시 전체 핀들이 다 보이도록 맞춤형 줌아웃 복귀
      if (map && kakao) {
        const validCoords = Array.from(markersRef.current.values()).map(m => m.position);
        if (validCoords.length === 0) {
          map.setCenter(new kakao.maps.LatLng(35.9, 127.8));
          map.setLevel(13);
        } else if (validCoords.length === 1) {
          map.setCenter(validCoords[0]);
          map.setLevel(5);
        } else {
          const fitBounds = new kakao.maps.LatLngBounds();
          validCoords.forEach(p => fitBounds.extend(p));
          map.setBounds(fitBounds, 60, 60, 60, 60);
        }
      }
    }

    // 마커 UI 하이라이트 동기화
    markersRef.current.forEach(({ element, labelElement, bodyElement, overlay }, id) => {
      const isSelected = String(id) === String(selectedSpotId);
      if (element) {
        element.style.zIndex = isSelected ? '50' : '10';
        element.style.transform = isSelected ? 'translateY(-6px) scale(1.2)' : 'none';
      }
      if (labelElement) {
        labelElement.style.display = isSelected ? 'block' : 'none';
      }
      if (bodyElement) {
        bodyElement.style.width = isSelected ? '38px' : '32px';
        bodyElement.style.height = isSelected ? '38px' : '32px';
        bodyElement.style.boxShadow = isSelected 
          ? '0 6px 18px rgba(95, 80, 169, 0.5), 0 0 0 3px rgba(95, 80, 169, 0.35)' 
          : '0 4px 12px rgba(0,0,0,0.35)';
      }
      if (overlay) {
        overlay.setZIndex(isSelected ? 50 : 10);
      }
    });
  }, [selectedSpotId, spots]);

  // 4. 내 현위치 마커 렌더링 및 중심 이동
  useEffect(() => {
    let isMounted = true;
    loadKakaoMapSdk().then(() => {
      if (!isMounted) return;
      const map = mapInstanceRef.current;
      const kakao = window.kakao;
      if (!map || !kakao || !kakao.maps) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }

      if (!userLocation || !userLocation.lat || !userLocation.lng) return;

      const userPos = new kakao.maps.LatLng(userLocation.lat, userLocation.lng);

      const userPinDiv = document.createElement('div');
      userPinDiv.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 60;
        pointer-events: none;
      `;
      userPinDiv.innerHTML = `
        <div style="
          background: #3B82F6;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 6px;
          white-space: nowrap;
          margin-bottom: 4px;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
          border: 1px solid rgba(255,255,255,0.6);
          letter-spacing: -0.2px;
        ">
          📍 내 현재 위치
        </div>
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          background: #3B82F6;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: #ffffff;
            border-radius: 50%;
          "></div>
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid #3B82F6;
            animation: user-loc-pulse 1.8s infinite ease-out;
          "></div>
        </div>
      `;

      const userOverlay = new kakao.maps.CustomOverlay({
        position: userPos,
        content: userPinDiv,
        xAnchor: 0.5,
        yAnchor: 1.0,
        zIndex: 60
      });

      userOverlay.setMap(map);
      userMarkerRef.current = userOverlay;

      // 관광지가 선택되어 있지 않은 경우 내 위치로 이동
      if (!selectedSpotId) {
        map.setLevel(6);
        map.setCenter(userPos);
        map.panTo(userPos);
      }
    }).catch(err => console.error('내 위치 마커 표시 오류:', err));

    return () => {
      isMounted = false;
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
    };
  }, [userLocation, selectedSpotId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div 
        className="search-map-view-container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '14px',
          height: '500px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
      <style>{`
        @keyframes user-loc-pulse {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
      {/* 1. 좌측 관광지 미니 리스트 패널 */}
      <div 
        className="search-map-places-list"
        style={{
          width: '290px',
          minWidth: '260px',
          height: '100%',
          overflowY: 'auto',
          borderRight: '1px solid #f1f5f9',
          backgroundColor: '#fafbfc',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ padding: '14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 5 }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'block', marginBottom: '4px' }}>
            📍 지도 표시 장소 ({spots.length}개)
          </span>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>
            장소 클릭 시 해당 위치로 이동하며,<br />
            목록을 아래로 스크롤하면 장소가 더 추가됩니다.
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
                  onClick={() => handleSpotSelection(spot)}
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

          {spots.length > 0 && (
            <div ref={mapObserverTarget} style={{ textAlign: 'center', padding: '14px 8px', color: '#94a3b8', fontSize: '11.5px', borderTop: '1px dashed #f1f5f9' }}>
              {isFetchingMore ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#5F50A9', fontWeight: 'bold' }}>
                  <span>⏳</span>
                  <span>추가 장소를 지도에 로딩 중...</span>
                </div>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={() => loadMore && loadMore()}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#F3EEFA',
                    color: '#5F50A9',
                    border: '1px solid rgba(95, 80, 169, 0.25)',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(95, 80, 169, 0.08)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#EAE1F7'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3EEFA'}
                >
                  ➕ 스크롤하여 더 많은 장소 불러오기
                </button>
              ) : (
                <span style={{ fontWeight: '600' }}>✨ 모든 장소를 지도에 표시했습니다!</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. 우측 메인 인터랙티브 지도 */}
      <div className="search-map-wrapper" style={{ flex: 1, height: '100%', position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* 지도 위 플로팅 장소 프리뷰 팝오버 카드 */}
        {activeSpot && (
          <div 
            className="search-map-preview-card"
            style={{
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

            <div style={{ marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  const petIdsQuery = selectedPetIds?.length > 0 ? `&petIds=${selectedPetIds.join(',')}` : '';
                  navigate(`/detail/${activeSpot.id}?source=${activeSpot.source}${petIdsQuery}`);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '50px',
                  backgroundColor: '#5F50A9',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(95, 80, 169, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <span>장소 상세정보 보기</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* 🗺️ 지도 핀 색상 체계 범례 (Legend) */}
    <div style={{
      padding: '12px 20px',
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>📍 핀 색상 가이드</span>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>| 판정 결과 및 상태별 마커 안내</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* 🟢 동반 가능 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#16A34A',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1.5px #16A34A',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>동반 가능</span>
        </div>

        {/* 🟡 조건부 가능 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#EAB308',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1.5px #EAB308',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>조건부 가능</span>
        </div>

        {/* 🔴 방문 불가 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#DC2626',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1.5px #DC2626',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>방문 불가</span>
        </div>

        {/* 🟣 기본 / 동반 확인 필요 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#5F50A9',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1.5px #5F50A9',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>동반 확인 필요</span>
        </div>

        {/* 🔵 내 현재 위치 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#3B82F6',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1.5px #3B82F6',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>내 현재 위치</span>
        </div>
      </div>
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
    let ids = null;
    if (searchParams.get('petIds') !== null) {
      const raw = searchParams.get('petIds');
      ids = raw ? raw.split(',').filter(Boolean).map(String) : [];
    } else if (queryState.selectedPetIds && Array.isArray(queryState.selectedPetIds) && queryState.selectedPetIds.length > 0) {
      ids = queryState.selectedPetIds.map(String);
    } else if (queryState.petId) {
      ids = [String(queryState.petId)];
    }

    if (!ids || ids.length === 0) {
      try {
        const guestPets = JSON.parse(localStorage.getItem('paw_pass_pets_guest') || '[]');
        const userPets = JSON.parse(localStorage.getItem('paw_pass_pets') || '[]');
        const userLocalPets = user ? JSON.parse(localStorage.getItem(`paw_pass_user_pets_${user.id}`) || '[]') : [];
        const allPets = [...userLocalPets, ...userPets, ...guestPets];
        if (allPets.length > 0) {
          const rep = allPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || allPets[0];
          if (rep && rep.id) ids = [String(rep.id)];
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
  const matchedCategory = findCategory(initRawCategory);

  const [selectedRegionCode, setSelectedRegionCode] = useState(matchedRegion.code || '');
  const [selectedRegionName, setSelectedRegionName] = useState(matchedRegion.code ? matchedRegion.label : '');

  const [selectedCategory, setSelectedCategory] = useState(matchedCategory.value || '');
  const [selectedCategoryName, setSelectedCategoryName] = useState(matchedCategory.label || '');

  const [petCounts, setPetCounts] = useState(queryState.petCounts || { small: 0, medium: 0, large: 0 });

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [isStickyCollapsed, setIsStickyCollapsed] = useState(false);

  const dropdownRef = useRef(null);
  const observerTarget = useRef(null);
  const mainSearchPillRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (mainSearchPillRef.current) {
        const rect = mainSearchPillRef.current.getBoundingClientRect();
        setShowStickySearch(rect.bottom < 50);
      } else {
        setShowStickySearch(window.scrollY > 280);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 선택된 펫 IDs를 ref에도 동기화 (클로저 캡처 문제 방지 → 검색 시 최신값 보장)
  const selectedPetIdsRef = useRef(selectedPetIds);
  useEffect(() => { selectedPetIdsRef.current = selectedPetIds; }, [selectedPetIds]);

  // 📍 GPS 기반 현재 내 위치 검색 & 지역 필터링 핸들러
  const handleCurrentLocationSearch = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('현재 브라우저에서 위치 정보를 지원하지 않습니다.');
      setShowLocationModal(false);
      return;
    }

    setIsLocating(true);
    toast.info('현재 위치를 확인 중입니다...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });

        try {
          await loadKakaoMapSdk();
          const kakao = window.kakao;
          if (kakao && kakao.maps && kakao.maps.services) {
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.coord2RegionCode(lng, lat, (result, status) => {
              setIsLocating(false);
              setShowLocationModal(false);
              setActiveDropdown(null);

              if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                const regionInfo = result.find(r => r.region_type === 'H') || result[0];
                const region1Name = regionInfo.region_1depth_name || '';
                const matched = findRegion(region1Name);

                setSelectedRegionCode(matched.code);
                setSelectedRegionName(`📍 ${matched.label}`);

                fetchSpots({
                  regionCode: matched.code,
                  category: selectedCategory,
                  matchStatus: selectedMatchStatus,
                  petIds: selectedPetIdsRef.current,
                  keyword: keyword.trim()
                }, false);

                toast.success(`현재 위치(${regionInfo.address_name || matched.fullName}) 기준으로 장소를 검색합니다.`);
              } else {
                toast.info('내 위치를 지도에 표시했습니다.');
              }
            });
          } else {
            setIsLocating(false);
            setShowLocationModal(false);
            setActiveDropdown(null);
          }
        } catch (err) {
          console.error('위치 지오코딩 실패:', err);
          setIsLocating(false);
          setShowLocationModal(false);
          setActiveDropdown(null);
        }
      },
      (err) => {
        setIsLocating(false);
        setShowLocationModal(false);
        console.warn('위치 권한 오류:', err);
        if (err.code === 1) {
          toast.error('위치 권한이 차단되었습니다. 브라우저 위치 권한을 허용해주세요.');
        } else {
          toast.error('위치 정보를 가져올 수 없습니다. 다시 시도해주세요.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [selectedCategory, selectedMatchStatus, keyword, fetchSpots]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // 드롭다운 메뉴나 트리거 요소 내부를 클릭한 경우 닫지 않음
      if (
        e.target && e.target.closest && (
          e.target.closest('.search-match-dropdown-menu') ||
          e.target.closest('.search-match-dropdown-trigger') ||
          e.target.closest('.modern-search-pill') ||
          e.target.closest('.sticky-floating-search-bar')
        )
      ) {
        return;
      }
      setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadUserPets = async () => {
      const token = localStorage.getItem('paw_pass_access_token');
      let loadedPets = [];
      if (user && token) {
        try {
          const res = await fetchPetsFromDB();
          const serverPets = Array.isArray(res) ? res : (res?.data || []);
          if (isMounted) setMyPets(serverPets);
          loadedPets = serverPets;
        } catch {
          if (isMounted) setMyPets([]);
        }
      } else {
        try {
          const guestPets = JSON.parse(localStorage.getItem('paw_pass_pets_guest') || '[]');
          if (isMounted) setMyPets(guestPets);
          loadedPets = guestPets;
        } catch {
          if (isMounted) setMyPets([]);
        }
      }

      // 비동기 펫 로드 완료 후, 기존 선택된 펫이 없을 때 대표 펫 자동 지정 및 즉시 맞춤 판정 검색
      if (loadedPets.length > 0 && selectedPetIdsRef.current.length === 0 && isMounted) {
        const rep = loadedPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || loadedPets[0];
        if (rep && rep.id) {
          const repIds = [rep.id];
          setSelectedPetIds(repIds);
          fetchSpots({
            regionCode: selectedRegionCode,
            category: selectedCategory,
            matchStatus: selectedMatchStatus,
            petIds: repIds,
            keyword: keyword.trim()
          }, false);
        }
      }
    };
    loadUserPets();
    return () => { isMounted = false; };
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
    const curKeyword = searchParams.get('keyword') !== null ? searchParams.get('keyword') : (currentState.keyword || '');
    const curMatchStatus = searchParams.get('matchStatus') !== null ? searchParams.get('matchStatus') : (currentState.matchStatus || '');
    const curRawRegion = searchParams.get('region') !== null ? searchParams.get('region') : (currentState.regionCode || currentState.region || '');
    const curRawCategory = searchParams.get('category') !== null ? searchParams.get('category') : (currentState.category || currentState.type || '');
    
    const curMatchedRegion = findRegion(curRawRegion);
    const curMatchedCategory = findCategory(curRawCategory);

    let curPetIds = null;
    if (searchParams.get('petIds') !== null) {
      const raw = searchParams.get('petIds');
      curPetIds = raw ? raw.split(',').filter(Boolean).map(String) : [];
    } else if (currentState.selectedPetIds && Array.isArray(currentState.selectedPetIds) && currentState.selectedPetIds.length > 0) {
      curPetIds = currentState.selectedPetIds.map(String);
    } else if (currentState.petId) {
      curPetIds = [String(currentState.petId)];
    } else if (selectedPetIdsRef.current.length > 0) {
      curPetIds = selectedPetIdsRef.current.map(String);
    } else {
      curPetIds = [];
    }

    const curGuestSize = currentState.guestSizeHint ||
      (curPetIds.length === 0
        ? (currentState.petCounts?.large > 0 ? 'large' : currentState.petCounts?.medium > 0 ? 'medium' : currentState.petCounts?.small > 0 ? 'small' : '')
        : '');

    // State 동기화
    setSelectedRegionCode(curMatchedRegion.code || '');
    setSelectedRegionName(curMatchedRegion.code ? curMatchedRegion.label : '');
    setSelectedCategory(curMatchedCategory.value || '');
    setSelectedCategoryName(curMatchedCategory.label || '');
    setKeyword(curKeyword);
    setSelectedMatchStatus(curMatchStatus);
    setSelectedPetIds(curPetIds);

    // 즉시 검색 실행 (진입 시 검색 버튼 누른 것과 동일하게 관광지 목록 로드)
    fetchSpots({
      regionCode: curMatchedRegion.code || curRawRegion,
      category: curMatchedCategory.value || curRawCategory,
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
    setPetCounts(prev => {
      const updated = { ...prev, [size]: Math.max(0, prev[size] + delta) };
      let guestSizeHint = '';
      if (selectedPetIdsRef.current.length === 0) {
        if (updated.large > 0) guestSizeHint = 'large';
        else if (updated.medium > 0) guestSizeHint = 'medium';
        else if (updated.small > 0) guestSizeHint = 'small';
      }
      fetchSpots({
        regionCode: selectedRegionCode,
        category: selectedCategory,
        matchStatus: selectedMatchStatus,
        petIds: selectedPetIdsRef.current,
        guestSizeHint,
        keyword: keyword.trim()
      }, false);
      return updated;
    });
  };

  const handlePetToggle = (petId, e) => {
    e.stopPropagation();
    const targetIdStr = String(petId);
    setSelectedPetIds(prev => {
      const prevStrs = prev.map(String);
      const exists = prevStrs.includes(targetIdStr);
      const next = exists 
        ? prevStrs.filter(id => id !== targetIdStr) 
        : [...prevStrs, targetIdStr];

      fetchSpots({
        regionCode: selectedRegionCode,
        category: selectedCategory,
        matchStatus: selectedMatchStatus,
        petIds: next,
        keyword: keyword.trim()
      }, false);

      const newParams = {};
      if (keyword.trim()) newParams.keyword = keyword.trim();
      if (selectedRegionCode) newParams.region = selectedRegionCode;
      if (selectedCategory) newParams.category = selectedCategory;
      if (selectedMatchStatus) newParams.matchStatus = selectedMatchStatus;
      if (next.length > 0) newParams.petIds = next.join(',');
      setSearchParams(newParams, { replace: true });

      return next;
    });
  };

  const getPetFilterLabel = () => {
    const parts = [];
    if (myPets.length > 0 && selectedPetIds.length > 0) {
      const selectedIdsStr = selectedPetIds.map(String);
      const selectedNames = myPets
        .filter(p => selectedIdsStr.includes(String(p.id)))
        .map(p => p.name);
      if (selectedNames.length > 0) parts.push(selectedNames.join(', '));
    }
    const extraParts = [];
    if (petCounts.small > 0) extraParts.push(`소형 ${petCounts.small}`);
    if (petCounts.medium > 0) extraParts.push(`중형 ${petCounts.medium}`);
    if (petCounts.large > 0) extraParts.push(`대형 ${petCounts.large}`);
    if (extraParts.length > 0) parts.push(extraParts.join('+'));

    return parts.length > 0 ? parts.join(' + ') : '반려동물 선택';
  };

  const handleRegionSelect = (regionCode, regionLabel) => {
    setSelectedRegionCode(regionCode);
    setSelectedRegionName(regionCode ? regionLabel : '');
    setActiveDropdown(null);

    const latestPetIds = selectedPetIdsRef.current;
    let guestSizeHint = '';
    if (latestPetIds.length === 0) {
      if (petCounts.large > 0) guestSizeHint = 'large';
      else if (petCounts.medium > 0) guestSizeHint = 'medium';
      else if (petCounts.small > 0) guestSizeHint = 'small';
    }

    fetchSpots({
      regionCode: regionCode,
      category: selectedCategory,
      matchStatus: selectedMatchStatus,
      petIds: latestPetIds,
      guestSizeHint,
      keyword: keyword.trim()
    }, false);

    const newParams = {};
    if (keyword.trim()) newParams.keyword = keyword.trim();
    if (regionCode) newParams.region = regionCode;
    if (selectedCategory) newParams.category = selectedCategory;
    if (selectedMatchStatus) newParams.matchStatus = selectedMatchStatus;
    if (latestPetIds.length > 0) newParams.petIds = latestPetIds.join(',');
    setSearchParams(newParams, { replace: true });
    setSelectedSpotId(null);
  };

  const handleCategorySelect = (categoryVal, categoryLabel) => {
    setSelectedCategory(categoryVal);
    setSelectedCategoryName(categoryLabel);
    setActiveDropdown(null);

    const latestPetIds = selectedPetIdsRef.current;
    let guestSizeHint = '';
    if (latestPetIds.length === 0) {
      if (petCounts.large > 0) guestSizeHint = 'large';
      else if (petCounts.medium > 0) guestSizeHint = 'medium';
      else if (petCounts.small > 0) guestSizeHint = 'small';
    }

    fetchSpots({
      regionCode: selectedRegionCode,
      category: categoryVal,
      matchStatus: selectedMatchStatus,
      petIds: latestPetIds,
      guestSizeHint,
      keyword: keyword.trim()
    }, false);

    const newParams = {};
    if (keyword.trim()) newParams.keyword = keyword.trim();
    if (selectedRegionCode) newParams.region = selectedRegionCode;
    if (categoryVal) newParams.category = categoryVal;
    if (selectedMatchStatus) newParams.matchStatus = selectedMatchStatus;
    if (latestPetIds.length > 0) newParams.petIds = latestPetIds.join(',');
    setSearchParams(newParams, { replace: true });
    setSelectedSpotId(null);
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

  // 📱 모바일 상세 바텀시트 열림 시 뒷배경(탐색 페이지) 스크롤 완전 잠금
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && selectedSpotDetail) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [selectedSpotDetail]);

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
      <div className="pawpass-search-container" style={{ padding: '36px 20px 60px 20px', minHeight: 'calc(100vh - 120px)', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
      <div 
        className="search-header-banner"
        style={{ 
          textAlign: 'center', 
          padding: '34px 20px 28px 20px', 
          background: 'linear-gradient(135deg, rgba(201, 182, 215, 0.45) 0%, rgba(246, 202, 221, 0.35) 35%, rgba(197, 224, 251, 0.45) 70%, rgba(174, 210, 249, 0.4) 100%)',
          borderRadius: '28px',
          boxShadow: '0 12px 35px rgba(201, 182, 215, 0.22)',
          marginBottom: '24px',
          position: 'relative',
          zIndex: activeDropdown ? 200 : 50,
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#5F50A9', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '5px 16px', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          Explore Destinations
        </span>
        <h1 
          className="search-header-title"
          style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px', wordBreak: 'keep-all', lineHeight: '1.3' }}
        >
          우리 아이 맞춤 관광지 탐색
        </h1>
        <p 
          className="search-header-desc"
          style={{ fontSize: '15px', color: '#64748b', margin: '0 0 28px 0', wordBreak: 'keep-all', lineHeight: '1.55' }}
        >
          아이와 딱 맞는 관광지를 찾아보세요
        </p>

        {/* 플로팅 검색창 (모던 웹 Pill 스타일) */}
        <div 
          ref={(node) => {
            dropdownRef.current = node;
            mainSearchPillRef.current = node;
          }} 
          className="modern-search-pill"
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
            zIndex: activeDropdown ? 300 : 60
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
            .search-dropdown-option {
              padding: 7px 4px;
              font-size: 12.5px;
              border-radius: 8px;
              cursor: pointer;
              text-align: center;
              transition: all 0.15s ease;
              user-select: none;
              background-color: transparent;
              color: #334155;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              width: 100%;
            }
            .search-dropdown-option:hover {
              background-color: #F3EEFA !important;
              color: #5F50A9 !important;
              font-weight: 700 !important;
            }
            .search-dropdown-option.selected {
              background-color: #5F50A9 !important;
              color: #ffffff !important;
              font-weight: bold !important;
            }
            .search-dropdown-option.selected:hover {
              background-color: #4f4291 !important;
              color: #ffffff !important;
            }
            .search-dropdown-all-btn {
              grid-column: 1 / -1;
              padding: 7px 8px;
              font-size: 12.5px;
              border-radius: 8px;
              cursor: pointer;
              text-align: center;
              transition: all 0.15s ease;
              user-select: none;
              background-color: #f8fafc;
              color: #334155;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              width: 100%;
            }
            .search-dropdown-all-btn:hover {
              background-color: #F3EEFA !important;
              color: #5F50A9 !important;
              font-weight: 700 !important;
            }
            .search-dropdown-all-btn.selected {
              background-color: #5F50A9 !important;
              color: #ffffff !important;
              font-weight: bold !important;
            }
            .search-dropdown-all-btn.selected:hover {
              background-color: #4f4291 !important;
              color: #ffffff !important;
            }
          `}</style>

          {/* 1. 키워드 / 여행지 */}
          <div 
            className="search-segment-btn"
            style={{ flex: 1.4, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', padding: '6px 12px' }}
          >
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
            style={{ flex: 1, position: 'relative', zIndex: activeDropdown === 'region' ? 100 : 1 }} 
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
              <div style={{ position: 'absolute', top: '56px', left: 0, width: '280px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 16px 36px rgba(0,0,0,0.12)', zIndex: 1000, padding: '12px', boxSizing: 'border-box' }}>
                {/* 📍 현재 내 위치 GPS 버튼 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(null);
                    setShowLocationModal(true);
                  }}
                  disabled={isLocating}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    marginBottom: '10px',
                    backgroundColor: '#F3EEFA',
                    color: '#5F50A9',
                    border: '1.5px solid rgba(95, 80, 169, 0.25)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: isLocating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(95, 80, 169, 0.1)',
                    transition: 'all 0.2s ease',
                    opacity: isLocating ? 0.7 : 1
                  }}
                  onMouseOver={(e) => { if (!isLocating) { e.currentTarget.style.backgroundColor = '#EAE1F7'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseOut={(e) => { if (!isLocating) { e.currentTarget.style.backgroundColor = '#F3EEFA'; e.currentTarget.style.transform = 'none'; } }}
                >
                  <span style={{ fontSize: '15px' }}>📍</span>
                  <span>{isLocating ? '현재 위치 확인 중...' : '현재 내 위치로 검색'}</span>
                </button>

                <div style={{ height: '1px', backgroundColor: '#f1f5f9', marginBottom: '10px' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {REGION_OPTIONS.map(r => {
                    const isSelected = (!selectedRegionCode && !r.code) || (selectedRegionCode === r.code);
                    return (
                      <div 
                        key={r.code || 'all'}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRegionSelect(r.code, r.label);
                        }}
                        className={`search-dropdown-option ${isSelected ? 'selected' : ''}`}
                      >
                        {r.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

          {/* 3. 카테고리 */}
          <div 
            className="search-segment-btn" 
            style={{ flex: 1, position: 'relative', zIndex: activeDropdown === 'category' ? 100 : 1 }} 
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
              <div style={{ position: 'absolute', top: '56px', left: 0, width: '220px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', zIndex: 1000, padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleCategorySelect('', '');
                  }}
                  className={`search-dropdown-all-btn ${selectedCategory === '' ? 'selected' : ''}`}
                >
                  전체 테마
                </div>
                {CATEGORY_OPTIONS.map(c => {
                  const isSelected = selectedCategory === c.value;
                  return (
                    <div 
                      key={c.value}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleCategorySelect(c.value, c.label);
                      }}
                      className={`search-dropdown-option ${isSelected ? 'selected' : ''}`}
                    >
                      {c.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

          {/* 4. 반려동물 */}
          <div 
            className="search-segment-btn" 
            style={{ flex: 1.2, position: 'relative', zIndex: activeDropdown === 'pet' ? 100 : 1 }} 
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
              <div style={{ position: 'absolute', top: '56px', right: 0, width: '260px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', zIndex: 100, padding: '12px' }}>
                <div onClick={(e) => { e.stopPropagation(); navigate('/profile'); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '10px', color: '#fff', backgroundColor: '#5F50A9', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px', fontSize: '12px', boxShadow: '0 3px 10px rgba(95, 80, 169, 0.2)' }}>
                  + 내 반려동물 프로필 등록
                </div>

                {myPets.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>등록된 우리 아이</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto' }}>
                        {myPets.map((pet) => {
                          const petImg = pet.profile_image || pet.imageUrl || pet.image || pet.photo;
                          const isSelected = selectedPetIds.map(String).includes(String(pet.id));
                          return (
                            <div 
                              key={pet.id} 
                              onClick={(e) => handlePetToggle(pet.id, e)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: isSelected ? 'rgba(95, 80, 169, 0.1)' : '#f8fafc', border: isSelected ? '1px solid #5F50A9' : '1px solid #e2e8f0' }}
                            >
                              {petImg ? (
                                <img 
                                  src={petImg} 
                                  alt={pet.name} 
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} 
                                />
                              ) : (
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#F3EEFA', color: '#5F50A9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                                  🐶
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px', color: isSelected ? '#5F50A9' : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {pet.name}
                                  {pet.breed && <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>({pet.breed})</span>}
                                </p>
                              </div>
                              <span style={{ color: '#5F50A9', fontWeight: 'bold', fontSize: '12px' }}>{isSelected ? '✓' : ''}</span>
                            </div>
                          );
                        })}
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
            className="search-submit-pill-btn"
            style={{ 
              height: '46px', 
              padding: '0 18px 0 16px',
              backgroundColor: '#5F50A9', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px',
              marginLeft: '6px', 
              boxShadow: '0 4px 14px rgba(95, 80, 169, 0.35)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(95, 80, 169, 0.45)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(95, 80, 169, 0.35)'; }}
          >
            <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
              관광지 찾기
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* 🚀 스크롤 다운 시 상단 고정 플로팅 검색바 & 하단 중앙 접기(▲) 탭 */}
      {showStickySearch && (
        !isStickyCollapsed ? (
          <div 
            className="sticky-search-wrapper"
            style={{
              position: 'fixed',
              top: '64px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '94%',
              maxWidth: '860px',
              zIndex: 990,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              animation: 'stickySearchSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <style>{`
              @keyframes stickySearchSlideDown {
                from { opacity: 0; transform: translate(-50%, -15px); }
                to { opacity: 1; transform: translate(-50%, 0); }
              }
            `}</style>
            <div 
              className="sticky-floating-search-bar"
              style={{
                pointerEvents: 'auto',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '50px',
                padding: '6px 10px 6px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 12px 35px rgba(95, 80, 169, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08)',
                border: '1.5px solid rgba(201, 182, 215, 0.85)',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '15px' }}>🔍</span>
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
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#1e293b',
                    background: 'transparent',
                    minWidth: '100px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {(selectedRegionName || selectedCategoryName) && (
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: '700',
                    color: '#5F50A9',
                    backgroundColor: '#F3EEFA',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedRegionName ? selectedRegionName.replace('📍 ', '') : '전체지역'} · {selectedCategoryName || '전체테마'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleSearchButtonClick()}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    backgroundColor: '#5F50A9',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(95, 80, 169, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  검색
                </button>
              </div>
            </div>

            {/* 🔽 검색창 바로 아래 중앙에 위치한 모던 슬라이드업 접기 핸들 탭 */}
            <button
              type="button"
              className="sticky-search-collapse-tab"
              onClick={() => setIsStickyCollapsed(true)}
              title="검색창 위로 올리기 (접기)"
              aria-label="검색창 접기"
              style={{
                pointerEvents: 'auto',
                marginTop: '-1px',
                padding: '3px 22px',
                backgroundColor: '#ffffff',
                color: '#64748b',
                border: '1.5px solid rgba(201, 182, 215, 0.85)',
                borderTop: 'none',
                borderRadius: '0 0 14px 14px',
                boxShadow: '0 4px 12px rgba(95, 80, 169, 0.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '800',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.backgroundColor = '#F3EEFA'; 
                e.currentTarget.style.color = '#5F50A9';
                e.currentTarget.style.transform = 'translateY(1px)'; 
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.backgroundColor = '#ffffff'; 
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.transform = 'none'; 
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
        ) : (
          /* 접힌 상태일 때 상단 중앙에 위치한 모던 슬라이드다운 펼치기 탭 버튼 */
          <div 
            className="sticky-search-expand-wrapper"
            style={{
              position: 'fixed',
              top: '64px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 990,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <button
              type="button"
              className="sticky-search-expand-tab"
              onClick={() => setIsStickyCollapsed(false)}
              title="검색창 다시 펼치기"
              style={{
                backgroundColor: '#ffffff',
                color: '#5F50A9',
                border: '1.5px solid rgba(201, 182, 215, 0.85)',
                borderRadius: '0 0 16px 16px',
                padding: '5px 18px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(95, 80, 169, 0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                animation: 'stickySearchSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.backgroundColor = '#F3EEFA'; 
                e.currentTarget.style.transform = 'translateY(2px)'; 
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.backgroundColor = '#ffffff'; 
                e.currentTarget.style.transform = 'none'; 
              }}
            >
              <span>🔍 관광지 검색창 열기</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        )
      )}

      {/* 방문 판정 드롭다운 & 뷰 모드 전환 토글 (카드형 / 지도형) - 동일 선상 1줄 배치 */}
      <div 
        className="search-filter-controls-row" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'nowrap', 
          gap: '8px', 
          marginBottom: '16px', 
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 50
        }}
      >
        {/* 💡 방문 판정 드롭다운 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            className="search-match-dropdown-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === 'matchStatus' ? null : 'matchStatus');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '50px',
              border: selectedMatchStatus ? '1.5px solid #5F50A9' : '1.5px solid #e2e8f0',
              backgroundColor: selectedMatchStatus ? '#F3EEFA' : '#ffffff',
              color: selectedMatchStatus ? '#5F50A9' : '#334155',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: selectedMatchStatus ? '0 3px 12px rgba(95, 80, 169, 0.18)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ 
              color: selectedMatchStatus === '가능' ? '#16a34a' : selectedMatchStatus === '조건부' ? '#d97706' : selectedMatchStatus === '불가' ? '#dc2626' : '#5F50A9',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {selectedMatchStatus ? (
                MATCH_STATUS_BUTTONS.find(b => b.value === selectedMatchStatus)?.label || selectedMatchStatus
              ) : (
                '💡 방문 판정: 전체'
              )}
            </span>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={selectedMatchStatus ? '#5F50A9' : '#64748b'} 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ 
                transform: activeDropdown === 'matchStatus' ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.2s ease',
                marginLeft: '2px'
              }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {activeDropdown === 'matchStatus' && (
            <div 
              className="search-match-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: '160px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '6px',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e2e8f0',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                animation: 'matchDropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <style>{`
                @keyframes matchDropdownFadeIn {
                  from { opacity: 0; transform: translateY(-6px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              {MATCH_STATUS_BUTTONS.map((btn) => {
                const isSelected = selectedMatchStatus === btn.value;
                return (
                  <button
                    type="button"
                    key={btn.value || 'all'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMatchStatusButtonClick(btn.value);
                      setActiveDropdown(null);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isSelected ? '800' : '600',
                      backgroundColor: isSelected ? '#F3EEFA' : 'transparent',
                      color: isSelected ? '#5F50A9' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span>{btn.label}</span>
                    {isSelected && <span style={{ color: '#5F50A9', fontWeight: '900', fontSize: '13px' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 🔲 카드형 vs 🗺️ 지도형 뷰 모드 토글 */}
        <div 
          className="search-view-mode-toggle"
          style={{ 
            display: 'flex', 
            backgroundColor: '#ffffff', 
            padding: '4px', 
            borderRadius: '50px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1.5px solid #e2e8f0',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('card')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: viewMode === 'card' ? '#5F50A9' : 'transparent',
              color: viewMode === 'card' ? '#ffffff' : '#64748b',
              fontWeight: viewMode === 'card' ? 'bold' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: viewMode === 'card' ? '0 2px 8px rgba(95, 80, 169, 0.3)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
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
              padding: '6px 14px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: viewMode === 'map' ? '#5F50A9' : 'transparent',
              color: viewMode === 'map' ? '#ffffff' : '#64748b',
              fontWeight: viewMode === 'map' ? 'bold' : '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: viewMode === 'map' ? '0 2px 8px rgba(95, 80, 169, 0.3)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
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
            userLocation={userLocation}
            loadMore={loadMore}
            isFetchingMore={isFetchingMore}
            hasMore={hasMore}
          />
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
            {(() => {
              const displaySpots = (spots.length >= 3)
                ? spots.slice(0, Math.floor(spots.length / 3) * 3)
                : spots;

              return displaySpots.length > 0 ? (
                displaySpots.map((spot, idx) => {
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
                    onClick={() => setSelectedSpotId(prev => (String(prev) === String(spot.id) ? null : spot.id))}
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
                          categoryHint={selectedCategory}
                          fallback={<div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '24px' }}>🖼️</span><span>대표 이미지 준비중</span></div>}
                        />

                        <button
                          type="button"
                          className="spot-card-favorite-btn"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(spot); }}
                          title={liked ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          aria-label={liked ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                          style={{ 
                            position: 'absolute', 
                            top: '12px', 
                            right: '12px', 
                            backgroundColor: 'rgba(255, 255, 255, 0.92)', 
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            border: 'none', 
                            borderRadius: '50%', 
                            width: '36px', 
                            height: '36px', 
                            minWidth: '36px',
                            minHeight: '36px',
                            maxWidth: '36px',
                            maxHeight: '36px',
                            padding: 0,
                            cursor: 'pointer', 
                            zIndex: 10, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '18px',
                            lineHeight: '1',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)', 
                            transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          {liked ? '❤️' : '🤍'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>{spot.name}</h4>
                          <span style={{ fontSize: '12px', backgroundColor: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                            {spot.source === 'kcisa' ? '🏥 한국문화정보원' : '🏞️ 한국관광공사'}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '12.5px', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', 
                          backgroundColor: spot.matchStatus === '가능' ? '#dcfce7' : spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부' ? '#fef9c3' : '#f1f5f9', 
                          color: spot.matchStatus === '가능' ? '#15803d' : spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부' ? '#a16207' : '#64748b' 
                        }}>
                          {spot.matchStatus}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#6b7280' }}>📍 {spot.address}</p>
                    </div>

                    {/* 💡 카드 하단 지도 연동 버튼 그룹 (파란색 카카오맵 + 초록색 네이버 지도) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '16px' }}>
                      <a 
                        href={kakaoMapUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          display: 'inline-block', padding: '6px 12px', 
                          backgroundColor: '#A2B9EE', color: '#1e3a8a', borderRadius: '20px', 
                          fontSize: '12.5px', fontWeight: '800', textDecoration: 'none', 
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
                          display: 'inline-block', padding: '6px 12px', 
                          backgroundColor: '#bbf7d0', color: '#15803d', borderRadius: '20px', 
                          fontSize: '12.5px', fontWeight: '800', textDecoration: 'none', 
                          boxSizing: 'border-box' 
                        }}
                      >
                        네이버 지도 ↗
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', padding: '40px' }}>검색 조건에 일치하는 장소가 없습니다.</p>
            );
          })()}

            {spots.length > 0 && (
              <div ref={observerTarget} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: '14px' }}>
                {isFetchingMore ? <span>⏳ 추가 장소를 불러오는 중...</span> : !hasMore ? <span>✨ 모든 장소를 다 확인하셨습니다!</span> : null}
              </div>
            )}
          </div>

          {/* 📱 모바일 바텀시트 / 데스크톱 드로어 백드롭 오버레이 */}
          {selectedSpotDetail && (
            <div 
              className="search-detail-backdrop"
              onClick={() => setSelectedSpotId(null)}
              onTouchMove={(e) => {
                if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                  e.preventDefault();
                }
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.05)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                touchAction: 'none',
                zIndex: 99,
                animation: 'fadeInSearchBackdrop 0.15s ease'
              }}
            >
              <style>{`
                @keyframes fadeInSearchBackdrop {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                .drawer-drag-handle {
                  display: none;
                }
                @media (max-width: 768px) {
                  .drawer-drag-handle {
                    display: block;
                    width: 40px;
                    height: 4.5px;
                    background-color: #cbd5e1;
                    border-radius: 10px;
                    margin: 0 auto 6px auto;
                    cursor: pointer;
                    flex-shrink: 0;
                  }
                }
              `}</style>
            </div>
          )}

          <div 
            className={`search-detail-drawer ${selectedSpotDetail ? 'open' : ''}`}
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

      {/* 📍 사이트 중앙 위치 권한 요청 팝업 모달 */}
      {showLocationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => !isLocating && setShowLocationModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              maxWidth: '420px',
              width: '100%',
              padding: '34px 26px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              animation: 'locModalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes locModalFadeIn {
                from { opacity: 0; transform: scale(0.92) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
              @keyframes pulseIconRing {
                0% { transform: scale(0.95); opacity: 0.8; }
                50% { transform: scale(1.15); opacity: 0.3; }
                100% { transform: scale(0.95); opacity: 0.8; }
              }
            `}</style>

            {/* 상단 핀 아이콘 일러스트 */}
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 18px auto',
              borderRadius: '50%',
              backgroundColor: '#F3EEFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 8px 20px rgba(95, 80, 169, 0.15)'
            }}>
              <span style={{ fontSize: '32px' }}>📍</span>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px dashed #5F50A9',
                animation: 'pulseIconRing 3s infinite ease-in-out'
              }} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0', letterSpacing: '-0.3px' }}>
              현재 위치로 관광지 탐색
            </h3>

            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.65', margin: '0 0 26px 0', wordBreak: 'keep-all' }}>
              현재 계신 위치를 기반으로 <strong style={{ color: '#5F50A9' }}>가장 가까운 반려동물 동반 장소</strong>를 추천해 드립니다.<br/>
              위치 정보 제공을 허용하시겠습니까?
            </p>

            {/* 액션 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                disabled={isLocating}
                style={{
                  flex: 1,
                  padding: '13px 0',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isLocating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => !isLocating && (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                onMouseOut={(e) => !isLocating && (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCurrentLocationSearch}
                disabled={isLocating}
                style={{
                  flex: 1.5,
                  padding: '13px 0',
                  backgroundColor: '#5F50A9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isLocating ? 'wait' : 'pointer',
                  boxShadow: '0 6px 18px rgba(95, 80, 169, 0.35)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => !isLocating && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 22px rgba(95, 80, 169, 0.45)')}
                onMouseOut={(e) => !isLocating && (e.currentTarget.style.transform = 'none', e.currentTarget.style.boxShadow = '0 6px 18px rgba(95, 80, 169, 0.35)')}
              >
                {isLocating ? (
                  <>
                    <span>⏳</span>
                    <span>위치 확인 중...</span>
                  </>
                ) : (
                  <>
                    <span>위치 공유 및 검색</span>
                    <span>🐾</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default SearchPage;