// src/constants/categories.js

/**
 * 한국관광공사 및 PawPass 표준 카테고리/테마 옵션
 */
export const CATEGORY_OPTIONS = [
  { label: '자연/풍경', value: 'NATURE' },
  { label: '카페', value: 'CAFE' },
  { label: '음식점/식당', value: 'FOOD' },
  { label: '문화/예술', value: 'CULTURE' },
  { label: '숙박시설', value: 'STAY' },
  { label: '동물병원', value: 'HOSPITAL' }
];

/**
 * 코드, 한글명, 영문명, 유사어 등 어떤 값이 들어와도 일치하는 표준 카테고리 객체를 찾는 유틸리티
 */
export const findCategory = (input) => {
  if (!input) return { label: '', value: '' };

  const trimmed = String(input).trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct value match or exact label match
  const exact = CATEGORY_OPTIONS.find(
    (c) => c.value.toLowerCase() === lower || c.label === trimmed
  );
  if (exact) return exact;

  // 2. Fuzzy matches for Korean & English variations
  if (lower === 'nature' || trimmed.includes('자연') || trimmed.includes('풍경') || trimmed.includes('공원') || trimmed.includes('휴양림') || trimmed.includes('산책') || trimmed.includes('숲')) {
    return { label: '자연/풍경', value: 'NATURE' };
  }
  if (lower === 'cafe' || trimmed.includes('카페') || trimmed.includes('커피') || trimmed.includes('디저트') || trimmed.includes('베이커리')) {
    return { label: '카페', value: 'CAFE' };
  }
  if (lower === 'food' || trimmed.includes('음식') || trimmed.includes('식당') || trimmed.includes('맛집') || trimmed.includes('레스토랑')) {
    return { label: '음식점/식당', value: 'FOOD' };
  }
  if (lower === 'culture' || trimmed.includes('문화') || trimmed.includes('예술') || trimmed.includes('전시') || trimmed.includes('박물관') || trimmed.includes('미술관')) {
    return { label: '문화/예술', value: 'CULTURE' };
  }
  if (lower === 'stay' || trimmed.includes('숙박') || trimmed.includes('호텔') || trimmed.includes('펜션') || trimmed.includes('리조트') || trimmed.includes('캠핑') || trimmed.includes('글램핑') || trimmed.includes('게스트하우스')) {
    return { label: '숙박시설', value: 'STAY' };
  }
  if (lower === 'hospital' || trimmed.includes('병원') || trimmed.includes('동물병원') || trimmed.includes('의료') || trimmed.includes('약국')) {
    return { label: '동물병원', value: 'HOSPITAL' };
  }

  return { label: trimmed, value: trimmed };
};
