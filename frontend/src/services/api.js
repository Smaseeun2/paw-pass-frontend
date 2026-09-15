// src/services/api.js
// 도메인별로 분리된 API 모듈들을 하나로 모아서 기존 임포트를 유지합니다.

export * from './client.js';
export * from './auth.api.js';
export * from './pet.api.js';
export * from './spot.api.js';
export * from './favorite.api.js';
export * from './route.api.js';

import { BASE_URL } from '../config/env.js';
import { authFetch } from './client.js';

export const fetchPrimaryPet = async () => {
  const res = await authFetch(`${BASE_URL}/users/me/primary-pet`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('대표 펫 조회 실패');
  const result = await res.json();
  return result.data || result;
};
