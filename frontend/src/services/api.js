// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.30.1.29:8080';

// 1. 공통 헤더 생성
export const getHeaders = () => {
  const token = localStorage.getItem('paw_pass_access_token');
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420', // ngrok 안내 화면 강제 스킵
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

// 3. 인터셉터 Fetch
export const authFetch = async (url, options = {}) => {
  let token = localStorage.getItem('paw_pass_access_token');

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let res = await fetch(url, { ...options, headers });

  // 401 Unauthorized 또는 403 Forbidden 발생 시 처리
  if (res.status === 401 || res.status === 403) {
    const refreshToken = localStorage.getItem('paw_pass_refresh_token');

    // 1) 리프레시 토큰이 있다면 토큰 갱신 시도
    if (refreshToken) {
      try {
        const newToken = await refreshAccessToken();
        headers.Authorization = `Bearer ${newToken}`;
        return await fetch(url, { ...options, headers });
      } catch (err) {
        console.warn('토큰 자동 갱신 실패:', err);
      }
    }

    // 2) 토큰 갱신 실패 시 로컬 스토리지 토큰 제거
    localStorage.removeItem('paw_pass_access_token');
    localStorage.removeItem('paw_pass_refresh_token');

    // 3) 공개 API(/explore, /tours, /facilities)는 토큰 없이 1회 재시도
    if (url.includes('/explore') || url.includes('/tours') || url.includes('/facilities')) {
      delete headers.Authorization;
      res = await fetch(url, { ...options, headers });
    }
  }

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

// 5. 백엔드 로그아웃
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

// 10. 통합 관광지/문화시설 탐색 (GET /explore)
// 백엔드 명세: regionCode, category, matchStatus, petId, page
export const fetchExploreSpots = async ({ regionCode, category, keyword, matchStatus, petId, page = 1 }) => {
  const params = new URLSearchParams();
  
  if (regionCode) params.append('regionCode', regionCode);
  if (category) params.append('category', category);
  if (keyword) params.append('keyword', keyword);
  if (matchStatus) params.append('matchStatus', matchStatus);
  if (petId) params.append('petId', petId);
  params.append('page', page);

  const res = await authFetch(`${BASE_URL}/explore?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error('장소 목록 조회 실패');
  const result = await res.json();
  return result.data || result;
};

// 11. 관광공사 실시간 관광지 검색 (GET /tours)
export const fetchTours = async ({ region_code = '', category = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (region_code) params.append('region_code', region_code);
  if (category) params.append('category', category);
  params.append('page', page);

  const res = await authFetch(`${BASE_URL}/tours?${params.toString()}`, { method: 'GET' });
  if (!res.ok) throw new Error('관광지 목록 조회 실패');
  return res.json();
};

// 12. 문화시설(여행지) DB 검색 (GET /facilities)
export const fetchFacilities = async ({ region_code = '', category = '', page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (region_code) params.append('region_code', region_code);
  if (category) params.append('category', category);
  params.append('page', page);

  const res = await authFetch(`${BASE_URL}/facilities?${params.toString()}`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('문화시설 목록 조회 실패');
  const result = await res.json();
  return result.data || result;
};

// 13. 관광공사 관광지 상세 단건 조회 (GET /tours/{contentId})
export const fetchTourDetail = async (contentId) => {
  const res = await authFetch(`${BASE_URL}/tours/${contentId}`, { method: 'GET' });
  if (!res.ok) throw new Error('관광지 상세 정보 조회 실패');
  const result = await res.json();
  return result.data || result;
};

// 14. 문화시설 상세 단건 조회 (GET /facilities/{id})
export const fetchFacilityDetail = async (id) => {
  const res = await authFetch(`${BASE_URL}/facilities/${id}`, { method: 'GET' });
  if (!res.ok) throw new Error('문화시설 상세 정보 조회 실패');
  const result = await res.json();
  return result.data || result;
};

// 15. 문화시설 이미지 단건 조회 (GET /facilities/{id}/image)
export const fetchFacilityImage = async (id) => {
  const res = await authFetch(`${BASE_URL}/facilities/${id}/image`, { method: 'GET' });
  if (!res.ok) throw new Error('문화시설 이미지 조회 실패');
  const result = await res.json();
  return result.data || result;
};

// 16. 즐겨찾기 등록 (POST /favorites)
export const addFavoriteInDB = async (source, contentId) => {
  const res = await authFetch(`${BASE_URL}/favorites`, {
    method: 'POST',
    body: JSON.stringify({ 
      source: source, 
      content_id: String(contentId), // 혹은 백엔드가 contentId를 원한다면 contentId: String(contentId) 로 변경
      contentId: String(contentId)   // 안전하게 둘 다 동봉해서 보낼 수도 있습니다.
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || '즐겨찾기 등록 실패');
  }
  
  const result = await res.json();
  return result.data || result;
};

// 17. 즐겨찾기 목록 조회 (GET /favorites - 필요 시 활용)
export const fetchFavoritesFromDB = async () => {
  const res = await authFetch(`${BASE_URL}/favorites`, {
    method: 'GET'
  });
  
  if (!res.ok) throw new Error('즐겨찾기 목록 조회 실패');
  const result = await res.json();
  return result.data || result;
};


// 18. 즐겨찾기 해제 / 삭제 (DELETE /favorites/{id})
export const deleteFavoriteInDB = async (favoriteId) => {
  const res = await authFetch(`${BASE_URL}/favorites/${favoriteId}`, {
    method: 'DELETE'
  });
  // 204 No Content 성공 처리
  if (!res.ok && res.status !== 204) {
    throw new Error('즐겨찾기 삭제 실패');
  }
};


// 19. 최적 동선 추천 조회 (POST /route/suggest)
export const fetchSuggestedRoute = async (points) => {
  const res = await authFetch(`${BASE_URL}/route/suggest`, {
    method: 'POST',
    body: JSON.stringify({ points })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || '동선 추천 조회 실패');
  }
  
  const result = await res.json();
  return result.data || result;
};

// src/services/api.js 에 추가할 함수 예시
export const setPrimaryPet = async (petId) => {
  const res = await authFetch(`${BASE_URL}/users/me/primary-pet`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pet_id: petId }) // 또는 petId 형식에 맞춰 조정
  });
  if (!res.ok) throw new Error('대표 반려동물 설정 실패');
  return res.json();
};