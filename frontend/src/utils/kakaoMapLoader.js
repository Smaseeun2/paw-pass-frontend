// src/utils/kakaoMapLoader.js

let kakaoLoadPromise = null;

/**
 * 카카오맵 SDK를 싱글톤으로 안전하게 단 1회만 로드하는 유틸리티
 * @returns {Promise<window.kakao>}
 */
export const loadKakaoMapSdk = () => {
  // 1. 이미 완전히 로드되어 초기화된 경우
  if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
    return Promise.resolve(window.kakao);
  }

  // 2. 이미 로드 중인 Promise가 있는 경우 재사용
  if (kakaoLoadPromise) {
    return kakaoLoadPromise;
  }

  const appKey = import.meta.env.VITE_KAKAO_APP_KEY || '';

  kakaoLoadPromise = new Promise((resolve, reject) => {
    if (!appKey) {
      console.warn('⚠️ VITE_KAKAO_APP_KEY가 설정되지 않았습니다.');
      return reject(new Error('Kakao App Key missing'));
    }

    // 3. 이미 DOM에 kakao SDK 스크립트가 주입되어 있는지 확인
    let script = document.getElementById('pawpass-kakao-sdk');

    const handleMapsLoaded = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          resolve(window.kakao);
        });
      } else {
        reject(new Error('Kakao Maps namespace unavailable'));
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'pawpass-kakao-sdk';
      script.type = 'text/javascript';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey.trim()}&autoload=false&libraries=services`;
      script.async = true;

      script.onload = handleMapsLoaded;
      script.onerror = (err) => {
        kakaoLoadPromise = null;
        console.error('❌ 카카오맵 SDK 스크립트 로드 실패:', err);
        reject(err);
      };

      document.head.appendChild(script);
    } else {
      if (window.kakao && window.kakao.maps) {
        handleMapsLoaded();
      } else {
        script.addEventListener('load', handleMapsLoaded);
        script.addEventListener('error', (err) => {
          kakaoLoadPromise = null;
          reject(err);
        });
      }
    }
  });

  return kakaoLoadPromise;
};
