// src/pages/DetailPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSpotDetail } from '../hooks/useSpotDetail';
import { useFavoritesContext as useFavorites } from '../contexts/FavoritesContext';
import { usePetMatching } from '../hooks/usePetMatching';

import { loadKakaoMapSdk } from '../utils/kakaoMapLoader';
import ConditionalBadge from '../components/ConditionalBadge';
import { toast } from '../utils/toast';

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
  const petIdFromQuery = searchParams.get('petId') || location.state?.petId || '';
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
        // 동물병원·약국은 반려동물이 '치료받으러 가는 곳'이므로 동반 판정 불필요
        const vetKeywords = ['동물병원', '동물 병원', '동물약국', '수의', '동물의료', '펫클리닉', 'animal hospital', 'veterinary'];
        const isVetOrPharmacy = vetKeywords.some(kw => (detail.name || '').toLowerCase().includes(kw.toLowerCase()))
          || (detail.rawCategory || '').toLowerCase().includes('동물병원')
          || (detail.rawCategory || '').toLowerCase().includes('약국');
        if (isVetOrPharmacy) return null;

        // 로그인 + petId 있음 → AI 기반 판정 표시
        if (matchResult && petIdFromQuery) {
          return (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐾 내 반려동물 맞춤 방문 판정</h3>
              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: matchResult.color || '#0284c7', margin: '0 0 6px 0' }}>
                  판정 결과: {matchResult.status}
                </p>
                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 10px 0' }}>
                  <strong>판정 요약:</strong> {matchResult.reason}
                </p>
                {matchResult.rawText && (
                  <div style={{ backgroundColor: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 'bold' }}>📄 시설 원문 정보:</p>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, whiteSpace: 'pre-line' }}>{matchResult.rawText}</p>
                  </div>
                )}
                {(matchResult.status === '조건부' || matchResult.status === '조건부 방문 가능' || matchResult.status === '조건부 가능') && matchResult.tips && (
                  <ConditionalBadge tips={matchResult.tips} />
                )}
              </div>
            </div>
          );
        }

        // 2. 비로그인 + 크기 힌트 있음 → 자체 판정 로직 적용 (useTouristSpots와 유사)
        let guestStatus = '동반 확인 필요';
        let guestReason = '반려동물 크기 정보가 선택되지 않았거나, 시설의 동반 규정 정보가 부족합니다.';
        let guestColor = '#64748b';

        if (guestSizeHint) {
          const possibleSize = (cond.possibleBreeds || cond.relaAcmpyEntEnterPrn || '').toLowerCase();
          const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' }[guestSizeHint];

          if (!possibleSize || possibleSize.trim() === '') {
            guestStatus = '조건부 가능';
            guestReason = `시설의 명확한 크기 제한 정보가 없습니다. 단, 반려용품이 필요할 수 있으므로 ${sizeLabel} 동반 시 사전 문의가 권장됩니다.`;
            guestColor = '#d97706';
          } else {
            const deniedBySize =
              (guestSizeHint === 'large' && possibleSize.includes('소형')) ||
              (guestSizeHint === 'large' && possibleSize.includes('중형') && !possibleSize.includes('대형')) ||
              (guestSizeHint === 'medium' && possibleSize.includes('소형') && !possibleSize.includes('중형') && !possibleSize.includes('대형'));

            if (deniedBySize) {
              guestStatus = '방문 불가';
              guestReason = `이 시설은 ${sizeLabel}의 출입을 제한하고 있습니다. (규정: ${cond.possibleBreeds})`;
              guestColor = '#dc2626';
            } else {
              guestStatus = '조건부 가능';
              guestReason = `${sizeLabel} 크기 조건은 충족하지만, 비로그인 상태에서는 반려용품 소지 여부를 확인할 수 없어 '조건부 가능'으로 안내해 드립니다.`;
              guestColor = '#d97706';
            }
          }
        }

        // 비로그인 or 펫 미선택 렌더링
        return (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐾 반려동물 방문 판정</h3>
            <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <p style={{ fontSize: '15px', fontWeight: 'bold', color: guestColor, margin: '0 0 6px 0' }}>
                판정 결과: {guestStatus}
              </p>
              <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 16px 0' }}>
                <strong>판정 요약:</strong> {guestReason}
              </p>

              <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '8px', border: '1px dashed #93c5fd' }}>
                <p style={{ fontSize: '13px', color: '#1e40af', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  💡 정확한 AI 맞춤 판정을 원하시나요?
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                  프로필을 등록하면 체중뿐만 아니라 유모차, 이동장 등 내가 가진 반려용품까지 고려하여 정확한 방문 가능 여부를 알려드려요!
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  🐾 내 반려동물 프로필 등록하기
                </button>
              </div>
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
              <p style={{ margin: '0' }}><strong>기타 안내:</strong> {cond.etcInfo}</p>
            )}
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 8px 0' }}><strong>동반 안내 규정:</strong> {cond.petPolicy || '현장 규정 확인 필요'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>입장 제한 조건:</strong> {cond.petRestriction || '특이 제한 없음'}</p>
            <p style={{ margin: '0' }}><strong>시설 비치물품:</strong> {cond.petAmenities || '기본 지참 필요'}</p>
          </>
        )}
      </div>

    </div>
  );
}

export default DetailPage;