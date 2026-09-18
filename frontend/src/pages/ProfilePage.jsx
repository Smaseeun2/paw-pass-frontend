// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPetsFromDB, createPetInDB, deletePetInDB, updatePetInDB, authFetch, uploadProfileImage } from '../services/api';
import mockSpots from '../mocks/tourist-spots.json';
import { toast } from '../utils/toast';
import { migrateGuestRoutes } from '../utils/migrationUtils';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../config/env';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, login, updateUser } = useAuth();

  const getActiveKey = (currentUser) => {
    return currentUser?.email ? `paw_pass_pets_${currentUser.email}` : 'paw_pass_pets_guest';
  };

  const [pets, setPets] = useState(() => {
    try {
      const guestSaved = localStorage.getItem('paw_pass_pets_guest');
      return guestSaved ? JSON.parse(guestSaved) : [];
    } catch {
      return [];
    }
  });

  // 수정 중인 반려동물 ID 추적 state (null이면 신규 등록 모드)
  const [editingPetId, setEditingPetId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    species: 'DOG',
    breed: '',
    birthYear: String(new Date().getFullYear()),
    birthMonth: '01',
    birthDay: '01',
    unknownBirth: false,
    weight: '',
    size: '소형',
    image: '🐶',
    supplies: []
  });

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('register'); // 'register' | 'selectPrimary'
  const [registeredPetName, setRegisteredPetName] = useState('');

  const defaultIcons = ['🐶', '🐱', '🦮', '🐈‍⬛'];
  const availableSupplies = ['목줄/하네스', '입마개', '배변봉투', '이동장/케이지', '유모차/웨건', '기저귀/매너벨트'];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  // 백엔드 명세에 맞춘 페이로드 변환
  const formatPayloadForDB = (pet) => {
    const sizeMap = {
      '소형': 'SMALL',
      '중형': 'MEDIUM',
      '대형': 'LARGE'
    };

    const hasCarrier = pet.supplies ? pet.supplies.includes('이동장/케이지') : Boolean(pet.has_carrier);
    const hasLeash = pet.supplies ? pet.supplies.includes('목줄/하네스') : Boolean(pet.has_leash);
    const hasMuzzle = pet.supplies ? pet.supplies.includes('입마개') : Boolean(pet.has_muzzle);
    const hasWasteBags = pet.supplies ? pet.supplies.includes('배변봉투') : Boolean(pet.has_waste_bags);
    const hasStroller = pet.supplies ? pet.supplies.includes('유모차/웨건') : Boolean(pet.has_stroller);
    const hasDiaper = pet.supplies ? pet.supplies.includes('기저귀/매너벨트') : Boolean(pet.has_diaper);

    return {
      species: pet.species || 'DOG',
      name: String(pet.name || '').trim(),
      breed: String(pet.breed || '').trim(),
      weight: parseFloat(pet.weight) || 0,
      size: sizeMap[pet.size] || 'SMALL',
      has_carrier: hasCarrier,
      has_leash: hasLeash,
      has_muzzle: hasMuzzle,
      has_waste_bags: hasWasteBags,
      has_stroller: hasStroller,
      has_diaper: hasDiaper,
      birth_date: (pet.birthDate === '모름' || pet.birthDate === '정보 없음' || !pet.birthDate) ? null : pet.birthDate,
      image: pet.image || pet.imageUrl || '',
      is_primary: Boolean(pet.isPrimary || pet.is_primary)
    };
  };

  // 💡 [핵심 보정] 전체 펫 중 오직 단 1마리만 isPrimary가 true가 되도록 강제 정렬하는 함수
  const enforceSinglePrimary = (petList) => {
    if (!Array.isArray(petList) || petList.length === 0) return [];
    
    const primaryIndex = petList.findIndex(p => Boolean(p.isPrimary || p.is_primary));
    const targetIdx = primaryIndex !== -1 ? primaryIndex : 0;

    return petList.map((p, idx) => ({
      ...p,
      isPrimary: idx === targetIdx
    }));
  };

  // 펫 동기화
  useEffect(() => {
    const loadPets = async () => {
      const reverseSizeMap = {
        'SMALL': '소형',
        'MEDIUM': '중형',
        'LARGE': '대형'
      };

      let rawPets = [];

      if (user) {
        try {
          const res = await fetchPetsFromDB();
          rawPets = Array.isArray(res) ? res : (res?.data || []);
        } catch (err) {
          console.warn('DB 펫 조회 에러 (비로그인 처리):', err);
        }

        const guestSaved = localStorage.getItem('paw_pass_pets_guest');
        if (guestSaved) {
          const guestPets = JSON.parse(guestSaved);
          const failedGuestPets = [];

          const results = await Promise.allSettled(
            guestPets.map(gPet => createPetInDB(formatPayloadForDB(gPet)))
          );

          results.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
              const resData = result.value?.data || result.value;
              rawPets.push(resData);
            } else {
              failedGuestPets.push(guestPets[idx]);
            }
          });

          if (failedGuestPets.length === 0) {
            localStorage.removeItem('paw_pass_pets_guest');
          } else {
            localStorage.setItem('paw_pass_pets_guest', JSON.stringify(failedGuestPets));
            toast.error('일부 반려동물 정보를 서버로 이전하지 못했습니다.');
          }
        }
      } else {
        const guestSaved = localStorage.getItem('paw_pass_pets_guest');
        rawPets = guestSaved ? JSON.parse(guestSaved) : [];
      }

      const formattedPets = rawPets.map((p) => ({
        ...p,
        size: reverseSizeMap[p.size] || p.size || '소형',
        birthDate: p.birth_date || p.birthDate || '정보 없음',
        isPrimary: Boolean(p.is_primary || p.isPrimary),
        image: p.image_url || p.imageUrl || p.image || '', // 서버 최신 규격 반영
        supplies: p.supplies || [
          ...(p.has_leash ? ['목줄/하네스'] : []),
          ...(p.has_carrier ? ['이동장/케이지'] : []),
          ...(p.has_stroller ? ['유모차/웨건'] : []),
          ...(p.has_muzzle ? ['입마개'] : []),
          ...(p.has_waste_bags ? ['배변봉투'] : []),
          ...(p.has_diaper ? ['기저귀/매너벨트'] : [])
        ]
      }));

      setPets(enforceSinglePrimary(formattedPets));
    };

    loadPets();
  }, [user]);

  // 🐾 [임시 낙관적] 대표 반려동물 설정 함수 (Optimistic Update로 먼저 화면 갱신)
  const handleSetPrimary = async (petId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // 1. UI 즉각 반영 (Optimistic Update)
    setPets(prev => enforceSinglePrimary(prev.map(p => ({
      ...p,
      isPrimary: String(p.id) === String(petId),
      is_primary: String(p.id) === String(petId)
    }))));

    // 비로그인이면 로컬스토리지에만 저장 후 종료 (useEffect가 안 돎)
    if (!user) return;

    // 2. 백엔드 반영 (실패 시 롤백하거나 에러 UI 표시)
    try {
      // 방법 A: 유저 API로 대표 펫 설정 (백 404 에러 발생 가능성 대비)
      const res = await authFetch(`${BASE_URL}/users/me/primary-pet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_id: petId })
      });

      if (!res.ok) {
        // 방법 B: 유저 API 실패 시, 해당 펫의 updatePetInDB를 돌려서 is_primary=true 로 강제 시도
        const targetPet = pets.find(p => String(p.id) === String(petId));
        if (targetPet) {
          await updatePetInDB(petId, formatPayloadForDB({ ...targetPet, is_primary: true }));
        }
      }
    } catch (error) {
      console.error('대표 펫 설정 에러:', error);
      // 필요 시 여기서 롤백 로직 추가 가능
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWeightChange = (e) => {
    const val = e.target.value;
    let autoSize = form.size;
    const num = Number(val);
    if (val !== '' && !isNaN(num)) {
      if (num < 10) autoSize = '소형';
      else if (num < 25) autoSize = '중형';
      else autoSize = '대형';
    }
    setForm((prev) => ({ ...prev, weight: val, size: autoSize }));
  };

  const handleSizeClick = (selectedSize) => {
    setForm((prev) => ({ ...prev, size: selectedSize }));
  };

  const handleUserProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      const updatedUser = await uploadProfileImage(file);
      updateUser(updatedUser);
      toast.success('프로필 이미지가 성공적으로 변경되었습니다!');
    } catch (err) {
      toast.error(err.message || '프로필 이미지 업로드에 실패했습니다.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // 실제 업로드를 위한 File 객체 저장
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSupplyToggle = (item) => {
    setForm((prev) => {
      const exists = prev.supplies.includes(item);
      const updated = exists ? prev.supplies.filter((s) => s !== item) : [...prev.supplies, item];
      return { ...prev, supplies: updated };
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.warning('반려동물 이름을 입력해주세요.');
      return false;
    }
    if (!form.breed.trim()) {
      toast.warning('반려동물 품종을 입력해주세요.');
      return false;
    }
    if (!form.weight) {
      toast.warning('몸무게를 입력해주세요.');
      return false;
    }
    return true;
  };

  const buildPetData = () => {
    let formattedBirthDate = form.unknownBirth 
      ? '모름' 
      : `${form.birthYear}-${form.birthMonth}-${form.birthDay}`;

    return {
      id: editingPetId || Date.now(),
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim(),
      birthDate: formattedBirthDate,
      weight: Number(form.weight),
      size: form.size,
      image: form.image || '🐶',
      supplies: form.supplies,
      isPrimary: false
    };
  };

  const handleStartEdit = (pet, e) => {
    if (e) e.stopPropagation();
    setEditingPetId(pet.id);
    setImageFile(null); // 수정 모드 진입 시 이미지 파일 초기화

    let year = '2024';
    let month = '01';
    let day = '01';
    let isUnknown = false;

    if (pet.birthDate === '모름' || pet.birthDate === '정보 없음' || !pet.birthDate) {
      isUnknown = true;
    } else {
      const parts = pet.birthDate.split('-');
      if (parts.length === 3) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      }
    }

    setForm({
      name: pet.name || '',
      species: pet.species || 'DOG',
      breed: pet.breed || '',
      birthYear: year,
      birthMonth: month,
      birthDay: day,
      unknownBirth: isUnknown,
      weight: pet.weight ? String(pet.weight) : '',
      size: pet.size || '소형',
      image: pet.image_url || pet.imageUrl || pet.image || '🐶',
      supplies: pet.supplies || []
    });

    const formElement = document.getElementById('pet-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingPetId(null);
    setImageFile(null);
    setForm({
      name: '',
      species: 'DOG',
      breed: '',
      birthYear: String(new Date().getFullYear()),
      birthMonth: '01',
      birthDay: '01',
      unknownBirth: false,
      weight: '',
      size: '소형',
      image: '🐶',
      supplies: []
    });
  };

  // 새 펫 추가 및 수정 처리
  const handleAddPet = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const petData = buildPetData();

    if (editingPetId) {
      if (user) {
        try {
          const payload = formatPayloadForDB(petData);
          const res = await updatePetInDB(editingPetId, payload);
          let updatedPet = res?.data || res;

          // 실제 이미지 파일이 등록된 경우 이미지 업로드 처리
          if (imageFile) {
            const { uploadPetProfileImage } = await import('../services/api');
            const imgRes = await uploadPetProfileImage(editingPetId, imageFile);
            updatedPet.image_url = imgRes?.image_url || imgRes?.imageUrl || updatedPet.image_url;
          }

          const reverseSizeMap = { SMALL: '소형', MEDIUM: '중형', LARGE: '대형' };

          setPets((prev) =>
            enforceSinglePrimary(prev.map((pet) =>
              String(pet.id) === String(editingPetId)
                ? {
                    ...pet,
                    ...updatedPet,
                    size: reverseSizeMap[updatedPet.size] || petData.size,
                    birthDate: petData.birthDate,
                    supplies: petData.supplies,
                    image: updatedPet.image_url || petData.image
                  }
                : pet
            ))
          );
        } catch (err) {
          console.error('펫 수정 실패:', err);
          toast.error('수정 중 오류가 발생했습니다.');
          return;
        }
      } else {
        const targetKey = getActiveKey(user);
        const updatedPets = enforceSinglePrimary(pets.map((p) => (String(p.id) === String(editingPetId) ? petData : p)));
        setPets(updatedPets);
        localStorage.setItem(targetKey, JSON.stringify(updatedPets));
      }

      toast.success(`${petData.name}가 수정되었습니다! 🐾`);
      handleCancelEdit();
    } else {
      let newlyCreatedId = petData.id;
      if (user) {
        try {
          const payload = formatPayloadForDB(petData);
          const res = await createPetInDB(payload);
          let createdPet = res?.data || res;
          newlyCreatedId = createdPet.id || petData.id;

          // 새 펫 생성 후 파일이 있다면 이미지 업로드 연이어 처리
          if (imageFile) {
            const { uploadPetProfileImage } = await import('../services/api');
            const imgRes = await uploadPetProfileImage(newlyCreatedId, imageFile);
            createdPet.image_url = imgRes?.image_url || imgRes?.imageUrl || createdPet.image_url;
          }

          const reverseSizeMap = { SMALL: '소형', MEDIUM: '중형', LARGE: '대형' };

          setPets((prev) => {
            const isFirst = prev.length === 0;
            const newPetObj = {
              ...petData,
              ...createdPet,
              size: reverseSizeMap[createdPet.size] || petData.size,
              id: newlyCreatedId,
              isPrimary: isFirst,
              image: createdPet.image_url || petData.image
            };
            return enforceSinglePrimary([...prev, newPetObj]);
          });
        } catch (err) {
          console.error('펫 등록 실패:', err);
          toast.error('등록 중 에러가 발생했습니다.');
          return;
        }

      } else {
        const targetKey = getActiveKey(user);
        setPets((prev) => {
          const isFirst = prev.length === 0;
          const newPetObj = { ...petData, isPrimary: isFirst };
          const updatedPets = enforceSinglePrimary([...prev, newPetObj]);
          localStorage.setItem(targetKey, JSON.stringify(updatedPets));
          return updatedPets;
        });
      }

      setRegisteredPetName(form.name);

      if (pets.length > 0) {
        setModalType('selectPrimary');
      } else {
        setModalType('register');
      }

      setShowModal(true);
      handleCancelEdit();
    }
  };

  const handleLoginAndSave = () => {
    if (!validateForm()) return;
    const newPet = buildPetData();
    localStorage.setItem('paw_pass_pending_pet', JSON.stringify(newPet));
    login();
  };

  const handleDeletePet = async (id, e) => {
    if (e) e.stopPropagation();
    if (editingPetId === id) {
      handleCancelEdit();
    }

    if (user) {
      try {
        await deletePetInDB(id);
        setPets((prev) => {
          const remaining = prev.filter((pet) => String(pet.id) !== String(id));
          return enforceSinglePrimary(remaining);
        });
      } catch (err) {
        console.error('서버 삭제 에러:', err);
        toast.error('삭제 요청에 실패했습니다.');
      }
    } else {
      const targetKey = getActiveKey(user);
      setPets((prev) => {
        const remaining = prev.filter((pet) => String(pet.id) !== String(id));
        const cleaned = enforceSinglePrimary(remaining);
        localStorage.setItem(targetKey, JSON.stringify(cleaned));
        return cleaned;
      });
    }
  };

  return (
    
        <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, #C9B6D7 0%, #F6CADD 35%, #C5E0FB 70%, #AED2F9 100%)',
        zIndex: 0,
        opacity: 0.35,
        pointerEvents: 'none'
      }} />
      <div className="pawpass-profile-container" style={{ padding: '40px 20px 30px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative', zIndex: 1 }}>
      <style>{`
        .pet-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .pet-card:hover { transform: translateY(-4px); box-shadow: 0 12px 35px rgba(0,0,0,0.1) !important; }
        
        .form-input {
          border: none !important;
          background-color: #f8fafc !important;
          border-radius: 16px !important;
          padding: 14px 16px !important;
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
        }
        .form-input:focus {
          outline: none;
          background-color: #fff !important;
          box-shadow: 0 0 0 2px #C9B6D7 !important;
        }
        
        .brand-btn { transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease; }
        .brand-btn:hover { transform: translateY(-2px); filter: brightness(0.95); box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important; }
      `}</style>
            {/* 상단 모던 히어로 카드 배너 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '36px 20px 32px 20px', 
        background: 'linear-gradient(135deg, rgba(201, 182, 215, 0.45) 0%, rgba(246, 202, 221, 0.35) 35%, rgba(197, 224, 251, 0.45) 70%, rgba(174, 210, 249, 0.4) 100%)',
        borderRadius: '32px',
        boxShadow: '0 12px 35px rgba(201, 182, 215, 0.22)',
        marginBottom: '28px',
        position: 'relative',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.7)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#5F50A9', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '5px 16px', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          Pet Management
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          🐾 반려동물 프로필 관리
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '0' }}>
          {user ? `${user.name}님의 소중한 반려동물 정보를 등록하고 맞춤 여행을 준비하세요` : '아이의 체중과 견종을 등록해 맞춤 동반 조건을 확인해보세요'}
        </p>
      </div>

      {!user ? (
        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ color: '#0369a1', display: 'block', fontSize: '14px', marginBottom: '2px' }}>🐾 현재 체험 모드(비로그인) 이용 중</strong>
            <span style={{ fontSize: '13px', color: '#0c4a6e' }}>정보 입력 후 바로 로그인하시면 해당 구글 계정으로 즉시 영구 저장됩니다.</span>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.08)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            {user.picture ? (
              <img src={user.picture} alt="프로필" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🐾</div>
            )}
            <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              📷
              <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleUserProfileImageUpload} />
            </label>
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1e293b' }}>{user.name}님, 반가워요!</h2>
            <p style={{ margin: 0, color: '#64748b' }}>{user.email}</p>
          </div>
        </div>
      )}

      {/* 등록된 카드 목록 */}
      <div style={{ marginBottom: '40px' }}>
        <h3>등록된 반려동물 목록 ({pets.length}마리)</h3>
        {pets.length === 0 ? (
          <p style={{ color: '#888', marginTop: '15px' }}>등록된 아이가 없습니다. 아래 폼에서 첫 프로필을 등록해보세요!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {pets.map((pet) => {
              const isImageFile = typeof pet.image === 'string' && (pet.image.startsWith('data:') || pet.image.startsWith('http') || pet.image.startsWith('blob:'));
              const isCurrentEditing = String(editingPetId) === String(pet.id);
              const isPrimary = Boolean(pet.isPrimary);

              return (
                <div key={pet.id} className="pet-card" style={{ 
                    border: 'none', 
                    padding: '15px', 
                    borderRadius: '24px', 
                    backgroundColor: isCurrentEditing ? '#f8faff' : (isPrimary ? '#FDF5C9' : '#fff'), 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'flex-start', 
                    position: 'relative', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.06)' 
                  }}
                >
                  <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', overflow: 'hidden', flexShrink: 0 }}>
                    {isImageFile ? (
                      <img src={pet.image} alt="pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{pet.image || '🐶'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, color: '#243D66', fontSize: '16px', fontWeight: '800' }}>{pet.name}</h4>
                      {isPrimary ? (
                        <span style={{ 
                          backgroundColor: '#243D66', 
                          color: '#ffffff', 
                          padding: '3px 10px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          letterSpacing: '-0.2px',
                          boxShadow: '0 2px 6px rgba(36, 61, 102, 0.25)' 
                        }}>
                          ⭐ 대표
                        </span>
                      ) : (
                        <button 
                          type="button"
                          onClick={(e) => handleSetPrimary(pet.id, e)}
                          style={{ padding: '3px 8px', backgroundColor: '#fff', border: 'none', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}
                        >
                          대표로 설정
                        </button>
                      )}
                    </div>

                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>
                      {pet.breed} ({pet.size}{pet.species === 'CAT' ? '묘' : '견'}, {pet.weight}kg)
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#777' }}>생일: {pet.birthDate}</p>
                    
                    {pet.supplies && pet.supplies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                        {pet.supplies.map((sup, idx) => (
                          <span key={idx} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            ✓ {sup}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 카드 우측 상단 수정/삭제 버튼 */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                    <button 
                      type="button"
                      onClick={(e) => handleStartEdit(pet, e)}
                      title="프로필 수정"
                      style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}
                    >
                      ✏️
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleDeletePet(pet.id, e)}
                      title="프로필 삭제"
                      style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '2px 4px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr style={{ borderColor: '#eee', marginBottom: '30px' }} />

      {/* 등록 및 수정 폼 */}
      <div id="pet-form-section" style={{ 
        backgroundColor: '#ffffff', 
        border: '1px solid rgba(226, 232, 240, 0.8)', 
        padding: '36px 32px', 
        borderRadius: '32px', 
        boxShadow: '0 20px 45px rgba(95, 80, 169, 0.07)',
        position: 'relative'
      }}>
        {/* 헤더 영역 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ 
              display: 'inline-block', 
              backgroundColor: '#F3EEFA', 
              color: '#5F50A9', 
              padding: '4px 12px', 
              borderRadius: '50px', 
              fontSize: '11px', 
              fontWeight: '800', 
              letterSpacing: '0.8px',
              marginBottom: '8px'
            }}>
              {editingPetId ? 'EDIT PROFILE' : 'NEW PROFILE'}
            </span>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.3px' }}>
              {editingPetId ? `🐾 ${form.name || '반려동물'} 정보 수정` : '새 반려동물 프로필 등록'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {editingPetId ? '반려동물의 최신 정보와 출입 조건을 업데이트하세요.' : '아이의 체형과 특성에 맞춘 여행지 출입 조건을 똑똑하게 분석해드려요.'}
            </p>
          </div>
          {editingPetId && (
            <button 
              type="button" 
              onClick={handleCancelEdit}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#f1f5f9', 
                color: '#475569', 
                border: '1px solid #e2e8f0', 
                borderRadius: '50px', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '700',
                transition: 'all 0.2s'
              }}
            >
              ✕ 수정 취소
            </button>
          )}
        </div>
        
        <form onSubmit={handleAddPet} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          
          {/* 1. 프로필 아바타 / 사진 선택 카드 */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '24px', 
            padding: '20px 24px', 
            border: '1px solid #e2e8f0', 
            display: 'flex', 
            gap: '24px', 
            alignItems: 'center', 
            flexWrap: 'wrap' 
          }}>
            <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '50%', 
                backgroundColor: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '34px', 
                overflow: 'hidden', 
                border: '3px solid #F3EEFA',
                boxShadow: '0 4px 14px rgba(95, 80, 169, 0.12)'
              }}>
                {typeof form.image === 'string' && (form.image.startsWith('data:') || form.image.startsWith('http') || form.image.startsWith('blob:')) ? (
                  <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{form.image || '🐶'}</span>
                )}
              </div>
              <label 
                title="사진 변경"
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  backgroundColor: '#5F50A9', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  boxShadow: '0 2px 6px rgba(95,80,169,0.3)',
                  fontSize: '13px'
                }}
              >
                📷
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  캐릭터 아이콘 또는 사진 업로드
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {defaultIcons.map((icon, idx) => {
                  const isSelected = form.image === icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, image: icon }));
                        setImageFile(null);
                      }}
                      style={{
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        border: isSelected ? '2px solid #5F50A9' : '1.5px solid #e2e8f0',
                        backgroundColor: isSelected ? '#F3EEFA' : '#ffffff',
                        fontSize: '20px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 10px rgba(95, 80, 169, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. 동물 종류 세그먼트 버튼 (반려견 vs 반려묘) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              동물 종류 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, species: 'DOG' }))}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: form.species === 'DOG' ? '2px solid #5F50A9' : '1.5px solid #e2e8f0',
                  backgroundColor: form.species === 'DOG' ? '#5F50A9' : '#f8fafc',
                  color: form.species === 'DOG' ? '#ffffff' : '#475569',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: form.species === 'DOG' ? '0 4px 12px rgba(95, 80, 169, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🐶</span>
                <span>반려견 (강아지)</span>
              </button>

              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, species: 'CAT' }))}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: form.species === 'CAT' ? '2px solid #5F50A9' : '1.5px solid #e2e8f0',
                  backgroundColor: form.species === 'CAT' ? '#5F50A9' : '#f8fafc',
                  color: form.species === 'CAT' ? '#ffffff' : '#475569',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: form.species === 'CAT' ? '0 4px 12px rgba(95, 80, 169, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🐱</span>
                <span>반려묘 (고양이)</span>
              </button>
            </div>
          </div>

          {/* 3. 이름 & 품종 (2열 그리드) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                반려동물 이름 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="예: 초코, 콩이, 구름이" 
                style={{ 
                  width: '100%', 
                  height: '48px', 
                  padding: '0 16px', 
                  borderRadius: '16px', 
                  border: '1.5px solid #e2e8f0', 
                  backgroundColor: '#f8fafc', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#5F50A9'; e.target.style.backgroundColor = '#ffffff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                품종 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                name="breed" 
                value={form.breed} 
                onChange={handleChange} 
                placeholder="예: 말티즈, 포메라니안, 코숏 (모를 경우 믹스)" 
                style={{ 
                  width: '100%', 
                  height: '48px', 
                  padding: '0 16px', 
                  borderRadius: '16px', 
                  border: '1.5px solid #e2e8f0', 
                  backgroundColor: '#f8fafc', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#5F50A9'; e.target.style.backgroundColor = '#ffffff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
              />
            </div>
          </div>

          {/* 4. 생년월일 & 생일을 몰라요 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                생년월일 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <label style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '4px 12px', 
                borderRadius: '50px', 
                backgroundColor: form.unknownBirth ? '#F3EEFA' : '#f1f5f9', 
                color: form.unknownBirth ? '#5F50A9' : '#64748b', 
                border: form.unknownBirth ? '1px solid #5F50A9' : '1px solid #e2e8f0',
                fontSize: '12px', 
                fontWeight: '700', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" 
                  checked={form.unknownBirth} 
                  onChange={(e) => setForm((prev) => ({ ...prev, unknownBirth: e.target.checked }))} 
                  style={{ accentColor: '#5F50A9', cursor: 'pointer' }}
                />
                🎂 생일을 몰라요
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
              <select 
                name="birthYear" 
                value={form.birthYear} 
                onChange={handleChange} 
                disabled={form.unknownBirth}
                style={{ 
                  height: '48px', 
                  borderRadius: '16px', 
                  border: '1.5px solid #e2e8f0', 
                  backgroundColor: form.unknownBirth ? '#f1f5f9' : '#f8fafc', 
                  padding: '0 14px', 
                  fontSize: '14px', 
                  color: form.unknownBirth ? '#94a3b8' : '#1e293b',
                  outline: 'none',
                  cursor: form.unknownBirth ? 'not-allowed' : 'pointer'
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>

              <select 
                name="birthMonth" 
                value={form.birthMonth} 
                onChange={handleChange} 
                disabled={form.unknownBirth}
                style={{ 
                  height: '48px', 
                  borderRadius: '16px', 
                  border: '1.5px solid #e2e8f0', 
                  backgroundColor: form.unknownBirth ? '#f1f5f9' : '#f8fafc', 
                  padding: '0 14px', 
                  fontSize: '14px', 
                  color: form.unknownBirth ? '#94a3b8' : '#1e293b',
                  outline: 'none',
                  cursor: form.unknownBirth ? 'not-allowed' : 'pointer'
                }}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>

              <select 
                name="birthDay" 
                value={form.birthDay} 
                onChange={handleChange} 
                disabled={form.unknownBirth}
                style={{ 
                  height: '48px', 
                  borderRadius: '16px', 
                  border: '1.5px solid #e2e8f0', 
                  backgroundColor: form.unknownBirth ? '#f1f5f9' : '#f8fafc', 
                  padding: '0 14px', 
                  fontSize: '14px', 
                  color: form.unknownBirth ? '#94a3b8' : '#1e293b',
                  outline: 'none',
                  cursor: form.unknownBirth ? 'not-allowed' : 'pointer'
                }}
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. 체중 및 체형 크기 분류 */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              체중 (kg) 및 크기 분류 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                <input 
                  type="number" 
                  step="0.1" 
                  name="weight" 
                  value={form.weight} 
                  onChange={handleWeightChange} 
                  placeholder="예: 4.5" 
                  style={{ 
                    width: '100%', 
                    height: '48px', 
                    padding: '0 45px 0 16px', 
                    borderRadius: '16px', 
                    border: '1.5px solid #e2e8f0', 
                    backgroundColor: '#f8fafc', 
                    fontSize: '14px', 
                    color: '#1e293b', 
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#5F50A9'; e.target.style.backgroundColor = '#ffffff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                  kg
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: '소형', desc: '10kg 미만' },
                  { label: '중형', desc: '10~25kg' },
                  { label: '대형', desc: '25kg 이상' }
                ].map((item) => {
                  const isActive = form.size === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSizeClick(item.label)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '14px',
                        border: isActive ? '1.5px solid #5F50A9' : '1.5px solid #e2e8f0',
                        backgroundColor: isActive ? '#5F50A9' : '#f8fafc',
                        color: isActive ? '#ffffff' : '#475569',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: isActive ? '0 3px 10px rgba(95, 80, 169, 0.2)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ fontSize: '10px', opacity: isActive ? 0.9 : 0.6, fontWeight: 'normal' }}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              💡 체중을 입력하면 크기가 자동 판별되며, 직접 버튼을 눌러 지정할 수도 있습니다.
            </p>
          </div>

          {/* 6. 동반 시 구비 가능한 용품 (인터랙티브 태그 칩) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              동반 시 구비 가능한 용품 선택 <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>(선택)</span>
            </label>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px', 
              backgroundColor: '#f8fafc', 
              padding: '16px', 
              borderRadius: '20px', 
              border: '1px solid #e2e8f0' 
            }}>
              {availableSupplies.map((item) => {
                const checked = form.supplies.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSupplyToggle(item)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '50px',
                      fontSize: '13px',
                      fontWeight: checked ? '800' : '600',
                      cursor: 'pointer',
                      border: checked ? '1.5px solid #5F50A9' : '1.5px solid #e2e8f0',
                      backgroundColor: checked ? '#5F50A9' : '#ffffff',
                      color: checked ? '#ffffff' : '#475569',
                      boxShadow: checked ? '0 3px 8px rgba(95, 80, 169, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <span>{checked ? '✓' : '+'}</span>
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              💡 장소별 출입 조건(입마개, 케이지, 이동장 필수 등)을 판별할 때 활용됩니다.
            </p>
          </div>

          {/* 7. 액션 버튼 영역 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button 
              type="submit" 
              className="brand-btn" 
              style={{ 
                flex: 1, 
                minWidth: '200px', 
                height: '52px',
                padding: '0 24px', 
                backgroundColor: '#5F50A9', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '50px', 
                fontSize: '15px', 
                cursor: 'pointer', 
                fontWeight: '800',
                letterSpacing: '-0.2px',
                boxShadow: '0 8px 24px rgba(95, 80, 169, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🐾</span>
              <span>{editingPetId ? '프로필 수정 완료하기' : (user ? '새 프로필 등록 완료하기' : '체험용 프로필 등록하기 (임시)')}</span>
            </button>

            {!user && !editingPetId && (
              <button 
                type="button" 
                className="brand-btn" 
                onClick={handleLoginAndSave} 
                style={{ 
                  flex: 1, 
                  minWidth: '220px', 
                  height: '52px',
                  padding: '0 24px', 
                  backgroundColor: '#4285F4', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50px', 
                  fontSize: '15px', 
                  cursor: 'pointer', 
                  fontWeight: '800',
                  boxShadow: '0 6px 18px rgba(66, 133, 244, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🔑</span>
                <span>구글 로그인하고 영구 저장하기</span>
              </button>
            )}

            {editingPetId && (
              <button 
                type="button"
                onClick={handleCancelEdit}
                style={{ 
                  height: '52px',
                  padding: '0 24px', 
                  backgroundColor: '#f1f5f9', 
                  color: '#475569', 
                  border: '1.5px solid #e2e8f0', 
                  borderRadius: '50px', 
                  fontSize: '14px', 
                  cursor: 'pointer', 
                  fontWeight: '700',
                  transition: 'all 0.2s ease'
                }}
              >
                수정 취소
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 등록 완료 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#fff', width: '90%', maxWidth: '420px', padding: '30px',
            borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative', textAlign: 'center'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}
            >
              ✕
            </button>

            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🐶</div>

            <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '20px', marginBottom: '8px' }}>프로필 등록 완료!</h3>
            
            {modalType === 'selectPrimary' ? (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 14px 0' }}>
                  이미 등록된 반려동물이 있습니다.<br />방문 판정에 사용할 <strong>대표 반려동물</strong>을 선택해주세요.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {pets.map((p) => (
                    <div 
                      key={p.id}
                      onClick={(e) => handleSetPrimary(p.id, e)}
                      style={{
                        padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        backgroundColor: p.isPrimary ? '#f0fdf4' : '#f8fafc',
                        border: p.isPrimary ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{p.name} ({p.breed})</span>
                      <span style={{ color: p.isPrimary ? '#16a34a' : '#94a3b8', fontWeight: 'bold' }}>
                        {p.isPrimary ? '⭐ 대표 설정됨' : '선택하기'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#16a34a', fontWeight: 'bold', marginBottom: '24px' }}>
                ✨ {registeredPetName}이(가) 대표 반려동물로 설정되었습니다!
              </p>
            )}

            <button 
              type="button"
              onClick={() => {
                setShowModal(false);
                navigate('/search');
              }}
              style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '24px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}
            >
              같이 갈 수 있는 관광지 탐색 페이지로 이동 →
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default ProfilePage;