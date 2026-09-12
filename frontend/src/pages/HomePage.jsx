// src/pages/HomePage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { fetchPetsFromDB, fetchExploreSpots } from '../services/api';

const CATEGORY_OPTIONS = [
  { label: '자연/풍경', value: 'NATURE' },
  { label: '카페', value: 'CAFE' },
  { label: '음식점/식당', value: 'FOOD' },
  { label: '문화/예술', value: 'CULTURE' },
  { label: '숙박시설', value: 'STAY' }
];

const REGION_OPTIONS = [
  { label: '전체 지역', code: '' },
  { label: '서울', code: '1' },
  { label: '인천', code: '2' },
  { label: '대전', code: '3' },
  { label: '대구', code: '4' },
  { label: '부산', code: '6' },
  { label: '울산', code: '7' },
  { label: '세종', code: '8' },
  { label: '경기도', code: '31' },
  { label: '강원도', code: '32' },
  { label: '충청북도', code: '33' },
  { label: '충청남도', code: '34' },
  { label: '전라북도', code: '35' },
  { label: '전라남도', code: '36' },
  { label: '경상북도', code: '37' },
  { label: '경상남도', code: '38' },
  { label: '제주도', code: '39' }
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
  const dropdownRef = useRef(null);

  // 실시간 추천 관광지 6개 로드
  useEffect(() => {
    const loadTopSpots = async () => {
      setIsLoadingSpots(true);
      try {
        const data = await fetchExploreSpots({ page: 1 });
        const rawSpots = Array.isArray(data) ? data : (data?.data || []);

        const mapped = rawSpots.slice(0, 6).map((spot) => {
          const spotId = String(spot.id);
          return {
            id: spotId,
            name: spot.title || '장소명 없음',
            address: spot.addr || '주소 정보 없음',
            imageUrl: spot.image || '',
            tel: spot.tel || '정보 미제공',
            source: spot.source || 'tourapi',
            matchStatus: spot.match_status || ''
          };
        });

        setRecommendedSpots(mapped);
      } catch (err) {
        console.warn('홈 추천 장소 로드 실패:', err);
      } finally {
        setIsLoadingSpots(false);
      }
    };

    loadTopSpots();
  }, []);

  // 로그인 유저 반려동물 로드
  useEffect(() => {
    const loadUserPets = async () => {
      const token = localStorage.getItem('paw_pass_access_token');
      if (user && token) {
        try {
          const res = await fetchPetsFromDB();
          const serverPets = Array.isArray(res) ? res : (res?.data || []);
          setMyPets(serverPets);
        } catch (error) {
          setMyPets([]);
        }
      }
    };
    loadUserPets();
  }, [user]);

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
    navigate('/search', { 
      state: { 
        keyword: keyword.trim(), 
        region: selectedRegionCode, 
        type: selectedType, 
        selectedPetIds,
        petCounts 
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

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#fcfcfc', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* 히어로 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', padding: '60px 20px 80px 20px', textAlign: 'center', borderBottom: '1px solid #eaeaea' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto' }}>
          <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block', marginBottom: '16px' }}>
            🐾 반려동물 맞춤형 여행 플랫폼
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0' }}>
            Paw Pass와 함께 떠나는 특별한 여정
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px' }}>
            우리 아이 체중, 견종에 맞춘 실시간 출입 조건 매칭을 확인해보세요.
          </p>

          {/* 검색 바 */}
          <div 
            ref={dropdownRef}
            style={{ 
              display: 'flex', gap: '12px', backgroundColor: '#fff', padding: '18px', 
              borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', 
              alignItems: 'center', border: '1px solid #e2e8f0', position: 'relative'
            }}
          >
            {/* 검색어 */}
            <div style={{ flex: '2 1 220px', position: 'relative' }}>
              <input 
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="관광지나 편의시설 검색"
                style={{ width: '100%', padding: '12px 14px 12px 36px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            </div>

            {/* 지역 */}
            <div style={{ position: 'relative', flex: '1 1 140px' }}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'region' ? null : 'region')}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: selectedRegionName ? '#1e293b' : '#64748b' }}
              >
                <span>{selectedRegionName || '전체 지역'}</span>
                <span>▾</span>
              </button>
              {activeDropdown === 'region' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', maxHeight: '220px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px' }}>
                  {REGION_OPTIONS.map((reg) => (
                    <div key={reg.code} onClick={() => { setSelectedRegionCode(reg.code); setSelectedRegionName(reg.code ? reg.label : ''); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', backgroundColor: selectedRegionCode === reg.code ? '#f1f5f9' : 'transparent' }}>{reg.label}</div>
                  ))}
                </div>
              )}
            </div>

            {/* 카테고리 5종 */}
            <div style={{ position: 'relative', flex: '1 1 150px' }}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: selectedTypeName ? '#1e293b' : '#64748b' }}
              >
                <span>{selectedTypeName || '전체 카테고리'}</span>
                <span>▾</span>
              </button>
              {activeDropdown === 'type' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px' }}>
                  <div onClick={() => { setSelectedType(''); setSelectedTypeName(''); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }}>전체 카테고리</div>
                  {CATEGORY_OPTIONS.map((t) => (
                    <div key={t.value} onClick={() => { setSelectedType(t.value); setSelectedTypeName(t.label); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', backgroundColor: selectedType === t.value ? '#f1f5f9' : 'transparent' }}>{t.label}</div>
                  ))}
                </div>
              )}
            </div>

            {/* 반려동물 선택 드롭다운 */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'pet' ? null : 'pet')}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#1e293b' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🐾 {getPetFilterLabel()}</span>
                <span>▾</span>
              </button>

              {activeDropdown === 'pet' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '280px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.12)', zIndex: 50, padding: '14px' }}>
                  <div onClick={() => navigate('/profile')} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#2563eb', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '12px', fontSize: '13px' }}>
                    + 반려동물 프로필 관리 / 등록
                  </div>

                  {user && myPets.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>등록된 우리 아이</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                        {myPets.map((pet) => (
                          <div 
                            key={pet.id} 
                            onClick={(e) => handlePetToggle(pet.id, e)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedPetIds.includes(pet.id) ? '#eff6ff' : '#f8fafc', border: selectedPetIds.includes(pet.id) ? '1.5px solid #2563eb' : '1px solid #e2e8f0' }}
                          >
                            <span style={{ fontSize: '16px' }}>🐶</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{pet.name}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{pet.breed} · {pet.weight}kg</p>
                            </div>
                            <span style={{ color: selectedPetIds.includes(pet.id) ? '#2563eb' : '#cbd5e1', fontWeight: 'bold' }}>{selectedPetIds.includes(pet.id) ? '✓' : '○'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    {[['소형 (10kg 미만)', 'small'], ['중형 (10~25kg)', 'medium'], ['대형 (25kg 이상)', 'large']].map(([title, key]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={(e) => handleCountChange(key, -1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts[key]}</span>
                          <button onClick={(e) => handleCountChange(key, 1, e)} style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleSearch} style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 실시간 추천 6개 카드 */}
      <div style={{ maxWidth: '1100px', margin: '40px auto 0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>🌟 실시간 추천 동반 장소</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>전국의 엄선된 인기 장소 목록입니다.</p>
          </div>
          <button 
            onClick={() => navigate('/search')} 
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            더 많은 장소 탐색하기 →
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
                  onClick={() => navigate(`/detail/${spot.id}?source=${spot.source}`)}
                  style={{ border: '1px solid #e2e8f0', borderRadius: '16px', backgroundColor: '#fff', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: spot.source === 'kcisa' ? '#e0f2fe' : '#fef3c7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {spot.imageUrl ? (
                      <img src={spot.imageUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <span style={{ fontSize: '36px', marginBottom: '6px' }}>{spot.source === 'kcisa' ? '🏥' : '🏞️'}</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: spot.source === 'kcisa' ? '#0369a1' : '#b45309' }}>
                          {spot.source === 'kcisa' ? '반려동물 편의시설' : '추천 여행지'}
                        </span>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(spot); }}
                      style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}
                    >
                      {liked ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{spot.name}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>📍 {spot.address}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;