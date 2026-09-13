// src/hooks/usePetMatching.js
import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.30.1.29:8080';

// 💡 1. 헬퍼 함수를 컴포넌트 외부에 분리하여 매 렌더링마다 불필요하게 실행되는 것 방지
const resolvePetId = (paramPetId) => {
  if (paramPetId) return paramPetId;
  try {
    for (const key of ['paw_pass_pets_guest', 'paw_pass_pets', 'paw_pass_user']) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const parsed = JSON.parse(saved);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0].id || parsed[0]._id || parsed[0].petId || '';
      }
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.pets) && parsed.pets.length > 0) {
          return parsed.pets[0].id || parsed.pets[0]._id || '';
        }
      }
    }
  } catch (e) {
    console.warn('자동 반려동물 ID 조회 중 예외 발생:', e);
  }
  return '';
};

export const usePetMatching = (id, source = 'tourapi', paramPetId = '') => {
  // 💡 2. useMemo를 사용하여 petId를 안정적으로 고정
  const petId = useMemo(() => resolvePetId(paramPetId), [paramPetId]);

  const [matchResult, setMatchResult] = useState(() => {
    if (!petId) {
      return {
        status: '반려동물 선택 필요',
        color: '#64748b',
        reason: '맞춤 방문 판정을 위해 프로필에서 반려동물을 등록하거나 선택해주세요.'
      };
    }
    return {
      status: '조회 중...',
      color: '#64748b',
      reason: '판정 결과를 불러오는 중입니다.'
    };
  });
  
  const [isLoading, setIsLoading] = useState(Boolean(id && petId));

  useEffect(() => {
    if (!id || !petId) return;

    let isMounted = true;
    const fetchMatching = async () => {
      setIsLoading(true);
      try {
        const endpoint = source === 'kcisa' 
          ? `${BASE_URL}/facilities/${id}/match` 
          : `${BASE_URL}/tours/${id}/match`;

        const res = await authFetch(`${endpoint}?petId=${petId}`, { method: 'GET' });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || '매칭 판정 조회 실패');
        }

        const result = await res.json();
        const data = result.data || result;

        const statusText = data.match_status || data.status || '직접 확인 필요';
        
        let color = '#64748b';
        if (statusText === '가능' || statusText === '방문 가능') color = 'green';
        else if (statusText === '조건부' || statusText === '조건부 방문 가능') color = '#ff9800';
        else if (statusText === '불가' || statusText === '방문 불가') color = 'red';

        if (isMounted) {
          setMatchResult({
            status: statusText,
            color: color,
            reason: data.reason || data.description || '반려동물 동반 조건에 따른 판정 결과입니다.'
          });
        }
      } catch (err) {
        console.error('펫 매칭 API 호출 에러:', err);
        if (isMounted) {
          setMatchResult({
            status: '판정 불가',
            color: 'red',
            reason: '반려동물 맞춤 판정을 불러오지 못했습니다.'
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMatching();

    return () => {
      isMounted = false;
    };
  }, [id, source, petId]);

  return { matchResult, isLoading };
};