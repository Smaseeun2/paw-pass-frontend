import { BASE_URL } from '../config/env';
import { authFetch } from './client';

export const loginWithGoogleCode = async (code) => {
  const res = await fetch(`${BASE_URL}/auth/google_id`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({ code })
  });

  if (!res.ok) throw new Error('구글 로그인 코드 처리 실패');
  return res.json();
};

export const logoutBackend = async (refreshToken) => {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch (err) {
    console.error('백엔드 로그아웃 통신 실패:', err);
  }
};

export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const res = await authFetch(`${BASE_URL}/users/me/profile-image`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || '프로필 이미지 업로드 실패');
  }

  const result = await res.json();
  return result.data || result;
};