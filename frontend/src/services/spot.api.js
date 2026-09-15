import { BASE_URL } from '../config/env';
import { authFetch } from './client';

export const fetchExploreSpots = async ({ regionCode, category, keyword, matchStatus, petId, petIds, page = 1 }) => {
  const params = new URLSearchParams();
  if (regionCode) params.append('regionCode', regionCode);
  if (category) params.append('category', category);
  if (keyword) params.append('keyword', keyword);
  if (matchStatus) params.append('matchStatus', matchStatus);
  if (petId) {
    params.append('petId', petId);
  }
  params.append('page', page);

  const res = await authFetch(`${BASE_URL}/explore?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error('통합 관광지 탐색 실패');
  return res.json();
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