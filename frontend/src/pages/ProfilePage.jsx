// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mockSpots from '../mocks/tourist-spots.json';

function ProfilePage() {
  const navigate = useNavigate();
  const [pets, setPets] = useState(() => {
    const saved = localStorage.getItem('paw_pass_pets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, name: '몽이', species: 'DOG', breed: '말티즈', birthDate: '2020.05.12', weight: 4.2, size: '소형', image: '🐶' }
    ];
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

  // 맞춤 추천 팝업 상태 관리
  const [showModal, setShowModal] = useState(false);
  const [registeredPetName, setRegisteredPetName] = useState('');
  const [recommendedSpots, setRecommendedSpots] = useState([]);

  const defaultIcons = ['🐶', '🐱', '🦮', '🐈‍⬛'];

  // 드롭다운용 연도, 월, 일 데이터 생성
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - i); // 최근 25년치 연도
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  useEffect(() => {
    localStorage.setItem('paw_pass_pets', JSON.stringify(pets));
    if (pets.length > 0) {
      localStorage.setItem('paw_pass_pet_profile', JSON.stringify(pets[0]));
    }
  }, [pets]);

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

  // 프로필 등록 버튼 클릭 시 실행
  const handleAddPet = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('반려동물 이름을 입력해주세요!');
      return;
    }

    const formattedBirthDate = `${form.birthYear}.${form.birthMonth}.${form.birthDay}`;

    const newPet = {
      id: Date.now(),
      name: form.name,
      species: form.species,
      breed: form.breed || '믹스',
      birthDate: formattedBirthDate,
      weight: form.weight ? Number(form.weight) : 5,
      size: form.size,
      image: form.image || '🐶'
    };

    setPets((prev) => [...prev, newPet]);
    
    // 팝업 데이터 세팅 및 모달 띄우기
    setRegisteredPetName(form.name);
    setRecommendedSpots(mockSpots.slice(0, 3));
    setShowModal(true);

    // 폼 초기화
    setForm({ name: '', species: 'DOG', breed: '', birthYear: '2024', birthMonth: '01', birthDay: '01', weight: '', size: '소형', image: '🐶' });
  };

  const handleDeletePet = (id) => {
    setPets((prev) => prev.filter((pet) => pet.id !== id));
  };

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>반려동물 프로필 작성</h2>
      <p style={{ textAlign: 'center', color: 'gray', marginBottom: '30px' }}>
        우리 아이의 실제 사진과 정보를 등록하고 맞춤형 관광지 추천을 받아보세요.
      </p>

      {/* --- 등록된 반려동물 카드 목록 --- */}
      <div style={{ marginBottom: '40px' }}>
        <h3>등록된 반려동물 목록</h3>
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
      </div>

      <hr style={{ borderColor: '#eee', marginBottom: '30px' }} />

      {/* --- 프로필 등록 폼 --- */}
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
              placeholder="내용을 입력해주세요." 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
            />
          </label>

          {/* 생일 드롭다운 선택 영역 (년, 월, 일) */}
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
              placeholder="예: 말티즈, 푸들 등" 
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
                placeholder="숫자 직접 입력 (예: 4.5)" 
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

          <button 
            type="submit" 
            style={{ marginTop: '15px', padding: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            프로필 등록 완료하기
          </button>
        </form>
      </div>

      {/* --- 프로필 등록 완료 시 뜨는 맞춤 추천 팝업 (Modal) --- */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#fff', width: '90%', maxWidth: '500px', padding: '25px',
            borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative'
          }}>
            {/* 닫기 버튼 */}
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

            {/* 추천 관광지 리스트 */}
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