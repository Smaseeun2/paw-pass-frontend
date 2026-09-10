// src/pages/ProfilePage.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { loginWithBackend } from '../services/authService';
import mockSpots from '../mocks/tourist-spots.json';

function ProfilePage() {
  const navigate = useNavigate();

  // 1. 현재 로그인 유저 상태
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('paw_pass_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const getActiveKey = (currentUser) => {
    return currentUser?.email ? `paw_pass_pets_${currentUser.email}` : 'paw_pass_pets_guest';
  };

  // 2. 초기 펫 데이터 불러오기
  const [pets, setPets] = useState(() => {
    try {
      const savedUser = localStorage.getItem('paw_pass_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;

      if (parsedUser?.email) {
        const userKey = `paw_pass_pets_${parsedUser.email}`;
        const userSaved = localStorage.getItem(userKey);
        let userPets = userSaved ? JSON.parse(userSaved) : [];

        // 게스트 데이터가 남아있다면 통합 승계
        const guestSaved = localStorage.getItem('paw_pass_pets_guest');
        if (guestSaved) {
          const guestPets = JSON.parse(guestSaved);
          if (guestPets && guestPets.length > 0) {
            userPets = [...userPets, ...guestPets];
            localStorage.setItem(userKey, JSON.stringify(userPets));
            localStorage.removeItem('paw_pass_pets_guest');
          }
        }
        return userPets;
      } else {
        const guestSaved = localStorage.getItem('paw_pass_pets_guest');
        return guestSaved ? JSON.parse(guestSaved) : [];
      }
    } catch (e) {
      console.error('스토리지 로드 에러:', e);
      return [];
    }
  });

  const [form, setForm] = useState({
    name: '',
    species: 'DOG',
    breed: '',
    birthYear: '2024',
    birthMonth: '01',
    birthDay: '01',
    weight: '',
    size: '소형',
    image: '🐶'
  });

  // 최신 form 상태를 OAuth 콜백에서도 참조할 수 있도록 ref 연결
  const formRef = useRef(form);
  formRef.current = form;

  const [showModal, setShowModal] = useState(false);
  const [registeredPetName, setRegisteredPetName] = useState('');
  const [recommendedSpots, setRecommendedSpots] = useState([]);

  const defaultIcons = ['🐶', '🐱', '🦮', '🐈‍⬛'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  // 3. 구글 로그인 및 작성 중이던 프로필 직행 저장 처리
  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const backendData = await loginWithBackend(codeResponse.code);
        if (backendData && backendData.user) {
          const loggedUser = {
            name: backendData.user.name,
            email: backendData.user.email,
            picture: backendData.user.picture
          };
          setUser(loggedUser);
          localStorage.setItem('paw_pass_user', JSON.stringify(loggedUser));

          const userKey = `paw_pass_pets_${loggedUser.email}`;
          const existing = localStorage.getItem(userKey);
          let currentList = existing ? JSON.parse(existing) : [];

          // 💡 로그인 전에 작성 중이던 폼 데이터가 있다면 계정 목록에 즉시 추가
          const pendingPetJson = localStorage.getItem('paw_pass_pending_pet');
          if (pendingPetJson) {
            const pendingPet = JSON.parse(pendingPetJson);
            currentList = [...currentList, pendingPet];
            localStorage.removeItem('paw_pass_pending_pet');
          }

          // 게스트 데이터가 있었을 경우에도 함께 병합
          const guestSaved = localStorage.getItem('paw_pass_pets_guest');
          if (guestSaved) {
            const guestPets = JSON.parse(guestSaved);
            currentList = [...currentList, ...guestPets];
            localStorage.removeItem('paw_pass_pets_guest');
          }

          localStorage.setItem(userKey, JSON.stringify(currentList));
          alert(`환영합니다, ${loggedUser.name}님! 입력하신 반려동물 프로필이 계정에 저장되었습니다. 🐾`);
          window.location.reload();
        }
      } catch (error) {
        console.error('로그인 실패:', error);
        alert('구글 로그인에 실패했습니다.');
      }
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWeightChange = (e) => {
    const val = e.target.value;
    let autoSize = form.size;
    const num = Number(val);
    if (val !== '') {
      if (num < 10) autoSize = '소형';
      else if (num < 25) autoSize = '중형';
      else autoSize = '대형';
    }
    setForm((prev) => ({ ...prev, weight: val, size: autoSize }));
  };

  const handleSizeClick = (selectedSize) => {
    setForm((prev) => ({ ...prev, size: selectedSize }));
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

  // 반려동물 객체 생성 헬퍼 함수
  const buildPetData = () => {
    const formattedBirthDate = `${form.birthYear}.${form.birthMonth}.${form.birthDay}`;
    return {
      id: Date.now(),
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim() || '믹스',
      birthDate: formattedBirthDate,
      weight: form.weight ? Number(form.weight) : 5,
      size: form.size,
      image: form.image || '🐶'
    };
  };

  // 1) 버튼 클릭 액션: 체험용 등록 (또는 로그인 회원 일반 등록)
  const handleAddPet = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('반려동물 이름을 입력해주세요!');
      return;
    }

    const newPet = buildPetData();
    const targetKey = getActiveKey(user);
    const updatedPets = [...pets, newPet];

    setPets(updatedPets);
    try {
      localStorage.setItem(targetKey, JSON.stringify(updatedPets));
    } catch (err) {
      console.error('스토리지 저장 실패:', err);
    }

    setRegisteredPetName(form.name);
    setRecommendedSpots(mockSpots.slice(0, 3));
    setShowModal(true);

    setForm({
      name: '',
      species: 'DOG',
      breed: '',
      birthYear: '2024',
      birthMonth: '01',
      birthDay: '01',
      weight: '',
      size: '소형',
      image: '🐶'
    });
  };

  // 2) 버튼 클릭 액션: 작성 중인 폼 내용을 들고 곧바로 구글 로그인하여 저장
  const handleLoginAndSave = () => {
    if (!form.name.trim()) {
      alert('저장할 반려동물의 이름을 먼저 입력해주세요!');
      return;
    }

    // 작성 중이던 폼 데이터를 임시 펜딩 키에 저장 후 구글 로그인 트리거
    const newPet = buildPetData();
    localStorage.setItem('paw_pass_pending_pet', JSON.stringify(newPet));
    googleLogin();
  };

  const handleDeletePet = (id) => {
    const targetKey = getActiveKey(user);
    const updated = pets.filter((pet) => pet.id !== id);
    setPets(updated);
    try {
      localStorage.setItem(targetKey, JSON.stringify(updated));
    } catch (err) {
      console.error('스토리지 삭제 저장 실패:', err);
    }
  };

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>반려동물 프로필 작성</h2>
      <p style={{ textAlign: 'center', color: 'gray', marginBottom: '24px' }}>
        {user ? `${user.name}님의 반려동물 프로필 관리` : '체험 모드로 등록하거나 구글 로그인 후 안전하게 보관하세요.'}
      </p>

      {/* 비로그인 안내 배너 */}
      {!user && (
        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ color: '#0369a1', display: 'block', fontSize: '14px', marginBottom: '2px' }}>🐾 현재 체험 모드(비로그인) 이용 중</strong>
            <span style={{ fontSize: '13px', color: '#0c4a6e' }}>정보 입력 후 바로 로그인하시면 해당 구글 계정으로 즉시 영구 저장됩니다.</span>
          </div>
        </div>
      )}

      {/* 등록된 카드 목록 */}
      <div style={{ marginBottom: '40px' }}>
        <h3>등록된 반려동물 목록 ({pets.length}마리)</h3>
        {pets.length === 0 ? (
          <p style={{ color: '#888', marginTop: '15px' }}>등록된 아이가 없습니다. 아래 폼에서 첫 프로필을 등록해보세요!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {pets.map((pet) => {
              const isImageFile = typeof pet.image === 'string' && (pet.image.startsWith('data:') || pet.image.startsWith('http') || pet.image.startsWith('blob:'));
              return (
                <div key={pet.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px', backgroundColor: '#fff', display: 'flex', gap: '15px', alignItems: 'center', position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', overflow: 'hidden', flexShrink: 0 }}>
                    {isImageFile ? (
                      <img src={pet.image} alt="pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{pet.image || '🐶'}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1976d2' }}>{pet.name}</h4>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#555' }}>{pet.breed} ({pet.size}견/묘)</p>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#777' }}>생일: {pet.birthDate}</p>
                  </div>
                  <button 
                    onClick={() => handleDeletePet(pet.id)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr style={{ borderColor: '#eee', marginBottom: '30px' }} />

      {/* 등록 폼 */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '25px' }}>새 반려동물 등록하기</h3>
        
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
            반려동물 이름
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
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>반려동물 생일</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                name="birthYear" 
                value={form.birthYear} 
                onChange={handleChange} 
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>

              <select 
                name="birthMonth" 
                value={form.birthMonth} 
                onChange={handleChange} 
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>

              <select 
                name="birthDay" 
                value={form.birthDay} 
                onChange={handleChange} 
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
            반려동물 품종
            <input 
              type="text" 
              name="breed" 
              value={form.breed} 
              onChange={handleChange} 
              placeholder="예: 말티즈, 푸들, 코숏 등" 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
              체중 (kg) 및 크기 분류
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

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '15px', flexWrap: 'wrap' }}>
            <button 
              type="submit" 
              style={{ 
                flex: 1, minWidth: '200px', padding: '14px', 
                backgroundColor: user ? '#1976d2' : '#4b5563', 
                color: 'white', border: 'none', borderRadius: '8px', 
                fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' 
              }}
            >
              {user ? '프로필 등록 완료하기' : '체험용 프로필 등록하기 (임시)'}
            </button>

            {!user && (
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
          </div>
        </form>
      </div>

      {/* 추천 팝업 */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#fff', width: '90%', maxWidth: '500px', padding: '25px',
            borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}
            >
              ✕
            </button>

            <h3 style={{ marginTop: 0, color: '#1976d2', textAlign: 'center' }}>🎉 프로필 등록 완료!</h3>
            <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
              🐾 {registeredPetName}와(과) 갈 수 있는 추천 관광지
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {recommendedSpots.map((spot) => (
                <div key={spot.contentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{spot.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>📍 {spot.address}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      navigate(`/detail/${spot.contentId}`);
                    }}
                    style={{ padding: '6px 10px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    보기
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setShowModal(false);
                navigate('/search');
              }}
              style={{ width: '100%', padding: '10px', backgroundColor: '#ff4081', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              더 찾아보기 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;