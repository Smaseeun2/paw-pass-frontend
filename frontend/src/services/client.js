import { BASE_URL } from '../config/env';

export const getHeaders = () => {
  const token = localStorage.getItem('paw_pass_access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const authFetch = async (url, options = {}) => {
  const headers = getHeaders();

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // ngrok 경고 페이지 스킵을 위한 헤더 추가
  headers['ngrok-skip-browser-warning'] = 'true';

  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });

  if (res.status === 401 || res.status === 403) {
    const refreshToken = localStorage.getItem('paw_pass_refresh_token');
    
    // Prevent infinite loop by checking if this is already a retry
    if (refreshToken && !options._isRetry) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const result = refreshData.data || refreshData;
          if (result.access_token) {
            localStorage.setItem('paw_pass_access_token', result.access_token);
            const newHeaders = getHeaders();
            if (!(options.body instanceof FormData)) {
              newHeaders['Content-Type'] = 'application/json';
            }
            return fetch(url, { ...options, headers: { ...newHeaders, ...options.headers }, _isRetry: true });
          }
        }
      } catch (err) {
        console.warn('토큰 갱신 중 에러 발생:', err);
      }
    }
    
    // 리프레시 토큰이 없거나, 갱신에 실패했거나, 이미 재시도한 경우 강제 로그아웃
    localStorage.removeItem('paw_pass_access_token');
    localStorage.removeItem('paw_pass_refresh_token');
    localStorage.removeItem('paw_pass_user');
    
    // 이벤트 발생시켜서 App 레벨이나 Context에서 감지하도록 (선택사항)
    window.dispatchEvent(new Event('paw_pass_auth_expired'));
  }

  return res;
};
