// src/services/authService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const loginWithBackend = async (authCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: authCode }),
    });

    const result = await response.json();
    
    // 백엔드 ApiResponse 성공 여부에 따른 데이터 반환
    if (response.ok && result.data) {
      return result.data; // LoginResponse (user 정보, 토큰 등)
    } else {
      throw new Error(result.message || '백엔드 인증 실패');
    }
  } catch (error) {
    console.error('백엔드 로그인 통신 오류:', error);
    alert('백엔드 서버와 통신 중 오류가 발생했습니다. 서버가 켜져 있는지 확인해주세요!');
    return null;
  }
};