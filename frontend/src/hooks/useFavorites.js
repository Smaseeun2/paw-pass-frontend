// src/hooks/useFavorites.js
import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('paw_pass_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('paw_pass_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // 찜 추가 및 제거 토글 함수
  const toggleFavorite = (spot) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.contentId === spot.contentId);
      if (exists) {
        return prev.filter((item) => item.contentId !== spot.contentId);
      } else {
        return [...prev, spot];
      }
    });
  };

  const removeFavorite = (contentId) => {
    setFavorites((prev) => prev.filter((item) => item.contentId !== contentId));
  };

  const isFavorite = (contentId) => {
    return favorites.some((item) => item.contentId === contentId);
  };

  return { favorites, toggleFavorite, removeFavorite, isFavorite };
};