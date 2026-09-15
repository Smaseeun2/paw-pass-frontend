import { BASE_URL } from '../config/env';
import { authFetch } from './client';

export const fetchFavorites = async (userId) => {
  const res = await authFetch(`${BASE_URL}/favorites`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('즐겨찾기 목록 조회 실패');
  const result = await res.json();
  return result.data || result;
};

export const addFavorite = async (itemData) => {
  const res = await authFetch(`${BASE_URL}/favorites`, {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
  if (!res.ok) throw new Error('즐겨찾기 등록 실패');
  const result = await res.json();
  return result.data || result;
};

export const deleteFavorite = async (favoriteId) => {
  const res = await authFetch(`${BASE_URL}/favorites/${favoriteId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('즐겨찾기 삭제 실패');
};

export const toggleFavoriteItem = async (isFavorite, favoriteId, spotData) => {
  if (isFavorite) {
    await deleteFavorite(favoriteId);
    return false;
  } else {
    const newFav = await addFavorite(spotData);
    return newFav;
  }
};