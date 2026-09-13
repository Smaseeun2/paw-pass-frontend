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

    // 💡 디버깅용 로그 (F12 콘솔에서 regionCode가 '부산' 등으로 잘 박혀서 가는지 확인하세요)
    console.log('🔍 [탐색 요청 파라미터]', { regionCode, category, matchStatus, petId, page: targetPage });

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

        return {
          id: spotId,
          contentId: spotId,
          name: spot.title || '장소명 없음',
          address: spot.addr || '주소 정보 없음',
          imageUrl: spot.image || spot.first_image || '',
          tel: contactTel,
          phone: contactTel,
          lat: spot.lat,
          lng: spot.lng,
          source: spot.source || 'tourapi',
          rawCategory: spot.category, // 백엔드 소스별 원본 category 값 ("동물병원", "카페", "39" 등)
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