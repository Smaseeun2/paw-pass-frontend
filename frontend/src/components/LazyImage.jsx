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
  const getPlaceholderImage = (categoryName, spotTitle = '') => {
    const cat = String(categoryName || '').toUpperCase();
    const title = String(spotTitle || '').toLowerCase();
    
    // ── 1단계: 명시적 카테고리(코드/명칭) 최우선 매핑 ──
    if (cat.includes('CULTURE') || cat.includes('문화') || cat.includes('예술') || cat.includes('미술') || cat.includes('박물관') || cat.includes('전시') || cat === '14' || cat === '15' || cat.includes('A02')) {
      return '/images/placeholders/CULTURE.png';
    }
    if (cat.includes('HOSPITAL') || cat.includes('병원') || cat.includes('의료') || cat.includes('약국') || cat.includes('클리닉') || cat.includes('반려의료')) {
      return '/images/placeholders/HOSPITAL.png';
    }
    if (cat.includes('STAY') || cat.includes('숙박') || cat.includes('펜션') || cat.includes('호텔') || cat.includes('리조트') || cat.includes('글램핑') || cat.includes('캠핑') || cat === '32' || cat.includes('B02')) {
      return '/images/placeholders/STAY.png';
    }
    if (cat.includes('CAFE') || cat.includes('카페') || cat.includes('커피') || cat.includes('디저트') || cat.includes('베이커리') || cat.includes('A0502')) {
      return '/images/placeholders/CAFE.png';
    }
    if (cat.includes('FOOD') || cat.includes('음식') || cat.includes('식당') || cat.includes('맛집') || cat.includes('레스토랑') || cat.includes('식음료') || cat === '39' || cat.includes('A05')) {
      return '/images/placeholders/FOOD.png';
    }
    if (cat.includes('NATURE') || cat.includes('자연') || cat.includes('풍경') || cat.includes('공원') || cat.includes('관광지') || cat.includes('휴양림') || cat === '12' || cat === '28' || cat.includes('A01') || cat.includes('A03')) {
      return '/images/placeholders/NATURE.png';
    }

    // ── 2단계: 제목(상호명) 기반 정밀 키워드 매핑 ──
    // 2-1. 문화 / 전시 / 관람 시설 (전시관, 박물관, 연구소, 과학관 등 - 민물고기전시관 오탐 방지)
    if (
      title.includes('전시관') || title.includes('박물관') || title.includes('미술관') || title.includes('과학관') ||
      title.includes('연구소') || title.includes('기념관') || title.includes('생태관') || title.includes('체험관') ||
      title.includes('수족관') || title.includes('아쿠아리움') || title.includes('홍보관') || title.includes('갤러리') ||
      title.includes('극장') || title.includes('아트') || title.includes('테마파크') || title.includes('랜드') ||
      title.includes('목장') || title.includes('사찰') || title.includes('서원') || title.includes('향교') || title.includes('유적')
    ) {
      return '/images/placeholders/CULTURE.png';
    }

    // 2-2. 동물병원 / 약국 / 의료
    if (
      title.includes('동물병원') || title.includes('병원') || title.includes('약국') || title.includes('클리닉') ||
      title.includes('메디컬') || title.includes('수의') || title.includes('동물의료')
    ) {
      return '/images/placeholders/HOSPITAL.png';
    }

    // 2-3. 숙박 / 펜션 / 호텔 / 캠핑
    if (
      title.includes('펜션') || title.includes('호텔') || title.includes('리조트') || title.includes('글램핑') ||
      title.includes('캠핑') || title.includes('민박') || title.includes('스테이') || title.includes('모텔') ||
      title.includes('야영장') || title.includes('카라반') || title.includes('게스트하우스')
    ) {
      return '/images/placeholders/STAY.png';
    }

    // 2-4. 카페 / 디저트 / 베이커리
    if (
      title.includes('카페') || title.includes('커피') || title.includes('베이커리') || title.includes('디저트') ||
      title.includes('coffee') || title.includes('cafe') || title.includes('roasters') || title.includes('찻집') || title.includes('다방')
    ) {
      return '/images/placeholders/CAFE.png';
    }

    // 2-5. 음식점 / 맛집 (주의: '물고기'/'민물고기'는 제외, 단일 '회' 대신 '횟집'/'생선회' 사용)
    const isFood = (
      title.includes('식당') || title.includes('갈비') || title.includes('가든') || title.includes('밥집') ||
      title.includes('구이') || title.includes('한식') || title.includes('중식') || title.includes('일식') ||
      title.includes('양식') || title.includes('치킨') || title.includes('피자') || title.includes('버거') ||
      title.includes('삼겹살') || title.includes('불고기') || title.includes('고깃집') || title.includes('정육') ||
      title.includes('국밥') || title.includes('횟집') || title.includes('생선회') || title.includes('숙성회') ||
      title.includes('주막') || title.includes('포차') || title.includes('키친') || title.includes('테이블') ||
      title.includes('돈까스') || title.includes('초밥') || title.includes('칼국수') || title.includes('파스타') ||
      ((title.includes('고기') || title.includes('육류')) && !title.includes('물고기') && !title.includes('민물고기'))
    );
    if (isFood) {
      return '/images/placeholders/FOOD.png';
    }

    // 2-6. 자연 / 풍경 / 야외 공원
    if (
      title.includes('공원') || title.includes('산책') || title.includes('휴양림') || title.includes('해수욕장') ||
      title.includes('숲') || title.includes('계곡') || title.includes('수목원') || title.includes('해변') ||
      title.includes('둘레길') || title.includes('등산로') || title.includes('폭포') || title.includes('호수') ||
      title.includes('저수지') || title.includes('섬') || title.includes('해안')
    ) {
      return '/images/placeholders/NATURE.png';
    }
    
    return '/images/placeholders/DEFAULT.png';
  };

  const [fallbackError, setFallbackError] = useState(false);
  const categoryToUse = spot.category || spot.rawCategory || spot.cat3 || spot.cat2 || spot.cat1 || spot.type || spot.contentTypeId || spot.partName || spot.part_name || spot.category_name || categoryHint || '';
  const fallbackImageUrl = getPlaceholderImage(
    categoryToUse,
    spot.title || spot.name || ''
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
