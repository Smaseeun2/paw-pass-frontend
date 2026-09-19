import { BASE_URL } from '../config/env';
import { authFetch } from './client';

/**
 * 로그인한 유저의 동선 목록 조회 (GET /routes)
 * @returns {Promise<Array<{ id?: string|number, source?: string, content_id?: string|number, title?: string, lat: number, lng: number }>>}
 */
export const fetchUserRoutes = async () => {
  const res = await authFetch(`${BASE_URL}/routes`, {
    method: 'GET'
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || '동선 목록을 불러오지 못했습니다.');
  }
  
  const result = await res.json();
  return Array.isArray(result) ? result : (result?.data || []);
};

/**
 * 로그인한 유저의 동선 목록 전체 교체 저장 (PUT /routes)
 * @param {Array<{ source?: string, content_id?: string|number, id?: string|number, title?: string, name?: string, lat: number, lng: number }>} places
 * @returns {Promise<any>}
 */
export const updateUserRoutes = async (places) => {
  const payload = {
    places: places.map(p => ({
      source: p.source || (String(p.id || '').startsWith('kakao_') ? 'kakao' : 'tourapi'),
      content_id: String(p.content_id || p.contentId || p.id || '').replace(/^kakao_/, ''),
      title: p.title || p.name || '장소명 없음',
      lat: Number(p.lat || p.latitude),
      lng: Number(p.lng || p.longitude)
    }))
  };

  const res = await authFetch(`${BASE_URL}/routes`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.detail || '동선 목록 저장에 실패했습니다.');
  }
  
  const result = await res.json();
  return result.data || result;
};

/**
 * 백엔드 최적 동선 계산 API (POST /route/suggest)
 * @param {Array<{ id: string|number, lat: number, lng: number }>} points (2~8개 장소)
 * @returns {Promise<{ order: Array<string|number>, total_distance_km: number, legs: Array<{ from_id?: string|number, to_id?: string|number, distance_km?: number }> }>}
 */
export const fetchSuggestedRoute = async (points) => {
  const res = await authFetch(`${BASE_URL}/route/suggest`, {
    method: 'POST',
    body: JSON.stringify({ points })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const msg = errorData?.message || errorData?.detail || errorData?.error || '동선 추천 API 호출에 실패했습니다.';
    throw new Error(msg);
  }
  
  const result = await res.json();
  return result.data || result;
};