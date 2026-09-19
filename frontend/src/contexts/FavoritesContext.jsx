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
        const normalized = serverData.map(fav => ({
          ...fav,
          contentId: String(fav.content_id ?? fav.contentId ?? fav.id ?? ''),
          content_id: String(fav.content_id ?? fav.contentId ?? fav.id ?? ''),
          source: fav.source || 'tourapi',
          name: fav.title || fav.name || '장소명 없음',
          title: fav.title || fav.name || '장소명 없음',
          address: fav.addr || fav.address || fav.addr1 || '주소 정보 없음',
          addr: fav.addr || fav.address || fav.addr1 || '주소 정보 없음',
          imageUrl: fav.image || fav.firstimage || fav.imageUrl || ''
        }));
        setFavorites(normalized);
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

    const spotTitle = spot.title || spot.name || '장소명 없음';
    const spotAddr = spot.addr || spot.address || spot.addr1 || '주소 정보 없음';
    const spotImage = spot.firstimage || spot.image || spot.imageUrl || '';

    // Optimistic Update
    const newFav = {
      contentId,
      content_id: contentId,
      source,
      name: spotTitle,
      title: spotTitle,
      address: spotAddr,
      addr: spotAddr,
      imageUrl: spotImage
    };

    setFavorites(prev => {
      if (isCurrentlyFav) {
        return prev.filter(fav => String(fav.content_id || fav.contentId) !== contentId);
      } else {
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
         // 서버 응답(실제 ID 포함)으로 낙관적 항목 교체하되 title, addr 정보 유지
         setFavorites(prev => prev.map(fav => String(fav.content_id || fav.contentId) === contentId ? {
           ...newFav,
           ...newAddedFav,
           name: newAddedFav?.title || newAddedFav?.name || newFav.name || newFav.title,
           title: newAddedFav?.title || newAddedFav?.name || newFav.title || newFav.name,
           address: newAddedFav?.addr || newAddedFav?.address || newFav.address,
           addr: newAddedFav?.addr || newAddedFav?.address || newFav.addr
         } : fav));
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
