// src/pages/SearchPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTouristSpots } from '../hooks/useTouristSpots';
import { useFavorites } from '../hooks/useFavorites';
import { fetchPetsFromDB } from '../services/api';

// 백엔드 명세 5종 카테고리
const CATEGORY_OPTIONS = [
  { label: '자연/관광지', value: 'NATURE' },
  { label: '카페', value: 'CAFE' },
  { label: '음식점', value: 'FOOD' },
  { label: '문화시설', value: 'CULTURE' },
  { label: '숙박시설', value: 'STAY' }
];

// 백엔드 명세 17개 시/도 + 강릉
const REGION_OPTIONS = [
  { label: '전체 지역', code: '' },
  { label: '서울', code: '서울' },
  { label: '부산', code: '부산' },
  { label: '대구', code: '대구' },
  { label: '인천', code: '인천' },
  { label: '광주', code: '광주' },
  { label: '대전', code: '대전' },
  { label: '울산', code: '울산' },
  { label: '세종', code: '세종' },
  { label: '경기', code: '경기' },
  { label: '강원', code: '강원' },
  { label: '강릉 (특례)', code: '강릉' },
  { label: '충북', code: '충북' },
  { label: '충남', code: '충남' },
  { label: '전북', code: '전북' },
  { label: '전남', code: '전남' },
  { label: '경북', code: '경북' },
  { label: '경남', code: '경남' },
  { label: '제주', code: '제주' }
];

function SearchPage() {
  const { spots, isLoading, hasMore, fetchSpots, loadMore } = useTouristSpots();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const queryState = location.state || {};

  // 로그인 유저 정보
  const [user] = useState(() => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // DB에 등록된 내 반려동물 목록
  const [myPets, setMyPets] = useState([]);
  const [selectedPetIds, setSelectedPetIds] = useState(
    queryState.selectedPetIds || (queryState.petId ? [queryState.petId] : [])
  );

  // 검색 키워드 State
  const [keyword, setKeyword] = useState(queryState.keyword || '');

  // 출입 판정 필터 State
  const [selectedMatchStatus, setSelectedMatchStatus] = useState('');

  // 지역 State
  const initialRegion = REGION_OPTIONS.find(r => r.code === queryState.region || r.label === queryState.region || r.code === queryState.regionCode);
  const [selectedRegionCode, setSelectedRegionCode] = useState(initialRegion ? initialRegion.code : '');
  const [selectedRegionName, setSelectedRegionName] = useState(initialRegion ? initialRegion.label : '');

  // 카테고리 State
  const initialCategory = CATEGORY_OPTIONS.find(c => c.value === queryState.category || c.value === queryState.type);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory ? initialCategory.value : '');
  const [selectedCategoryName, setSelectedCategoryName] = useState(initialCategory ? initialCategory.label : '');

  // 마리수 카운터 State
  const [petCounts, setPetCounts] = useState(queryState.petCounts || { small: 0, medium: 0, large: 0 });

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);

  const dropdownRef = useRef(null);
  const observerTarget = useRef(null);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 반려동물 목록 로드 (비로그인 방어)
  useEffect(() => {
    const loadUserPets = async () => {
      const token = localStorage.getItem('paw_pass_access_token');
      if (user && token) {
        try {
          const res = await fetchPetsFromDB();
          const serverPets = Array.isArray(res) ? res : (res?.data || []);
          setMyPets(serverPets);
        } catch {
          setMyPets([]);
        }
      } else {
        setMyPets([]);
      }
    };
    loadUserPets();
  }, [user]);

  // 첫 진입 시 조회
  useEffect(() => {
    fetchSpots({
      regionCode: initialRegion ? initialRegion.code : '',
      category: initialCategory ? initialCategory.value : '',
      petId: selectedPetIds[0] || '',
      keyword: queryState.keyword || ''
    }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 무한 스크롤
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, isLoading, hasMore]);

  // 마리수 변경
  const handleCountChange = (size, delta, e) => {
    e.stopPropagation();
    setPetCounts(prev => ({ ...prev, [size]: Math.max(0, prev[size] + delta) }));
  };

  // 내 반려동물 선택 토글
  const handlePetToggle = (petId, e) => {
    e.stopPropagation();
    setSelectedPetIds(prev => 
      prev.includes(petId) ? prev.filter(id => id !== petId) : [...prev, petId]
    );
  };

  // 반려동물 필터 버튼 라벨
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

  // 검색 버튼 클릭
  const handleSearchButtonClick = () => {
    fetchSpots({
      regionCode: selectedRegionCode,
      category: selectedCategory,
      petId: selectedPetIds[0] || '',
      keyword: keyword.trim()
    }, false);

    setActiveDropdown(null);
    setSelectedSpotId(null);
  };

  const goToDetail = (spotId) => {
  const targetSpot = spots.find(s => String(s.id) === String(spotId));
  if (!targetSpot) return;

  const source = targetSpot.source || 'tourapi';
  const currentPetId = selectedPetIds[0] || ''; 

  navigate(`/detail/${spotId}?source=${source}&petId=${currentPetId}`, {
    state: { 
      previewImage: targetSpot.imageUrl || '',
      petId: currentPetId // state로도 안전하게 동시 전달
    }
  });
};

  const selectedSpotDetail = spots.find(s => String(s.id) === String(selectedSpotId));

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative' }}>
      <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '32px', marginBottom: '5px', color: '#333' }}>Paw Pass</h1>
      <p style={{ textAlign: 'center', color: '#777', marginBottom: '30px' }}>장소 탐색</p>

      {/* --- 검색 필터 바 영역 --- */}
      <div 
        ref={dropdownRef} 
        style={{ 
          display: 'flex', gap: '12px', backgroundColor: '#eef0f2', padding: '16px', 
          borderRadius: '12px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center', 
          border: '1px solid #d1d5db', position: 'relative' 
        }}
      >
        {/* 1. 검색어 입력창 */}
        <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
          <input 
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchButtonClick(); }}
            placeholder="장소명이나 키워드 검색"
            style={{ 
              width: '100%', padding: '12px 15px 12px 35px', backgroundColor: '#fff', 
              border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#333', boxSizing: 'border-box' 
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            🔍
          </span>
        </div>

        {/* 2. 지역 필터 드롭다운 버튼 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '130px' }}>
          <button 
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'region' ? null : 'region')}
            style={{ width: '100%', height: '45px', padding: '0 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', color: '#374151', boxSizing: 'border-box' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📍 {selectedRegionName || '전체 지역'}
            </span>
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

        {/* 3. 카테고리 필터 드롭다운 버튼 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '130px' }}>
          <button 
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
            style={{ width: '100%', height: '45px', padding: '0 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', color: '#374151', boxSizing: 'border-box' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              🏷️ {selectedCategoryName || '전체 카테고리'}
            </span>
            <span style={{ marginLeft: '4px', fontSize: '12px' }}>▾</span>
          </button>

          {activeDropdown === 'category' && (
            <div style={{ position: 'absolute', top: '105%', left: 0, width: '180px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 30, padding: '6px' }}>
              <div 
                onClick={() => { setSelectedCategory(''); setSelectedCategoryName(''); setActiveDropdown(null); }} 
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

        {/* 4. 반려동물 선택 드롭다운 버튼 */}
        <div style={{ position: 'relative', flex: 1.5, minWidth: '180px' }}>
          <button 
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'pet' ? null : 'pet')}
            style={{ width: '100%', height: '45px', padding: '0 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#374151', boxSizing: 'border-box' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              🐾 {getPetFilterLabel()}
            </span>
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
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
                    등록된 우리 아이 (선택 시 출입 가능 필터 적용)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {myPets.map((pet) => {
                      const isSelected = selectedPetIds.includes(pet.id);
                      return (
                        <div 
                          key={pet.id}
                          onClick={(e) => handlePetToggle(pet.id, e)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px',
                            borderRadius: '8px', cursor: 'pointer',
                            backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                            border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0'
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>🐶</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>{pet.name}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{pet.breed} · {pet.weight}kg</p>
                          </div>
                          <span style={{ fontSize: '15px', color: isSelected ? '#2563eb' : '#cbd5e1', fontWeight: 'bold' }}>
                            {isSelected ? '✓' : '○'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', borderTop: user && myPets.length > 0 ? '1px solid #f1f5f9' : 'none', paddingTop: user && myPets.length > 0 ? '10px' : '0' }}>
                  직접 마리수 선택
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>소형 (10kg 미만)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button type="button" onClick={(e) => handleCountChange('small', -1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.small}</span>
                      <button type="button" onClick={(e) => handleCountChange('small', 1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>중형 (10~25kg)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button type="button" onClick={(e) => handleCountChange('medium', -1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.medium}</span>
                      <button type="button" onClick={(e) => handleCountChange('medium', 1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>대형 (25kg 이상)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button type="button" onClick={(e) => handleCountChange('large', -1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.large}</span>
                      <button type="button" onClick={(e) => handleCountChange('large', 1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. 검색 실행 버튼 */}
        <div>
          <button 
            type="button"
            onClick={handleSearchButtonClick}
            style={{ padding: '0 24px', height: '45px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            검색
          </button>
        </div>
      </div>
      
        {/* 1. 기존 검색 필터 바 내부 또는 아래쪽에 출입 상태 필터 추가 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>출입 판정:</span>
          {[
            { label: '전체', value: '' },
            { label: '🟢 방문 가능', value: '가능' },
            { label: '🟡 조건부', value: '조건부' },
            { label: '🔴 방문 불가', value: '불가' }
          ].map((filter) => {
            const isSelected = selectedMatchStatus === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setSelectedMatchStatus(filter.value);
                  // 상태 변경 즉시 검색 API 호출
                  fetchSpots({
                    regionCode: selectedRegionCode,
                    category: selectedCategory,
                    matchStatus: filter.value, // 💡 백엔드 matchStatus 필터 전달
                    petId: selectedPetIds[0] || '',
                    keyword: keyword.trim()
                  }, false);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: isSelected ? '#eff6ff' : '#fff',
                  color: isSelected ? '#2563eb' : '#374151',
                  fontSize: '13px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      {/* --- 콘텐츠 목록 영역 --- */}
      {isLoading && spots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>장소 정보를 불러오는 중입니다...</div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* 카드 리스트 그리드 */}
          <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {spots.length > 0 ? (
              spots.map((spot, idx) => {
                const isSelected = selectedSpotId === spot.id;
                const liked = isFavorite(spot.id);

                return (
                  <div 
                    key={`${spot.id}-${idx}`}
                    onClick={() => setSelectedSpotId(spot.id)}
                    style={{
                      border: isSelected ? '2px solid #4b5563' : '1px solid #d1d5db',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#f3f4f6' : '#fff',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ 
                      position: 'relative', width: '100%', height: '140px', 
                      backgroundColor: spot.source === 'kcisa' ? '#e0f2fe' : '#fef3c7', 
                      borderRadius: '8px', marginBottom: '12px', display: 'flex', 
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      overflow: 'hidden' 
                    }}>
                      {spot.imageUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <img src={spot.imageUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {/* 구글 이미지 저작자 표기 정책 반영 */}
                          {spot.imageAttribution && (
                            <span style={{ 
                              position: 'absolute', bottom: '4px', right: '4px', 
                              fontSize: '9px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
                              padding: '2px 4px', borderRadius: '4px', maxWidth: '90%', 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}>
                              {spot.imageAttribution}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: '32px', marginBottom: '4px' }}>
                            {spot.source === 'kcisa' ? '🏥' : '🏞️'}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: spot.source === 'kcisa' ? '#0369a1' : '#b45309' }}>
                            {spot.source === 'kcisa' ? '반려동물 편의시설' : '추천 여행지'}
                          </span>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(spot); }}
                        style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 2 }}
                      >
                        {liked ? '❤️' : '🤍'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{spot.name}</h4>
                      <span style={{ 
                        fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
                        backgroundColor: spot.matchStatus === '가능' ? '#dcfce7' : spot.matchStatus === '조건부' ? '#fef9c3' : '#f1f5f9',
                        color: spot.matchStatus === '가능' ? '#15803d' : spot.matchStatus === '조건부' ? '#a16207' : '#64748b'
                      }}>
                        {spot.matchStatus}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>📍 {spot.address}</p>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: spot.source === 'kcisa' ? '#e0f2fe' : '#fef3c7', color: spot.source === 'kcisa' ? '#0369a1' : '#b45309', fontWeight: 'bold' }}>
                      {spot.source === 'kcisa' ? '반려동물 시설' : '관광공사 여행지'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', padding: '40px' }}>검색 조건에 일치하는 장소가 없습니다.</p>
            )}

            {/* 무한 스크롤 트리거 */}
            {spots.length > 0 && (
              <div ref={observerTarget} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: '14px' }}>
                {isLoading ? <span>⏳ 추가 장소를 불러오는 중...</span> : !hasMore ? <span>✨ 모든 장소를 다 확인하셨습니다!</span> : null}
              </div>
            )}
          </div>

          {/* 우측 상세 패널 */}
          <div style={{ flex: 1, minWidth: '320px', border: '1px solid #d1d5db', borderRadius: '12px', padding: '24px', backgroundColor: '#fff', position: 'sticky', top: '20px' }}>
            {selectedSpotDetail ? (
              <div>
                <h3 style={{ marginTop: '0', marginBottom: '16px', fontSize: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', color: '#1f2937' }}>
                  {selectedSpotDetail.name}
                </h3>
                <div style={{ width: '100%', height: '160px', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', overflow: 'hidden', position: 'relative' }}>
                  {selectedSpotDetail.imageUrl ? (
                    <>
                      <img src={selectedSpotDetail.imageUrl} alt={selectedSpotDetail.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {selectedSpotDetail.imageAttribution && (
                        <span style={{ 
                          position: 'absolute', bottom: '4px', right: '4px', 
                          fontSize: '9px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
                          padding: '2px 4px', borderRadius: '4px', maxWidth: '90%', 
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                        }}>
                          {selectedSpotDetail.imageAttribution}
                        </span>
                      )}
                    </>
                  ) : (
                    <span>🖼️ 대표 이미지 준비중</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#4b5563', marginBottom: '20px' }}>
                  <p style={{ margin: '0' }}><strong>주소:</strong> {selectedSpotDetail.address}</p>
                  <p style={{ margin: '0' }}><strong>연락처:</strong> {selectedSpotDetail.phone || '정보 미제공'}</p>
                  <p style={{ margin: '0' }}><strong>출입 판정:</strong> {selectedSpotDetail.matchStatus}</p>
                </div>

                <button 
                  type="button"
                  onClick={() => goToDetail(selectedSpotDetail.id)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  상세 페이지 및 준비물 확인하기 →
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 20px' }}>
                <p style={{ fontSize: '15px', margin: 0, color: '#6b7280' }}>👈 왼쪽 목록에서 장소를 선택하시면<br/>상세 정보가 오른쪽에 표시됩니다.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default SearchPage;