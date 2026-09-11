// src/hooks/usePetMatching.js
import { useState, useEffect } from 'react';
import { authFetch } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.30.1.29:8080';

export const usePetMatching = (id, source = 'tourapi', petId = '') => {
  const [matchResult, setMatchResult] = useState({
    status: '조회 중...',
    color: '#64748b',
    reason: '판정 결과를 불러오는 중입니다.'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchMatching = async () => {
      setIsLoading(true);
      try {
        // 💡 source에 따른 엔드포인트 분기 처리 (kcisa vs tourapi)
        const endpoint = source === 'kcisa' 
          ? `${BASE_URL}/facilities/${id}/match` 
          : `${BASE_URL}/tours/${id}/match`;

        const query = petId ? `?petId=${petId}` : '';

        const res = await authFetch(`${endpoint}${query}`, { method: 'GET' });
        
        if (!res.ok) {
          throw new Error('매칭 판정 조회 실패');
        }

        const result = await res.json();
        const data = result.data || result;

        const statusText = data.match_status || data.status || '직접 확인 필요';
        
        let color = '#64748b';
        if (statusText === '가능' || statusText === '방문 가능') color = 'green';
        else if (statusText === '조건부' || statusText === '조건부 방문 가능') color = '#ff9800';
        else if (statusText === '불가' || statusText === '방문 불가') color = 'red';

        setMatchResult({
          status: statusText,
          color: color,
          reason: data.reason || data.description || '반려동물 동반 조건에 따른 판정 결과입니다.'
        });
      } catch (err) {
        console.error('펫 매칭 API 호출 에러:', err);
        setMatchResult({
          status: '판정 불가',
          color: 'red',
          reason: '반려동물 맞춤 판정을 불러오지 못했습니다.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatching();
  }, [id, source, petId]);

  return { matchResult, isLoading };
};