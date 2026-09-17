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

function DrawerContent({ spot, onClose, navigate, user, myPets }) {
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
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
        <p>정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
        <p>{error}</p>
        <button onClick={onClose} style={{ marginTop: '12px', padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>닫기</button>
      </div>
    );
  }

  const d = detail || {};
  const cond = d.petCondition || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
        <button 
          onClick={onClose}
          style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18"></path>
            <path d="M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div style={{ width: '100%', height: '240px', backgroundColor: '#e5e7eb', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', overflow: 'hidden', position: 'relative' }}>
        <LazyImage spot={d.image ? d : spot} fallback={<span>🖼️ 대표 이미지 준비중</span>} />
      </div>

      <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0', fontSize: '24px', color: '#1f2937', lineHeight: '1.3', wordBreak: 'keep-all' }}>
          {d.title || d.name || spot.title || spot.name || '이름 없음'}
        </h3>
      </div>
      
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#334155' }}>반려동물 출입 판정:</span>
          <span style={{ 
            fontSize: '13px', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', 
            backgroundColor: spot.matchStatus === '가능' ? '#dcfce7' : spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부' ? '#fef9c3' : '#f1f5f9', 
            color: spot.matchStatus === '가능' ? '#15803d' : spot.matchStatus === '조건부 가능' || spot.matchStatus === '조건부' ? '#a16207' : '#64748b' 
          }}>
            {spot.matchStatus}
          </span>
        </div>
        {spot.matchReason && (
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
            <strong style={{ color: '#475569' }}>판정 사유:</strong> {spot.matchReason}
          </p>
        )}
        {(!user || myPets.length === 0) && spot.matchStatus === '동반 확인 필요' && (
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', cursor: 'pointer' }} onClick={() => navigate(user ? '/profile' : '/login')}>
            <p style={{ margin: 0, fontSize: '13px', color: '#1d4ed8', lineHeight: '1.5' }}>
              💡 <strong>로그인하고 펫 프로필을 등록해보세요!</strong><br/>AI가 내 반려동물을 분석해 맞춤 출입 여부를 알려드립니다. 🚀
            </p>
          </div>
        )}
      </div>

      <div style={{ lineHeight: '1.7', backgroundColor: '#fff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px', fontSize: '14px' }}>
        <p style={{ margin: '0 0 8px 0' }}><strong>📍 주소:</strong> {d.address || spot.address}</p>
        <p style={{ margin: '0 0 8px 0' }}><strong>📞 전화번호:</strong> {d.phone || spot.tel || '정보 미제공'}</p>
        <p style={{ margin: '0 0 8px 0' }}><strong>⏰ 운영시간:</strong> {d.hours || '현장 또는 전화 문의'}</p>
        {cond.parkingAvailable && <p style={{ margin: '0 0 8px 0' }}><strong>🚗 주차 정보:</strong> {cond.parkingAvailable}</p>}
      </div>

      {cond.petPolicy && (
        <div style={{ backgroundColor: '#fff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px', fontSize: '14px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>🐶 상세 동반 규정</h4>
          {cond.petPolicy && <p style={{ margin: '0 0 8px 0' }}><strong>규정:</strong> {cond.petPolicy}</p>}
          {cond.petRestriction && <p style={{ margin: '0 0 8px 0' }}><strong>제한사항:</strong> {cond.petRestriction}</p>}
          {cond.needItem && <p style={{ margin: '0 0 8px 0' }}><strong>필요 용품:</strong> {cond.needItem}</p>}
        </div>
      )}

      {/* 지도 표시 영역 */}
      <div style={{ backgroundColor: '#fff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>📍 위치 보기</h4>
        <div 
          ref={mapRef} 
          style={{ width: '100%', height: '200px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}
        />
      </div>

      <button 
        type="button"
        onClick={() => navigate(`/detail/${spot.id}?source=${spot.source}`)}
        style={{ width: '100%', padding: '16px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'background-color 0.2s' }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#4b5563'}
      >
        전체 상세 페이지 보기 →
      </button>
    </div>
  );
}

function SearchPage() {
  const { spots, isInitialLoading, isFetchingMore, hasMore, fetchSpots, loadMore } = useTouristSpots();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const initPetIds = queryState.selectedPetIds
    || (queryState.petId ? [queryState.petId] : null)
    || (searchParams.get('petIds') ? searchParams.get('petIds').split(',') : []);

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
        setMyPets([]);
      }
    };
    loadUserPets();
  }, [user]);

  useEffect(() => {
    // 초기 검색 시 guestSizeHint 계산 (홈에서 넘어온 크기 힌트 OR 직접 카운터)
    const initGuestSize = queryState.guestSizeHint ||
      (initPetIds.length === 0
        ? (queryState.petCounts?.large > 0 ? 'large' : queryState.petCounts?.medium > 0 ? 'medium' : queryState.petCounts?.small > 0 ? 'small' : '')
        : '');

    fetchSpots({
      regionCode: matchedRegion.code || initRawRegion,
      category: matchedCategory ? matchedCategory.value : initRawCategory,
      matchStatus: initMatchStatus,
      petIds: initPetIds,
      guestSizeHint: initGuestSize,
      keyword: initKeyword
    }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (user && myPets.length > 0 && selectedPetIds.length > 0) {
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
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto' }}>
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
      
      <div style={{ position: 'sticky', top: '0', zIndex: 30, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '16px 0 4px 0', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>반려동물 동반 장소 탐색</h2>
        <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '32px', margin: '0 0 5px 0', color: '#333' }}>Paw Pass</h1>
        <p style={{ textAlign: 'center', color: '#777', margin: '0 0 20px 0' }}>장소 탐색</p>

        {/* 검색 필터 바 */}
        <div 
          ref={dropdownRef} 
          style={{ display: 'flex', gap: '12px', backgroundColor: '#eef0f2', padding: '16px', borderRadius: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #d1d5db', position: 'relative' }}
        >
          <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
            <input 
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (e.target.value.trim().length > 0) {
                  // 키워드 검색 시 전국/전체 카테고리로 강제 전환 (백엔드 스펙)
                  setSelectedRegionCode('');
                  setSelectedRegionName('');
                  setSelectedCategory('');
                  setSelectedCategoryName('');
                }
              }}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') {
                  if (e.nativeEvent.isComposing) return; // 한글 조합 중 엔터 무시
                  handleSearchButtonClick(); 
                }
              }}
              placeholder="장소명이나 키워드 검색"
              style={{ width: '100%', padding: '12px 15px 12px 35px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#333', boxSizing: 'border-box' }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>🔍</span>
          </div>

          {/* 지역 드롭다운 */}
          <div style={{ position: 'relative', flex: 1, minWidth: '130px' }}>
            <button 
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'region' ? null : 'region')}
              style={{ width: '100%', height: '45px', padding: '0 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', color: '#374151', boxSizing: 'border-box' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {selectedRegionName || '전체 지역'}</span>
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>▾</span>
            </button>

            {activeDropdown === 'region' && (
              <div style={{ position: 'absolute', top: '105%', left: 0, width: '170px', maxHeight: '250px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 30, padding: '6px' }}>
                {REGION_OPTIONS.map((reg) => (
                  <div 
                    key={reg.code || 'all'} 
                    onClick={() => { 
                      setSelectedRegionCode(reg.code); 
                      setSelectedRegionName(reg.code ? reg.label : ''); 
                      setKeyword(''); // 지역 선택 시 키워드 초기화 (전국 검색 방지)
                      setActiveDropdown(null); 
                    }} 
                    style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', color: '#374151', backgroundColor: selectedRegionCode === reg.code ? '#eff6ff' : 'transparent', fontWeight: selectedRegionCode === reg.code ? 'bold' : 'normal', fontSize: '13px' }}
                  >
                    {reg.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 카테고리 드롭다운 */}
          <div style={{ position: 'relative', flex: 1, minWidth: '130px' }}>
            <button 
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
              style={{ width: '100%', height: '45px', padding: '0 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', color: '#374151', boxSizing: 'border-box' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏷️ {selectedCategoryName || '전체 카테고리'}</span>
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>▾</span>
            </button>

            {activeDropdown === 'category' && (
              <div style={{ position: 'absolute', top: '105%', left: 0, width: '180px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 30, padding: '6px' }}>
                <div 
                  onClick={() => { setSelectedCategory(''); setSelectedCategoryName(''); setKeyword(''); setActiveDropdown(null); }} 
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', color: '#374151', backgroundColor: !selectedCategory ? '#eff6ff' : 'transparent', fontWeight: !selectedCategory ? 'bold' : 'normal', fontSize: '13px' }}
                >
                  전체 카테고리
                </div>
                {CATEGORY_OPTIONS.map((t) => (
                  <div 
                    key={t.value} 
                    onClick={() => { 
                      setSelectedCategory(t.value); 
                      setSelectedCategoryName(t.label); 
                      setKeyword(''); // 카테고리 선택 시 키워드 초기화
                      setActiveDropdown(null); 
                    }} 
                    style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', color: '#374151', backgroundColor: selectedCategory === t.value ? '#eff6ff' : 'transparent', fontWeight: selectedCategory === t.value ? 'bold' : 'normal', fontSize: '13px' }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 반려동물 선택 드롭다운 (- 0 + 컨트롤러 포함) */}
          <div style={{ position: 'relative', flex: 1.5, minWidth: '180px' }}>
            <button 
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'pet' ? null : 'pet')}
              style={{ width: '100%', height: '45px', padding: '0 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#374151', boxSizing: 'border-box' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🐾 {getPetFilterLabel()}</span>
              <span style={{ marginLeft: '4px', fontSize: '12px' }}>▾</span>
            </button>

            {activeDropdown === 'pet' && (
              <div style={{ position: 'absolute', top: '105%', left: 0, width: '280px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 8px 18px rgba(0,0,0,0.15)', zIndex: 30, padding: '14px' }}>
                <div 
                  onClick={() => navigate('/profile')} 
                  style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#2563eb', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '12px', fontSize: '13px' }}
                >
                  + 반려동물 프로필 관리 / 등록
                </div>

                {user && myPets.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>등록된 우리 아이</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {myPets.map((pet) => {
                        const isSelected = selectedPetIds.includes(pet.id);
                        return (
                          <div 
                            key={pet.id}
                            onClick={(e) => handlePetToggle(pet.id, e)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: isSelected ? '#eff6ff' : '#f8fafc', border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0' }}
                          >
                            <span style={{ fontSize: '18px' }}>🐶</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{pet.name}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{pet.breed} · {pet.weight}kg</p>
                            </div>
                            <span style={{ fontSize: '15px', color: isSelected ? '#2563eb' : '#cbd5e1', fontWeight: 'bold' }}>{isSelected ? '✓' : '○'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 체중별 마릿수 조절 컨트롤러 (- 0 +) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {[['소형 (10kg 미만)', 'small'], ['중형 (10~25kg)', 'medium'], ['대형 (25kg 이상)', 'large']].map(([title, key]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button type="button" onClick={(e) => handleCountChange(key, -1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts[key]}</span>
                        <button type="button" onClick={(e) => handleCountChange(key, 1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <button 
              type="button"
              onClick={() => handleSearchButtonClick()}
              style={{ padding: '0 24px', height: '45px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              검색
            </button>
          </div>
        </div>

        {/* 방문 판정 필터 버튼 바 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>💡 방문 판정:</span>
          {MATCH_STATUS_BUTTONS.map((btn) => {
            const isActive = selectedMatchStatus === btn.value;
            return (
              <button
                key={btn.value || 'all'}
                type="button"
                onClick={() => handleMatchStatusButtonClick(btn.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: isActive ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: isActive ? '#eff6ff' : '#fff',
                  color: isActive ? '#1d4ed8' : '#334155',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 스켈레톤 로딩 UI */}
      {isInitialLoading ? (
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
              <div key={i} className="skeleton-card" style={{ padding: '16px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="skeleton-block" style={{ width: '100%', height: '140px', borderRadius: '8px', marginBottom: '12px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '60%' }}>
                      <div className="skeleton-block" style={{ height: '20px', borderRadius: '4px', width: '100%' }} />
                      <div className="skeleton-block" style={{ height: '14px', borderRadius: '4px', width: '60%' }} />
                    </div>
                    <div className="skeleton-block" style={{ height: '20px', borderRadius: '4px', width: '25%' }} />
                  </div>
                  <div className="skeleton-block" style={{ height: '14px', borderRadius: '4px', width: '80%', marginTop: '12px' }} />
                  <div className="skeleton-block" style={{ height: '14px', borderRadius: '4px', width: '50%', marginTop: '6px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <div className="skeleton-block" style={{ height: '36px', borderRadius: '8px', flex: 1 }} />
                  <div className="skeleton-block" style={{ height: '36px', borderRadius: '8px', flex: 1 }} />
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
                    onDoubleClick={() => navigate(`/detail/${spot.id}?source=${spot.source}`)}
                    style={{ border: isSelected ? '2px solid #4b5563' : '1px solid #d1d5db', borderRadius: '12px', backgroundColor: isSelected ? '#f3f4f6' : '#fff', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    title="클릭하여 요약 보기, 더블 클릭하여 상세 페이지로 이동"
                  >
                    <div>
                      <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <LazyImage 
                          spot={spot} 
                          fallback={<div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '24px' }}>🖼️</span><span>대표 이미지 준비중</span></div>}
                        />

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(spot); }}
                          style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 2 }}
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
                          backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', 
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
                          backgroundColor: '#10b981', color: '#fff', borderRadius: '6px', 
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
              width: '560px', maxWidth: '90vw', height: '100vh', 
              backgroundColor: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)', 
              zIndex: 50, transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              boxSizing: 'border-box', paddingTop: '60px'
            }}
          >
            <div style={{ height: '100%', overflowY: 'auto', padding: '24px 24px 30px 24px', boxSizing: 'border-box' }}>
              {selectedSpotDetail && (
                <DrawerContent 
                  spot={selectedSpotDetail} 
                  onClose={() => setSelectedSpotId(null)} 
                  navigate={navigate} 
                  user={user} 
                  myPets={myPets} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;