// src/hooks/useFavorites.js
import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const getUserEmail = () => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      const user = saved ? JSON.parse(saved) : null;
      return user?.email || null;
    } catch {
      return null;
    }
  };

  const [favorites, setFavorites] = useState(() => {
    const email = getUserEmail();
    if (!email) return [];
    try {
      const saved = localStorage.getItem(`paw_pass_favorites_${email}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 유저 로그인 / 로그아웃 상태 변화 동기화
  useEffect(() => {
    const syncFavorites = () => {
      const email = getUserEmail();
      if (!email) {
        setFavorites([]);
        return;
      }
      try {
        const saved = localStorage.getItem(`paw_pass_favorites_${email}`);
        setFavorites(saved ? JSON.parse(saved) : []);
      } catch {
        setFavorites([]);
      }
    };

    window.addEventListener('storage', syncFavorites);
    return () => window.removeEventListener('storage', syncFavorites);
  }, []);

  const saveFavorites = (newList) => {
    const email = getUserEmail();
    if (!email) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    setFavorites(newList);
    localStorage.setItem(`paw_pass_favorites_${email}`, JSON.stringify(newList));
  };

  const toggleFavorite = (spot) => {
    const email = getUserEmail();
    if (!email) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    const exists = favorites.some((item) => item.contentId === spot.contentId);
    let updated;
    if (exists) {
      updated = favorites.filter((item) => item.contentId !== spot.contentId);
    } else {
      updated = [...favorites, spot];
    }
    saveFavorites(updated);
  };

  const removeFavorite = (contentId) => {
    const updated = favorites.filter((item) => item.contentId !== contentId);
    saveFavorites(updated);
  };

  const isFavorite = (contentId) => {
    return favorites.some((item) => item.contentId === contentId);
  };

  return { favorites, toggleFavorite, removeFavorite, isFavorite };
};