import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../config/env';
import { authFetch } from '../services/api';

export default function LazyImage({ spot, fallback = '🖼️ 이미지 준비중', style, attrStyle }) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageAttr, setImageAttr] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  const initialImageUrl = spot.image || spot.imageUrl || spot.firstimage || spot.first_image || spot.thumbnail || spot.imgUrl || '';
  const initialImageAttr = spot.imageAttribution || spot.image_attribution || '';
  const spotSource = spot.source;
  const spotId = String(spot.id || spot.content_id || spot.contentId);

  useEffect(() => {
    if (initialImageAttr) {
      setImageAttr(initialImageAttr);
    }
    if (initialImageUrl) {
      setImageUrl(initialImageUrl);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [initialImageUrl]);

  useEffect(() => {
    if (!isVisible || imageUrl || !spotId) return;

    let isMounted = true;

    const fetchImage = async () => {
      try {
        if (spotSource === 'kcisa') {
          const imgRes = await authFetch(`${BASE_URL}/facilities/${spotId}/image`, { method: 'GET' });
          if (imgRes.ok && isMounted) {
            const imgResult = await imgRes.json();
            const imgData = imgResult.data || imgResult;
            if (imgData.image) setImageUrl(imgData.image);
            if (imgData.image_attribution) setImageAttr(imgData.image_attribution);
          }
        } else if (spotSource === 'tourapi' || !spotSource) {
          // If we don't know the source or it's tourapi, fetching /tours/id might be heavy, 
          // but we do it lazily so it's better than N+1 all at once.
          const res = await authFetch(`${BASE_URL}/tours/${spotId}`, { method: 'GET' });
          if (res.ok && isMounted) {
            const dataResult = await res.json();
            const data = dataResult.data || dataResult;
            const foundImg = (Array.isArray(data.images) && data.images[0]) || data.firstimage || data.image || '';
            if (foundImg) setImageUrl(foundImg);
          }
        }
      } catch (err) {
        console.warn('LazyImage fetch error:', err);
      }
    };

    fetchImage();

    return () => { isMounted = false; };
  }, [isVisible, imageUrl, spotId, spotSource]);

  return (
    <div ref={imgRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', color: '#888', ...style }}>
      {imageUrl ? (
        <img src={imageUrl} alt={spot.title || spot.name || '이미지'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{fallback}</span>
      )}
      
      {imageAttr && (
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
