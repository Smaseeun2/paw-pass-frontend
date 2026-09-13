// src/hooks/useTouristSpots.js
import { useState, useCallback, useRef } from 'react';
import { fetchExploreSpots, authFetch } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.30.1.29:8080';

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
      const response = await fetchExploreSpots({
        regionCode,
        category,
        matchStatus,
        petId,
        page: targetPage
      });

      const rawSpots = Array.isArray(response) ? response : (response?.data || response?.content || []);

      const mappedSpotsPromises = rawSpots.map(async (spot) => {
        const spotId = String(spot.id || spot.content_id);
        const contactTel = spot.tel || '정보 미제공';

        let spotImage = 
          spot.image || 
          spot.imageUrl || 
          spot.firstimage || 
          spot.first_image || 
          spot.thumbnail || 
          spot.imgUrl || '';

        if (!spotImage && (spot.source === 'kcisa' || !spot.source)) {
          try {
            const imgRes = await authFetch(`${BASE_URL}/facilities/${spotId}/image`, { method: 'GET' });
            if (imgRes.ok) {
              const imgResult = await imgRes.json();
              const imgData = imgResult.data || imgResult;
              spotImage = imgData.image || '';
            }
          } catch (e) {
            // 무시
          }
        }

        const parsedLat = Number(spot.lat || spot.map_y || spot.mapy || spot.y || spot.latitude);
        const parsedLng = Number(spot.lng || spot.map_x || spot.mapx || spot.x || spot.longitude);

        // 💡 펫이 선택되지 않았거나 판정값이 없으면 기본으로 '동반 확인 필요' 할당
        const rawMatch = spot.match_status || spot.matchStatus;
        const assignedMatchStatus = petId && rawMatch ? rawMatch : '동반 확인 필요';

        return {
          id: spotId,
          contentId: spotId,
          name: spot.title || spot.name || '장소명 없음',
          address: spot.addr || spot.address || '주소 정보 없음',
          image: spotImage,
          imageUrl: spotImage,
          tel: contactTel,
          phone: contactTel,
          lat: !isNaN(parsedLat) ? parsedLat : null,
          lng: !isNaN(parsedLng) ? parsedLng : null,
          source: spot.source || 'tourapi',
          rawCategory: spot.category, 
          matchStatus: assignedMatchStatus,
          petInfoDescription: `출입 판정: ${assignedMatchStatus}`
        };
      });

      const mappedSpots = await Promise.all(mappedSpotsPromises);

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