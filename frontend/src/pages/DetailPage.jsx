// src/pages/DetailPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSpotDetail } from '../hooks/useSpotDetail';
import { useFavoritesContext as useFavorites } from '../contexts/FavoritesContext';
import { usePetMatching } from '../hooks/usePetMatching';

import { loadKakaoMapSdk } from '../utils/kakaoMapLoader';
import ConditionalBadge from '../components/ConditionalBadge';
import { toast } from '../utils/toast';

// 💡 헛걸음 방지 체크리스트 컴포넌트
function SpotChecklist() {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const checklistData = [
    {
      category: '1. 방문 전 필수 확인 사항 (서류 및 규정)',
      items: [
        { label: '등록증 및 증명서 지참', desc: '내장칩 등록 번호 또는 동물등록증, (필요시) 광견병 예방접종 증명서 지참 여부 확인' },
        { label: '체중 및 견종 제한 재확인', desc: '대형견 출입 가능 여부, 맹견류 제한 규정, 체중 기준(예: 15kg 이하 등) 충족 여부 확인' },
        { label: '실내외 동반 구역 확인', desc: '식당·카페의 경우 실내 동반 가능 여부와 전용 테라스/야외 좌석만 허용되는지 사전 파악' }
      ]
    },
    {
      category: '2. 현장 변수 대비 준비물',
      items: [
        { label: '배변 용품 및 매너 툴', desc: '배변봉투, 반려견 전용 물티슈, 실내 마킹 대비 매너벨트(기저귀) 준비' },
        { label: '이동장 및 하네스', desc: '리드줄(목줄/가슴줄) 규정 확인 (자동줄 제한 여부) 및 필요시 전용 이동장(케이지) 또는 유모차 지참' },
        { label: '급수 및 식사 도구', desc: '낯선 환경에서 반려견이 안정을 찾을 수 있는 개인 물그릇 및 평소 먹던 간식/사료 준비' }
      ]
    },
    {
      category: '3. 운영 시간 및 변동성 체크',
      items: [
        { label: '실시간 영업 정보 확인', desc: '공식 홈페이지나 SNS를 통한 임시 휴무, 대관 행사, 시즌별 운영 시간 변경 여부 최종 확인' },
        { label: '날씨 및 환경 변수 점검', desc: '야외 관광지의 경우 기상 악화(우천, 폭염 등) 시 이용 제한 여부 사전 파악' }
      ]
    }
  ];

  let globalItemIdx = 0;

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>✅ 헛걸음 방지 체크리스트</h3>
      <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
          소중한 반려견과 떠나기 전, 아래 항목들을 스스로 점검해보세요!
        </p>
        
        {checklistData.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: sIdx === checklistData.length - 1 ? '0' : '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>
              {section.category}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {section.items.map((item) => {
                const currentIndex = globalItemIdx++;
                const isChecked = !!checkedItems[currentIndex];
                return (
                  <label 
                    key={currentIndex} 
                    style={{ 
                      display: 'flex', alignItems: 'flex-start', gap: '10px', 
                      cursor: 'pointer', padding: '8px 12px', 
                      backgroundColor: isChecked ? '#f1f5f9' : '#fff',
                      borderRadius: '8px', border: '1px solid',
                      borderColor: isChecked ? '#cbd5e1' : '#e2e8f0',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => toggleCheck(currentIndex)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ opacity: isChecked ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                      <span style={{ 
                        display: 'block', fontSize: '13px', fontWeight: 'bold', 
                        color: isChecked ? '#64748b' : '#1e293b',
                        textDecoration: isChecked ? 'line-through' : 'none'
                      }}>
                        {item.label}
                      </span>
                      <span style={{ 
                        display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px',
                        textDecoration: isChecked ? 'line-through' : 'none'
                      }}>
                        {item.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 현재 로그인된 유저의 이메일(또는 식별자)을 가져오는 헬퍼 함수
const getCurrentUserEmail = () => {
  try {
    const saved = localStorage.getItem('paw_pass_user');
    const user = saved ? JSON.parse(saved) : null;
    return user?.email || user?.id || null;
  } catch {
    return null;
  }
};

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'tourapi';
  
  // 💡 카멜케이스 petId 명명 규칙을 적용하여 쿼리 및 스테이트에서 안전하게 추출
  const petIdFromQuery = searchParams.get('petIds') || searchParams.get('petId') || location.state?.selectedPetIds?.join(',') || location.state?.petId || '';
  // 비로그인 시 크기 힌트 (small/medium/large)
  const guestSizeHint = searchParams.get('guestSize') || location.state?.guestSizeHint || '';

  const { detail, isLoading, error } = useSpotDetail(id, source);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // 💡 펫 맞춤 판정 훅 호출 (토큰 헤더 및 인증 상태 연동)
  const { matchResult } = usePetMatching(id, source, petIdFromQuery);

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const mapContainerRef = useRef(null);

  // 유저별 고유 동선 스토리지 키 생성 (비로그인 상태면 guest 키 사용)
  const userEmail = getCurrentUserEmail();
  const storageKey = userEmail ? `paw_pass_routes_${userEmail}` : 'paw_pass_routes_guest';

  const [isRouteAdded, setIsRouteAdded] = useState(() => {
    if (!id || !storageKey) return false;
    try {
      const savedRoutes = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return savedRoutes.some(item => String(item.id || item.contentId) === String(id));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!detail || !mapContainerRef.current) return;

    let isMounted = true;

    loadKakaoMapSdk().then((kakao) => {
      if (!isMounted || !mapContainerRef.current) return;

      const stateLat = location.state?.lat;
      const stateLng = location.state?.lng;

      const apiLat = Number(stateLat || detail.lat || detail.map_y || detail.mapy || detail.y);
      const apiLng = Number(stateLng || detail.lng || detail.map_x || detail.mapx || detail.x);

      const hasValidCoords = !isNaN(apiLat) && !isNaN(apiLng) && apiLat !== 0 && apiLng !== 0;

      const createMapInstance = (lat, lng) => {
        if (!mapContainerRef.current) return;
        mapContainerRef.current.innerHTML = '';

        const centerLatLng = new kakao.maps.LatLng(lat, lng);
        const options = { center: centerLatLng, level: 4 };
        
        const map = new kakao.maps.Map(mapContainerRef.current, options);
        const marker = new kakao.maps.Marker({ position: centerLatLng });
        marker.setMap(map);
      };

      if (hasValidCoords) {
        createMapInstance(apiLat, apiLng);
      } else if (detail.address && kakao.maps.services) {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(detail.address, (result, status) => {
          if (!isMounted) return;
          if (status === kakao.maps.services.Status.OK && result[0]) {
            createMapInstance(Number(result[0].y), Number(result[0].x));
          } else {
            createMapInstance(37.566826, 126.978656);
          }
        });
      } else {
        createMapInstance(37.566826, 126.978656);
      }
    }).catch((err) => {
      console.error('상세페이지 지도 로드 실패:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [detail, location.state]);

  const handleToggleRoute = () => {
    if (!storageKey) {
      toast.warning('로그인 후 동선을 추가할 수 있습니다.');
      return;
    }

    try {
      const savedRoutes = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const spotId = String(detail.id || detail.contentId);
      
      const targetLat = Number(detail.lat || detail.map_y || detail.mapy || detail.y) || 37.566826;
      const targetLng = Number(detail.lng || detail.map_x || detail.mapx || detail.x) || 126.978656;

      let updated;
      if (isRouteAdded) {
        updated = savedRoutes.filter(item => String(item.id || item.contentId) !== spotId);
        setIsRouteAdded(false);
        toast.info('나의 동선에서 제거되었습니다.');
      } else {
        updated = [...savedRoutes, {
          id: spotId,
          contentId: spotId,
          name: detail.name,
          address: detail.address,
          lat: targetLat,
          lng: targetLng,
          imageUrl: detail.image || detail.imageUrl || '',
          source: detail.source
        }];
        setIsRouteAdded(true);
        toast.success('❤️ 나의 동선에 추가되었습니다!');
      }
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error('동선 저장 중 오류 발생:', err);
    }
  };

  // 공유 버튼 핸들러 (현재 페이지 URL 클립보드 복사 + 폴백 처리)
  const handleShare = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('📋 현재 장소 링크가 복사되었습니다!'))
        .catch(() => {
          // HTTPS가 아닌 환경 폴백
          const el = document.createElement('textarea');
          el.value = window.location.href;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          toast.success('📋 링크가 복사되었습니다!');
        });
    } else {
      // navigator.clipboard 미지원 환경 폴백
      const el = document.createElement('textarea');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast.success('📋 링크가 복사되었습니다!');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
        장소 상세 정보를 실시간으로 불러오는 중입니다...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '20px', fontWeight: 'bold' }}>
          {error || '장소 정보를 찾을 수 없습니다.'}
        </p>
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          style={{ padding: '10px 18px', backgroundColor: '#4b5563', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ← 뒤로 가기
        </button>
      </div>
    );
  }

  const liked = isFavorite(detail.id || detail.contentId);
  const cond = detail.petCondition || {};

  const previewImage = location.state?.previewImage;
  let imageList = Array.isArray(detail.images) ? [...detail.images] : [];
  
  // URL에서 쿼리 파라미터를 제외한 기본 경로로 중복 검사 (http/https 무시)
  const getBaseUrl = (url) => {
    try {
      if (!url) return '';
      const u = new URL(url);
      return u.origin + u.pathname;
    } catch {
      return url.split('?')[0];
    }
  };

  if (previewImage) {
    const previewBase = getBaseUrl(previewImage);
    const isDuplicate = imageList.some(img => getBaseUrl(img) === previewBase);
    if (!isDuplicate) {
      imageList.unshift(previewImage);
    }
  }
  
  const mainImage = detail.image || detail.imageUrl;
  if (imageList.length === 0 && mainImage) {
    imageList = [mainImage];
  }

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const currentLat = Number(detail.lat || detail.map_y || detail.mapy || detail.y);
  const currentLng = Number(detail.lng || detail.map_x || detail.mapx || detail.x);
  const mapSearchUrl = !isNaN(currentLat) && !isNaN(currentLng) && currentLat !== 0 
    ? `https://map.kakao.com/link/map/${encodeURIComponent(detail.name)},${currentLat},${currentLng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(detail.address || detail.name)}`;

  const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(detail.name)}`;

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '680px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}
        >
          ← 뒤로 가기
        </button>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* 공유 버튼 */}
          <button 
            type="button"
            onClick={handleShare}
            style={{ 
              padding: '8px 14px', 
              backgroundColor: '#fff', 
              color: '#334155', 
              border: '1.5px solid #cbd5e1', 
              borderRadius: '20px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            🔗 공유
          </button>

          <button 
            type="button"
            onClick={() => toggleFavorite(detail)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: liked ? '#ef4444' : '#fff', 
              color: liked ? '#fff' : '#ef4444', 
              border: '1.5px solid #ef4444', 
              borderRadius: '20px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {liked ? '❤️ 찜 완료' : '🤍 찜하기'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', color: '#1e293b' }}>{detail.name}</h2>
        <span style={{ 
          fontSize: '12px', padding: '4px 8px', borderRadius: '6px', 
          backgroundColor: detail.source === 'kcisa' ? '#e0f2fe' : '#fef3c7', 
          color: detail.source === 'kcisa' ? '#0369a1' : '#b45309', fontWeight: 'bold' 
        }}>
          {detail.source === 'kcisa' ? '반려동물 시설' : '관광공사 여행지'}
        </span>
      </div>

      {imageList.length > 0 ? (
        <div style={{ position: 'relative', width: '100%', height: '340px', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1e293b', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <img 
            src={imageList[currentImageIdx]} 
            alt={`${detail.name} 슬라이더 이미지 ${currentImageIdx + 1}`} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />

          {imageList.length > 1 && (
            <>
              <button 
                type="button" 
                onClick={handlePrevImage}
                style={{
                  position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                }}
              >
                ‹
              </button>
              <button 
                type="button" 
                onClick={handleNextImage}
                style={{
                  position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                }}
              >
                ›
              </button>
              <div style={{
                position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', zIndex: 10
              }}>
                {currentImageIdx + 1} / {imageList.length}
              </div>
            </>
          )}

          {detail.imageAttribution && (
            <span style={{ 
              position: 'absolute', top: '12px', right: '12px', 
              fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
              padding: '3px 6px', borderRadius: '4px', maxWidth: '80%', 
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', zIndex: 10
            }}>
              {detail.imageAttribution}
            </span>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', height: '180px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '20px', border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>등록된 대표 이미지가 없습니다</span>
        </div>
      )}

      {imageList.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '6px' }}>
          {imageList.map((imgUrl, idx) => (
            <button 
              key={idx}
              type="button"
              onClick={() => setCurrentImageIdx(idx)}
              style={{
                width: '70px', height: '54px', padding: 0, border: currentImageIdx === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, backgroundColor: '#f1f5f9'
              }}
            >
              <img src={imgUrl} alt={`썸네일 ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ lineHeight: '1.7', backgroundColor: '#fff', padding: '18px 20px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ margin: '0 0 8px 0', flex: 1 }}><strong>📍 주소:</strong> {detail.address}</p>
          
          {/* 지도 바로가기 버튼 그룹 */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <a 
              href={mapSearchUrl} 
              target="_blank" 
              rel="noreferrer" 
              style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', textDecoration: 'none', borderRadius: '6px' }}
            >
              카카오맵 ↗
            </a>
            <a 
              href={naverMapUrl} 
              target="_blank" 
              rel="noreferrer" 
              style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', textDecoration: 'none', borderRadius: '6px' }}
            >
              네이버 지도(리뷰) ↗
            </a>
          </div>
        </div>

        <p style={{ margin: '0 0 8px 0' }}><strong>📞 전화번호:</strong> {detail.phone || '정보 미제공'}</p>
        <p style={{ margin: '0 0 8px 0' }}><strong>⏰ 운영시간:</strong> {detail.hours || '현장 또는 전화 문의'}</p>
        {cond.parkingAvailable && (
          <p style={{ margin: '0 0 8px 0' }}><strong>🚗 주차 정보:</strong> {cond.parkingAvailable}</p>
        )}
        {detail.description && (
          <p style={{ margin: '8px 0 0 0', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            {detail.description}
          </p>
        )}
      </div>

      <div style={{ backgroundColor: '#fff', padding: '18px 20px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b', margin: 0 }}>📍 위치 및 동선 관리</h3>
          <button 
            type="button"
            onClick={handleToggleRoute}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: isRouteAdded ? '#10b981' : '#2563eb', 
              color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
            }}
          >
            {isRouteAdded ? '🗺️ 동선에서 제거하기' : '➕ 내 동선에 추가하기'}
          </button>
        </div>
        
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '280px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}
        />
      </div>

      {/* ─── 반려동물 방문 판정 섹션 ─── */}
      {(() => {
        const vetKeywords = ['동물병원', '동물 병원', '동물약국', '수의', '동물의료', '펫클리닉', 'animal hospital', 'veterinary'];
        const isVetOrPharmacy = vetKeywords.some(kw => (detail.name || '').toLowerCase().includes(kw.toLowerCase()))
          || (detail.rawCategory || '').toLowerCase().includes('동물병원')
          || (detail.rawCategory || '').toLowerCase().includes('약국');
        if (isVetOrPharmacy) return null;

        const token = localStorage.getItem('paw_pass_access_token');
        const isLoggedIn = !!token;

        // matchResult가 있으면 API 판정 결과 표시 (로그인 사용자)
        if (matchResult !== null) {
          const status = matchResult?.status || '';
          const isLoading = status === '조회 중...';
          const isError = status === '판정 불가';

          // 상태별 스타일
          const statusStyle = (() => {
            if (status === '가능' || status === '방문 가능') return { bg: '#f0fdf4', border: '#86efac', badge: '#15803d', label: '✅ 방문 가능' };
            if (status === '조건부' || status === '조건부 방문 가능' || status === '조건부 가능') return { bg: '#fffbeb', border: '#fcd34d', badge: '#b45309', label: '⚠️ 조건부 가능' };
            if (status === '불가' || status === '방문 불가') return { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', label: '🚫 방문 불가' };
            return { bg: '#f8fafc', border: '#e2e8f0', badge: '#64748b', label: status || '확인 중...' };
          })();

          return (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐾 내 반려동물 맞춤 방문 판정</h3>
              <div style={{ backgroundColor: statusStyle.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${statusStyle.border}` }}>

                {isLoading ? (
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>⏳ 판정 결과를 불러오는 중...</p>
                ) : isError ? (
                  <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>판정 결과를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
                ) : (
                  <>
                    {/* 판정 결과 뱃지 */}
                    <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', backgroundColor: statusStyle.badge, color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {statusStyle.label}
                    </div>

                    {/* 판정 근거 */}
                    {matchResult?.reason && (
                      <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                        <strong>판정 근거:</strong> {matchResult.reason}
                      </p>
                    )}

                    {/* 시설 원문 정보 - 필드별 라벨 표시 */}
                    {(() => {
                      const pc = detail?.petCondition || {};
                      const fields = [
                        { label: '동반 가능 유형', value: pc.acmpyType },
                        { label: '입장 가능 크기/견종', value: pc.possibleBreeds },
                        { label: '필수 준비물', value: pc.needItem },
                        { label: '기타 안내', value: pc.etcInfo },
                        { label: '관련 구비 시설', value: pc.relaPosesFclty },
                        { label: '관련 비치 품목', value: pc.relaFrnshPrdlst },
                        { label: '관련 구매 품목', value: pc.relaPurcPrdlst },
                        { label: '관련 렌탈 품목', value: pc.relaRntlPrdlst },
                        { label: '동반 안내 규정', value: pc.petPolicy },
                        { label: '입장 제한 조건', value: pc.petRestriction },
                        { label: '시설 비치물품', value: pc.petAmenities },
                      ].filter(f => f.value && f.value.trim() !== '');

                      if (fields.length === 0 && !matchResult?.rawText) return null;

                      return (
                        <div style={{ backgroundColor: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0', fontWeight: 'bold' }}>📄 시설 원문 정보</p>
                          {fields.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {fields.map((f, i) => (
                                <p key={i} style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                                  <strong style={{ color: '#334155' }}>{f.label}:</strong> {f.value}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '13px', color: '#475569', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.7' }}>{matchResult.rawText}</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* 조건부 팁 */}
                    {(status === '조건부' || status === '조건부 방문 가능' || status === '조건부 가능') && matchResult?.tips && (
                      <ConditionalBadge tips={matchResult.tips} />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        }

        // 비로그인: 게스트 펫 프로필 기반 판정
        let guestStatus = '동반 확인 필요';
        let guestReason = '방문 판정을 위해 반려동물 프로필을 등록해주세요.';
        let guestBg = '#f8fafc';
        let guestBorder = '#e2e8f0';
        let guestBadge = '#64748b';
        let guestLabel = '확인 필요';

        // 로컬 스토리지에서 게스트 펫 읽기
        let effectiveSizeHint = guestSizeHint;
        let guestPetName = '';
        try {
          const storedPets = [
            ...JSON.parse(localStorage.getItem('paw_pass_pets_guest') || '[]'),
            ...JSON.parse(localStorage.getItem('paw_pass_pets') || '[]'),
          ];
          if (storedPets.length > 0) {
            const rep = storedPets.find(p => p.isPrimary || p.is_primary || p.isRepresentative || p.is_representative) || storedPets[0];
            guestPetName = rep.name || '';
            if (!effectiveSizeHint && rep.size) {
              const sizeMap = { '소형': 'small', '중형': 'medium', '대형': 'large', 'SMALL': 'small', 'MEDIUM': 'medium', 'LARGE': 'large' };
              effectiveSizeHint = sizeMap[rep.size] || '';
            }
          }
        } catch (e) {
          // 무시
        }

        if (effectiveSizeHint) {
          const possibleSize = (cond.possibleBreeds || '').toLowerCase();
          const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' }[effectiveSizeHint] || effectiveSizeHint;
          const petLabel = guestPetName ? `${guestPetName}(${sizeLabel})` : sizeLabel;
          const deniedBySize =
            (effectiveSizeHint === 'large' && possibleSize.includes('소형')) ||
            (effectiveSizeHint === 'large' && possibleSize.includes('중형') && !possibleSize.includes('대형')) ||
            (effectiveSizeHint === 'medium' && possibleSize.includes('소형') && !possibleSize.includes('중형') && !possibleSize.includes('대형'));

          if (!possibleSize || possibleSize.trim() === '') {
            guestLabel = '⚠️ 조건부 가능';
            guestReason = `시설의 명확한 크기 제한 정보가 없습니다. ${petLabel} 동반 시 사전 문의가 권장됩니다.`;
            guestBg = '#fffbeb'; guestBorder = '#fcd34d'; guestBadge = '#b45309';
          } else if (deniedBySize) {
            guestLabel = '🚫 방문 불가';
            guestReason = `이 시설은 ${petLabel}의 출입을 제한하고 있습니다. (규정: ${cond.possibleBreeds})`;
            guestBg = '#fef2f2'; guestBorder = '#fca5a5'; guestBadge = '#dc2626';
          } else {
            guestLabel = '⚠️ 조건부 가능';
            guestReason = `${petLabel} 크기 조건은 충족하지만, 반려용품 소지 여부를 확인할 수 없어 사전 문의를 권장합니다.`;
            guestBg = '#fffbeb'; guestBorder = '#fcd34d'; guestBadge = '#b45309';
          }
        } else if (guestPetName) {
          guestLabel = '⚠️ 조건부 가능';
          guestReason = `${guestPetName} 동반 관련 상세 조건은 시설에 직접 문의해주세요.`;
          guestBg = '#fffbeb'; guestBorder = '#fcd34d'; guestBadge = '#b45309';
        }

        return (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐾 반려동물 방문 판정</h3>
            <div style={{ backgroundColor: guestBg, padding: '16px', borderRadius: '12px', border: `1px solid ${guestBorder}` }}>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', backgroundColor: guestBadge, color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                {guestLabel}
              </div>
              <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.6' }}>
                <strong>판정 근거:</strong> {guestReason}
              </p>
            </div>
          </div>
        );
      })()}


      <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐶 반려동물 동반 조건 안내</h3>
      <div style={{ backgroundColor: '#f0fdf4', padding: '18px 20px', borderRadius: '12px', border: '1px solid #bbf7d0', lineHeight: '1.7', color: '#166534' }}>
        {detail.source === 'tourapi' ? (
          <>
            <p style={{ margin: '0 0 8px 0' }}><strong>동반 가능 유형:</strong> {cond.acmpyType || '현장 문의 필요'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>입장 가능 크기/견종:</strong> {cond.possibleBreeds || '제한 없음 (현장 확인 권장)'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>필수 준비물:</strong> {cond.needItem || '목줄 및 배변봉투 지참'}</p>
            {cond.etcInfo && (
              <p style={{ margin: '0 0 8px 0' }}><strong>기타 안내:</strong> {cond.etcInfo}</p>
            )}
            
            {cond.relaPosesFclty && (
              <p style={{ margin: '0 0 8px 0' }}><strong>관련 구비 시설:</strong> {cond.relaPosesFclty}</p>
            )}
            {cond.relaFrnshPrdlst && (
              <p style={{ margin: '0 0 8px 0' }}><strong>관련 비치 품목:</strong> {cond.relaFrnshPrdlst}</p>
            )}
            {cond.relaPurcPrdlst && (
              <p style={{ margin: '0 0 8px 0' }}><strong>관련 구매 품목:</strong> {cond.relaPurcPrdlst}</p>
            )}
            {cond.relaRntlPrdlst && (
              <p style={{ margin: '0 0 8px 0' }}><strong>관련 렌탈 품목:</strong> {cond.relaRntlPrdlst}</p>
            )}
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 8px 0' }}><strong>동반 안내 규정:</strong> {cond.petPolicy || '현장 규정 확인 필요'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>입장 제한 조건:</strong> {cond.petRestriction || '특이 제한 없음'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>시설 비치물품:</strong> {cond.petAmenities || '기본 지참 필요'}</p>
          </>
        )}
      </div>

      <SpotChecklist />

    </div>
  );
}

export default DetailPage;