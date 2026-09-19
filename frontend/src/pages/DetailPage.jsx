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
      icon: '📄',
      items: [
        { label: '등록증 및 증명서 지참', desc: '내장칩 등록 번호 또는 동물등록증, (필요시) 광견병 예방접종 증명서 지참 여부 확인' },
        { label: '체중 및 견종 제한 재확인', desc: '대형견 출입 가능 여부, 맹견류 제한 규정, 체중 기준(예: 15kg 이하 등) 충족 여부 확인' },
        { label: '실내외 동반 구역 확인', desc: '식당·카페의 경우 실내 동반 가능 여부와 전용 테라스/야외 좌석만 허용되는지 사전 파악' }
      ]
    },
    {
      category: '2. 현장 변수 대비 준비물',
      icon: '🎒',
      items: [
        { label: '배변 용품 및 매너 툴', desc: '배변봉투, 반려견 전용 물티슈, 실내 마킹 대비 매너벨트(기저귀) 준비' },
        { label: '이동장 및 하네스', desc: '리드줄(목줄/가슴줄) 규정 확인 (자동줄 제한 여부) 및 필요시 전용 이동장(케이지) 또는 유모차 지참' },
        { label: '급수 및 식사 도구', desc: '낯선 환경에서 반려견이 안정을 찾을 수 있는 개인 물그릇 및 평소 먹던 간식/사료 준비' }
      ]
    },
    {
      category: '3. 운영 시간 및 변동성 체크',
      icon: '⏰',
      items: [
        { label: '실시간 영업 정보 확인', desc: '공식 홈페이지나 SNS를 통한 임시 휴무, 대관 행사, 시즌별 운영 시간 변경 여부 최종 확인' },
        { label: '날씨 및 환경 변수 점검', desc: '야외 관광지의 경우 기상 악화(우천, 폭염 등) 시 이용 제한 여부 사전 파악' }
      ]
    }
  ];

  let totalItemsCount = 0;
  checklistData.forEach(s => { totalItemsCount += s.items.length; });
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalItemsCount > 0 ? Math.round((checkedCount / totalItemsCount) * 100) : 0;

  let globalItemIdx = 0;

  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      borderRadius: '24px', 
      padding: '28px', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginTop: '28px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span> 헛걸음 방지 사전 체크리스트
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            소중한 반려견과 출발하기 전, 필수 준비 항목을 점검해보세요!
          </p>
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          backgroundColor: '#f8fafc', 
          padding: '6px 14px', 
          borderRadius: '20px', 
          border: '1px solid #e2e8f0',
          fontSize: '12.5px',
          fontWeight: 'bold',
          color: '#5F50A9'
        }}>
          진행도 {checkedCount}/{totalItemsCount} ({progressPercent}%)
        </div>
      </div>

      {/* 진행 바 */}
      <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ 
          width: `${progressPercent}%`, 
          height: '100%', 
          backgroundColor: '#5F50A9', 
          borderRadius: '10px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}></div>
      </div>
      
      {checklistData.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: sIdx === checklistData.length - 1 ? '0' : '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{section.icon}</span> {section.category}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {section.items.map((item) => {
              const currentIndex = globalItemIdx++;
              const isChecked = !!checkedItems[currentIndex];
              return (
                <label 
                  key={currentIndex} 
                  onClick={() => toggleCheck(currentIndex)}
                  style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: '12px', 
                    cursor: 'pointer', 
                    padding: '12px 16px', 
                    backgroundColor: isChecked ? 'rgba(95, 80, 169, 0.06)' : '#f8fafc', 
                    borderRadius: '14px', 
                    border: isChecked ? '1.5px solid #5F50A9' : '1px solid #e2e8f0', 
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => {}}
                    style={{ marginTop: '3px', accentColor: '#5F50A9', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      display: 'block', fontSize: '13.5px', fontWeight: '700', 
                      color: isChecked ? '#5F50A9' : '#1e293b',
                      textDecoration: isChecked ? 'line-through' : 'none'
                    }}>
                      {item.label}
                    </span>
                    <span style={{ 
                      display: 'block', fontSize: '12px', color: isChecked ? '#64748b' : '#64748b', marginTop: '2px',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      lineHeight: '1.5'
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
      <div style={{ padding: '100px 20px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '40px', marginBottom: '14px' }}>🐾</div>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>장소 상세 정보를 실시간으로 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '80px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '14px' }}>⚠️</div>
        <p style={{ color: '#ef4444', marginBottom: '24px', fontWeight: 'bold', fontSize: '16px' }}>
          {error || '장소 정보를 찾을 수 없습니다.'}
        </p>
        <button type="button" onClick={() => navigate(-1)} 
          style={{ padding: '12px 26px', backgroundColor: '#5F50A9', color: '#fff', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 14px rgba(95,80,169,0.3)' }}
        >
          ← 이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  const liked = isFavorite(detail.id || detail.contentId);
  const cond = detail.petCondition || {};

  const previewImage = location.state?.previewImage;
  let imageList = Array.isArray(detail.images) ? [...detail.images] : [];
  
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

  const getDetailPlaceholder = () => {
    const cat = String(detail.category || detail.rawCategory || detail.type || detail.contentTypeId || detail.category_name || detail.part_name || '').toUpperCase();
    const title = String(detail.name || detail.title || '').toLowerCase();
    const hint = String(location.state?.categoryHint || '').toUpperCase();
    
    // ── 1. 동물병원 / 반려의료 (HOSPITAL) ──
    if (
      cat.includes('HOSPITAL') || cat.includes('병원') || cat.includes('의료') || cat.includes('약국') || cat.includes('클리닉') || cat.includes('반려의료') ||
      hint.includes('HOSPITAL') || hint.includes('병원') || hint.includes('의료') ||
      title.includes('동물병원') || title.includes('병원') || title.includes('약국') || title.includes('클리닉') ||
      title.includes('메디컬') || title.includes('수의') || title.includes('동물의료')
    ) {
      return '/images/placeholders/HOSPITAL.png';
    }

    // ── 2. 숙박 / 펜션 / 호텔 / 캠핑 (STAY) ──
    if (
      cat.includes('STAY') || cat.includes('숙박') || cat.includes('펜션') || cat.includes('호텔') || cat.includes('리조트') || cat.includes('글램핑') || cat.includes('캠핑') || cat === '32' || cat.includes('B02') ||
      hint.includes('STAY') || hint.includes('숙박') || hint.includes('펜션') || hint.includes('호텔') || hint.includes('캠핑') ||
      title.includes('펜션') || title.includes('호텔') || title.includes('리조트') || title.includes('글램핑') ||
      title.includes('캠핑') || title.includes('민박') || title.includes('스테이') || title.includes('모텔') ||
      title.includes('야영장') || title.includes('카라반') || title.includes('게스트하우스') || title.includes('풀빌라')
    ) {
      return '/images/placeholders/STAY.png';
    }

    // ── 3. 카페 / 디저트 / 베이커리 / 젤라또 / 커피 (CAFE) ──
    // ※ 중요: 한국관광공사(TourAPI)에서 카페는 contentTypeId=39(음식점) 또는 cat1=A05로 분류되므로,
    // 음식점(FOOD) 판정보다 먼저 카페 키워드(상호명/서브카테고리/검색필터힌트)를 검사해야 합니다.
    const isCafe = (
      cat.includes('CAFE') || cat.includes('카페') || cat.includes('커피') || cat.includes('디저트') || cat.includes('베이커리') || cat.includes('A0502') || cat.includes('음료') || cat.includes('제과') ||
      hint.includes('CAFE') || hint.includes('카페') || hint.includes('커피') || hint.includes('디저트') || hint.includes('베이커리') ||
      title.includes('카페') || title.includes('커피') || title.includes('cafe') || title.includes('coffee') ||
      title.includes('베이커리') || title.includes('bakery') || title.includes('브레드') || title.includes('bread') ||
      title.includes('디저트') || title.includes('dessert') || title.includes('젤라또') || title.includes('gelato') ||
      title.includes('아이스크림') || title.includes('icecream') || title.includes('빙수') ||
      title.includes('빵') || title.includes('케이크') || title.includes('케익') || title.includes('cake') ||
      title.includes('도넛') || title.includes('도너츠') || title.includes('donut') || title.includes('doughnut') ||
      title.includes('마카롱') || title.includes('macaron') || title.includes('와플') || title.includes('waffle') ||
      title.includes('크로플') || title.includes('croffle') || title.includes('크루아상') || title.includes('croissant') ||
      title.includes('쿠키') || title.includes('cookie') || title.includes('스콘') || title.includes('scone') ||
      title.includes('타르트') || title.includes('tart') || title.includes('베이크') || title.includes('bake') ||
      title.includes('찻집') || title.includes('다원') || title.includes('다방') || title.includes('티룸') || title.includes('tea') ||
      title.includes('에스프레소') || title.includes('espresso') || title.includes('라떼') || title.includes('latte') ||
      title.includes('로스터') || title.includes('roaster') || title.includes('브리즈') || title.includes('가배') ||
      title.includes('밀크티') || title.includes('초콜릿') || title.includes('쇼콜라')
    );
    if (isCafe) {
      return '/images/placeholders/CAFE.png';
    }

    // ── 4. 문화 / 예술 / 전시 / 박물관 / 체험 (CULTURE) ──
    if (
      cat.includes('CULTURE') || cat.includes('문화') || cat.includes('예술') || cat.includes('미술') || cat.includes('박물관') || cat.includes('전시') || cat === '14' || cat === '15' || cat.includes('A02') ||
      hint.includes('CULTURE') || hint.includes('문화') || hint.includes('전시') ||
      title.includes('전시관') || title.includes('박물관') || title.includes('미술관') || title.includes('과학관') ||
      title.includes('연구소') || title.includes('기념관') || title.includes('생태관') || title.includes('체험관') ||
      title.includes('수족관') || title.includes('아쿠아리움') || title.includes('홍보관') || title.includes('갤러리') ||
      title.includes('극장') || title.includes('아트') || title.includes('테마파크') || title.includes('랜드') ||
      title.includes('목장') || title.includes('사찰') || title.includes('서원') || title.includes('향교') || title.includes('유적')
    ) {
      return '/images/placeholders/CULTURE.png';
    }

    // ── 5. 자연 / 풍경 / 야외 공원 (NATURE) ──
    if (
      cat.includes('NATURE') || cat.includes('자연') || cat.includes('풍경') || cat.includes('공원') || cat.includes('관광지') || cat.includes('휴양림') || cat === '12' || cat === '28' || cat.includes('A01') || cat.includes('A03') ||
      hint.includes('NATURE') || hint.includes('자연') || hint.includes('풍경') ||
      title.includes('공원') || title.includes('산책') || title.includes('휴양림') || title.includes('해수욕장') ||
      title.includes('숲') || title.includes('계곡') || title.includes('수목원') || title.includes('해변') ||
      title.includes('둘레길') || title.includes('등산로') || title.includes('폭포') || title.includes('호수') ||
      title.includes('저수지') || title.includes('섬') || title.includes('해안') || title.includes('바다') ||
      title.includes('전망대') || title.includes('유원지')
    ) {
      return '/images/placeholders/NATURE.png';
    }

    // ── 6. 음식점 / 맛집 / 식당 (FOOD) ──
    if (
      cat.includes('FOOD') || cat.includes('음식') || cat.includes('식당') || cat.includes('맛집') || cat.includes('레스토랑') || cat.includes('식음료') || cat === '39' || cat.includes('A05') ||
      hint.includes('FOOD') || hint.includes('음식') || hint.includes('식당') ||
      title.includes('식당') || title.includes('갈비') || title.includes('가든') || title.includes('밥집') ||
      title.includes('구이') || title.includes('한식') || title.includes('중식') || title.includes('일식') ||
      title.includes('양식') || title.includes('치킨') || title.includes('피자') || title.includes('버거') ||
      title.includes('삼겹살') || title.includes('불고기') || title.includes('고깃집') || title.includes('정육') ||
      title.includes('국밥') || title.includes('횟집') || title.includes('생선회') || title.includes('숙성회') ||
      title.includes('주막') || title.includes('포차') || title.includes('키친') || title.includes('테이블') ||
      title.includes('돈까스') || title.includes('돈가스') || title.includes('초밥') || title.includes('칼국수') ||
      title.includes('파스타') || title.includes('찌개') || title.includes('탕') || title.includes('찜') ||
      title.includes('보쌈') || title.includes('족발') || title.includes('순대') || title.includes('냉면') ||
      title.includes('국수') || title.includes('짬뽕') || title.includes('짜장') ||
      ((title.includes('고기') || title.includes('육류')) && !title.includes('물고기') && !title.includes('민물고기'))
    ) {
      return '/images/placeholders/FOOD.png';
    }

    return '/images/placeholders/DEFAULT.png';
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

      <div className="pawpass-detail-container" style={{ padding: '30px 20px 80px 20px', maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <style>{`
          .detail-top-btn {
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }
          .detail-top-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          }
          .detail-top-btn:active {
            transform: translateY(0);
          }
          @media (max-width: 900px) {
            .detail-grid-layout {
              grid-template-columns: 1fr !important;
            }
            .detail-sticky-sidebar {
              position: static !important;
              top: auto !important;
            }
          }
        `}</style>
        
        {/* 상단 네비게이션 및 액션 바 */}
        <div className="detail-top-nav-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <button 
            type="button" 
            className="detail-top-btn detail-back-btn" 
            onClick={() => navigate(-1)} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '9px 18px', 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: '700', 
              color: '#334155', 
              fontSize: '13.5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            ← 뒤로 가기
          </button>
          
          <div className="detail-top-action-group" style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="detail-top-btn" 
              onClick={handleShare}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '9px 18px', 
                backgroundColor: '#fff', 
                color: '#334155', 
                border: '1px solid #e2e8f0', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontWeight: '700', 
                fontSize: '13.5px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              🔗 공유하기
            </button>

            <button 
              type="button" 
              className="detail-top-btn" 
              onClick={() => toggleFavorite(detail)}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '9px 20px', 
                backgroundColor: liked ? '#F79DC4' : '#fff', 
                color: liked ? '#fff' : '#d14d83', 
                border: liked ? 'none' : '1.5px solid #F79DC4', 
                borderRadius: '50px', 
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '13.5px',
                boxShadow: liked ? '0 4px 14px rgba(247, 157, 196, 0.45)' : '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              {liked ? '❤️ 즐겨찾기 완료' : '🤍 즐겨찾기'}
            </button>
          </div>
        </div>

        {/* 타이틀 및 메타 헤더 */}
        <div className="detail-meta-header" style={{ marginBottom: '24px' }}>
          <div className="detail-badge-action-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <div className="detail-badges-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="detail-source-badge" style={{ 
                fontSize: '12px', padding: '4px 10px', borderRadius: '50px', 
                backgroundColor: detail.source === 'kcisa' ? '#e0f2fe' : '#fef3c7', 
                color: detail.source === 'kcisa' ? '#0369a1' : '#b45309', fontWeight: '800' 
              }}>
                {detail.source === 'kcisa' ? '🏥 한국문화정보원' : '🏞️ 한국관광공사'}
              </span>
              {detail.rawCategory && (
                <span className="detail-category-badge" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '50px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700' }}>
                  {detail.rawCategory}
                </span>
              )}
            </div>

            {/* 모바일에서 한국문화정보원 배지와 같은 선상에 놓이는 액션 버튼 그룹 */}
            <div className="detail-mobile-action-group" style={{ display: 'none' }}>
              <button 
                type="button" 
                className="detail-top-btn" 
                onClick={handleShare}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '6px 12px', 
                  backgroundColor: '#fff', 
                  color: '#334155', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '50px', 
                  cursor: 'pointer', 
                  fontWeight: '700', 
                  fontSize: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                🔗 공유
              </button>

              <button 
                type="button" 
                className="detail-top-btn" 
                onClick={() => toggleFavorite(detail)}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '6px 13px', 
                  backgroundColor: liked ? '#F79DC4' : '#fff', 
                  color: liked ? '#fff' : '#d14d83', 
                  border: liked ? 'none' : '1.5px solid #F79DC4', 
                  borderRadius: '50px', 
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '12px',
                  boxShadow: liked ? '0 3px 10px rgba(247, 157, 196, 0.4)' : '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                {liked ? '❤️ 찜완료' : '🤍 찜하기'}
              </button>
            </div>
          </div>

          <h1 className="detail-title" style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>
            {detail.name}
          </h1>
          <p className="detail-address" style={{ margin: 0, fontSize: '15px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📍</span> {detail.address}
          </p>
        </div>

        {/* 📸 에어비앤비 스타일 메인 포토 갤러리 */}
        {imageList.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '440px', marginBottom: '32px', borderRadius: '28px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.08)' }}>
            <img 
              src={imageList[currentImageIdx]} 
              alt={`${detail.name} 대표 사진 ${currentImageIdx + 1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              onError={(e) => { e.currentTarget.src = getDetailPlaceholder(); }}
            />

            {imageList.length > 1 && (
              <>
                <button type="button" onClick={handlePrevImage}
                  style={{
                    position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255,255,255,0.85)', color: '#1e293b', border: 'none', borderRadius: '50%',
                    width: '42px', height: '42px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)', transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.85)'}
                >
                  ‹
                </button>
                <button type="button" onClick={handleNextImage}
                  style={{
                    position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255,255,255,0.85)', color: '#1e293b', border: 'none', borderRadius: '50%',
                    width: '42px', height: '42px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)', transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.85)'}
                >
                  ›
                </button>
                <div style={{
                  position: 'absolute', bottom: '16px', right: '16px',
                  backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', padding: '6px 14px', borderRadius: '50px', fontSize: '12.5px', fontWeight: 'bold', zIndex: 10, backdropFilter: 'blur(6px)'
                }}>
                  {currentImageIdx + 1} / {imageList.length}
                </div>
              </>
            )}

            {detail.imageAttribution && (
              <span style={{ 
                position: 'absolute', top: '16px', right: '16px', 
                fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', 
                padding: '4px 10px', borderRadius: '50px', maxWidth: '80%', 
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', zIndex: 10, backdropFilter: 'blur(6px)'
              }}>
                📷 {detail.imageAttribution}
              </span>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '360px', marginBottom: '32px', borderRadius: '28px', overflow: 'hidden', backgroundColor: '#f1f5f9', boxShadow: '0 15px 35px rgba(0,0,0,0.08)' }}>
            <img 
              src={getDetailPlaceholder()} 
              alt={detail.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* 썸네일 스트립 */}
        {imageList.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '6px' }}>
            {imageList.map((imgUrl, idx) => (
              <button key={idx} type="button" onClick={() => setCurrentImageIdx(idx)}
                style={{
                  width: '84px', height: '60px', padding: 0, 
                  border: currentImageIdx === idx ? '3px solid #5F50A9' : '1px solid #e2e8f0', 
                  borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, backgroundColor: '#f1f5f9', 
                  boxShadow: currentImageIdx === idx ? '0 4px 12px rgba(95,80,169,0.3)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  opacity: currentImageIdx === idx ? 1 : 0.75
                }}
              >
                <img src={imgUrl} alt={`썸네일 ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/images/placeholders/DEFAULT.png'; }} />
              </button>
            ))}
          </div>
        )}

        {/* 2열 그리드 메인 레이아웃 */}
        <div className="detail-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '32px', alignItems: 'start' }}>
          
          {/* 👈 좌측 메인 정보 컬럼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* 1. 🐾 내 반려동물 맞춤 방문 판정 카드 */}
            {(() => {
              const vetKeywords = ['동물병원', '동물 병원', '동물약국', '수의', '동물의료', '펫클리닉', 'animal hospital', 'veterinary'];
              const isVetOrPharmacy = vetKeywords.some(kw => (detail.name || '').toLowerCase().includes(kw.toLowerCase()))
                || (detail.rawCategory || '').toLowerCase().includes('동물병원')
                || (detail.rawCategory || '').toLowerCase().includes('약국');
              if (isVetOrPharmacy) return null;

              if (matchResult !== null) {
                const status = matchResult?.status || '';
                const isCheckLoading = status === '조회 중...';
                const isCheckError = status === '판정 불가';

                const statusStyle = (() => {
                  if (status === '가능' || status === '방문 가능') return { bg: '#f0fdf4', border: '#bbf7d0', badge: '#15803d', label: '✅ 방문 가능' };
                  if (status === '조건부' || status === '조건부 방문 가능' || status === '조건부 가능') return { bg: '#fffbeb', border: '#fde68a', badge: '#b45309', label: '⚠️ 조건부 가능' };
                  if (status === '불가' || status === '방문 불가') return { bg: '#fef2f2', border: '#fecaca', badge: '#dc2626', label: '🚫 방문 불가' };
                  return { bg: '#f8fafc', border: '#e2e8f0', badge: '#64748b', label: status || '확인 중...' };
                })();

                return (
                  <div style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '24px', 
                    padding: '26px', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(226, 232, 240, 0.8)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🐾</span> 내 반려동물 맞춤 방문 판정
                      </h3>
                      <span style={{ 
                        padding: '6px 14px', borderRadius: '50px', 
                        backgroundColor: statusStyle.badge, color: '#fff', 
                        fontSize: '13px', fontWeight: '800' 
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {isCheckLoading ? (
                      <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>⏳ 판정 결과를 분석하는 중입니다...</p>
                    ) : isCheckError ? (
                      <p style={{ fontSize: '14px', color: '#dc2626', margin: 0 }}>판정 결과를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {matchResult?.reason && (
                          <div style={{ backgroundColor: statusStyle.bg, border: `1px solid ${statusStyle.border}`, padding: '14px 16px', borderRadius: '16px' }}>
                            <p style={{ fontSize: '13.5px', color: '#334155', margin: 0, lineHeight: '1.6' }}>
                              <strong style={{ color: '#1e293b' }}>💡 판정 근거:</strong> {matchResult.reason}
                            </p>
                          </div>
                        )}

                        {/* 시설 원문 정보 */}
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
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 10px 0', fontWeight: '800' }}>📄 시설 공식 반려동물 정책</p>
                              {fields.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                  {fields.map((f, i) => (
                                    <div key={i} style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                      <span style={{ fontWeight: '700', color: '#334155', marginRight: '6px' }}>• {f.label}:</span>
                                      <span>{f.value}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '13px', color: '#475569', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.6' }}>{matchResult.rawText}</p>
                              )}
                            </div>
                          );
                        })()}

                        {(status === '조건부' || status === '조건부 방문 가능' || status === '조건부 가능') && matchResult?.tips && (
                          <ConditionalBadge tips={matchResult.tips} />
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // 비로그인 / 게스트 판정
              let guestReason = '방문 판정을 위해 반려동물 프로필을 등록해주세요.';
              let guestBg = '#f8fafc';
              let guestBorder = '#e2e8f0';
              let guestBadge = '#64748b';
              let guestLabel = '확인 필요';

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
              } catch {
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
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '24px', 
                  padding: '26px', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🐾</span> 반려동물 방문 판정
                    </h3>
                    <span style={{ 
                      padding: '6px 14px', borderRadius: '50px', 
                      backgroundColor: guestBadge, color: '#fff', 
                      fontSize: '13px', fontWeight: '800' 
                    }}>
                      {guestLabel}
                    </span>
                  </div>
                  <div style={{ backgroundColor: guestBg, border: `1px solid ${guestBorder}`, padding: '14px 16px', borderRadius: '16px' }}>
                    <p style={{ fontSize: '13.5px', color: '#334155', margin: 0, lineHeight: '1.6' }}>
                      <strong>💡 판정 근거:</strong> {guestReason}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 2. 🏛️ 장소 소개 및 상세 시설 정보 */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              padding: '28px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> 장소 상세 정보
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>📞 전화번호</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{detail.phone || '정보 미제공'}</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>⏰ 운영시간</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{detail.hours || '현장 또는 전화 문의'}</div>
                </div>

                {cond.parkingAvailable && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>🚗 주차 여부</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{cond.parkingAvailable}</div>
                  </div>
                )}
              </div>

              {detail.description && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#334155', margin: '0 0 8px 0' }}>장소 소개</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                    {detail.description}
                  </p>
                </div>
              )}
            </div>

            {/* 3. ✅ 헛걸음 방지 체크리스트 */}
            <SpotChecklist />

          </div>

          {/* 👉 우측 스티키 사이드바 (지도 및 동선 관리) */}
          <div className="detail-sticky-sidebar" style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 위치 및 지도 카드 */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              padding: '24px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📍</span> 위치 안내
                </h3>
              </div>

              {/* 카카오 지도 뷰어 */}
              <div 
                ref={mapContainerRef} 
                style={{ width: '100%', height: '240px', borderRadius: '18px', backgroundColor: '#f1f5f9', marginBottom: '16px', overflow: 'hidden' }}
              />

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                <strong>주소:</strong> {detail.address}
              </p>

              {/* 지도 앱 바로가기 버튼 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <a 
                  href={mapSearchUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    padding: '10px 12px', 
                    backgroundColor: '#A2B9EE', 
                    color: '#1e3a8a', 
                    fontWeight: '800', 
                    fontSize: '12.5px', 
                    textDecoration: 'none', 
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(162, 185, 238, 0.3)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                >
                  카카오맵 ↗
                </a>
                <a 
                  href={naverMapUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    padding: '10px 12px', 
                    backgroundColor: '#CBF5AF', 
                    color: '#166534', 
                    fontWeight: '800', 
                    fontSize: '12.5px', 
                    textDecoration: 'none', 
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(203, 245, 175, 0.3)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                >
                  네이버 지도 ↗
                </a>
              </div>

              {/* 동선 추가/제거 버튼 */}
              <button 
                type="button" 
                onClick={handleToggleRoute}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  backgroundColor: isRouteAdded ? '#f1f5f9' : '#5F50A9', 
                  color: isRouteAdded ? '#475569' : '#ffffff', 
                  border: isRouteAdded ? '1.5px solid #cbd5e1' : 'none', 
                  borderRadius: '16px', 
                  cursor: 'pointer', 
                  fontWeight: '800', 
                  fontSize: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  boxShadow: isRouteAdded ? 'none' : '0 6px 20px rgba(95, 80, 169, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                {isRouteAdded ? '🗺️ 여행 동선에서 제거하기' : '✨ 여행 동선에 추가하기'}
              </button>
            </div>

            {/* 빠른 도움말 카드 */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              padding: '20px 24px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>💡</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>PawPass 여행 TIP</span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: '1.6' }}>
                출발 전 시설의 최신 공지 및 임시 휴무일을 공식 채널에서 한 번 더 확인하시면 더욱 즐거운 여행이 됩니다.
              </p>
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default DetailPage;