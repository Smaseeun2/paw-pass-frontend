// src/pages/SearchPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTouristSpots } from '../hooks/useTouristSpots';
import { useFavorites } from '../hooks/useFavorites';

function SearchPage() {
  const { spots, isLoading, fetchSpots } = useTouristSpots();
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const queryState = location.state || {};

  const [keyword, setKeyword] = useState(queryState.keyword || '');
  const [selectedRegion, setSelectedRegion] = useState(queryState.region || '');
  const [selectedType, setSelectedType] = useState(queryState.type || '');
  const [selectedTypeName, setSelectedTypeName] = useState('');
  
  const [petCounts, setPetCounts] = useState(queryState.petCounts || {
    small: 0,
    medium: 0,
    large: 0
  });

  const [appliedCondition, setAppliedCondition] = useState({
    keyword: queryState.keyword || '',
    region: queryState.region || '',
    type: queryState.type || '',
    petCounts: queryState.petCounts || { small: 0, medium: 0, large: 0 }
  });

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountChange = (size, delta, e) => {
    e.stopPropagation();
    setPetCounts(prev => {
      const updatedCount = Math.max(0, prev[size] + delta);
      return { ...prev, [size]: updatedCount };
    });
  };

  const getPetFilterLabel = () => {
    const { small, medium, large } = petCounts;
    const total = small + medium + large;
    if (total === 0) return '반려동물 선택';
    
    const parts = [];
    if (small > 0) parts.push(`소형견/묘 ${small}마리`);
    if (medium > 0) parts.push(`중형견/묘 ${medium}마리`);
    if (large > 0) parts.push(`대형견/묘 ${large}마리`);

    return parts.length > 0 ? parts.join(' + ') : '반려동물 선택';
  };

  const handleSearchButtonClick = () => {
    const searchPayload = {
      keyword,
      region: selectedRegion,
      type: selectedType,
      petCounts
    };

    setAppliedCondition(searchPayload);
    fetchSpots(searchPayload);
    setActiveDropdown(null);
    setSelectedSpotId(null);
  };

  const handleItemClick = (spotId) => {
    setSelectedSpotId(spotId);
  };

  const goToDetail = (spotId) => {
    navigate(`/detail/${spotId}`);
  };

  const filteredSpots = spots.filter((spot) => {
    const matchesKeyword = appliedCondition.keyword.trim() === '' 
      ? true 
      : (spot.name && spot.name.toLowerCase().includes(appliedCondition.keyword.toLowerCase())) || 
        (spot.description && spot.description.toLowerCase().includes(appliedCondition.keyword.toLowerCase()));

    const matchesRegion = appliedCondition.region 
      ? spot.address && spot.address.includes(appliedCondition.region) 
      : true;

    const matchesType = appliedCondition.type 
      ? spot.type === appliedCondition.type || spot.category === appliedCondition.type 
      : true;

    return matchesKeyword && matchesRegion && matchesType;
  });

  const selectedSpotDetail = filteredSpots.find(s => s.contentId === selectedSpotId);

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative' }}>
      
      <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '32px', marginBottom: '5px', color: '#333' }}>Paw Pass</h1>
      <p style={{ textAlign: 'center', color: '#777', marginBottom: '30px' }}>장소 탐색</p>

      {/* --- 검색창 및 필터 바 영역 --- */}
      <div 
        ref={dropdownRef} 
        style={{ 
          display: 'flex', gap: '15px', backgroundColor: '#eef0f2', padding: '20px', 
          borderRadius: '12px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center', 
          border: '1px solid #d1d5db', position: 'relative' 
        }}
      >
        {/* 1. 검색어 입력창 */}
        <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
          <input 
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchButtonClick(); }}
            placeholder="관광지 이름이나 키워드를 입력하세요 (예: 카페)"
            style={{ 
              width: '100%', padding: '12px 15px 12px 35px', backgroundColor: '#f9fafb', 
              border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#333', boxSizing: 'border-box' 
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>
            🔍
          </span>
        </div>

        {/* 2. 지역 필터 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '130px' }}>
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'region' ? null : 'region')}
            style={{ width: '100%', padding: '12px 15px', backgroundColor: '#f9fafb', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', color: '#4b5563', boxSizing: 'border-box' }}
          >
            <span>{selectedRegion ? selectedRegion : '지역'}</span>
            <span>▾</span>
          </button>

          {activeDropdown === 'region' && (
            <div style={{ position: 'absolute', top: '105%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10, padding: '10px', boxSizing: 'border-box' }}>
              <div onClick={() => { setSelectedRegion(''); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', color: '#4b5563', backgroundColor: !selectedRegion ? '#e5e7eb' : 'transparent' }}>
                전체 지역
              </div>
              {['강릉', '서울', '제주'].map((reg) => (
                <div key={reg} onClick={() => { setSelectedRegion(reg); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', color: '#4b5563', backgroundColor: selectedRegion === reg ? '#e5e7eb' : 'transparent' }}>
                  {reg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. 장소 카테고리 필터 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
            style={{ width: '100%', padding: '12px 15px', backgroundColor: '#f9fafb', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', color: '#4b5563', boxSizing: 'border-box' }}
          >
            <span>{selectedTypeName ? selectedTypeName : '장소 카테고리'}</span>
            <span>▾</span>
          </button>

          {activeDropdown === 'type' && (
            <div style={{ position: 'absolute', top: '105%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10, padding: '10px', boxSizing: 'border-box' }}>
              <div onClick={() => { setSelectedType(''); setSelectedTypeName(''); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', color: '#4b5563', backgroundColor: !selectedType ? '#e5e7eb' : 'transparent' }}>
                전체 카테고리
              </div>
              {[
                { label: '자연/풍경', value: 'NATURE' },
                { label: '카페/식당', value: 'CAFE' },
                { label: '숙박시설', value: 'ACCOMMODATION' },
                { label: '체험/액티비티', value: 'ACTIVITY' }
              ].map((t) => (
                <div 
                  key={t.value} 
                  onClick={() => { setSelectedType(t.value); setSelectedTypeName(t.label); setActiveDropdown(null); }} 
                  style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', color: '#4b5563', backgroundColor: selectedType === t.value ? '#e5e7eb' : 'transparent' }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. 반려동물 선택 드롭다운 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'pet' ? null : 'pet')}
            style={{ width: '100%', padding: '12px 15px', backgroundColor: '#f9fafb', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#4b5563', boxSizing: 'border-box' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getPetFilterLabel()}</span>
            <span>▾</span>
          </button>

          {activeDropdown === 'pet' && (
            <div style={{ position: 'absolute', top: '105%', left: 0, width: '240px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10, padding: '12px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                
                <div 
                  onClick={() => navigate('/profile')} 
                  style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#2563eb', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', textAlign: 'center', backgroundColor: '#f8fafc' }}
                >
                  + 반려동물 프로필 등록하기
                </div>

                {/* 소형견/묘 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', color: '#333' }}>
                  <span>소형견/묘</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={(e) => handleCountChange('small', -1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.small}</span>
                    <button onClick={(e) => handleCountChange('small', 1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                {/* 중형견/묘 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', color: '#333' }}>
                  <span>중형견/묘</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={(e) => handleCountChange('medium', -1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.medium}</span>
                    <button onClick={(e) => handleCountChange('medium', 1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                {/* 대형견/묘 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', color: '#333' }}>
                  <span>대형견/묘</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={(e) => handleCountChange('large', -1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.large}</span>
                    <button onClick={(e) => handleCountChange('large', 1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* 5. 검색 버튼 */}
        <div>
          <button 
            onClick={handleSearchButtonClick}
            style={{ 
              padding: '12px 20px', backgroundColor: '#4b5563', color: 'white', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
              height: '45px'
            }}
          >
            검색
          </button>
        </div>

      </div>

      {/* --- 메인 콘텐츠 영역 --- */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>관광지 정보를 불러오는 중입니다...</div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {filteredSpots.length > 0 ? (
              filteredSpots.map((spot) => {
                const isSelected = selectedSpotId === spot.contentId;
                const liked = isFavorite(spot.contentId);

                return (
                  <div 
                    key={spot.contentId}
                    onClick={() => handleItemClick(spot.contentId)}
                    style={{
                      border: isSelected ? '2px solid #4b5563' : '1px solid #d1d5db',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#f3f4f6' : '#fff',
                      padding: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                      🖼️ 이미지 미리보기

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(spot);
                        }}
                        style={{
                          position: 'absolute', top: '10px', right: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none',
                          borderRadius: '50%', width: '32px', height: '32px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', fontSize: '16px', zIndex: 2
                        }}
                      >
                        {liked ? '❤️' : '🤍'}
                      </button>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{spot.name}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>📍 {spot.address}</p>
                  </div>
                );
              })
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', padding: '40px' }}>검색 조건에 일치하는 관광지가 없습니다.</p>
            )}
          </div>

          <div style={{ 
            flex: 1, minWidth: '320px', border: '1px solid #d1d5db', borderRadius: '12px', 
            padding: '24px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            position: 'sticky', top: '20px'
          }}>
            {selectedSpotDetail ? (
              <div>
                <h3 style={{ marginTop: '0', marginBottom: '16px', fontSize: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', color: '#1f2937' }}>
                  {selectedSpotDetail.name}
                </h3>
                <div style={{ width: '100%', height: '160px', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  🖼️ 대표 이미지
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#4b5563', marginBottom: '20px' }}>
                  <p style={{ margin: '0' }}><strong>주소:</strong> {selectedSpotDetail.address}</p>
                  <p style={{ margin: '0' }}><strong>운영시간:</strong> {selectedSpotDetail.operatingHours || '정보 미제공'}</p>
                  <p style={{ margin: '0' }}><strong>연락처:</strong> {selectedSpotDetail.phone || '정보 미제공'}</p>
                  <p style={{ margin: '0' }}><strong>동반 정보:</strong> {selectedSpotDetail.petInfoDescription || '소형견 동반 가능'}</p>
                </div>

                <button 
                  onClick={() => goToDetail(selectedSpotDetail.contentId)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  상세 페이지 및 준비물 확인하기 →
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 20px' }}>
                <p style={{ fontSize: '15px', margin: 0, color: '#6b7280' }}>👈 왼쪽 목록에서 관광지를 선택하시면<br/>상세 정보가 오른쪽에 표시됩니다.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default SearchPage;