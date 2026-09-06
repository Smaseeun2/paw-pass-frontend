import { useState } from 'react';
import mockSpots from '../mocks/tourist-spots.json';

export const useTouristSpots = () => {
  const [spots, setSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSpots = (condition) => {
    setIsLoading(true);

    setTimeout(() => {
      // 1. 주소(address) 텍스트 안에 검색한 지역 문자열이 포함되어 있는지 필터링
      let result = mockSpots.filter((spot) => spot.address.includes(condition.region));

      // 2. 관광 유형(category) 선택 시 필터링 추가
      if (condition.type) {
        result = result.filter((spot) => spot.category === condition.type);
      }

      setSpots(result);
      setIsLoading(false);
    }, 500);
  };

  return { spots, isLoading, fetchSpots };
};