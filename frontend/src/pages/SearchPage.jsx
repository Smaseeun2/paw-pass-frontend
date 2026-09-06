// src/pages/SearchPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTouristSpots } from '../hooks/useTouristSpots';

function SearchPage() {
  const { spots, isLoading, fetchSpots } = useTouristSpots();
  const navigate = useNavigate();

  // 검색어 및 필터 조건 상태
  const [keyword, setKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  const [myPets] = useState(() => {
    const saved = localStorage.getItem('paw_pass_pets');
    return saved ? JSON.parse(saved) : [{ id: 1, name: '몽이', size: '소형' }];
  });
  const [selectedPets, setSelectedPets] = useState([]);

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

  // 통합 검색 실행 함수
  const handleSearch = (kw = keyword, region = selectedRegion, type = selectedType, pets = selectedPets) => {
    fetchSpots({
      keyword: kw,
      region: region,
      type: type,
      pets: pets
    });
    setActiveDropdown(null);
    setSelectedSpotId(null);
  };

  const onSearchButtonClick = () => {
    handleSearch(keyword, selectedRegion, selectedType, selectedPets);
  };

  const handlePetToggle = (petId) => {
    let updated;
    if (petId === 'none') {
      updated = ['none'];
    } else {
      const filtered = selectedPets.filter(id => id !== 'none');
      if (filtered.includes(petId)) {
        updated = filtered.filter(id => id !== petId);
      } else {
        updated = [...filtered, petId];
      }
    }
    setSelectedPets(updated);
  };

  const handleSelectAllPets = () => {
    const allIds = myPets.map(p => p.id);
    setSelectedPets(allIds);
  };

  const handleNoPets = () => {
    setSelectedPets(['none']);
  };

  const handleItemClick = (spotId) => {
    setSelectedSpotId(spotId);
  };

  const goToDetail = (spotId) => {
    navigate(`/detail/${spotId}`);
  };

  const selectedSpotDetail = spots.find(s => s.contentId === selectedSpotId);

  const getPetFilterLabel = () => {
    if (selectedPets.includes('none')) return '반려동물 없음';
    if (selectedPets.length === 0) return '반려동물 선택';
    if (selectedPets.length === myPets.length) return '전체 반려동물 선택됨';
    const names = myPets.filter(p => selectedPets.includes(p.id)).map(p => p.name).join(', ');
    return `반려동물: ${names}`;
  };

  const getMatchStatusBadge = (status) => {
    if (status === '조건부 방문 가능' || status === 'WARN') {
      return { text: '조건부 방문 가능', color: '#f59e0b', bg: '#fef3c7' };
    }
    return { text: '방문 가능', color: '#10b981', bg: '#d1fae5' };
  };

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative' }}>
      <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '32px', marginBottom: '5px' }}>Paw Pass</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>장소 탐색</p>

      {/* --- 검색창 및 필터 바 영역 --- */}
      <div 
        ref={dropdownRef} 
        style={{ 
          display: 'flex', gap: '15px', backgroundColor: '#f8f9fa', padding: '20px', 
          borderRadius: '12px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center', 
          border: '1px solid #e5e7eb', position: 'relative' 
        }}
      >
        {/* 1. 검색어 입력창 (Input) */}
        <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
          <input 
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearchButtonClick(); }}
            placeholder="관광지 검색 예시 글 ~~"
            style={{ 
              width: '100%', padding: '12px 15px 12px 35px', backgroundColor: '#fff', 
              border: '1px solid #ccc', borderRadius: '8px', fontSize: '14px', outline: 'none' 
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
            🔍
          </span>
        </div>

        {/* 2. 지역 필터 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'region' ? null : 'region')}
            style={{ width: '100%', padding: '12px 15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}
          >
            <span>{selectedRegion ? `지역: ${selectedRegion}` : '지역 ▼'}</span>
          </button>

          {activeDropdown === 'region' && (
            <div style={{ position: 'absolute', top: '105%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10, padding: '10px' }}>
              <div onClick={() => setSelectedRegion('')} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', backgroundColor: !selectedRegion ? '#e3f2fd' : 'transparent' }}>
                전체 지역
              </div>
              {['강릉', '서울', '제주'].map((reg) => (
                <div key={reg} onClick={() => setSelectedRegion(reg)} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', backgroundColor: selectedRegion === reg ? '#e3f2fd' : 'transparent' }}>
                  {reg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. 반려동물 동반 필터 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'pet' ? null : 'pet')}
            style={{ width: '100%', padding: '12px 15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}
          >
            <span>{getPetFilterLabel()}</span>
          </button>

          {activeDropdown === 'pet' && (
            <div style={{ position: 'absolute', top: '105%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10, padding: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <button type="button" onClick={handleSelectAllPets} style={{ flex: 1, padding: '6px', fontSize: '12px', backgroundColor: '#e3f2fd', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#1976d2' }}>
                  전체 선택
                </button>
                <button type="button" onClick={handleNoPets} style={{ flex: 1, padding: '6px', fontSize: '12px', backgroundColor: '#f1f1f1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>
                  반려동물 없음
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {myPets.map((pet) => {
                  const isChecked = selectedPets.includes(pet.id);
                  return (
                    <label key={pet.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: isChecked ? '#f0f7ff' : 'transparent' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => handlePetToggle(pet.id)} />
                      <span>🐾 {pet.name} ({pet.size || '소형'})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. 검색 버튼 */}
        <div>
          <button 
            onClick={onSearchButtonClick}
            style={{ 
              padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', 
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
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>관광지 정보를 불러오는 중입니다...</div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* 왼쪽: 관광지 카드 목록 */}
          <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {spots.length > 0 ? (
              spots.map((spot) => {
                const isSelected = selectedSpotId === spot.contentId;
                const badge = getMatchStatusBadge(spot.matchStatus);
                return (
                  <div 
                    key={spot.contentId}
                    onClick={() => handleItemClick(spot.contentId)}
                    style={{
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#f0f7ff' : '#fff',
                      padding: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: '100%', height: '140px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                      🖼️ 이미지 미리보기
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold' }}>{spot.name}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>📍 {spot.address}</p>
                    
                    <span style={{ 
                      display: 'inline-block', padding: '4px 8px', borderRadius: '6px', 
                      fontSize: '12px', fontWeight: 'bold', color: badge.color, backgroundColor: badge.bg 
                    }}>
                      🐾 {badge.text}
                    </span>
                  </div>
                );
              })
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '40px' }}>검색 결과가 없습니다.</p>
            )}
          </div>

          {/* 오른쪽: 상세 미리보기 패널 */}
          <div style={{ 
            flex: 1, 
            minWidth: '320px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '12px', 
            padding: '24px', 
            backgroundColor: '#fff', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: '20px'
          }}>
            {selectedSpotDetail ? (
              <div>
                <h3 style={{ marginTop: '0', marginBottom: '16px', fontSize: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  {selectedSpotDetail.name}
                </h3>
                <div style={{ width: '100%', height: '160px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  🖼️ 대표 이미지
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#444', marginBottom: '20px' }}>
                  <p style={{ margin: '0' }}><strong>주소:</strong> {selectedSpotDetail.address}</p>
                  <p style={{ margin: '0' }}><strong>운영시간:</strong> {selectedSpotDetail.operatingHours || '정보 미제공'}</p>
                  <p style={{ margin: '0' }}><strong>연락처:</strong> {selectedSpotDetail.phone || '정보 미제공'}</p>
                  <p style={{ margin: '0' }}><strong>동반 정보:</strong> {selectedSpotDetail.petInfoDescription || '소형견 동반 가능'}</p>
                  <p style={{ margin: '0' }}>
                    <strong>이용조건 분석:</strong>{' '}
                    <span style={{ color: getMatchStatusBadge(selectedSpotDetail.matchStatus).color, fontWeight: 'bold' }}>
                      {getMatchStatusBadge(selectedSpotDetail.matchStatus).text}
                    </span>
                  </p>
                </div>

                <button 
                  onClick={() => goToDetail(selectedSpotDetail.contentId)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  상세 페이지 및 준비물 확인하기 →
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 20px' }}>
                <p style={{ fontSize: '15px', margin: 0 }}>👈 왼쪽 목록에서 관광지를 선택하시면<br/>상세 정보가 오른쪽에 표시됩니다.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default SearchPage;