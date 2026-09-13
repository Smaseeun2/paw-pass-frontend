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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (spot) => {
    const email = getUserEmail();
    if (!email) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    // 💡 content_id, contentId, id 모두 대응하여 실제 고유 ID 추출
    const contentId = String(spot.content_id || spot.contentId || spot.id || '');
    const source = spot.source || 'tourapi';

    const existingItem = favorites.find(
      (item) => String(item.content_id || item.contentId || item.id) === String(contentId) &&
                item.source === source
    );

    try {
      if (existingItem) {
        const targetId = existingItem.favorite_id || existingItem.id;
        await deleteFavoriteInDB(targetId);
      } else {
        await addFavoriteInDB(source, contentId);
      }
      await loadFavorites();
    } catch (err) {
      console.error('즐겨찾기 처리 중 오류 발생:', err);
      alert('즐겨찾기 처리에 실패했습니다.');
    }
  };

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