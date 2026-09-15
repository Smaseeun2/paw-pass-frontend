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

  const [form, setForm] = useState({
    name: '',
    species: 'DOG',
    breed: '',
    birthYear: '2024',
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
    const hasMuzzle = pet.supplies ? pet.supplies.includes('입마개') : false;
    const hasWasteBags = pet.supplies ? pet.supplies.includes('배변봉투') : false;
    const hasStroller = pet.supplies ? pet.supplies.includes('유모차/웨건') : Boolean(pet.has_stroller);
    const hasDiaper = pet.supplies ? pet.supplies.includes('기저귀/매너벨트') : false;

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
      birthDate: pet.birthDate || pet.birth_date || '',
      image: pet.image || pet.imageUrl || ''
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

  // 데이터 동기화
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
          console.warn('DB 목록 조회 실패 또는 등록된 데이터 없음:', err);
        }

        const guestSaved = localStorage.getItem('paw_pass_pets_guest');
        if (guestSaved) {
          const guestPets = JSON.parse(guestSaved);
          const failedGuestPets = [];

          const results = await Promise.allSettled(
            guestPets.map(gPet => createPetInDB(formatPayloadForDB(gPet)))
          );

          results.forEach((result, idx) => {
            const gPet = guestPets[idx];
            if (result.status === 'fulfilled') {
              const createdPet = result.value?.data || result.value;
              rawPets.push({
                ...createdPet,
                birthDate: gPet.birthDate || '생일 모름',
                supplies: gPet.supplies || [],
                image: gPet.image || ''
              });
            } else {
              console.warn(`게스트 펫(${gPet.name}) 마이그레이션 실패:`, result.reason);
              failedGuestPets.push(gPet);
            }
          });

          if (failedGuestPets.length > 0) {
            localStorage.setItem('paw_pass_pets_guest', JSON.stringify(failedGuestPets));
            toast.error('일부 반려동물 정보를 서버로 이전하지 못했습니다.');
          } else {
            localStorage.removeItem('paw_pass_pets_guest');
          }
        }
      } else {
        const guestSaved = localStorage.getItem('paw_pass_pets_guest');
        rawPets = guestSaved ? JSON.parse(guestSaved) : [];
      }

      const formattedPets = rawPets.map((p) => ({
        ...p,
        size: reverseSizeMap[p.size] || p.size || '소형',
        birthDate: p.birthDate || '생일 정보 없음',
        isPrimary: Boolean(p.is_primary || p.isPrimary),
        supplies: p.supplies || [
          ...(p.has_leash ? ['목줄/하네스'] : []),
          ...(p.has_carrier ? ['이동장/케이지'] : []),
          ...(p.has_stroller ? ['유모차/웨건'] : [])
        ]
      }));

      setPets(enforceSinglePrimary(formattedPets));
    };

    loadPets();
  }, [user]);

  // 💡 [핵심 수정] 대표 반려동물 설정 함수 (정확한 ID 매칭 및 이벤트 버블링 완벽 차단)
  const handleSetPrimary = async (petId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (user) {
      try {
        const res = await authFetch(`${BASE_URL}/users/me/primary-pet`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pet_id: petId })
        });

        if (!res.ok) throw new Error('대표 반려동물 설정 실패');
      } catch (err) {
        console.error('대표 설정 에러:', err);
        toast.info('대표 반려동물 설정 중 오류가 발생했습니다.');
        return;
      }
    }

    setPets(prev => enforceSinglePrimary(prev.map(p => ({
      ...p,
      isPrimary: String(p.id) === String(petId)
    }))));
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
    if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0) {
      toast.warning('올바른 체중(0보다 큰 숫자)을 입력해주세요.');
      return false;
    }
    return true;
  };

  const buildPetData = () => {
    const formattedBirthDate = form.unknownBirth 
      ? '생일 모름' 
      : `${form.birthYear}.${form.birthMonth}.${form.birthDay}`;

    return {
      id: editingPetId || Date.now(),
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim(),
      birthDate: formattedBirthDate,
      weight: Number(form.weight),
      size: form.size,
      image: form.image || '🐶',
      supplies: form.supplies
    };
  };

  const handleStartEdit = (pet, e) => {
    if (e) e.stopPropagation();
    setEditingPetId(pet.id);

    let year = '2024';
    let month = '01';
    let day = '01';
    let isUnknown = false;

    if (pet.birthDate === '생일 모름' || !pet.birthDate) {
      isUnknown = true;
    } else {
      const parts = pet.birthDate.split('.');
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
      image: pet.image || '🐶',
      supplies: pet.supplies || []
    });

    const formElement = document.getElementById('pet-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingPetId(null);
    setForm({
      name: '',
      species: 'DOG',
      breed: '',
      birthYear: '2024',
      birthMonth: '01',
      birthDay: '01',
      unknownBirth: false,
      weight: '',
      size: '소형',
      image: '🐶',
      supplies: []
    });
  };

  // 등록 및 수정 제출 분기 처리
  const handleAddPet = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const petData = buildPetData();

    if (editingPetId) {
      if (user) {
        try {
          const payload = formatPayloadForDB(petData);
          const res = await updatePetInDB(editingPetId, payload);
          const updatedPet = res?.data || res;

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
                    image: petData.image
                  }
                : pet
            ))
          );
        } catch (err) {
          console.error('서버 수정 에러:', err);
          toast.error('수정 중 오류가 발생했습니다.');
          return;
        }
      } else {
        const targetKey = getActiveKey(user);
        const updatedPets = enforceSinglePrimary(pets.map((p) => (String(p.id) === String(editingPetId) ? petData : p)));
        setPets(updatedPets);
        localStorage.setItem(targetKey, JSON.stringify(updatedPets));
      }

      toast.success(`${petData.name}의 프로필이 수정되었습니다! 🐾`);
      handleCancelEdit();
    } else {
      let newlyCreatedId = petData.id;
      if (user) {
        try {
          const payload = formatPayloadForDB(petData);
          const res = await createPetInDB(payload);
          const createdPet = res?.data || res;
          newlyCreatedId = createdPet.id || petData.id;

          const reverseSizeMap = { SMALL: '소형', MEDIUM: '중형', LARGE: '대형' };

          setPets((prev) => {
            const isFirst = prev.length === 0;
            const newPetObj = {
              ...petData,
              ...createdPet,
              size: reverseSizeMap[createdPet.size] || petData.size,
              id: newlyCreatedId,
              isPrimary: isFirst
            };
            return enforceSinglePrimary([...prev, newPetObj]);
          });
        } catch (err) {
          console.error('서버 저장 에러:', err);
          toast.error('서버 저장 중 오류가 발생했습니다.');
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
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>반려동물 프로필 작성</h2>
      <p style={{ textAlign: 'center', color: 'gray', marginBottom: '24px' }}>
        {user ? `${user.name}님의 반려동물 프로필 관리` : '체험 모드로 등록하거나 구글 로그인 후 안전하게 보관하세요.'}
      </p>

      {!user ? (
        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ color: '#0369a1', display: 'block', fontSize: '14px', marginBottom: '2px' }}>🐾 현재 체험 모드(비로그인) 이용 중</strong>
            <span style={{ fontSize: '13px', color: '#0c4a6e' }}>정보 입력 후 바로 로그인하시면 해당 구글 계정으로 즉시 영구 저장됩니다.</span>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                <div 
                  key={pet.id} 
                  style={{ 
                    border: isCurrentEditing ? '2px solid #1976d2' : (isPrimary ? '1.5px solid #bbf7d0' : '1px solid #ddd'), 
                    padding: '15px', 
                    borderRadius: '10px', 
                    backgroundColor: isCurrentEditing ? '#f8faff' : (isPrimary ? '#f0fdf4' : '#fff'), 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'flex-start', 
                    position: 'relative', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)' 
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
                      <h4 style={{ margin: 0, color: '#1976d2' }}>{pet.name}</h4>
                      {isPrimary ? (
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                          ⭐ 대표
                        </span>
                      ) : (
                        <button 
                          type="button"
                          onClick={(e) => handleSetPrimary(pet.id, e)}
                          style={{ padding: '3px 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}
                        >
                          대표로 설정
                        </button>
                      )}
                    </div>

                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>{pet.breed} ({pet.size}견/묘, {pet.weight}kg)</p>
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
      <div id="pet-form-section" style={{ backgroundColor: '#fff', border: editingPetId ? '2px solid #1976d2' : '1px solid #ddd', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h3 style={{ margin: 0, color: editingPetId ? '#1976d2' : '#111' }}>
            {editingPetId ? `🐾 ${form.name || '반려동물'} 프로필 수정하기` : '새 반려동물 등록하기'}
          </h3>
          {editingPetId && (
            <button 
              type="button" 
              onClick={handleCancelEdit}
              style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              수정 취소
            </button>
          )}
        </div>
        
        <form onSubmit={handleAddPet} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', overflow: 'hidden', border: '2px solid #bbb' }}>
                {typeof form.image === 'string' && (form.image.startsWith('data:') || form.image.startsWith('http') || form.image.startsWith('blob:')) ? (
                  <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{form.image}</span>
                )}
              </div>
              <label style={{ fontSize: '12px', color: '#1976d2', cursor: 'pointer', fontWeight: 'bold' }}>
                📸 직접 찍은 사진 선택
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#555' }}>또는 기본 아이콘 선택</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {defaultIcons.map((icon, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: icon }))}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', 
                      border: form.image === icon ? '2px solid #1976d2' : '1px solid #ccc',
                      backgroundColor: form.image === icon ? '#e3f2fd' : '#fff',
                      fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
            반려동물 이름 <span style={{ color: '#ef4444', fontSize: '12px' }}>*필수</span>
            <input 
              type="text" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="아이 이름을 입력해주세요." 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
                반려동물 생일 <span style={{ color: '#ef4444', fontSize: '12px' }}>*필수</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.unknownBirth} 
                  onChange={(e) => setForm((prev) => ({ ...prev, unknownBirth: e.target.checked }))} 
                />
                생일을 몰라요
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                name="birthYear" 
                value={form.birthYear} 
                onChange={handleChange} 
                disabled={form.unknownBirth}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: form.unknownBirth ? '#f3f4f6' : '#fff' }}
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
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: form.unknownBirth ? '#f3f4f6' : '#fff' }}
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
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: form.unknownBirth ? '#f3f4f6' : '#fff' }}
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
            반려동물 품종 <span style={{ color: '#ef4444', fontSize: '12px' }}>*필수</span>
            <input 
              type="text" 
              name="breed" 
              value={form.breed} 
              onChange={handleChange} 
              placeholder="예: 말티즈, 푸들, 코숏 등 (모를 경우 '믹스' 입력)" 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              체중 (kg) 및 크기 분류 <span style={{ color: '#ef4444', fontSize: '12px' }}>*필수</span>
            </label>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="number" 
                step="0.1" 
                name="weight" 
                value={form.weight} 
                onChange={handleWeightChange} 
                placeholder="숫자 입력 (예: 4.5)" 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', flex: 1, minWidth: '180px' }}
              />
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {['소형', '중형', '대형'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeClick(sz)}
                    style={{
                      padding: '10px 15px',
                      borderRadius: '6px',
                      border: form.size === sz ? '2px solid #1976d2' : '1px solid #ccc',
                      backgroundColor: form.size === sz ? '#e3f2fd' : '#fff',
                      color: form.size === sz ? '#1976d2' : '#333',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {sz} {sz === '소형' ? '(10kg 미만)' : sz === '중형' ? '(10~25kg)' : '(25kg 이상)'}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>* 체중을 직접 입력하면 크기가 자동 분류되며, 버튼을 눌러 직접 변경할 수도 있습니다.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              동반 시 구비 가능한 용품 선택 (선택)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {availableSupplies.map((item) => {
                const checked = form.supplies.includes(item);
                return (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={() => handleSupplyToggle(item)} 
                    />
                    {item}
                  </label>
                );
              })}
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>* 장소별 출입 조건(입마개, 케이지 필수 등)을 판별할 때 활용됩니다.</span>
          </div>

          {/* 하단 버튼 영역 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '15px', flexWrap: 'wrap' }}>
            <button 
              type="submit" 
              style={{ 
                flex: 1, minWidth: '200px', padding: '14px', 
                backgroundColor: editingPetId ? '#16a34a' : (user ? '#1976d2' : '#4b5563'), 
                color: 'white', border: 'none', borderRadius: '8px', 
                fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' 
              }}
            >
              {editingPetId 
                ? '수정 완료하기 🐾' 
                : (user ? '프로필 등록 완료하기' : '체험용 프로필 등록하기 (임시)')}
            </button>

            {!user && !editingPetId && (
              <button 
                type="button"
                onClick={handleLoginAndSave}
                style={{ 
                  flex: 1, minWidth: '220px', padding: '14px', 
                  backgroundColor: '#4285F4', color: 'white', 
                  border: 'none', borderRadius: '8px', 
                  fontSize: '15px', cursor: 'pointer', fontWeight: 'bold',
                  boxShadow: '0 2px 6px rgba(66, 133, 244, 0.3)'
                }}
              >
                구글 로그인하고 프로필 저장하기
              </button>
            )}

            {editingPetId && (
              <button 
                type="button"
                onClick={handleCancelEdit}
                style={{ 
                  padding: '14px 20px', backgroundColor: '#9ca3af', color: 'white', 
                  border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' 
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
              style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}
            >
              같이 갈 수 있는 관광지 탐색 페이지로 이동 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;