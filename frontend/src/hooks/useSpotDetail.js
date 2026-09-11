// src/hooks/useSpotDetail.js
import { useState, useEffect } from 'react';
import { fetchTourDetail, fetchFacilityDetail } from '../services/api';

export const useSpotDetail = (id, source = 'tourapi') => {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const loadDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let rawData;
        if (source === 'kcisa') {
          rawData = await fetchFacilityDetail(id);
        } else {
          rawData = await fetchTourDetail(id);
        }

        const data = rawData.data || rawData;
        const petCond = data.pet_condition || {};

        // 화면에서 쉽게 쓰도록 통합 포맷 정규화
        const normalized = {
          contentId: String(id),
          source,
          name: data.title || '장소명 없음',
          address: data.addr || '주소 정보 없음',
          phone: data.tel || '',
          hours: data.hours || petCond.operating_hours || '정보 미제공',
          images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []),
          imageUrl: (Array.isArray(data.images) && data.images[0]) || data.image || '',
          description: data.description || '',
          // 반려동물 동반 상세 조건
          petCondition: {
            acmpyType: petCond.acmpyTypeCd || '', // 동반 가능 유형
            possibleBreeds: petCond.acmpyPsblCpam || '', // 동반 가능 동물/견종 크기
            needItem: petCond.acmpyNeedMtr || '', // 필수 준비물 (목줄, 이동장 등)
            etcInfo: petCond.etcAcmpyInfo || '', // 기타 안내
            petRestriction: petCond.pet_restriction || '', // 제한 사항
            parkingAvailable: petCond.parking_available || '' // 주차 가능 여부
          }
        };

        setDetail(normalized);
      } catch (err) {
        console.error('상세 정보 로드 실패:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [id, source]);

  return { detail, isLoading, error };
};