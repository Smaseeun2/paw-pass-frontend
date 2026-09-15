// src/hooks/useSpotDetail.js
import { useState, useEffect } from 'react';
import { fetchTourDetail, fetchFacilityDetail, authFetch } from '../services/api';
import { BASE_URL } from '../config/env';

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
        let fetchedImage = '';
        let fetchedAttribution = '';

        let actualSource = source;
        if (source === 'kcisa' && /^\d+$/.test(id)) {
          actualSource = 'tourapi';
        }

        if (actualSource === 'kcisa') {
          // 1. 문화시설 상세 조회 (GET /facilities/{id})
          rawData = await fetchFacilityDetail(id);
          
          // 2. 문화시설 사진 전용 API 호출 (/facilities/{id}/image)
          try {
            const imgRes = await authFetch(`${BASE_URL}/facilities/${id}/image`, { method: 'GET' });
            if (imgRes.ok) {
              const imgResult = await imgRes.json();
              const imgData = imgResult.data || imgResult;
              fetchedImage = imgData.image || '';
              fetchedAttribution = imgData.image_attribution || '';
            }
          } catch (e) {
            console.warn('문화시설 개별 이미지 조회 실패:', e);
          }
        } else if (actualSource === 'kakao') {
          // 카카오맵 장소는 서버에 상세 정보가 없으므로 로컬스토리지(동선) 데이터나 빈 데이터로 모의 응답
          let cachedPlace = {};
          try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('paw_pass_routes_'));
            for (const k of keys) {
              const routes = JSON.parse(localStorage.getItem(k) || '[]');
              const found = routes.find(r => r.id === id);
              if (found) {
                cachedPlace = found;
                break;
              }
            }
          } catch (e) {}

          rawData = {
            data: {
              title: cachedPlace.name || '카카오맵 검색 장소',
              address: cachedPlace.address || '주소 정보',
              lat: cachedPlace.lat,
              lng: cachedPlace.lng,
              category: '카카오 장소',
              description: 'PawPass API에 등록되지 않은 카카오맵 로컬 장소입니다. 상세 동반 규정은 해당 장소에 직접 문의해 주세요.',
              pet_condition: {}
            }
          };
        } else {
          // 3. 관광공사 상세 조회 (GET /tours/{contentId})
          rawData = await fetchTourDetail(id);
        }

        const data = rawData.data || rawData;
        
        // 펫 조건 및 pet 변수 정의
        const petCond = data.pet_condition || data.petCondition || {};

        // 관광공사 상세는 images(배열), 나머지는 image(단수) 대응
        let candidateImages = [];
        if (actualSource === 'tourapi') {
          if (Array.isArray(data.images)) candidateImages = data.images;
          else if (data.images) candidateImages = [data.images];
          else if (data.image) candidateImages = [data.image];
          else if (data.firstimage) candidateImages = [data.firstimage];
        } else {
          if (fetchedImage) candidateImages = [fetchedImage];
          else if (data.image) candidateImages = [data.image];
        }

        // 💡 백엔드 수정 사항에 맞춘 위도(y), 경도(x) 필드명 최우선 반영
        const parsedLat = Number(data.lat || data.map_y || data.mapy || data.y || data.latitude);
        const parsedLng = Number(data.lng || data.map_x || data.mapx || data.x || data.longitude);

        const normalized = {
          contentId: String(id),
          id: String(id),
          source,
          name: data.title || data.facility_name || '장소명 없음',
          address: data.addr || data.address || data.addr1 || '주소 정보 없음',
          phone: data.tel || data.phone || '',
          hours: data.hours || petCond.operating_hours || '정보 미제공',
          images: candidateImages, // 갤러리 배열
          imageUrl: candidateImages[0] || '', // 대표 이미지 단건
          imageAttribution: fetchedAttribution || data.image_attribution || '',
          description: data.description || data.overview || '',
          rawCategory: data.category || data.cat3 || data.category3 || '',
          // 💡 지도 핀 위치를 잡기 위한 위도, 경도 명시적 주입
          lat: !isNaN(parsedLat) ? parsedLat : null,
          lng: !isNaN(parsedLng) ? parsedLng : null,
          petCondition: {
            acmpyType: petCond.acmpyTypeCd || petCond.acmpy_type || '',
            possibleBreeds: petCond.relaAcmpyEntEnterPrn || petCond.possible_breeds || '',
            needItem: petCond.acmpyNeedMtr || petCond.need_item || '',
            etcInfo: petCond.etcAcmpyInfo || petCond.etc_info || '',
            petPolicy: petCond.pet_policy || '',
            petRestriction: petCond.pet_restriction || '',
            petAmenities: petCond.pet_amenities || '',
            parkingAvailable: data.parking || petCond.parking_available || '',
            relaPosesFclty: petCond.rela_poses_fclty || '',
            relaFrnshPrdlst: petCond.rela_frnsh_prdlst || '',
            relaPurcPrdlst: petCond.rela_purc_prdlst || '',
            relaRntlPrdlst: petCond.rela_rntl_prdlst || ''
          }
        };

        setDetail(normalized);
      } catch (err) {
        console.error('장소 상세 정보 로드 실패:', err);
        setError('일시적인 서버 장애(또는 공공데이터 연동 오류)로 인해 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [id, source]);

  return { detail, isLoading, error };
};