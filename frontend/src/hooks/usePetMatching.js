// src/hooks/usePetMatching.js

export const usePetMatching = (spotPetInfo) => {
  // 로컬 스토리지에 저장된 사용자 반려동물 프로필을 불러옵니다
  const getStoredPetProfile = () => {
    const saved = localStorage.getItem('paw_pass_pet_profile');
    return saved ? JSON.parse(saved) : { size: '소형', weight: 5 };
  };

  const pet = getStoredPetProfile();

  // 관광지 조건과 반려동물 프로필을 비교하는 로직
  const calculateMatchStatus = () => {
    if (!spotPetInfo) return { status: '직접 확인 필요', color: '#777', reason: '정보 없음' };

    // 1. 동반 가능 여부 기본 체크
    if (!spotPetInfo.allowed) {
      return { status: '방문 불가', color: 'red', reason: '반려동물 동반이 불가능한 시설입니다.' };
    }

    // 2. 최대 무게 제한 체크 (백틱 및 올바른 변수명으로 수정)
    if (spotPetInfo.maxWeight && pet.weight > spotPetInfo.maxWeight) {
      return { 
        status: '조건부 방문 불가', 
        color: '#ff9800', 
        reason: `제한 체중(${spotPetInfo.maxWeight}kg)을 초과합니다.` 
      };
    }

    // 3. 기본 통과 시
    return { 
      status: spotPetInfo.indoor ? '방문 가능' : '조건부 방문 가능', 
      color: spotPetInfo.indoor ? 'green' : '#ff9800', 
      reason: spotPetInfo.indoor ? '실내 및 야외 모두 동반 가능합니다.' : '야외 공간만 동반 가능합니다.' 
    };
  };

  return { matchResult: calculateMatchStatus() };
};