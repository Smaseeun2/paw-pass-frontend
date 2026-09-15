import { BASE_URL } from '../config/env';
import { authFetch } from './client';

export const fetchExploreSpots = async ({ regionCode, category, keyword, matchStatus, petId, page = 1 }) => {
  const params = new URLSearchParams();
  if (regionCode) params.append('regionCode', regionCode);
  if (category) params.append('category', category);
  if (keyword) params.append('keyword', keyword);
  if (matchStatus) params.append('matchStatus', matchStatus);
  if (petId) params.append('petId', petId);
  params.append('page', page);

  // 1. 기본 통합 탐색 API 호출 (주로 kcisa 혹은 부분 데이터 응답)
  let exploreData = [];
  try {
    const res = await authFetch(`${BASE_URL}/explore?${params.toString()}`, { method: 'GET' });
    if (res.ok) {
      const json = await res.json();
      exploreData = Array.isArray(json) ? json : (json?.data || json?.content || []);
    }
  } catch (err) {
    console.warn('/explore API 에러:', err);
  }

  // 2. 관광공사 API 누락 방지를 위해 명시적으로 /tours 와 /facilities 병렬 조회 후 강제 병합
  // 백엔드 /explore 가 불완전할 수 있으므로 프론트에서 확실히 묶어줌
  try {
    const fallbackParams = new URLSearchParams();
    if (regionCode) fallbackParams.append('regionCode', regionCode);
    if (category) fallbackParams.append('category', category);
    fallbackParams.append('page', page);

    const promises = [
      authFetch(`${BASE_URL}/facilities?${fallbackParams.toString()}`, { method: 'GET' })
    ];
    
    // HOSPITAL(동물병원)은 TourAPI에 존재하지 않으므로 호출 생략
    if (category !== 'HOSPITAL') {
      promises.push(authFetch(`${BASE_URL}/tours?${fallbackParams.toString()}`, { method: 'GET' }));
    }

    const results = await Promise.allSettled(promises);
    
    const facRes = results[0];
    const toursRes = category !== 'HOSPITAL' ? results[1] : null;

    let toursData = [];
    if (toursRes && toursRes.status === 'fulfilled' && toursRes.value.ok) {
      const tj = await toursRes.value.json();
      toursData = Array.isArray(tj) ? tj : (tj?.data || tj?.content || []);
      toursData = toursData.map(t => ({ ...t, source: 'tourapi' }));
    }

    let facData = [];
    if (facRes.status === 'fulfilled' && facRes.value.ok) {
      const fj = await facRes.value.json();
      facData = Array.isArray(fj) ? fj : (fj?.data || fj?.content || []);
      facData = facData.map(f => ({ ...f, source: 'kcisa' }));
    }

    // 중복 제거 및 병합 (id 기준)
    const mergedMap = new Map();
    // 1) /explore 원본 우선 (AI 판정값이 들어있을 수 있으므로)
    exploreData.forEach(item => {
      const id = String(item.id || item.content_id);
      mergedMap.set(id, item);
    });
    // 2) 누락된 tourapi 데이터 추가
    toursData.forEach(item => {
      const id = String(item.id || item.content_id);
      if (!mergedMap.has(id)) mergedMap.set(id, item);
    });
    // 3) 누락된 kcisa 데이터 추가
    facData.forEach(item => {
      const id = String(item.id || item.content_id);
      if (!mergedMap.has(id)) mergedMap.set(id, item);
    });

    let finalArray = Array.from(mergedMap.values());

    // 프론트엔드 키워드/상태 필터링 보정 (폴백 데이터에는 검색조건이 안 걸려있을 수 있으므로)
    if (keyword) {
      finalArray = finalArray.filter(s => (s.title || s.name || '').toLowerCase().includes(keyword.toLowerCase()));
    }
    if (matchStatus) {
      finalArray = finalArray.filter(s => (s.match_status || s.matchStatus) === matchStatus);
    }

    return { data: finalArray };
  } catch (err) {
    console.error('병합 조회 실패:', err);
    return { data: exploreData };
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