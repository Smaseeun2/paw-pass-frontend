// src/pages/SearchPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTouristSpots } from '../hooks/useTouristSpots';
import { useFavorites } from '../hooks/useFavorites';
import { fetchPetsFromDB } from '../services/api';

// 백엔드 명세 5종 공통 카테고리
const CATEGORY_OPTIONS = [
  { label: '자연/풍경', value: 'NATURE' },
  { label: '카페', value: 'CAFE' },
  { label: '음식점/식당', value: 'FOOD' },
  { label: '문화/예술', value: 'CULTURE' },
  { label: '숙박시설', value: 'STAY' }
];

// 백엔드 명세 17개 시/도 + 강릉 (한글 지명 문자열 code 규격)
const REGION_OPTIONS = [
  { label: '전체 지역', code: '' },
  { label: '서울', code: '서울' },
  { label: '인천', code: '인천' },
  { label: '대전', code: '대전' },
  { label: '대구', code: '대구' },
  { label: '부산', code: '부산' },
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

  const [user] = useState(() => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [myPets, setMyPets] = useState([]);
  const [selectedPetIds, setSelectedPetIds] = useState(
    queryState.selectedPetIds || (queryState.petId ? [queryState.petId] : [])
  );

  const [keyword, setKeyword] = useState(queryState.keyword || '');
  const [selectedMatchStatus, setSelectedMatchStatus] = useState(queryState.matchStatus || '');

  // 지역 매칭
  const rawRegion = queryState.region || queryState.regionCode || '';
  const matchedRegion = REGION_OPTIONS.find(r => r.code === String(rawRegion) || r.label === String(rawRegion));

  const [selectedRegionCode, setSelectedRegionCode] = useState(matchedRegion ? matchedRegion.code : rawRegion);
  const [selectedRegionName, setSelectedRegionName] = useState(matchedRegion ? matchedRegion.label : (rawRegion ? String(rawRegion) : ''));

  // 카테고리 매칭
  const rawCategory = queryState.category || queryState.type || '';
  const matchedCategory = CATEGORY_OPTIONS.find(c => c.value === String(rawCategory) || c.label === String(rawCategory));

  const [selectedCategory, setSelectedCategory] = useState(matchedCategory ? matchedCategory.value : rawCategory);
  const [selectedCategoryName, setSelectedCategoryName] = useState(matchedCategory ? matchedCategory.label : (rawCategory ? String(rawCategory) : ''));

  const [petCounts, setPetCounts] = useState(queryState.petCounts || { small: 0, medium: 0, large: 0 });

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);

  const dropdownRef = useRef(null);
  const observerTarget = useRef(null);

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
        } catch {
          setMyPets([]);
        }
      } else {
        setMyPets([]);
      }
    };
    loadUserPets();
  }, [user]);

  // 첫 진입 시 검색 실행
  useEffect(() => {
    const initialReqRegion = matchedRegion ? matchedRegion.code : rawRegion;
    const initialReqCategory = matchedCategory ? matchedCategory.value : rawCategory;

    fetchSpots({
      regionCode: initialReqRegion,
      category: initialReqCategory,
      matchStatus: queryState.matchStatus || '',
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

  const handleSearchButtonClick = () => {
    fetchSpots({
      regionCode: selectedRegionCode,
      category: selectedCategory,
      matchStatus: selectedMatchStatus,
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
    const spotImage = targetSpot.imageUrl || targetSpot.image || '';

    navigate(`/detail/${spotId}?source=${source}&petId=${currentPetId}`, {
      state: { 
        previewImage: spotImage,
        petId: currentPetId,
        lat: targetSpot.lat,
        lng: targetSpot.lng
      }
    });
  };

  const selectedSpotDetail = spots.find(s => String(s.id) === String(selectedSpotId));

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative' }}>
      <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '32px', marginBottom: '5px', color: '#333' }}>Paw Pass</h1>
      <p style={{ textAlign: 'center', color: '#777', marginBottom: '30px' }}>장소 탐색</p>

      {/* 검색 필터 바 */}
      <div 
        ref={dropdownRef} 
        style={{ display: 'flex', gap: '12px', backgroundColor: '#eef0f2', padding: '16px', borderRadius: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #d1d5db', position: 'relative' }}
      >
        <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
          <input 
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchButtonClick(); }}
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

        {/* 반려동물 선택 드롭다운 */}
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
            </div>
          )}
        </div>

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

      {/* 목록 및 우측 패널 */}
      {isLoading ? (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          padding: '100px 0', gap: '16px', minHeight: '300px' 
        }}>
          <div style={{
            width: '48px', height: '48px', border: '4px solid #e2e8f0', 
            borderTop: '4px solid #2563eb', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', margin: 0 }}>
            🐾 맞춤 동반 장소를 불러오는 중입니다...
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            잠시만 기다려주세요!
          </p>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {spots.length > 0 ? (
              spots.map((spot, idx) => {
                const isSelected = selectedSpotId === spot.id;
                const liked = isFavorite(spot.id);
                const spotImg = spot.imageUrl || spot.image || '';

                return (
                  <div 
                    key={`${spot.id}-${idx}`}
                    onClick={() => setSelectedSpotId(spot.id)}
                    style={{ border: isSelected ? '2px solid #4b5563' : '1px solid #d1d5db', borderRadius: '12px', backgroundColor: isSelected ? '#f3f4f6' : '#fff', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: spotImg ? '#f1f5f9' : (spot.source === 'kcisa' ? '#e0f2fe' : '#fef3c7'), borderRadius: '8px', marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {spotImg ? (
                        <img src={spotImg} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <span style={{ fontSize: '32px', marginBottom: '4px' }}>{spot.source === 'kcisa' ? '🏥' : '🏞️'}</span>
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
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: spot.matchStatus === '가능' ? '#dcfce7' : spot.matchStatus === '조건부' ? '#fef9c3' : '#f1f5f9', color: spot.matchStatus === '가능' ? '#15803d' : spot.matchStatus === '조건부' ? '#a16207' : '#64748b' }}>
                        {spot.matchStatus}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>📍 {spot.address}</p>
                  </div>
                );
              })
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', padding: '40px' }}>검색 조건에 일치하는 장소가 없습니다.</p>
            )}

            {spots.length > 0 && (
              <div ref={observerTarget} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: '14px' }}>
                {isLoading ? <span>⏳ 추가 장소를 불러오는 중...</span> : !hasMore ? <span>✨ 모든 장소를 다 확인하셨습니다!</span> : null}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '320px', border: '1px solid #d1d5db', borderRadius: '12px', padding: '24px', backgroundColor: '#fff', position: 'sticky', top: '20px' }}>
            {selectedSpotDetail ? (
              <div>
                <h3 style={{ marginTop: '0', marginBottom: '16px', fontSize: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', color: '#1f2937' }}>
                  {selectedSpotDetail.name}
                </h3>
                <div style={{ width: '100%', height: '160px', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', overflow: 'hidden', position: 'relative' }}>
                  {selectedSpotDetail.imageUrl || selectedSpotDetail.image ? (
                    <img src={selectedSpotDetail.imageUrl || selectedSpotDetail.image} alt={selectedSpotDetail.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>🖼️ 대표 이미지 준비중</span>
                  )}
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