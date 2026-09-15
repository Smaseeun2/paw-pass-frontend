// src/constants/regions.js

/**
 * 한국관광공사 공공데이터 표준 지역 코드 및 명칭 상수
 */
export const REGION_OPTIONS = [
  { code: '', label: '전체 지역', fullName: '전체 지역' },
  { code: '서울', label: '서울', fullName: '서울특별시' },
  { code: '인천', label: '인천', fullName: '인천광역시' },
  { code: '대전', label: '대전', fullName: '대전광역시' },
  { code: '대구', label: '대구', fullName: '대구광역시' },
  { code: '광주', label: '광주', fullName: '광주광역시' },
  { code: '부산', label: '부산', fullName: '부산광역시' },
  { code: '울산', label: '울산', fullName: '울산광역시' },
  { code: '세종', label: '세종', fullName: '세종특별자치시' },
  { code: '경기', label: '경기', fullName: '경기도' },
  { code: '강원', label: '강원', fullName: '강원도' },
  { code: '충북', label: '충북', fullName: '충청북도' },
  { code: '충남', label: '충남', fullName: '충청남도' },
  { code: '전북', label: '전북', fullName: '전라북도' },
  { code: '전남', label: '전남', fullName: '전라남도' },
  { code: '경북', label: '경북', fullName: '경상북도' },
  { code: '경남', label: '경남', fullName: '경상남도' },
  { code: '제주', label: '제주', fullName: '제주도' }
];

/**
 * 코드, 축약명(경기), 정식명(경기도) 어떤 값이 들어와도 일치하는 지역 객체를 찾는 유틸리티
 */
const LEGACY_CODE_MAP = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구', '5': '광주',
  '6': '부산', '7': '울산', '8': '세종', '31': '경기', '32': '강원',
  '33': '충북', '34': '충남', '35': '전북', '36': '전남', '37': '경북',
  '38': '경남', '39': '제주'
};

export const findRegion = (input) => {
  if (!input) return REGION_OPTIONS[0];

  let trimmed = String(input).trim();
  if (LEGACY_CODE_MAP[trimmed]) {
    trimmed = LEGACY_CODE_MAP[trimmed];
  }

  const matched = REGION_OPTIONS.find(
    (r) =>
      r.code === trimmed ||
      r.label === trimmed ||
      r.fullName === trimmed ||
      trimmed.startsWith(r.label) ||
      (r.label !== '전체 지역' && r.fullName.includes(trimmed))
  );

  return matched || { code: trimmed, label: trimmed, fullName: trimmed };
};
