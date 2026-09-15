// src/hooks/usePetMatching.js
import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../services/api';
import { BASE_URL } from '../config/env';

// 펫 ID 검증 및 자동 추출 헬퍼
const resolvePetId = (paramPetId) => {
  // 1. 인자로 넘어온 펫 ID가 유효하면 우선 사용 (게스트의 13자리 타임스탬프 ID 및 문자열 ID 모두 지원)
  if (paramPetId && String(paramPetId).trim() !== '') {
    return String(paramPetId).trim();
  }

  try {
    // 2. 로그인 유저 정보나 펫 목록 스토리지 전수 조사
    const keysToCheck = ['paw_pass_pets', 'paw_pass_pets_guest', 'paw_pass_user'];
    
    for (const key of keysToCheck) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const parsed = JSON.parse(saved);
      
      // 케이스 A: 배열 형태의 펫 목록인 경우 ([ { id: 1, name: '초코' }, ... ])
      if (Array.isArray(parsed) && parsed.length > 0) {
        const representative = parsed.find(p => p.isRepresentative || p.is_representative || p.isPrimary) || parsed[0];
        const val = representative.id || representative._id || representative.petId || '';
        if (val) return String(val);
      }

      // 케이스 B: 객체 형태 안에 pets 배열이 있는 경우 ({ user: {...}, pets: [...] })
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.pets) && parsed.pets.length > 0) {
          const representative = parsed.pets.find(p => p.isRepresentative || p.is_representative || p.isPrimary) || parsed.pets[0];
          const val = representative.id || representative._id || representative.petId || '';
          if (val) return String(val);
        }
        // 케이스 C: 유저 객체 자체에 대표 펫 ID가 박혀있는 경우
        if (parsed.primaryPetId || parsed.representativePetId) {
          return String(parsed.primaryPetId || parsed.representativePetId);
        }
      }
    }
  } catch (e) {
    console.warn('자동 반려동물 ID 조회 중 예외 발생:', e);
  }

  return '';
};

export const usePetMatching = (spotId, source = 'tourapi', paramPetId = '') => {
  const resolvedId = useMemo(() => {
    if (!spotId) return '';
    if (typeof spotId === 'object') {
      return String(spotId.contentId || spotId.content_id || spotId.id || '');
    }
    return String(spotId);
  }, [spotId]);

  const petId = useMemo(() => resolvePetId(paramPetId), [paramPetId]);

  const [asyncResult, setAsyncResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 파생 상태 계산 (Effect 내 동기 setState 제거로 React 19 린트 에러 해결)
  const matchResult = useMemo(() => {
    if (!petId) {
      return {
        status: '반려동물 선택 필요',
        color: '#64748b',
        reason: '맞춤 방문 판정을 위해 프로필에서 반려동물을 등록하거나 선택해주세요.'
      };
    }
    if (!resolvedId) {
      return {
        status: '장소 선택 필요',
        color: '#64748b',
        reason: '장소 정보가 올바르지 않습니다.'
      };
    }
    if (asyncResult) {
      return asyncResult;
    }
    return {
      status: '조회 중...',
      color: '#64748b',
      reason: '판정 결과를 불러오는 중입니다.'
    };
  }, [petId, resolvedId, asyncResult]);

  useEffect(() => {
    if (!resolvedId || !petId) {
      return;
    }

    console.log(`🐾 [usePetMatching] 요청 ID: "${resolvedId}", Source: "${source}", PetID: "${petId}"`);

    let isMounted = true;
    const fetchMatching = async () => {
      setIsLoading(true);
      try {
        const endpoint = source === 'kcisa' 
          ? `${BASE_URL}/facilities/${resolvedId}/match` 
          : `${BASE_URL}/tours/${resolvedId}/match`;

        // petId 파라미터 없이 호출하면 백엔드가 자동으로 대표 반려동물을 기준으로 매칭합니다.
        const res = await authFetch(endpoint, { method: 'GET' });
        
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
        
        let tips = Array.isArray(data.tips) ? data.tips : [];
        if (tips.length === 0 && (statusText === '조건부' || statusText === '조건부 방문 가능')) {
          // 팁이 안 내려올 경우 보정 (2-4 요구사항)
          tips = ["자세한 출입 조건은 전화 문의", "이동장/케이지 필수 지참 권장"];
        }

        if (isMounted) {
          setAsyncResult({
            status: statusText,
            color: color,
            reason: data.reason || data.description || '반려동물 동반 조건에 따른 판정 결과입니다.',
            rawText: data.raw_text || '',
            tips: tips
          });
        }
      } catch (err) {
        console.error('펫 매칭 API 호출 에러:', err);
        if (isMounted) {
          setAsyncResult({
            status: '판정 불가',
            color: 'red',
            reason: '반려동물 맞춤 판정을 불러오지 못했습니다.',
            rawText: ''
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
  }, [resolvedId, source, petId]);

  return { matchResult, isLoading };
};