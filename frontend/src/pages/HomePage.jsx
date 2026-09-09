// src/pages/HomePage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mockSpots from '../mocks/tourist-spots.json';
import { useFavorites } from '../hooks/useFavorites';

function HomePage() {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [keyword, setKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTypeName, setSelectedTypeName] = useState('');
  
  const [petCounts, setPetCounts] = useState({
    small: 0,
    medium: 0,
    large: 0
  });

  const [activeDropdown, setActiveDropdown] = useState(null);
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

  const handleSearch = () => {
    navigate('/search', { state: { keyword, region: selectedRegion, type: selectedType, petCounts } });
  };

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

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#fcfcfc', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* 히어로 섹션 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', 
        padding: '60px 20px 80px 20px', 
        textAlign: 'center',
        borderBottom: '1px solid #eaeaea'
      }}>
        <div style={{ maxWidth: '950px', margin: '0 auto' }}>
          <span style={{ 
            backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '6px 14px', 
            borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block', marginBottom: '16px' 
          }}>
            🐾 반려동물 맞춤형 여행 플랫폼
          </span>
          <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
            Paw Pass와 함께 떠나는 특별한 여정
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px', lineHeight: '1.5' }}>
            우리 아이 체중, 목줄 여부까지 고려한 실시간 출입 조건 매칭 서비스를 경험해보세요.
          </p>

          {/* 검색 및 필터 바 */}
          <div 
            ref={dropdownRef}
            style={{ 
              display: 'flex', gap: '12px', backgroundColor: '#fff', padding: '18px', 
              borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', 
              alignItems: 'center', border: '1px solid #e2e8f0', position: 'relative', textAlign: 'left',
              flexWrap: 'nowrap', overflow: 'visible'
            }}
          >
            {/* 검색어 입력 */}
            <div style={{ flex: '2 1 220px', position: 'relative' }}>
              <input 
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="관광지 검색 예시 글 ~~"
                style={{ width: '100%', padding: '12px 14px 12px 36px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            </div>

            {/* 지역 선택 */}
            <div style={{ position: 'relative', flex: '1 1 140px' }}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'region' ? null : 'region')}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '500', fontSize: '14px', color: selectedRegion ? '#1e293b' : '#64748b', boxSizing: 'border-box' }}
              >
                <span>{selectedRegion ? selectedRegion : '지역'}</span>
                <span>▾</span>
              </button>
              {activeDropdown === 'region' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px', boxSizing: 'border-box' }}>
                  <div onClick={() => { setSelectedRegion(''); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', backgroundColor: !selectedRegion ? '#f1f5f9' : 'transparent', fontSize: '14px' }}>전체 지역</div>
                  {['서울', '강릉', '제주'].map((reg) => (
                    <div key={reg} onClick={() => { setSelectedRegion(reg); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', backgroundColor: selectedRegion === reg ? '#f1f5f9' : 'transparent', fontSize: '14px' }}>{reg}</div>
                  ))}
                </div>
              )}
            </div>

            {/* 장소 카테고리 */}
            <div style={{ position: 'relative', flex: '1 1 150px' }}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '500', fontSize: '14px', color: selectedTypeName ? '#1e293b' : '#64748b', boxSizing: 'border-box' }}
              >
                <span>{selectedTypeName ? selectedTypeName : '장소 카테고리'}</span>
                <span>▾</span>
              </button>
              {activeDropdown === 'type' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 50, padding: '6px', boxSizing: 'border-box' }}>
                  <div onClick={() => { setSelectedType(''); setSelectedTypeName(''); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', backgroundColor: !selectedType ? '#f1f5f9' : 'transparent', fontSize: '14px' }}>전체 카테고리</div>
                  {[
                    { label: '자연/풍경', value: 'NATURE' },
                    { label: '카페/식당', value: 'CAFE' },
                    { label: '숙박시설', value: 'ACCOMMODATION' },
                    { label: '체험/액티비티', value: 'ACTIVITY' }
                  ].map((t) => (
                    <div key={t.value} onClick={() => { setSelectedType(t.value); setSelectedTypeName(t.label); setActiveDropdown(null); }} style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', backgroundColor: selectedType === t.value ? '#f1f5f9' : 'transparent', fontSize: '14px' }}>{t.label}</div>
                  ))}
                </div>
              )}
            </div>

            {/* 반려동물 선택 드롭다운 */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'pet' ? null : 'pet')}
                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '500', fontSize: '13px', color: '#1e293b', boxSizing: 'border-box' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getPetFilterLabel()}</span>
                <span>▾</span>
              </button>

              {activeDropdown === 'pet' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '240px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                    
                    <div 
                      onClick={() => navigate('/profile')} 
                      style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#2563eb', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', textAlign: 'center', backgroundColor: '#f8fafc' }}
                    >
                      + 반려동물 프로필 등록하기
                    </div>

                    {/* 소형견/묘 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
                      <span>소형견/묘</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={(e) => handleCountChange('small', -1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.small}</span>
                        <button onClick={(e) => handleCountChange('small', 1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>

                    {/* 중형견/묘 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
                      <span>중형견/묘</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={(e) => handleCountChange('medium', -1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>{petCounts.medium}</span>
                        <button onClick={(e) => handleCountChange('medium', 1, e)} style={{ width: '26px', height: '26px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>

                    {/* 대형견/묘 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
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

            {/* 검색 버튼 */}
            <div style={{ flex: '0 0 auto' }}>
              <button 
                onClick={handleSearch}
                style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                검색
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 추천 관광지 섹션 */}
      <div style={{ maxWidth: '1100px', margin: '40px auto 0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>🌟 실시간 추천 동반 관광지</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>지금 가장 인기 있는 반려동물 동반 장소입니다.</p>
          </div>
          <button 
            onClick={() => navigate('/search')} 
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            전체 보기 →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {mockSpots.slice(0, 6).map((spot) => {
            const liked = isFavorite(spot.contentId);
            return (
              <div 
                key={spot.contentId}
                onClick={() => navigate(`/detail/${spot.contentId}`)}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  {spot.imageUrl ? (
                    <img src={spot.imageUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>🖼️ 이미지 준비중</span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(spot);
                    }}
                    style={{
                      position: 'absolute', top: '12px', right: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none',
                      borderRadius: '50%', width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '16px', zIndex: 2
                    }}
                  >
                    {liked ? '❤️' : '🤍'}
                  </button>
                </div>

                <div style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{spot.name}</h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>📍 {spot.address}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomePage;