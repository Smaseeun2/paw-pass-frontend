// src/utils/toast.js
// 전역 토스트 알림 유틸리티 (브라우저 alert() 대체)
// 사용법: import { toast } from '../utils/toast'; → toast.success('완료!');

const TOAST_EVENT = 'pawpass:toast';

/**
 * 토스트 알림 발생 함수
 * @param {string} message - 표시할 메시지
 * @param {'success'|'error'|'info'|'warning'} type - 알림 유형
 * @param {number} duration - 자동 닫힘 시간(ms), 기본 3000
 */
const show = (message, type = 'info', duration = 3000) => {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type, duration, id: Date.now() }
  }));
};

export const toast = {
  success: (msg, duration) => show(msg, 'success', duration),
  error: (msg, duration) => show(msg, 'error', duration),
  info: (msg, duration) => show(msg, 'info', duration),
  warning: (msg, duration) => show(msg, 'warning', duration),
};

export { TOAST_EVENT };
