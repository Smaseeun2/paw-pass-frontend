import { BASE_URL } from '../config/env';
import { authFetch } from './client';

/**
 * 백엔드 최적 동선 계산 API
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