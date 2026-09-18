// src/pages/HomePage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavoritesContext as useFavorites } from '../contexts/FavoritesContext';
import { fetchPetsFromDB, fetchExploreSpots } from '../services/api';
import LazyImage from '../components/LazyImage';

const CATEGORY_OPTIONS = [
  { label: '자연/풍경', value: 'NATURE' },
  { label: '카페', value: 'CAFE' },
  { label: '음식점/식당', value: 'FOOD' },
  { label: '문화/예술', value: 'CULTURE' },
  { label: '숙박시설', value: 'STAY' },
  { label: '동물병원', value: 'HOSPITAL' }
];

import { REGION_OPTIONS } from '../constants/regions';

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
  const dropdownRef = useRef(null);

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

  const scrollToSearchBar = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = Math.max(0, rect.top + scrollTop - 80);
      const startY = scrollTop;
      const distance = targetY - startY;

      if (Math.abs(distance) < 15) return;

      const duration = 750; // 0.75초 동안 부드럽게 감속
      let startTime = null;

      // 부드러운 시작과 감속 (EaseInOutCubic)
      const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const animationStep = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        window.scrollTo(0, startY + distance * eased);

        if (progress < 1) {
          window.requestAnimationFrame(animationStep);
        }
      };

      window.requestAnimationFrame(animationStep);
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
      <div style={{ fontFamily: 'sans-serif', paddingBottom: '24px', position: 'relative', zIndex: 1 }}>
      
      {/* 1. 히어로 섹션 & 떠 있는 검색창 */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        <div style={{ 
          width: '100%', 
          height: '460px', 
          borderRadius: '32px', 
          backgroundImage: 'linear-gradient(to bottom, rgba(30, 20, 60, 0.28) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(15, 23, 42, 0.45) 100%), url(/hero-banner.jpg)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center 45%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'visible'
        }}>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '800', 
            letterSpacing: '1.2px', 
            marginBottom: '12px', 
            color: '#fff', 
            backgroundColor: 'rgba(95, 80, 169, 0.75)', 
            padding: '5px 16px', 
            borderRadius: '50px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(6px)'
          }}>
            All you need is PawPass
          </span>
          <h1 style={{ fontSize: '46px', fontWeight: '900', margin: '0 0 14px 0', textShadow: '0 3px 18px rgba(0, 0, 0, 0.7), 0 1px 4px rgba(0, 0, 0, 0.5)', letterSpacing: '-0.5px' }}>우리 아이와 함께 여행을 떠나볼까요?</h1>
          <p style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 2px 12px rgba(0, 0, 0, 0.7), 0 1px 4px rgba(0, 0, 0, 0.5)', margin: 0 }}>우리 아이와 딱 맞는 여행지를 찾아보세요</p>
        
          {/* 플로팅 검색창 (모던 웹 Pill 스타일 - 비례 확대) */}
          <div 
            ref={dropdownRef}
            className="modern-search-pill"
            onClick={scrollToSearchBar}
            style={{ 
              position: 'absolute',
              bottom: '-48px',
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
                onFocus={scrollToSearchBar}
                onClick={(e) => { e.stopPropagation(); scrollToSearchBar(); }}
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
                <div style={{ position: 'absolute', top: '64px', left: 0, width: '280px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', boxShadow: '0 16px 36px rgba(0,0,0,0.14)', zIndex: 10, padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                        {myPets.map((pet) => (
                          <div 
                            key={pet.id} 
                            onClick={(e) => handlePetToggle(pet.id, e)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '10px', cursor: 'pointer', backgroundColor: selectedPetIds.includes(pet.id) ? 'rgba(95, 80, 169, 0.1)' : '#f8fafc', border: selectedPetIds.includes(pet.id) ? '1px solid #5F50A9' : '1px solid #e2e8f0' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12.5px', color: selectedPetIds.includes(pet.id) ? '#5F50A9' : '#333' }}>{pet.name}</p>
                            </div>
                            <span style={{ color: '#5F50A9', fontWeight: 'bold', fontSize: '12.5px' }}>{selectedPetIds.includes(pet.id) ? '✓' : ''}</span>
                          </div>
                        ))}
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
              style={{ 
                width: '54px', 
                height: '54px', 
                minWidth: '54px',
                backgroundColor: '#5F50A9', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginLeft: '8px', 
                boxShadow: '0 4px 16px rgba(95, 80, 169, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.06)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(95, 80, 169, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(95, 80, 169, 0.4)';
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            width: '100%',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
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
                    minWidth: '50px',
                    padding: '9px 0',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    borderRadius: '50px',
                    border: '1.5px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    fontSize: displayLabel.length > 3 ? '11px' : '12.5px',
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
        </div>
      </div>

{/* 4. 실시간 추천 관광지 카드 (레퍼런스 스타일) */}
      <div style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>대한민국 관광지 with PawPass</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>PawPass에 등록된 대한민국 관광지를 소개합니다.</p>
          </div>
          <button 
            onClick={() => navigate('/search')} 
            style={{ background: '#5F50A9', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 14px rgba(95, 80, 169, 0.3)', transition: 'all 0.2s ease' }}
          >
            더 보기 →
          </button>
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
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.name}</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {spot.address}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                        {spot.matchStatus}
                      </span>
                      <span style={{ color: '#5F50A9', fontSize: '13px', fontWeight: 'bold' }}>자세히 보기 →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>
    </>
  );
}

export default HomePage;
