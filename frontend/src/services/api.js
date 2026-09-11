// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.30.1.29:8080';

// 1. 공통 헤더 생성
export const getHeaders = () => {
  const token = localStorage.getItem('paw_pass_access_token');
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', // 💡 ngrok 안내 화면 강제 스킵
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// 2. 토큰 갱신 함수 (POST /auth/refresh)
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('paw_pass_refresh_token');
  if (!refreshToken) {
    throw new Error('리프레시 토큰이 없습니다.');
  }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!res.ok) {
    localStorage.removeItem('paw_pass_user');
    localStorage.removeItem('paw_pass_access_token');
    localStorage.removeItem('paw_pass_refresh_token');
    window.location.href = '/';
    throw new Error('세션 만료: 다시 로그인해주세요.');
  }

  const result = await res.json();
  const newAccessToken = result.data?.access_token || result.access_token;

  if (newAccessToken) {
    localStorage.setItem('paw_pass_access_token', newAccessToken);
    return newAccessToken;
  }
  throw new Error('새 액세스 토큰 수신 실패');
};

// 3. 토큰 만료 시 자동 갱신 인터셉터 Fetch
// authFetch 내부 headers 기본값에도 추가
export const authFetch = async (url, options = {}) => {
  let token = localStorage.getItem('paw_pass_access_token');

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', // 💡 ngrok 안내 화면 강제 스킵
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let res = await fetch(url, { ...options, headers });
  // ... (기존 로직 유지)
  return res;
};

// 4. 소셜 로그인
export const loginWithGoogleCode = async (code) => {
  const res = await fetch(`${BASE_URL}/auth/google_id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (!res.ok) throw new Error('로그인 요청 실패');
  return res.json();
};

// 5. 백엔드 로그아웃 (💡 App.jsx가 필요로 하는 export 추가)
export const logoutBackend = async (refreshToken) => {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch (err) {
    console.error('백엔드 로그아웃 통신 실패:', err);
  }
};

// 6. 반려동물 목록 조회
export const fetchPetsFromDB = async () => {
  const res = await authFetch(`${BASE_URL}/pets`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('반려동물 목록 조회 실패');
  const result = await res.json();
  return result.data || result;
};

// 7. 반려동물 등록
export const createPetInDB = async (petData) => {
  const res = await authFetch(`${BASE_URL}/pets`, {
    method: 'POST',
    body: JSON.stringify(petData)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || '반려동물 등록 실패');
  }
  const result = await res.json();
  return result.data || result;
};

// 8. 반려동물 삭제
export const deletePetInDB = async (petId) => {
  const res = await authFetch(`${BASE_URL}/pets/${petId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('반려동물 삭제 실패');
};

// 9. 반려동물 정보 수정 (PUT /pets/{id})
export const updatePetInDB = async (petId, petData) => {
  const res = await authFetch(`${BASE_URL}/pets/${petId}`, {
    method: 'PUT',
    body: JSON.stringify(petData)
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('반려동물 수정 실패 응답:', errorText);
    throw new Error(errorText || '반려동물 수정 실패');
  }
  const result = await res.json();
  return result.data || result;
};

// 10. 통합 관광지/문화시설 탐색 (추천: GET /explore)
export const fetchExploreSpots = async ({ region_code = '', category = '', match_status = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (region_code) params.append('region_code', region_code);
  if (category) params.append('category', category);
  if (match_status) params.append('match_status', match_status);
  if (page) params.append('page', page);

  const res = await authFetch(`${BASE_URL}/explore?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error('통합 탐색 조회 실패');
  return res.json();
};

// 11. 관광공사 실시간 관광지 검색 (GET /tours)
export const fetchTours = async ({ region_code = '', category = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (region_code) params.append('region_code', region_code);
  if (category) params.append('category', category);
  if (page) params.append('page', page);

  const res = await authFetch(`${BASE_URL}/tours?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error('관광지 목록 조회 실패');
  return res.json();
};

// 12. 문화시설(여행지) DB 검색 (GET /facilities)
export const fetchFacilities = async ({ region_code = '', category = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (region_code) params.append('region_code', region_code);
  if (category) params.append('category', category);
  if (page) params.append('page', page);

  const res = await authFetch(`${BASE_URL}/facilities?${params.toString()}`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('문화시설 목록 조회 실패');
  const result = await res.json();
  return result.data || result;
};