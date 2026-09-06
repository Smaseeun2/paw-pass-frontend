// src/hooks/useSpotDetail.js
import mockSpots from '../mocks/tourist-spots.json';

export const useSpotDetail = (spotId) => {
  // 만약 id가 없다면 빈 값 반환
  if (!spotId) return { detail: null };

  // 전달받은 id와 일치하는 관광지 1개를 찾습니다.
  const detail = mockSpots.find((spot) => String(spot.contentId) === String(spotId));

  return { detail };
};