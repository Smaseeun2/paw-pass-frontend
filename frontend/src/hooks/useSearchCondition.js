// src/hooks/useSearchCondition.js
import { useState } from 'react';

export const useSearchCondition = () => {
  // 1. 상태 (데이터): 여행 지역과 희망 관광 유형을 포함합니다[cite: 1].
  const [searchCondition, setSearchCondition] = useState({
    region: '',
    type: ''
  });

  // 2. 행동 (메서드): 사용자의 선택에 따라 조건을 업데이트합니다.
  const updateCondition = (e) => {
    const { name, value } = e.target;
    setSearchCondition((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. 행동 (메서드): 검색을 실행하고 기획서의 예외 상황을 처리합니다.
  const executeSearch = () => {
    // 예외 처리: 여행 조건을 선택하지 않으면 지역 선택을 요청합니다[cite: 1].
    if (!searchCondition.region) {
      alert('여행 지역을 선택해주세요. (지역 선택은 필수입니다)');
      return false;
    }
    
    alert(`선택된 지역: ${searchCondition.region}\n선택된 유형: ${searchCondition.type || '전체'}\n관광지 목록을 조회합니다!`);
    console.log('현재 적용 중인 여행 조건:', searchCondition); // 적용 중인 조건을 표시[cite: 1]
    return true;
  };

  return { searchCondition, updateCondition, executeSearch };
};