import { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../config/env';
import { authFetch } from '../services/api';

export default function LazyImage({ spot = {}, fallback = '🖼️ 이미지 준비중', categoryHint = '', style, attrStyle }) {
  const imgRef = useRef(null);

  const initialImageUrl = spot.image || spot.imageUrl || spot.firstimage || spot.first_image || spot.thumbnail || spot.imgUrl || '';
  const initialImageAttr = spot.imageAttribution || spot.image_attribution || '';
  const spotSource = spot.source;
  const spotId = String(spot.id || spot.content_id || spot.contentId || '');

  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [imageAttr, setImageAttr] = useState(initialImageAttr);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    if (initialImageUrl && initialImageUrl !== imageUrl) {
      setImageUrl(initialImageUrl);
      setHasError(false);
    }
    if (initialImageAttr && initialImageAttr !== imageAttr) {
      setImageAttr(initialImageAttr);
    }
  }, [initialImageUrl, initialImageAttr]);

  useEffect(() => {
    if (imageUrl) return; // 이미 이미지가 있으면 옵저버 불필요

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!isVisible || imageUrl || !spotId) return;

    let isMounted = true;
    setIsFetching(true);

    const fetchImage = async () => {
      try {
        // DB 오염 방어: kcisa로 저장되었으나 실제로는 tourapi ID(숫자)인 경우 보정
        let actualSource = spotSource;
        if (spotSource === 'kcisa' && /^\d+$/.test(spotId)) {
          actualSource = 'tourapi';
        }

        if (actualSource === 'kcisa') {
          const imgRes = await authFetch(`${BASE_URL}/facilities/${spotId}/image`, { method: 'GET' });
          if (imgRes.ok && isMounted) {
            const imgResult = await imgRes.json();
            const imgData = imgResult.data || imgResult;
            if (imgData.image) {
              setImageUrl(imgData.image);
              setHasError(false);
            }
            if (imgData.image_attribution) setImageAttr(imgData.image_attribution);
          }
        } else if (actualSource === 'tourapi' || !actualSource) {
          const res = await authFetch(`${BASE_URL}/tours/${spotId}`, { method: 'GET' });
          if (res.ok && isMounted) {
            const dataResult = await res.json();
            const data = dataResult.data || dataResult;
            const foundImg = (Array.isArray(data.images) && data.images[0]) || data.firstimage || data.image || '';
            if (foundImg) {
              setImageUrl(foundImg);
              setHasError(false);
            }
          }
        }
      } catch (err) {
        console.warn('LazyImage fetch error:', err);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    fetchImage();

    return () => { isMounted = false; };
  }, [isVisible, imageUrl, spotId, spotSource]);

  // 카테고리 이름, 코드 및 키워드를 기반으로 파일명(영문) 매핑 헬퍼
  const getPlaceholderImage = (categoryName, spotTitle = '', hintCategory = '') => {
    const cat = String(categoryName || '').toUpperCase();
    const title = String(spotTitle || '').toLowerCase();
    const hint = String(hintCategory || '').toUpperCase();
    
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

  const [fallbackError, setFallbackError] = useState(false);
  const categoryToUse = spot.category || spot.rawCategory || spot.cat3 || spot.cat2 || spot.cat1 || spot.type || spot.contentTypeId || spot.partName || spot.part_name || spot.category_name || categoryHint || '';
  const fallbackImageUrl = getPlaceholderImage(
    categoryToUse,
    spot.title || spot.name || '',
    categoryHint
  );

  return (
    <div ref={imgRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#888', overflow: 'hidden', ...style }}>
      {imageUrl && !hasError ? (
        <img 
          key="main-image"
          src={imageUrl} 
          alt={spot.title || spot.name || '이미지'} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
          onError={() => setHasError(true)} 
        />
      ) : isFetching ? (
        <div key="loading-fallback" style={{ fontSize: '13px', color: '#94a3b8' }}>{fallback}</div>
      ) : !fallbackError ? (
        <img 
          key="placeholder-image"
          src={fallbackImageUrl} 
          alt="카테고리 기본 이미지" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
          onError={() => setFallbackError(true)} 
        />
      ) : (
        <div key="error-fallback" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '13px' }}>
          <span style={{ fontSize: '24px' }}>🐾</span>
          <span>PawPass</span>
        </div>
      )}
      
      {imageAttr && !hasError && imageUrl && (
        <div style={{
          position: 'absolute', bottom: '6px', left: '8px', right: '8px',
          fontSize: '11px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none',
          ...attrStyle
        }}>
          이미지 제공자: {imageAttr}
        </div>
      )}
    </div>
  );
}
