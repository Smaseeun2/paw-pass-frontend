// src/config/env.js
// Vite 내장 환경변수를 통해 개발 환경(npm run dev / localhost:5173)과 배포 환경(npm run build)을 자동 분기

export const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

// 1. 프론트엔드 웹사이트 URL (개발: http://localhost:5173, 배포: 실제 배포 도메인)
export const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || (IS_DEV ? 'http://localhost:5173' : 'https://pawpass.site');

// 2. 백엔드 API BASE_URL (개발/배포)
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawpass.site';
