// src/hooks/useTrips.js
import { useState, useEffect } from 'react';
import { toast } from '../utils/toast';

export const useTrips = () => {
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('paw_pass_trips');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('paw_pass_trips', JSON.stringify(trips));
  }, [trips]);

  // 렌더링 중이 아니라 함수가 실행되는 시점(이벤트 발생 시)에 날짜와 ID를 생성합니다.
  const addTrip = (title, spotName) => {
    if (!spotName) {
      toast.warning('동선에 추가할 관광지를 선택해주세요!');
      return;
    }

    const newTrip = {
      id: Date.now(),
      title: title || '나의 여행 동선',
      spots: [spotName],
      date: new Date().toISOString().split('T')[0]
    };

    setTrips((prev) => {
      toast.success(`"${newTrip.spots[0]}" 장소가 '${newTrip.title}' 동선에 추가되었습니다! 🚗`);
      return [...prev, newTrip];
    });
  };

  const deleteTrip = (id) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== id));
  };

  return { trips, addTrip, deleteTrip };
};