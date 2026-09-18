// src/pages/SupportPage.jsx
import { useState } from 'react';

const notices = [
  {
    id: 1,
    title: '가을맞이 전국 반려견 동반 힐링 명소 대규모 업데이트 안내',
    date: '2026-09-15',
    category: 'UPDATE',
    content: '전국 500여 개 가을 단풍 산책로, 신규 반려동물 동반 카페 및 글램핑 숙소 데이터가 최신화되었습니다. 상세 필터(체급, 리드줄/케이지 필수 규정)를 통해 우리 아이에게 꼭 맞는 장소를 찾아보세요!'
  },
  {
    id: 2,
    title: 'PawPass 2.0 서비스 그랜드 리뉴얼 오픈',
    date: '2026-08-25',
    category: 'NOTICE',
    content: '새로워진 PawPass를 만나보세요! 반응형 인터랙티브 지도, 에어비앤비 스타일 와이드 갤러리, 다둥이 맞춤 판정 시스템 및 직관적인 여행 동선 플래너가 정식 적용되었습니다.'
  },
  {
    id: 3,
    title: '카카오 지도 & 네이버 지도 원클릭 실시간 길찾기 연동 안내',
    date: '2026-08-10',
    category: 'SERVICE',
    content: '장소 상세 정보 및 탐색 퀵 드로어에서 카카오맵 및 네이버 지도 길찾기 바로가기를 지원하여 여행지까지 빠르고 편리하게 이동하실 수 있습니다.'
  }
];

const faqs = [
  {
    id: 0,
    category: 'service',
    question: 'PawPass 이용방법을 알고싶어요.',
    answer: `반려동물과 함께하는 완벽한 여행 파트너, PawPass(포패스) 구석구석 이용 가이드입니다! 🐾✨

1. 🏠 홈 (Home)
• 스마트 검색 & 감속 스크롤: 메인 상단의 둥근 플로팅 검색창에 가고 싶은 장소나 키워드를 입력하고 검색하면 부드럽게 탐색 페이지로 이동합니다.
• 빠른 탐색 캡슐: '전국 추천', '카페', '숙소', '공원/산책로' 등 인기 테마와 지역 캡슐을 눌러 원하는 테마로 바로 이동할 수 있습니다.
• 맞춤 추천 피드: 우리 아이(반려견) 조건에 딱 맞는 인기 명소와 시즌별 추천 여행지를 한눈에 확인하세요.

2. 🔍 관광지 탐색 (Explore)
• 실시간 동반 판정 필터: 강아지 몸무게(소/중/대형견), 견종(맹견 여부), 실내/야외 동반 가능 여부, 목줄/입마개/케이지 필수 규정을 필터로 설정하여 맞춤 장소만 쏙쏙 골라보세요.
• 인터랙티브 지도 & 퀵 드로어: 화면을 이동하며 주변 동반 가능 장소를 핀으로 확인하고, 장소 카드를 클릭해 빠른 요약 드로어를 열어보세요. 카카오맵/네이버 지도 길찾기도 바로 연동됩니다.

3. 📖 장소 상세 정보 (Place Detail)
• 와이드 2열 갤러리: 감성적인 장소 사진들을 시원한 뷰로 감상할 수 있습니다.
• 공식 동반 규정 및 헛걸음 방지 체크리스트: 시설 공식 규정, 출입 가능 몸무게 제한, 부대시설(리드줄 착용 구역, 펜스 유무, 배변봉투 구비 등)을 사전에 철저히 확인하여 헛걸음을 방지합니다.
• 즐겨찾기 & 동선 담기: 마음에 드는 장소는 핑크색 하트(❤️) 버튼으로 찜하고, '여행 동선에 추가' 버튼을 눌러 나만의 여행 코스에 담을 수 있습니다.

4. 🗺️ 여행 동선 플래너 (Trip Planner)
• 지도 위 동선 시각화: 내가 담은 장소들이 카카오 지도 위에 번호와 선으로 연결되어 한눈에 이동 경로를 파악할 수 있습니다.
• 드래그 & 드롭 순서 편집: 일정 순서를 자유롭게 끌어서 변경할 수 있으며, 최적 이동 동선을 손쉽게 계획할 수 있습니다.
• 일정 메모 & 여행 관리: 세부 일정 메모를 작성하고 여행 계획을 저장하여 체계적으로 여행을 즐길 수 있습니다.

5. 🐾 마이 프로필 & 반려동물 등록 (Profile)
• 다둥이 프로필 관리: 함께 사는 소중한 반려견들의 사진, 이름, 견종, 몸무게, 생일, 특이사항 등을 등록하세요.
• 대표 반려동물 설정: 대표 아이를 설정해두면 탐색 및 상세 페이지에서 해당 아이의 체급/조건에 맞춰 자동으로 출입 가능 여부(Pass/Caution/Restricted)를 뱃지로 판정해 드립니다.

6. ❤️ 즐겨찾기 (Bookmarks)
• 내가 찜한 명소 모아보기: 탐색하면서 찜해둔 카페, 식당, 숙소, 여행지를 한곳에서 모아보고 언제든 빠르게 다시 찾아볼 수 있습니다.`
  },
  {
    id: 1,
    category: 'profile',
    question: '반려견 프로필은 여러 마리 등록할 수 있나요?',
    answer: '네, 가능합니다! [프로필] 페이지에서 다둥이 프로필을 제한 없이 등록할 수 있으며, 그중 주 여행 메이트인 아이를 [대표 반려동물]로 지정하면 탐색 및 상세 페이지에서 해당 아이 기준으로 맞춤 판정이 자동 적용됩니다.'
  },
  {
    id: 2,
    category: 'profile',
    question: '대표로 설정되는 프로필은 무엇인가요?',
    answer: `[대표 반려동물] 프로필은 등록하신 여러 반려견 중 여행 탐색 및 출입 판정의 기본 기준이 되는 프로필입니다. 🐕👑

• 실시간 맞춤 동반 판정: 관광지 탐색, 홈 맞춤 추천, 장소 상세 페이지에서 별도의 필터 조작 없이도 대표 아이의 몸무게(소/중/대형견) 및 견종 특성에 맞춰 출입 가능 여부(Pass / Caution / Restricted)를 자동으로 계산하여 알려드립니다.
• 맞춤 추천 피드: 대표 아이의 체급과 조건에 최적화된 여행지와 테마가 우선적으로 추천됩니다.
• 대표 펫 간편 변경: [프로필] 페이지에서 등록된 반려견 카드 중 원하는 아이의 '대표 반려동물 설정'을 클릭하시면 언제든지 자유롭게 기준 아이를 바꾸실 수 있습니다.`
  },
  {
    id: 3,
    category: 'service',
    question: '동반 가능 여부(Pass / Caution / Restricted) 판정 기준이 궁금해요.',
    answer: 'PawPass는 지자체 및 각 시설의 공식 반려동물 동반 가이드라인을 바탕으로 판정합니다.\n• 🟢 Pass: 체급 제한 없이 목줄 착용 후 자유롭게 동반 가능\n• 🟡 Caution: 특정 무게 이하(예: 10kg 미만), 케이지/유모차 필수, 야외 테라스만 허용 등 조건부 동반\n• 🔴 Restricted: 맹견 출입 제한 또는 특정 구역 동반 불가'
  },
  {
    id: 4,
    category: 'service',
    question: '장소 정보가 실제와 다른 경우 어떻게 제보하나요?',
    answer: '상세 페이지 하단의 [정보 수정 제보] 버튼 또는 고객센터 문의를 통해 변경된 영업시간, 동반 규정 변경 사항을 남겨주시면 관리자 검토 후 24시간 이내에 반영됩니다.'
  },
  {
    id: 5,
    category: 'account',
    question: '회원 탈퇴 및 개인정보 삭제는 어떻게 하나요?',
    answer: '[프로필] 페이지 하단의 계정 관리 메뉴에서 탈퇴 신청이 가능하며, 등록된 반려동물 프로필 및 여행 동선 데이터는 즉시 안전하게 파기됩니다.'
  }
];

function SupportPage() {
  const [activeTab, setActiveTab] = useState('faq'); // 기본 FAQ 탭
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaqId, setOpenFaqId] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesQuery = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

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
      <div className="pawpass-support-container" style={{ padding: '40px 20px 30px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative', zIndex: 1 }}>
        <style>{`
          .support-card { transition: transform 0.2s ease, box-shadow 0.2s ease; border: none !important; box-shadow: 0 4px 15px rgba(0,0,0,0.04) !important; border-radius: 24px !important; }
          .support-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important; }
          
          .support-pill-btn { transition: transform 0.2s ease, filter 0.2s; border-radius: 50px !important; }
          .support-pill-btn:hover { transform: translateY(-2px); filter: brightness(0.95); }
          
          .faq-accordion { transition: transform 0.2s ease, box-shadow 0.2s ease; border: none !important; border-radius: 24px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important; }
          .faq-accordion:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06) !important; }
        `}</style>
      
        {/* 상단 모던 히어로 카드 배너 */}
        <div style={{ 
          textAlign: 'center', 
          padding: '36px 20px 32px 20px', 
          background: 'linear-gradient(135deg, rgba(201, 182, 215, 0.45) 0%, rgba(246, 202, 221, 0.35) 35%, rgba(197, 224, 251, 0.45) 70%, rgba(174, 210, 249, 0.4) 100%)',
          borderRadius: '32px',
          boxShadow: '0 12px 35px rgba(201, 182, 215, 0.22)',
          marginBottom: '32px',
          position: 'relative',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.7)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#5F50A9', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '5px 16px', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            Help & Support
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            고객센터 & 도움말
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: '0' }}>
            서비스 소식과 자주 묻는 질문을 한곳에서 편리하게 확인하세요
          </p>
        </div>

        {/* 모던 탭 네비게이션 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '50px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', width: '100%', maxWidth: '360px' }}>
            <button 
              onClick={() => setActiveTab('notice')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '50px', border: 'none', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
                backgroundColor: activeTab === 'notice' ? '#fff' : 'transparent',
                color: activeTab === 'notice' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'notice' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              📢 공지사항
            </button>
            <button 
              onClick={() => setActiveTab('faq')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '50px', border: 'none', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
                backgroundColor: activeTab === 'faq' ? '#fff' : 'transparent',
                color: activeTab === 'faq' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'faq' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              ❓ 자주 묻는 질문
            </button>
          </div>
        </div>

        {/* --- 1. 공지사항 탭 --- */}
        {activeTab === 'notice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                className="support-card"
                style={{ 
                  backgroundColor: '#fff', padding: '28px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ 
                    fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px',
                    backgroundColor: notice.category === 'EVENT' ? '#dbeafe' : notice.category === 'UPDATE' ? '#dcfce7' : '#f1f5f9',
                    color: notice.category === 'EVENT' ? '#1d4ed8' : notice.category === 'UPDATE' ? '#15803d' : '#475569'
                  }}>
                    {notice.category}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{notice.date}</span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '17px', fontWeight: 'bold' }}>{notice.title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{notice.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* --- 2. FAQ 탭 --- */}
        {activeTab === 'faq' && (
          <div>
            {/* 검색 및 필터 영역 */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text"
                placeholder="궁금한 내용을 검색해보세요 (예: 이용방법, 프로필, 판정)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, minWidth: '220px', padding: '12px 16px', borderRadius: '50px', border: 'none', fontSize: '14px', outline: 'none', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: '전체', value: 'all' },
                  { label: '서비스', value: 'service' },
                  { label: '프로필', value: 'profile' },
                  { label: '계정', value: 'account' }
                ].map(cat => (
                  <button
                    key={cat.value}
                    className="support-pill-btn"
                    onClick={() => setSelectedCategory(cat.value)}
                    style={{
                      padding: '0 16px', height: '45px', borderRadius: '50px', fontSize: '13px', cursor: 'pointer',
                      backgroundColor: selectedCategory === cat.value ? '#C9B6D7' : '#fff',
                      color: selectedCategory === cat.value ? '#fff' : '#64748b',
                      border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      fontWeight: selectedCategory === cat.value ? 'bold' : 'normal'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ 아코디언 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      className="faq-accordion"
                      style={{ 
                        backgroundColor: "#fff", overflow: "hidden" 
                      }}
                    >
                      <div 
                        onClick={() => toggleFaq(faq.id)}
                        style={{ 
                          padding: '18px 20px', display: 'flex', justifyContent: 'space-between', 
                          alignItems: 'center', cursor: 'pointer', backgroundColor: isOpen ? '#f8fafc' : '#fff' 
                        }}
                      >
                        <span style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>
                          <span style={{ color: '#5F50A9', marginRight: '8px', fontWeight: 'bold' }}>Q.</span> {faq.question}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                          ▼
                        </span>
                      </div>
                      {isOpen && (
                        <div style={{ 
                          padding: '18px 24px 22px 24px', backgroundColor: '#faf9fc', 
                          borderTop: '1px solid #f1f5f9', fontSize: '14px', color: '#334155', lineHeight: '1.7',
                          whiteSpace: 'pre-wrap'
                        }}>
                          <span style={{ color: '#F79DC4', fontWeight: '800', marginRight: '8px' }}>A.</span>
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontSize: '14px' }}>
                  검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default SupportPage;