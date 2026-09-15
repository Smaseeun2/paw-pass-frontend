// src/hooks/useTouristSpots.js
import { useState, useCallback, useRef } from 'react';
import { fetchExploreSpots, authFetch } from '../services/api';
import { BASE_URL } from '../config/env';

export const useTouristSpots = () => {
  const [spots, setSpots] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const currentConditionRef = useRef({});

  const fetchSpots = useCallback(async (condition = {}, isAppend = false) => {
    if (isAppend) {
      setIsFetchingMore(true);
    } else {
      setIsInitialLoading(true);
    }

    const targetPage = isAppend ? (currentConditionRef.current.page || 1) + 1 : 1;

    if (!isAppend) {
      currentConditionRef.current = { ...condition, page: 1 };
    } else {
      currentConditionRef.current.page = targetPage;
    }

    const queryCondition = isAppend ? currentConditionRef.current : condition;

    const regionCode = queryCondition.regionCode || queryCondition.region_code || '';
    const category = queryCondition.category || queryCondition.type || '';
    const matchStatus = queryCondition.matchStatus || queryCondition.match_status || '';
    const keyword = queryCondition.keyword || '';

    // Updated: support multiple pet IDs
    const petIds = queryCondition.petIds;
    const petId = queryCondition.petId;
    // 비로그인 사용자가 크기 필터를 선택한 경우 ('small' | 'medium' | 'large' | '')
    const guestSizeHint = queryCondition.guestSizeHint || '';
    // 다견 AND 조건: 여러 마리가 선택된 경우 대표 펫 기준으로 API를 호출하되, 프론트에서 AND 방식 판정
    const primaryPetId = petIds && petIds.length > 0 ? petIds[0] : petId;
    const allPetIds = petIds && petIds.length > 0 ? petIds : (petId ? [petId] : []);

    try {
      let rawSpots = [];

      // 1차: /explore 통합 엔드포인트 시도
      try {
        const response = await fetchExploreSpots({
          regionCode,
          category,
          matchStatus,
          petId: primaryPetId,
          keyword,
          page: targetPage
        });
        rawSpots = Array.isArray(response) ? response : (response?.data || response?.content || []);
      } catch (exploreErr) {
        console.error('❌ /explore 통합 API 조회 실패 (폴백 제거됨):', exploreErr.message);
        rawSpots = [];
      }

      // 저장된 펫 목록 로드 (다견 AND 판정용)
      let localPets = [];
      try {
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('paw_pass_access_token') : null;
        const savedPetsKey = token
          ? Object.keys(window.localStorage).find(k => k.startsWith('paw_pass_pets_') && !k.endsWith('_guest'))
          : 'paw_pass_pets_guest';
        if (savedPetsKey) {
          const raw = window.localStorage.getItem(savedPetsKey);
          if (raw) localPets = JSON.parse(raw);
        }
      } catch (_) { /* 조용히 무시 */ }

      /**
       * 다견 AND 판정 알고리즘:
       * - '가능': 크기 조건 충족 & 프로필에 등록한 반려용품이 방문 가능 조건을 모두 충족
       * - '조건부': 프로필에 없는 추가 반려용품이 요구될 때 (예: 이동장 없는데 이동장 필수)
       * - '확인 필요': 정보가 불충분하거나 API에서 판정값 없을 때
       * - 다견일 경우: 각 펫에 대해 위 기준 적용 후 가장 제한적인 결과를 AND 방식으로 채택
       */
      const MATCH_RANK = { '가능': 1, '조건부': 2, '동반 확인 필요': 3, '불가': 4 };

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

        const parsedLat = Number(spot.lat || spot.map_y || spot.mapy || spot.y || spot.latitude);
        const parsedLng = Number(spot.lng || spot.map_x || spot.mapx || spot.x || spot.longitude);

        // 기본 판정값 파싱
        const rawMatch = spot.match_status || spot.matchStatus;
        let assignedMatchStatus = '동반 확인 필요';

        if (guestSizeHint && allPetIds.length === 0) {
          // ── 비로그인 + 크기 선택 ──────────────────────────────────────────────
          // 장소의 크기 제한 정보 파싱 (백엔드/TourAPI 필드 대응)
          const possibleSize = (spot.possibleBreeds || spot.possible_breeds || spot.relaAcmpyEntEnterPrn || '').toLowerCase();
          const sizeLabels = { small: ['소형', '소', '5kg', '10kg', 'small'], medium: ['중형', '중', '25kg', 'medium'], large: ['대형', '대', 'large'] };
          const guestLabels = sizeLabels[guestSizeHint] || [];

          // 제한 정보가 없으면 → 정보 불충분 → 조건부
          if (!possibleSize || possibleSize.trim() === '') {
            // 정보 없으면 크기 충족 가능하다고 가정하되, 반려용품 미확인이므로 조건부
            assignedMatchStatus = '조건부 가능';
          } else {
            // 크기 불허 키워드 체크 (예: "소형견만 가능"에서 대형 선택)
            const deniedBySize =
              (guestSizeHint === 'large' && possibleSize.includes('소형')) ||
              (guestSizeHint === 'large' && possibleSize.includes('중형') && !possibleSize.includes('대형')) ||
              (guestSizeHint === 'medium' && possibleSize.includes('소형') && !possibleSize.includes('중형') && !possibleSize.includes('대형'));

            if (deniedBySize) {
              assignedMatchStatus = '방문 불가';
            } else {
              // 크기 조건 충족이지만 반려용품 미확인 → 조건부 가능
              assignedMatchStatus = '조건부 가능';
            }
          }
        } else if (allPetIds.length === 0 || !rawMatch) {
          // 펫 미선택이거나 정보 없으면 확인 필요
          assignedMatchStatus = '동반 확인 필요';
        } else if (allPetIds.length === 1) {
          // 단일 펫: 백엔드 판정값 그대로 사용 (조건부 보정 포함)
          assignedMatchStatus = rawMatch;
        } else {
          // 다견 AND 조건: 선택된 모든 펫에 대해 판정 후 가장 제한적인 결과 채택
          // 대표 펫 판정은 이미 있으므로, 나머지 펫은 크기/준비물 기반으로 프론트 추정
          const selectedLocalPets = localPets.filter(p => allPetIds.includes(p.id || p._id));
          
          const petStatuses = [rawMatch]; // 대표 펫 판정
          for (const pet of selectedLocalPets.slice(1)) {
            const petWeight = Number(pet.weight || 0);
            const petSupplies = Array.isArray(pet.supplies) ? pet.supplies : [];
            const needItem = spot.needItem || spot.need_item || '';
            
            // 간이 판정: 필요 용품이 명시되어 있는데 프로필에 없으면 조건부
            if (needItem && petSupplies.length > 0) {
              const needsExtra = needItem.split(/[,\/]+/).some(item => {
                const itemStr = item.trim().toLowerCase();
                return itemStr && !petSupplies.some(s => s.toLowerCase().includes(itemStr));
              });
              petStatuses.push(needsExtra ? '조건부' : rawMatch);
            } else if (!needItem && rawMatch) {
              petStatuses.push(rawMatch);
            } else {
              petStatuses.push('동반 확인 필요');
            }
          }

          // 가장 제한적인 상태 채택 (AND 방식)
          assignedMatchStatus = petStatuses.reduce((worst, cur) => {
            return (MATCH_RANK[cur] || 3) > (MATCH_RANK[worst] || 3) ? cur : worst;
          });
        }

        return {
          id: spotId,
          contentId: spotId,
          name: spot.title || spot.name || '장소명 없음',
          address: spot.addr1 || spot.addr || spot.address || '주소 정보 없음',
          image: spotImage,
          imageUrl: spotImage,
          imageAttribution: spot.image_attribution || '',
          tel: contactTel,
          phone: contactTel,
          lat: !isNaN(parsedLat) ? parsedLat : null,
          lng: !isNaN(parsedLng) ? parsedLng : null,
          source: spot.source || 'tourapi',
          rawCategory: spot.category,
          matchStatus: assignedMatchStatus,
          matchReason: spot.match_reason || '',
          matchRawText: spot.match_raw_text || '',
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

      setHasMore(rawSpots.length > 0);
    } catch (err) {
      console.error('장소 목록 조회 실패:', err);
      if (!isAppend) setSpots([]);
    } finally {
      if (isAppend) {
        setIsFetchingMore(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isInitialLoading && !isFetchingMore && hasMore) {
      fetchSpots(currentConditionRef.current, true);
    }
  }, [fetchSpots, isInitialLoading, isFetchingMore, hasMore]);

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