import { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../config/env';
import { authFetch } from '../services/api';

export default function LazyImage({ spot, fallback = '🖼️ 이미지 준비중', style, attrStyle }) {
  const imgRef = useRef(null);

  const initialImageUrl = spot.image || spot.imageUrl || spot.firstimage || spot.first_image || spot.thumbnail || spot.imgUrl || '';
  const initialImageAttr = spot.imageAttribution || spot.image_attribution || '';
  const spotSource = spot.source;
  const spotId = String(spot.id || spot.content_id || spot.contentId);

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

  // 카테고리 이름을 기반으로 파일명(영문) 추출 헬퍼
  const getPlaceholderImage = (categoryName) => {
    if (!categoryName) return '/images/placeholders/DEFAULT.png';
    const cat = String(categoryName).toLowerCase();
    
    if (cat.includes('자연') || cat.includes('풍경')) return '/images/placeholders/NATURE.png';
    if (cat.includes('카페') || cat.includes('커피')) return '/images/placeholders/CAFE.png';
    if (cat.includes('음식') || cat.includes('식당')) return '/images/placeholders/FOOD.png';
    if (cat.includes('문화') || cat.includes('예술') || cat.includes('미술') || cat.includes('박물관')) return '/images/placeholders/CULTURE.png';
    if (cat.includes('숙박') || cat.includes('펜션') || cat.includes('호텔')) return '/images/placeholders/STAY.png';
    if (cat.includes('병원') || cat.includes('의료')) return '/images/placeholders/HOSPITAL.png';
    
    return '/images/placeholders/DEFAULT.png';
  };

  const [fallbackError, setFallbackError] = useState(false);
  const fallbackImageUrl = getPlaceholderImage(spot.category || spot.cat3 || spot.type);

  return (
    <div ref={imgRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', color: '#888', ...style }}>
      {imageUrl && !hasError ? (
        <img 
          key="main-image"
          src={imageUrl} 
          alt={spot.title || spot.name || '이미지'} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={() => setHasError(true)} 
        />
      ) : isFetching ? (
        <div key="loading-fallback" style={{ fontSize: '14px', color: '#aaa' }}>{fallback}</div>
      ) : !fallbackError ? (
        <img 
          key="placeholder-image"
          src={fallbackImageUrl} 
          alt="카테고리 기본 이미지" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
          onError={() => setFallbackError(true)} 
        />
      ) : (
        <span key="error-text">🖼️ 이미지 없음</span>
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
