// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 토큰 포함 헤더 생성 헬퍼
const getHeaders = () => {
  const token = localStorage.getItem('paw_pass_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// 1. 소셜 로그인 (인가 코드 전송)
export const loginWithGoogleCode = async (code) => {
  const res = await fetch(`${BASE_URL}/auth/google_id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (!res.ok) throw new Error('로그인 요청 실패');
  return res.json();
};

// 2. 백엔드 로그아웃
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

// 3. 반려동물 목록 조회
export const fetchPetsFromDB = async () => {
  const res = await fetch(`${BASE_URL}/pets`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('반려동물 목록 조회 실패');
  const result = await res.json();
  return result.data || result; // data 필드가 있으면 data 반환
};

// 4. 반려동물 등록
export const createPetInDB = async (petData) => {
  const res = await fetch(`${BASE_URL}/pets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(petData)
  });
  if (!res.ok) throw new Error('반려동물 등록 실패');
  const result = await res.json();
  return result.data || result;
};

// 5. 반려동물 삭제
export const deletePetInDB = async (petId) => {
  const res = await fetch(`${BASE_URL}/pets/${petId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('반려동물 삭제 실패');
};