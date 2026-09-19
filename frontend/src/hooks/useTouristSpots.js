// src/hooks/useTouristSpots.js
import { useState, useCallback, useRef } from 'react';
import { fetchExploreSpots } from '../services/api';

export const useTouristSpots = () => {
  const [spots, setSpots] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const currentConditionRef = useRef({});
  const lastFetchKeyRef = useRef('');
  const lastFetchTimeRef = useRef(0);

  const fetchSpots = useCallback(async (condition = {}, isAppend = false) => {
    // 동시 호출 방지 (이미 요청 중이면 무시)
    if (isFetchingRef.current) {
      return;
    }

    const targetPage = isAppend ? (currentConditionRef.current.page || 1) + 1 : 1;
    const queryCondition = isAppend ? currentConditionRef.current : condition;

    const regionCode = queryCondition.regionCode || queryCondition.region_code || '';
    const category = queryCondition.category || queryCondition.type || '';
    const matchStatus = queryCondition.matchStatus || queryCondition.match_status || '';
    const keyword = (queryCondition.keyword || '').trim();
    const petIds = queryCondition.petIds;
    const petId = queryCondition.petId;
    const guestSizeHint = queryCondition.guestSizeHint || '';
    const allPetIds = petIds && petIds.length > 0 ? petIds : (petId ? [petId] : []);

    const fetchKey = JSON.stringify({
      regionCode,
      category,
      matchStatus,
      keyword,
      petIds: allPetIds.join(','),
      guestSizeHint,
      page: targetPage,
      isAppend
    });

    const now = Date.now();
    // 동일한 파라미터로 500ms 이내 재호출되는 폭풍 요청 차단
    if (!isAppend && lastFetchKeyRef.current === fetchKey && now - lastFetchTimeRef.current < 500) {
      return;
    }
    lastFetchKeyRef.current = fetchKey;
    lastFetchTimeRef.current = now;

    isFetchingRef.current = true;
    if (isAppend) {
      setIsFetchingMore(true);
    } else {
      setIsInitialLoading(true);
      setHasMore(true);
      hasMoreRef.current = true;
    }

    if (!isAppend) {
      currentConditionRef.current = { ...condition, page: 1 };
    } else {
      currentConditionRef.current.page = targetPage;
    }

    try {
      let rawSpots = [];

      // /explore 통합 엔드포인트 호출
      try {
        const response = await fetchExploreSpots({
          regionCode,
          category,
          matchStatus,
          petIds: allPetIds.join(','),
          keyword,
          page: targetPage
        });
        rawSpots = Array.isArray(response) ? response : (response?.data || response?.content || []);
      } catch (exploreErr) {
        console.error('❌ /explore API 조회 실패:', exploreErr.message);
        rawSpots = [];
      }

      const mappedSpots = rawSpots.map((spot) => {
        const spotId = String(spot.id || spot.content_id || '');
        const contactTel = spot.tel || '정보 미제공';

        const spotImage =
          spot.image ||
          spot.imageUrl ||
          spot.firstimage ||
          spot.first_image ||
          spot.thumbnail ||
          spot.imgUrl || '';

        const parsedLat = Number(spot.lat || spot.map_y || spot.mapy || spot.y || spot.latitude);
        const parsedLng = Number(spot.lng || spot.map_x || spot.mapx || spot.x || spot.longitude);

        // 기본 판정값 파싱
        const rawMatch = spot.match_status || spot.matchStatus;
        let assignedMatchStatus = '동반 확인 필요';

        if (guestSizeHint && allPetIds.length === 0) {
          const possibleSize = (spot.possibleBreeds || spot.possible_breeds || spot.relaAcmpyEntEnterPrn || '').toLowerCase();

          if (!possibleSize || possibleSize.trim() === '') {
            assignedMatchStatus = '조건부 가능';
          } else {
            const deniedBySize =
              (guestSizeHint === 'large' && possibleSize.includes('소형')) ||
              (guestSizeHint === 'large' && possibleSize.includes('중형') && !possibleSize.includes('대형')) ||
              (guestSizeHint === 'medium' && possibleSize.includes('소형') && !possibleSize.includes('중형') && !possibleSize.includes('대형'));

            if (deniedBySize) {
              assignedMatchStatus = '방문 불가';
            } else {
              assignedMatchStatus = '조건부 가능';
            }
          }
        } else if (allPetIds.length === 0 || !rawMatch) {
          assignedMatchStatus = '동반 확인 필요';
        } else {
          assignedMatchStatus = rawMatch;
        }

        return {
          id: spotId,
          contentId: spotId,
          content_id: spotId,
          name: spot.title || spot.name || '장소명 없음',
          title: spot.title || spot.name || '장소명 없음',
          address: spot.addr1 || spot.addr || spot.address || '주소 정보 없음',
          addr: spot.addr1 || spot.addr || spot.address || '주소 정보 없음',
          image: spotImage,
          imageUrl: spotImage,
          imageAttribution: spot.image_attribution || '',
          tel: contactTel,
          phone: contactTel,
          lat: !isNaN(parsedLat) ? parsedLat : null,
          lng: !isNaN(parsedLng) ? parsedLng : null,
          source: spot.source || 'tourapi',
          category: spot.category || spot.category_name || spot.categoryName || spot.part_name || spot.partName || spot.category_code || spot.contentTypeId || spot.content_type_id || '',
          rawCategory: spot.category,
          contentTypeId: spot.contentTypeId || spot.content_type_id || spot.contenttypeid || '',
          partName: spot.part_name || spot.partName || '',
          matchStatus: assignedMatchStatus,
          matchReason: spot.match_reason || '',
          matchRawText: spot.match_raw_text || '',
          petInfoDescription: `출입 판정: ${assignedMatchStatus}`
        };
      });

      if (isAppend) {
        setSpots(prev => {
          const map = new Map();
          prev.forEach(item => map.set(item.id, item));
          const prevSize = map.size;
          mappedSpots.forEach(item => map.set(item.id, item));
          const newSize = map.size;

          // 새로운 항목이 하나도 추가되지 않았거나 반환된 결과가 없으면 페이징 종료
          if (newSize === prevSize || mappedSpots.length === 0) {
            setHasMore(false);
            hasMoreRef.current = false;
          }
          return Array.from(map.values());
        });
      } else {
        setSpots(mappedSpots);
      }

      // 결과가 0개이거나 페이지 당 기본 사이즈(10개 미만)면 다음 페이지 없음으로 설정
      const moreAvailable = rawSpots.length >= 10;
      setHasMore(moreAvailable);
      hasMoreRef.current = moreAvailable;
    } catch (err) {
      console.error('장소 목록 조회 실패:', err);
      if (!isAppend) setSpots([]);
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      isFetchingRef.current = false;
      if (isAppend) {
        setIsFetchingMore(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isFetchingRef.current && hasMoreRef.current) {
      fetchSpots(currentConditionRef.current, true);
    }
  }, [fetchSpots]);

  return {
    spots,
    isLoading: isInitialLoading,
    isInitialLoading,
    isFetchingMore,
    hasMore,
    fetchSpots,
    loadMore
  };
};