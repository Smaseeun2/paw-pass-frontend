import { BASE_URL } from '../config/env';
import { authFetch } from './client';

export const fetchSuggestedRoute = async (points) => {
  const res = await authFetch(`${BASE_URL}/route/suggest`, {
    method: 'POST',
    body: JSON.stringify({ points })
  });
  
  if (!res.ok) {
    throw new Error('동선 추천 API 호출 실패');
  }
  
  const result = await res.json();
  return result.data || result;
};