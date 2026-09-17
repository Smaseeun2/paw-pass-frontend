import { BASE_URL } from '../config/env';
import { authFetch } from './client';

export const fetchPetsFromDB = async () => {
  const res = await authFetch(`${BASE_URL}/pets`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('반려동물 목록 조회 실패');
  const result = await res.json();
  return result.data || result;
};

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

export const deletePetInDB = async (petId) => {
  const res = await authFetch(`${BASE_URL}/pets/${petId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('반려동물 삭제 실패');
};

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

export const uploadPetProfileImage = async (petId, file) => {
  const formData = new FormData();
  formData.append('image', file);

  const res = await authFetch(`${BASE_URL}/pets/${petId}/profile-image`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || '반려동물 이미지 등록 실패');
  }
  const result = await res.json();
  return result.data || result;
};