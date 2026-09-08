// src/hooks/useSearchCondition.js
import { useState } from 'react';

export const useSearchCondition = () => {
  // 1. 상태 (데이터): 검색어, 여행 지역, 희망 관광 유형을 포함합니다.
  const [searchCondition, setSearchCondition] = useState({
    keyword: '',
    region: '',
    type: ''
  });

  // 2. 행동 (메서드): 사용자의 입력(input, select 등)에 따라 조건을 업데이트합니다.
  const updateCondition = (e) => {
    const { name, value } = e.target;
    setSearchCondition((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. 행동 (메서드): 검색을 실행하고 조건을 반환합니다.
  const executeSearch = () => {
    console.log('현재 적용 중인 여행 조건:', searchCondition);
    return searchCondition;
  };

  return { searchCondition, updateCondition, executeSearch, setSearchCondition };
};