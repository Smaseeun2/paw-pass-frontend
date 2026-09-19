// src/pages/HomePage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavoritesContext as useFavorites } from '../contexts/FavoritesContext';
import { fetchPetsFromDB, fetchExploreSpots } from '../services/api';
import LazyImage from '../components/LazyImage';
import { loadKakaoMapSdk } from '../utils/kakaoMapLoader';
import { toast } from '../utils/toast';
import { REGION_OPTIONS, findRegion } from '../constants/regions';

const CATEGORY_OPTIONS = [
  { label: '자연/풍경', value: 'NATURE' },
  { label: '카페', value: 'CAFE' },
  { label: '음식점/식당', value: 'FOOD' },
  { label: '문화/예술', value: 'CULTURE' },
  { label: '숙박시설', value: 'STAY' },
  { label: '동물병원', value: 'HOSPITAL' }
];

function HomePage() {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [user] = useState(() => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [recommendedSpots, setRecommendedSpots] = useState([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(false);

  const [myPets, setMyPets] = useState([]);
  const [selectedPetIds, setSelectedPetIds] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [selectedRegionCode, setSelectedRegionCode] = useState('');
  const [selectedRegionName, setSelectedRegionName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTypeName, setSelectedTypeName] = useState('');

  const [petCounts, setPetCounts] = useState({
    small: 0,
    medium: 0,
    large: 0
  });

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const dropdownRef = useRef(null);

  // 📍 GPS 기반 현재 내 위치 검색 & 탐색 페이지 이동 핸들러
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

                toast.success(`현재 위치(${regionInfo.address_name || matched.fullName}) 기준으로 관광지를 탐색합니다.`);

                navigate('/search', {
                  state: {
                    regionCode: matched.code,
                    region: matched.label,
                    category: selectedType,
                    selectedPetIds,
                    keyword: keyword.trim()
                  }
                });
              } else {
                toast.info('내 위치를 확인했습니다.');
                navigate('/search', {
                  state: {
                    category: selectedType,
                    selectedPetIds,
                    keyword: keyword.trim()
                  }
                });
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
  }, [selectedType, selectedPetIds, keyword, navigate]);

  // 1. 로그인 유저 반려동물 로드 및 대표 펫 자동 지정 (폴백 처리 포함)
  useEffect(() => {
    const loadUserPets = async () => {
      const token = localStorage.getItem('paw_pass_access_token');
      if (user && token) {
        try {
          const res = await fetchPetsFromDB();
          const serverPets = Array.isArray(res) ? res : (res?.data || []);
          setMyPets(serverPets);

          if (serverPets.length > 0) {
            const representativePet = serverPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || serverPets[0];
            if (representativePet) {
              setSelectedPetIds(prev => (prev.length === 0 ? [representativePet.id] : prev));
            }
          }
        } catch {
          setMyPets([]);
        }
      } else {
        try {
          const guestPets = JSON.parse(localStorage.getItem('paw_pass_pets_guest') || '[]');
          setMyPets(guestPets);
          
          if (guestPets.length > 0) {
            const representativePet = guestPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || guestPets[0];
            if (representativePet) {
              setSelectedPetIds(prev => (prev.length === 0 ? [representativePet.id] : prev));
            }
          }
        } catch {
          setMyPets([]);
          setSelectedPetIds([]);
        }
      }
    };
    loadUserPets();
  }, [user]);

  // 2. 실시간 추천 관광지 6개 로드 (대표 펫 ID가 있으면 펫 맞춤 파라미터 함께 전달)
  useEffect(() => {
    const loadTopSpots = async () => {
      setIsLoadingSpots(true);
      try {
        const data = await fetchExploreSpots({ page: 1, petIds: selectedPetIds });
        const rawSpots = Array.isArray(data) ? data : (data?.data || []);

        const mapped = rawSpots.slice(0, 6).map((spot) => {
          const spotId = String(spot.id || spot.content_id);
          const rawMatch = spot.match_status || spot.matchStatus;
          // 로그아웃 상태이거나 펫 정보가 없으면 '동반 확인 필요'로 표기
          const assignedMatchStatus = (selectedPetIds.length > 0) && rawMatch ? rawMatch : '동반 확인 필요';

          return {
            id: spotId,
            name: spot.title || spot.name || '장소명 없음',
            address: spot.addr || spot.address || '주소 정보 없음',
            imageUrl: spot.image || spot.imageUrl || spot.first_image || '',
            imageAttribution: spot.image_attribution || '',
            tel: spot.tel || '정보 미제공',
            source: spot.source || 'tourapi',
            matchStatus: assignedMatchStatus,
            matchReason: spot.match_reason || '',
            matchRawText: spot.match_raw_text || ''
          };
        });

        setRecommendedSpots(mapped);
      } catch (err) {
        console.warn('홈 추천 장소 로드 실패:', err);
        setRecommendedSpots([]);
      } finally {
        setIsLoadingSpots(false);
      }
    };

    loadTopSpots();
  }, [selectedPetIds]);

  const [randomPlaceholder, setRandomPlaceholder] = useState('예: 남이섬');

  // API로부터 로드된 실제 관광지 이름들을 기반으로 랜덤 플레이스홀더 순환
  useEffect(() => {
    const defaultList = ['남이섬', '해운대해수욕장', '순천만국가정원', '아침고요수목원', '스타필드 하남', '안면도자연휴양림', '경포대'];
    let spotNames = defaultList;

    if (recommendedSpots && recommendedSpots.length > 0) {
      const apiNames = recommendedSpots
        .map(s => s.name)
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
  }, [recommendedSpots]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const targetRegionObj = REGION_OPTIONS.find(r => r.code === selectedRegionCode);
    const regionName = targetRegionObj && targetRegionObj.code !== '' ? targetRegionObj.label : '';

    // 비로그인 크기 힌트 계산 (로그인 유저는 petId 기반이므로 힌트 불필요)
    let guestSizeHint = '';
    if (selectedPetIds.length === 0) {
      if (petCounts.large > 0) guestSizeHint = 'large';
      else if (petCounts.medium > 0) guestSizeHint = 'medium';
      else if (petCounts.small > 0) guestSizeHint = 'small';
    }

    navigate('/search', { 
      state: { 
        keyword: keyword.trim(), 
        regionCode: selectedRegionCode,
        region: regionName, 
        type: selectedType, 
        selectedPetIds,
        petCounts,
        guestSizeHint
      } 
    });
  };

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

  const scrollToSearchBar = useCallback(() => {
    if (dropdownRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const rect = dropdownRef.current.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      if (isMobile) {
        // 📱 모바일: 기존 모바일 스크롤 유지
        const targetY = Math.max(0, rect.top + currentScroll - 70);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      } else {
        // 🖥️ 웹/데스크톱: 검색창이 화면 세로 정중앙에 정확히 오도록 계산
        const elementTop = rect.top + currentScroll;
        const elementHeight = rect.height;
        const viewportHeight = window.innerHeight;
        const targetY = Math.max(0, elementTop - (viewportHeight / 2) + (elementHeight / 2));

        const startY = currentScroll;
        const diff = targetY - startY;
        if (Math.abs(diff) < 2) return;

        // 부드럽고 여유로운 속도 (680ms 감속 애니메이션)
        let startTime = null;
        const duration = 680;

        const easeInOutCubic = (t) => {
          return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };

        const step = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const progress = Math.min((currentTime - startTime) / duration, 1);
          const ease = easeInOutCubic(progress);

          window.scrollTo(0, startY + diff * ease);

          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };

        window.requestAnimationFrame(step);
      }
    }
  }, []);

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
      <div style={{ paddingBottom: '24px', position: 'relative', zIndex: 1 }}>
      
      {/* 1. 히어로 섹션 & 떠 있는 검색창 */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        <div 
          className="hero-banner-container"
          style={{ 
            width: '100%', 
            height: '380px', 
            borderRadius: '32px', 
            backgroundImage: 'linear-gradient(to bottom, rgba(30, 20, 60, 0.32) 0%, rgba(0, 0, 0, 0.1) 40%, rgba(15, 23, 42, 0.35) 100%), url(/hero-banner.jpg)', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center 30%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            paddingBottom: '68px',
            color: '#fff',
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '700', 
            letterSpacing: '1.1px', 
            marginBottom: '12px', 
            color: '#fff', 
            backgroundColor: 'rgba(95, 80, 169, 0.88)', 
            padding: '4px 15px', 
            borderRadius: '50px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(6px)',
            textTransform: 'uppercase',
            lineHeight: '1.4'
          }}>
            All you need is PawPass
          </span>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '900', 
            lineHeight: '1.3', 
            letterSpacing: '-0.7px', 
            margin: '0 0 10px 0', 
            textAlign: 'center', 
            wordBreak: 'keep-all', 
            textShadow: '0 3px 18px rgba(0, 0, 0, 0.7), 0 1px 4px rgba(0, 0, 0, 0.5)' 
          }}>
            우리 아이와 함께 여행을 떠나볼까요?
          </h1>
          <p style={{ 
            fontSize: '17px', 
            fontWeight: '600', 
            lineHeight: '1.5', 
            letterSpacing: '-0.25px', 
            margin: 0, 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.95)', 
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.7), 0 1px 4px rgba(0, 0, 0, 0.5)' 
          }}>
            우리 아이와 딱 맞는 여행지를 찾아보세요
          </p>
        
          {/* 플로팅 검색창 (모던 웹 Pill 스타일 - 비례 확대) */}
          <div 
            ref={dropdownRef}
            className="modern-search-pill"
            onClick={scrollToSearchBar}
            style={{ 
              position: 'absolute',
              bottom: '-52px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#ffffff',
              borderRadius: '60px',
              padding: '10px 12px 10px 26px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 25px 50px -12px rgba(95, 80, 169, 0.22), 0 4px 20px rgba(0, 0, 0, 0.06)',
              width: '94%',
              maxWidth: '1000px',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              color: '#333',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            <style>{`
              .search-segment-btn {
                padding: 8px 18px;
                border-radius: 45px;
                transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                text-align: left;
              }
              .search-segment-btn:hover {
                background-color: #f8fafc;
              }
            `}</style>

            {/* 1. 키워드 / 여행지 */}
            <div 
              className="search-segment-btn"
              onClick={(e) => { e.stopPropagation(); scrollToSearchBar(); }}
              style={{ flex: 1.4, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6px 14px' }}
            >
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                여행지
              </span>
              <input 
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onClick={(e) => { e.stopPropagation(); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder={randomPlaceholder}
                style={{ 
                  fontSize: '15.5px', 
                  fontWeight: '600', 
                  border: 'none', 
                  background: 'transparent', 
                  width: '100%', 
                  padding: '3px 0', 
                  color: '#1e293b', 
                  outline: 'none', 
                  boxSizing: 'border-box' 
                }}
              />
            </div>

            <div style={{ width: '1px', height: '38px', backgroundColor: '#e2e8f0', margin: '0 6px' }}></div>

            {/* 2. 지역 */}
            <div 
              className="search-segment-btn" 
              style={{ flex: 1, position: 'relative' }} 
              onClick={(e) => { e.stopPropagation(); scrollToSearchBar(); setActiveDropdown(activeDropdown === 'region' ? null : 'region'); }}
            >
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
                지역
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '15.5px', fontWeight: '600', color: selectedRegionCode ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedRegionName || '전체 지역'}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
              
              {activeDropdown === 'region' && (
                <div style={{ position: 'absolute', top: '64px', left: 0, width: '280px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 16px 36px rgba(0,0,0,0.14)', zIndex: 10, padding: '10px', boxSizing: 'border-box' }}>
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
                      padding: '10px 12px',
                      marginBottom: '8px',
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
                      boxShadow: '0 2px 6px rgba(95, 80, 169, 0.08)',
                      transition: 'all 0.2s ease',
                      opacity: isLocating ? 0.7 : 1
                    }}
                    onMouseOver={(e) => { if (!isLocating) { e.currentTarget.style.backgroundColor = '#EAE1F7'; } }}
                    onMouseOut={(e) => { if (!isLocating) { e.currentTarget.style.backgroundColor = '#F3EEFA'; } }}
                  >
                    <span style={{ fontSize: '15px' }}>📍</span>
                    <span>{isLocating ? '현재 위치 확인 중...' : '현재 내 위치로 검색'}</span>
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', marginBottom: '8px' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {REGION_OPTIONS.map(r => (
                      <div 
                        key={r.code || 'all'}
                        onClick={(e) => { e.stopPropagation(); setSelectedRegionCode(r.code); setSelectedRegionName(r.code ? r.label : ''); setActiveDropdown(null); }}
                        style={{ padding: '8px 4px', fontSize: '13px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', backgroundColor: selectedRegionCode === r.code ? '#5F50A9' : 'transparent', color: selectedRegionCode === r.code ? '#fff' : '#334155', fontWeight: selectedRegionCode === r.code ? 'bold' : '600', transition: 'all 0.15s' }}
                      >
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ width: '1px', height: '38px', backgroundColor: '#e2e8f0', margin: '0 6px' }}></div>

            {/* 3. 테마 / 카테고리 */}
            <div 
              className="search-segment-btn" 
              style={{ flex: 1, position: 'relative' }} 
              onClick={(e) => { e.stopPropagation(); scrollToSearchBar(); setActiveDropdown(activeDropdown === 'type' ? null : 'type'); }}
            >
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
                테마
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '15.5px', fontWeight: '600', color: selectedType ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedTypeName || '모든 테마'}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
              
              {activeDropdown === 'type' && (
                <div style={{ position: 'absolute', top: '64px', left: 0, width: '230px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 16px 36px rgba(0,0,0,0.14)', zIndex: 10, padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); setSelectedType(''); setSelectedTypeName(''); setActiveDropdown(null); }}
                    style={{ gridColumn: '1 / -1', padding: '8px 10px', fontSize: '13px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', backgroundColor: selectedType === '' ? '#5F50A9' : '#f8fafc', color: selectedType === '' ? '#fff' : '#334155', fontWeight: selectedType === '' ? 'bold' : '600' }}
                  >전체 테마</div>
                  {CATEGORY_OPTIONS.map(c => (
                    <div 
                      key={c.value}
                      onClick={(e) => { e.stopPropagation(); setSelectedType(c.value); setSelectedTypeName(c.label); setActiveDropdown(null); }}
                      style={{ padding: '8px 6px', fontSize: '13px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', backgroundColor: selectedType === c.value ? '#5F50A9' : 'transparent', color: selectedType === c.value ? '#fff' : '#334155', fontWeight: selectedType === c.value ? 'bold' : '600' }}
                    >
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: '1px', height: '38px', backgroundColor: '#e2e8f0', margin: '0 6px' }}></div>

            {/* 4. 반려동물 */}
            <div 
              className="search-segment-btn" 
              style={{ flex: 1.25, position: 'relative' }} 
              onClick={(e) => { e.stopPropagation(); scrollToSearchBar(); setActiveDropdown(activeDropdown === 'pet' ? null : 'pet'); }}
            >
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
                반려동물
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '15.5px', fontWeight: '600', color: (selectedPetIds.length > 0 || petCounts.small > 0 || petCounts.medium > 0 || petCounts.large > 0) ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getPetFilterLabel()}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
              
              {activeDropdown === 'pet' && (
                <div style={{ position: 'absolute', top: '64px', right: 0, width: '270px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 16px 36px rgba(0,0,0,0.14)', zIndex: 10, padding: '14px' }}>
                  <div onClick={() => navigate('/profile')} style={{ padding: '9px', cursor: 'pointer', borderRadius: '12px', color: '#fff', backgroundColor: '#5F50A9', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px', fontSize: '13px', boxShadow: '0 3px 10px rgba(95,80,169,0.2)' }}>
                    + 내 반려동물 프로필 등록
                  </div>

                  {myPets.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>등록된 우리 아이</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto' }}>
                        {myPets.map((pet) => {
                          const petImg = pet.profile_image || pet.imageUrl || pet.image || pet.photo;
                          return (
                            <div 
                              key={pet.id} 
                              onClick={(e) => handlePetToggle(pet.id, e)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '10px', cursor: 'pointer', backgroundColor: selectedPetIds.includes(pet.id) ? 'rgba(95, 80, 169, 0.1)' : '#f8fafc', border: selectedPetIds.includes(pet.id) ? '1px solid #5F50A9' : '1px solid #e2e8f0' }}
                            >
                              {petImg ? (
                                <img 
                                  src={petImg} 
                                  alt={pet.name} 
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} 
                                />
                              ) : (
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F3EEFA', color: '#5F50A9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                                  🐶
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12.5px', color: selectedPetIds.includes(pet.id) ? '#5F50A9' : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {pet.name}
                                  {pet.breed && <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>({pet.breed})</span>}
                                </p>
                              </div>
                              <span style={{ color: '#5F50A9', fontWeight: 'bold', fontSize: '12.5px' }}>{selectedPetIds.includes(pet.id) ? '✓' : ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#333' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#64748b' }}>다른 반려동물 친구</div>
                    {[["소형 (10kg 미만)", 'small'], ["중형 (10~25kg)", 'medium'], ["대형 (25kg 이상)", 'large']].map(([title, key]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={(e) => handleCountChange(key, -1, e)} style={{ width: '25px', height: '25px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>-</button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts[key]}</span>
                          <button onClick={(e) => handleCountChange(key, 1, e)} style={{ width: '25px', height: '25px', border: 'none', background: '#5F50A9', color: '#fff', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 검색 버튼 */}
            <button 
              onClick={handleSearch} 
              className="home-search-submit-btn"
              style={{ 
                height: '52px', 
                padding: '0 20px 0 18px',
                backgroundColor: '#5F50A9', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                marginLeft: '8px', 
                boxShadow: '0 4px 16px rgba(95, 80, 169, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(95, 80, 169, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(95, 80, 169, 0.4)';
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
                관광지 찾기
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 테마별 카테고리 (6개 일렬 아치형) */}
      <div style={{ maxWidth: '1200px', margin: '80px auto 40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', justifyContent: 'center' }}>
          <div style={{ width: '20px', height: '2px', backgroundColor: '#5F50A9', marginRight: '10px' }}></div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#5F50A9', margin: 0, letterSpacing: '-0.3px' }}>테마별 카테고리</h2>
          <div style={{ width: '20px', height: '2px', backgroundColor: '#5F50A9', marginLeft: '10px' }}></div>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', textAlign: 'center' }}>원하는 테마를 선택해 맞춤 여행지를 바로 확인해보세요</p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '16px' 
        }}>
          {[
            { name: '자연/풍경', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80', val: 'NATURE' },
            { name: '카페', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80', val: 'CAFE' },
            { name: '음식점/식당', img: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=400&q=80', val: 'FOOD' },
            { name: '문화/예술', img: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=400&q=80', val: 'CULTURE' },
            { name: '숙박시설', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80', val: 'STAY' },
            { name: '동물병원', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80', val: 'HOSPITAL' }
          ].map(cat => (
            <div 
              key={cat.name} 
              onClick={() => {
                navigate('/search', { 
                  state: { 
                    type: cat.val, 
                    category: cat.val, 
                    selectedPetIds 
                  } 
                });
              }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              title={`${cat.name} 카테고리로 바로 탐색`}
            >
              <div style={{ 
                width: '100%', 
                aspectRatio: '0.85', 
                borderRadius: '999px 999px 14px 14px', 
                backgroundImage: `url(${cat.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                marginBottom: '10px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.07)',
                border: '2px solid rgba(255,255,255,0.8)'
              }}></div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 지역별 카테고리 캡슐 버튼 바 (1줄 균등 정렬) */}
      <div style={{ maxWidth: '1200px', margin: '30px auto 50px auto', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '28px', 
          padding: '22px 24px', 
          border: '1px solid rgba(226, 232, 240, 0.8)', 
          boxShadow: '0 10px 30px rgba(95, 80, 169, 0.05)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '16px' }}>📍</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
              지역별 인기 여행지 둘러보기
            </span>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <div 
              className="region-scroll-container"
              style={{ 
                display: 'flex', 
                gap: '6px', 
                width: '100%',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {REGION_OPTIONS.map(r => {
                const displayLabel = r.code === '' ? '전체' : r.label;
                return (
                  <button
                    key={r.code || 'all'}
                    type="button"
                    onClick={() => {
                      navigate('/search', {
                        state: {
                          regionCode: r.code,
                          region: r.code ? r.label : '',
                          selectedPetIds
                        }
                      });
                    }}
                    style={{
                      flex: '1 1 0px',
                      minWidth: '52px',
                      padding: '9px 4px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      borderRadius: '50px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#334155',
                      fontSize: displayLabel.length > 3 ? '12px' : '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#5F50A9';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#5F50A9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(95, 80, 169, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.color = '#334155';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                    }}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>

            {/* 웹(PC)에서는 숨기고 모바일에서만 노출되는 넘김 인디케이터 */}
            <div 
              className="home-region-scroll-fade"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '45px',
                background: 'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 1) 100%)',
                pointerEvents: 'none',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '6px',
                borderRadius: '0 20px 20px 0'
              }}
            >
              <span style={{ fontSize: '14px', color: '#5F50A9', fontWeight: '900', opacity: 0.75 }}>›</span>
            </div>
          </div>
        </div>
      </div>

{/* 4. 실시간 추천 관광지 카드 (레퍼런스 스타일) */}
      <div style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
        <div className="home-recommend-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 2px 0', lineHeight: 1.25 }}>
                <div>대한민국 관광지</div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '900', 
                  background: 'linear-gradient(135deg, #5F50A9 0%, #E26895 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginTop: '2px'
                }}>
                  with PawPass
                </div>
              </h2>
            </div>
            
            <button 
              onClick={() => navigate('/search')} 
              className="home-more-spots-btn"
              style={{ 
                background: '#5F50A9', 
                border: 'none', 
                color: '#fff', 
                padding: '9px 18px', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: '13px', 
                boxShadow: '0 4px 14px rgba(95, 80, 169, 0.25)', 
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                marginTop: '4px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#4c3d8f';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#5F50A9';
                e.currentTarget.style.transform = 'none';
              }}
            >
              더 보기 →
            </button>
          </div>

          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '6px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            PawPass에 등록된 대한민국 관광지를 소개합니다.
          </p>
        </div>

        {isLoadingSpots ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>추천 여행지를 불러오는 중입니다...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {recommendedSpots.map((spot, idx) => {
              const liked = isFavorite(spot.id);
              return (
                <div 
                  key={`${spot.id}-${idx}`}
                  onClick={() => {
                    const petIdsQuery = selectedPetIds?.length > 0 ? `&petIds=${selectedPetIds.join(',')}` : '';
                    navigate(`/detail/${spot.id}?source=${spot.source}${petIdsQuery}`);
                  }}
                  style={{ borderRadius: '24px', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', padding: '16px', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: spot.source === 'kcisa' ? '#C5E0FB' : '#fef3c7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', marginBottom: '16px', overflow: 'hidden' }}>
                    <LazyImage 
                      spot={spot} 
                      fallback={
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '36px', marginBottom: '4px' }}>{spot.source === 'kcisa' ? '🏛️' : '🌲'}</span>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: spot.source === 'kcisa' ? '#0369a1' : '#b45309' }}>
                            {spot.source === 'kcisa' ? '한국문화정보원' : '한국관광공사'}
                          </span>
                        </div>
                      }
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(spot); }}
                      style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {liked ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div style={{ padding: '0' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.name}</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {spot.address}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', padding: '4px 10px', borderRadius: '8px', fontWeight: '800', backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {spot.matchStatus}
                      </span>
                      <span style={{ color: '#5F50A9', fontSize: '14px', fontWeight: '800' }}>자세히 보기 →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>

      {/* 📍 위치 정보 제공 권한 동의 안내 모달 (중앙 팝업) */}
      {showLocationModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'modalBackdropFade 0.2s ease-out'
          }}
          onClick={() => setShowLocationModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              maxWidth: '380px',
              width: '100%',
              padding: '30px 24px 24px 24px',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.28)',
              position: 'relative',
              animation: 'modalCardPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalBackdropFade {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes modalCardPop {
                from { opacity: 0; transform: scale(0.92) translateY(12px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            {/* 상단 핀 아이콘 */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#F3EEFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '32px',
              boxShadow: '0 6px 16px rgba(95, 80, 169, 0.15)'
            }}>
              📍
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0', letterSpacing: '-0.3px' }}>
              현재 위치로 관광지 탐색
            </h3>

            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.65', margin: '0 0 24px 0', wordBreak: 'keep-all' }}>
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
                  padding: '12px 0',
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
                  padding: '12px 0',
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
                onMouseOver={(e) => !isLocating && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !isLocating && (e.currentTarget.style.transform = 'none')}
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
    </>
  );
}

export default HomePage;

