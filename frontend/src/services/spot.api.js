import { BASE_URL } from '../config/env';
import { authFetch } from './client';

export const fetchExploreSpots = async ({ regionCode, category, keyword, matchStatus, petId, petIds, page = 1 }) => {
  const params = new URLSearchParams();
  if (regionCode) params.append('regionCode', regionCode);
  if (category) params.append('category', category);
  if (keyword) params.append('keyword', keyword);
  
  const rawPetIds = petIds ? (Array.isArray(petIds) ? petIds.join(',') : String(petIds)) : (petId ? String(petId) : '');
  
  // 프론트엔드 임시(게스트) 펫 ID인 13자리 타임스탬프는 백엔드로 전송하지 않음
  const finalPetIds = rawPetIds
    .split(',')
    .map(id => id.trim())
    .filter(id => id !== '' && !(id.length === 13 && !isNaN(Number(id))))
    .join(',');
  
  if (matchStatus) {
    params.append('matchStatus', matchStatus);
  } else if (finalPetIds) {
    params.append('showAll', 'true');
  }
  
  if (finalPetIds) params.append('petIds', finalPetIds);
  params.append('page', page);

  // 백엔드 /explore 엔드포인트 단일 호출 (지역명 변환, API 병합, AI 판정 모두 백엔드 위임)
  try {
    const res = await authFetch(`${BASE_URL}/explore?${params.toString()}`, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`탐색 API 오류: ${res.status}`);
    }
    const json = await res.json();
    let exploreData = Array.isArray(json) ? json : (json?.data || json?.content || []);
    
    // source 태깅 보정 (백엔드 누락 시 유추)
    exploreData = exploreData.map(item => {
      const id = String(item.id || item.content_id);
      if (!item.source) {
        if (/^\d+$/.test(id)) {
          item.source = 'tourapi';
        } else if (id.length >= 32) {
          item.source = 'kcisa';
        }
      }
      return item;
    });

    return { data: exploreData };
  } catch (err) {
    console.error('⚠️ /explore API 호출 실패:', err);
    throw err; // 상위 컴포넌트(useTouristSpots)로 에러를 전파하여 적절한 UI 처리 유도
  }
};

export const fetchTours = async ({ regionCode, category, page = 1 }) => {
  const params = new URLSearchParams();
  if (regionCode) params.append('regionCode', regionCode);
  if (category) params.append('category', category);
  params.append('page', page);
  const res = await authFetch(`${BASE_URL}/tours?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error('관광지 목록 조회 실패');
  return res.json();
};

export const fetchFacilities = async ({ regionCode, category, page = 1 }) => {
  const params = new URLSearchParams();
  if (regionCode) params.append('regionCode', regionCode);
  if (category) params.append('category', category);
  params.append('page', page);
  const res = await authFetch(`${BASE_URL}/facilities?${params.toString()}`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('문화시설 목록 조회 실패');
  return res.json();
};

export const fetchTourDetail = async (contentId) => {
  const res = await authFetch(`${BASE_URL}/tours/${contentId}`, { method: 'GET' });
  if (!res.ok) throw new Error('관광지 상세 조회 실패');
  return res.json();
};

export const fetchFacilityDetail = async (id) => {
  const res = await authFetch(`${BASE_URL}/facilities/${id}`, { method: 'GET' });
  if (!res.ok) throw new Error('문화시설 상세 조회 실패');
  return res.json();
};

export const fetchFacilityImage = async (id) => {
  const res = await authFetch(`${BASE_URL}/facilities/${id}/image`, { method: 'GET' });
  if (!res.ok) throw new Error('문화시설 이미지 조회 실패');
  return res.json();
};