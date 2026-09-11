// src/hooks/useSpotDetail.js
import { useState, useEffect } from 'react';
import { fetchTourDetail, fetchFacilityDetail, fetchFacilityImage } from '../services/api';

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
        if (source === 'kcisa') {
          // 1. KCISA 문화시설: 본문 + 사진 API 각각 안전하게 호출
          let f = {};
          let imgData = {};

          try {
            const facilityRes = await fetchFacilityDetail(id);
            f = facilityRes.data || facilityRes;
          } catch (e) {
            console.warn('문화시설 본문 조회 실패:', e);
          }

          try {
            const imageRes = await fetchFacilityImage(id);
            imgData = imageRes.data || imageRes;
          } catch (e) {
            console.warn('문화시설 이미지 조회 실패 (선택 사항):', e);
          }

          const cond = f.pet_condition || f.petCondition || {};

          setDetail({
            id: String(f.id || id),
            name: f.facility_name || f.title || '시설명 없음',
            address: f.address || f.addr || '주소 정보 없음',
            phone: f.tel || f.phone || '',
            hours: cond.operating_hours || f.operating_hours || '정보 미제공',
            imageUrl: imgData.image || imgData.url || f.image || f.google_photo_url || '',
            imageAttribution: imgData.image_attribution || f.image_attribution || '',
            lat: f.lat || f.latitude,
            lng: f.lng || f.longitude,
            source: 'kcisa',
            description: f.description || '',
            petCondition: {
              operatingHours: cond.operating_hours || '',
              petRestriction: cond.pet_restriction || '',
              parkingAvailable: cond.parking_available ? '주차 가능' : '주차 정보 없음',
              allowedPetSize: cond.allowed_pet_size || '',
              petExclusive: cond.pet_exclusive || '',
              additionalPetFee: cond.additional_pet_fee || ''
            }
          });
        } else {
          // 2. TourAPI 관광공사: 단건 호출
          const res = await fetchTourDetail(id);
          const t = res.data || res;
          const cond = t.pet_condition || t.petCondition || {};

          setDetail({
            id: String(t.content_id || t.id || id),
            name: t.title || '장소명 없음',
            address: t.addr1 || t.addr || '주소 정보 없음',
            phone: t.tel || '',
            hours: t.usetime || '정보 미제공',
            imageUrl: t.firstimage || t.image || '',
            imageAttribution: t.image_attribution || '',
            lat: t.mapy || t.lat,
            lng: t.mapx || t.lng,
            source: 'tourapi',
            description: t.overview || '',
            petCondition: {
              acmpyTypeCd: cond.acmpy_type_cd || cond.acmpyTypeCd || '',
              acmpyPsblCpam: cond.acmpy_psbl_cpam || cond.acmpyPsblCpam || '',
              acmpyNeedMtr: cond.acmpy_need_mtr || cond.acmpyNeedMtr || '',
              etcAcmpyInfo: cond.etc_acmpy_info || cond.etcAcmpyInfo || ''
            }
          });
        }
      } catch (err) {
        console.error('상세 정보 조회 실패:', err);
        setError('상세 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [id, source]);

  return { detail, isLoading, error };
};