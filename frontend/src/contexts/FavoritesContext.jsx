import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { fetchFavorites, addFavorite, deleteFavorite } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from '../utils/toast';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const serverData = await fetchFavorites();
      if (Array.isArray(serverData)) {
        setFavorites(serverData);
      }
    } catch (err) {
      console.warn('서버 즐겨찾기 조회 실패, 로컬 스토리지로 대체합니다:', err);
      try {
        const saved = localStorage.getItem(`paw_pass_favorites_${user.email}`);
        if (saved) setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (spot) => {
    if (!user) {
      toast.warning('로그인이 필요한 기능입니다.');
      return;
    }

    const contentId = String(spot.content_id || spot.contentId || spot.id || '');
    const source = spot.source || 'tourapi';
    const isCurrentlyFav = favorites.some(fav => String(fav.content_id || fav.contentId) === contentId);
    
    let favoriteIdToDelete = null;
    if (isCurrentlyFav) {
      const favObj = favorites.find(fav => String(fav.content_id || fav.contentId) === contentId);
      favoriteIdToDelete = favObj?.id || favObj?.favorite_id;
    }

    // Optimistic Update
    setFavorites(prev => {
      if (isCurrentlyFav) {
        return prev.filter(fav => String(fav.content_id || fav.contentId) !== contentId);
      } else {
        const newFav = {
          contentId,
          content_id: contentId,
          source,
          name: spot.title || spot.name,
          address: spot.addr1 || spot.address || spot.addr,
          imageUrl: spot.firstimage || spot.image || spot.imageUrl || ''
        };
        return [newFav, ...prev];
      }
    });

    try {
      if (isCurrentlyFav) {
         if (favoriteIdToDelete) {
           await deleteFavorite(favoriteIdToDelete);
         } else {
           // 낙관적 업데이트 직후라 ID가 없는 경우 서버에서 조회 후 삭제
           const serverData = await fetchFavorites();
           const realFav = serverData.find(fav => String(fav.content_id || fav.contentId) === contentId);
           if (realFav && (realFav.id || realFav.favorite_id)) {
             await deleteFavorite(realFav.id || realFav.favorite_id);
           }
         }
      } else {
         const newAddedFav = await addFavorite({
            source,
            content_id: contentId
         });
         // 서버 응답(실제 ID 포함)으로 낙관적 항목 교체
         setFavorites(prev => prev.map(fav => String(fav.content_id || fav.contentId) === contentId ? newAddedFav : fav));
      }
    } catch (err) {
      console.error('즐겨찾기 에러:', err);
      toast.error('즐겨찾기 반영에 실패했습니다.');
      loadFavorites(); // 롤백
    }
  };

  const removeFavorite = async (contentId) => {
    const targetItem = favorites.find(
      (item) => String(item.content_id || item.contentId || item.id) === String(contentId)
    );
    if (!targetItem) return;

    // Optimistic Update
    setFavorites(prev => prev.filter(item => String(item.content_id || item.contentId || item.id) !== String(contentId)));

    try {
      const targetId = targetItem.favorite_id || targetItem.id;
      if (targetId) {
        await deleteFavorite(targetId);
      } else {
        const serverData = await fetchFavorites();
        const realFav = serverData.find(fav => String(fav.content_id || fav.contentId) === String(contentId));
        if (realFav && (realFav.id || realFav.favorite_id)) {
          await deleteFavorite(realFav.id || realFav.favorite_id);
        }
      }
    } catch (err) {
      console.error('즐겨찾기 삭제 에러:', err);
      toast.error('즐겨찾기 삭제에 실패했습니다.');
      loadFavorites();
    }
  };

  const isFavorite = (contentId) => {
    return favorites.some(
      (item) => String(item.content_id || item.contentId || item.id) === String(contentId)
    );
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isLoading, loadFavorites, refreshFavorites: loadFavorites, toggleFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = () => useContext(FavoritesContext);
