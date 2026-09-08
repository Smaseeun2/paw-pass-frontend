// src/hooks/useRouteOptimizer.js

// 1. Haversine 공식을 이용한 두 위경도 간의 직선 거리 계산 (km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 2. Nearest Neighbor 알고리즘을 통한 최적 동선 정렬 훅
export const useRouteOptimizer = (spots) => {
  if (!spots || spots.length <= 1) return spots;

  // 원본 배열을 훼손하지 않기 위해 복사
  const unvisited = [...spots];
  const optimized = [];

  // 첫 번째 장소를 출발지로 지정
  let current = unvisited.shift();
  optimized.push(current);

  // 가장 가까운 다음 장소를 반복적으로 탐색하여 정렬
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    unvisited.forEach((spot, idx) => {
      // 위도(latitude)와 경도(longitude) 값이 모두 있는지 확인
      if (current.latitude && current.longitude && spot.latitude && spot.longitude) {
        const dist = getDistance(current.latitude, current.longitude, spot.latitude, spot.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = idx;
        }
      }
    });

    current = unvisited.splice(nearestIndex, 1)[0];
    optimized.push(current);
  }

  return optimized;
};