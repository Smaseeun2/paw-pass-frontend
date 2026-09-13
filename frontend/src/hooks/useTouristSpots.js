// src/hooks/useTouristSpots.js
import { useState, useCallback, useRef } from 'react';
import { fetchExploreSpots } from '../services/api';

export const useTouristSpots = () => {
  const [spots, setSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const currentConditionRef = useRef({});

  const fetchSpots = useCallback(async (condition = {}, isAppend = false) => {
    setIsLoading(true);

    const targetPage = isAppend ? (currentConditionRef.current.page || 1) + 1 : 1;

    if (!isAppend) {
      currentConditionRef.current = { ...condition, page: 1 };
    } else {
      currentConditionRef.current.page = targetPage;
    }

    const queryCondition = isAppend ? currentConditionRef.current : condition;

    const regionCode = queryCondition.regionCode || queryCondition.region_code || '';
    const category = queryCondition.category || queryCondition.type || '';
    const petId = queryCondition.petId || '';
    const matchStatus = queryCondition.matchStatus || queryCondition.match_status || '';

    try {
      const data = await fetchExploreSpots({
        regionCode,
        category,
        matchStatus,
        petId,
        page: targetPage
      });

      const rawSpots = Array.isArray(data) ? data : (data?.data || []);
      
      const mappedSpots = rawSpots.map((spot) => {
        const spotId = String(spot.id || spot.content_id);
        const contactTel = spot.tel || '정보 미제공';

        // 💡 [핵심 수정] 백엔드가 내려주는 이미지 관련 다양한 필드명 완벽 대응
        const foundImage = 
          spot.image || 
          spot.first_image || 
          spot.firstimage || 
          spot.thumbnail || 
          spot.imgUrl || 
          spot.imageUrl || '';

        // 백엔드 수정 사항에 맞춘 위도(lat/map_y), 경도(lng/map_x) 추출
        const parsedLat = Number(spot.lat || spot.map_y || spot.mapy || spot.y || spot.latitude);
        const parsedLng = Number(spot.lng || spot.map_x || spot.mapx || spot.x || spot.longitude);

        return {
          id: spotId,
          contentId: spotId,
          name: spot.title || spot.name || '장소명 없음',
          address: spot.addr || spot.address || '주소 정보 없음',
          imageUrl: foundImage, // 추출된 이미지 URL
          tel: contactTel,
          phone: contactTel,
          lat: !isNaN(parsedLat) ? parsedLat : null,
          lng: !isNaN(parsedLng) ? parsedLng : null,
          source: spot.source || 'tourapi',
          rawCategory: spot.category, 
          matchStatus: spot.match_status || '확인필요',
          petInfoDescription: spot.match_status 
            ? `출입 판정: ${spot.match_status}` 
            : (spot.source === 'kcisa' ? '반려동물 편의시설' : '반려동물 동반 여행지')
        };
      });

      if (isAppend) {
        setSpots(prev => {
          const map = new Map();
          prev.forEach(item => map.set(item.id, item));
          mappedSpots.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });
      } else {
        setSpots(mappedSpots);
      }

      setHasMore(rawSpots.length >= 40);
    } catch (err) {
      console.error('장소 목록 조회 실패:', err);
      if (!isAppend) setSpots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchSpots(currentConditionRef.current, true);
    }
  }, [fetchSpots, isLoading, hasMore]);

  return { spots, isLoading, hasMore, fetchSpots, loadMore };
};