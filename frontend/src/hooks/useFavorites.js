// src/hooks/useFavorites.js
import { useState, useEffect, useCallback } from 'react';
import { addFavoriteInDB, fetchFavoritesFromDB, deleteFavoriteInDB } from '../services/api';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getUserEmail = () => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      const user = saved ? JSON.parse(saved) : null;
      return user?.email || user?.id || null;
    } catch {
      return null;
    }
  };

  // 서버에서 즐겨찾기 목록 동기화
  const loadFavorites = useCallback(async () => {
    const email = getUserEmail();
    if (!email) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const serverData = await fetchFavoritesFromDB();
      if (Array.isArray(serverData)) {
        setFavorites(serverData);
      }
    } catch (err) {
      console.warn('서버 즐겨찾기 조회 실패, 로컬 스토리지로 대체합니다:', err);
      try {
        const saved = localStorage.getItem(`paw_pass_favorites_${email}`);
        if (saved) setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // 즐겨찾기 추가 / 삭제 토글
  const toggleFavorite = async (spot) => {
    const email = getUserEmail();
    if (!email) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    const contentId = spot.content_id || spot.contentId || spot.id;
    const source = spot.source || 'tourapi';

    // 이미 등록되어 있는지 확인 (서버 객체의 id 또는 content_id 기준)
    const existingItem = favorites.find(
      (item) => String(item.content_id || item.contentId || item.id) === String(contentId) &&
                item.source === source
    );

    try {
      if (existingItem) {
        // 1. 이미 있다면 삭제 (DELETE /favorites/{id})
        const targetId = existingItem.favorite_id || existingItem.id;
        await deleteFavoriteInDB(targetId);
      } else {
        // 2. 없다면 등록 (POST /favorites)
        await addFavoriteInDB(source, contentId);
      }
      // 변경 후 서버 목록 최신화
      await loadFavorites();
    } catch (err) {
      console.error('즐겨찾기 처리 중 오류 발생:', err);
      alert('즐겨찾기 처리에 실패했습니다.');
    }
  };

  // 특정 contentId로 직접 삭제
  const removeFavorite = async (contentId) => {
    const targetItem = favorites.find(
      (item) => String(item.content_id || item.contentId || item.id) === String(contentId)
    );
    if (!targetItem) return;

    try {
      const targetId = targetItem.favorite_id || targetItem.id;
      await deleteFavoriteInDB(targetId);
      await loadFavorites();
    } catch (err) {
      console.error('즐겨찾기 삭제 실패:', err);
    }
  };

  const isFavorite = (contentId) => {
    return favorites.some(
      (item) => String(item.content_id || item.contentId || item.id) === String(contentId)
    );
  };

  return { favorites, toggleFavorite, removeFavorite, isFavorite, isLoading, refreshFavorites: loadFavorites };
};