// src/hooks/useTouristSpots.js
import { useState, useCallback } from 'react';
import { fetchExploreSpots } from '../services/api';

export const useTouristSpots = () => {
  const [spots, setSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentCondition, setCurrentCondition] = useState({});

  const fetchSpots = useCallback(async (condition = {}, isAppend = false) => {
    setIsLoading(true);

    const targetPage = isAppend ? (condition.page || page + 1) : 1;
    const queryCondition = isAppend ? currentCondition : condition;

    try {
      const data = await fetchExploreSpots({
        region_code: queryCondition.region || '',
        category: queryCondition.type || '',
        match_status: queryCondition.matchStatus || '',
        page: targetPage
      });

      const rawSpots = Array.isArray(data) ? data : (data?.data || []);

      const mappedSpots = rawSpots.map((spot, idx) => {
        const contactTel = spot.tel || '정보 미제공';
        return {
          contentId: String(spot.id || `${targetPage}-${idx + 1}`),
          name: spot.title || '장소명 없음',
          address: spot.addr || '주소 정보 없음',
          imageUrl: spot.image || spot.first_image || '',
          tel: contactTel,
          phone: contactTel,
          lat: spot.lat,
          lng: spot.lng,
          source: spot.source || 'tourapi',
          matchStatus: spot.match_status || '',
          description: spot.description || '',
          petInfoDescription: spot.match_status 
            ? `출입 조건 판별: ${spot.match_status}` 
            : (spot.source === 'kcisa' ? '반려동물 편의시설' : '반려동물 동반 여행지')
        };
      });

      if (isAppend) {
        setSpots(prev => [...prev, ...mappedSpots]);
      } else {
        setSpots(mappedSpots);
        setCurrentCondition(condition);
      }

      // 받아온 데이터가 40개 미만이면 더 이상 데이터가 없다고 판단
      setHasMore(rawSpots.length >= 40);
      setPage(targetPage);
    } catch (err) {
      console.error('관광지 목록 조회 실패:', err);
      if (!isAppend) setSpots([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, currentCondition]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchSpots(currentCondition, true);
    }
  };

  return { spots, isLoading, hasMore, fetchSpots, loadMore };
};