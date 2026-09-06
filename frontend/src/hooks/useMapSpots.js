// src/hooks/useMapSpots.js
import { useState } from 'react';
import mockSpots from '../mocks/tourist-spots.json';

export const useMapSpots = () => {
  const [spots] = useState(mockSpots);
  const [selectedSpot, setSelectedSpot] = useState(null);

  // 마커를 클릭했을 때 선택된 관광지 설정
  const handleMarkerClick = (spot) => {
    setSelectedSpot(spot);
  };

  return { spots, selectedSpot, handleMarkerClick };
};