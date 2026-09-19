// src/pages/SupportPage.jsx
import { useState } from 'react';

const notices = [
  {
    id: 1,
    title: 'PawPass 서비스 그랜드 오픈 안내',
    date: '2026-09-19',
    category: 'NOTICE',
    content: '반려견과 함께하는 가장 완벽한 여행 파트너, PawPass(포패스)가 정식 오픈했습니다! 🐾 우리 아이 몸무게와 체급에 맞춘 실시간 동반 가능 여부 판정, 전국 동반 명소를 한눈에 보는 인터랙티브 지도 & 길찾기, 헛걸음 없는 공식 출입 규정 안내, 그리고 나만의 맞춤 여행을 완성하는 여행 동선 플래너까지! 이제 PawPass와 함께 반려견과의 소중한 여행을 안심하고 시작해보세요.'
  },
  {
    id: 2,
    title: '지도형 관광지 탐색 & 인터랙티브 핀 기능 오픈',
    date: '2026-09-18',
    category: 'UPDATE',
    content: '탐색 페이지에서 지도형 뷰(Map View)가 새롭게 추가되었습니다! 🗺️ 지도 위에서 전국의 반려동물 동반 가능 장소를 한눈에 탐색하고, 출입 가능 상태별 맞춤 핀 색상(🟢가능/🟡조건부/🔴불가), 내 현재 위치 기반 검색, 장소 클릭 시 실시간 지도 중심 이동 및 좌측 리스트 무한 스크롤 연동까지 편리하게 이용해보세요.'
  }
];

const faqs = [
  {
    id: 0,
    category: 'service',
    categoryLabel: '서비스 이용',
    question: 'PawPass 이용방법을 알고싶어요.',
    answer: `반려동물과 함께하는 완벽한 여행 파트너, PawPass(포패스) 구석구석 이용 가이드입니다! 🐾✨

1. 🏠 홈 (Home)
• 스마트 검색: 메인 상단의 둥근 플로팅 검색창에 가고 싶은 장소나 키워드를 입력하고 검색하면 탐색 페이지로 바로 이동합니다.
• 빠른 탐색 캡슐: '전국 추천', '카페', '숙소', '공원/산책로' 등 인기 테마 캡슐을 눌러 원하는 테마로 바로 이동할 수 있습니다.
• 맞춤 추천 피드: 우리 아이(반려견) 조건에 딱 맞는 인기 명소와 시즌별 추천 여행지를 한눈에 확인하세요.

2. 🔍 관광지 탐색 (Explore)
• 실시간 동반 판정 필터: 강아지 몸무게(소/중/대형견), 견종, 실내/야외 동반 가능 여부, 목줄/입마개/케이지 필수 규정을 필터로 설정하여 맞춤 장소만 쏙쏙 골라보세요.
• 인터랙티브 지도 & 퀵 드로어: 화면을 이동하며 주변 동반 가능 장소를 핀으로 확인하고, 장소 카드를 클릭해 빠른 요약 드로어를 열어보세요. 길찾기도 바로 연동됩니다.

3. 📖 장소 상세 정보 (Place Detail)
• 공식 동반 규정 및 헛걸음 방지 체크리스트: 시설 공식 규정, 출입 가능 몸무게 제한, 부대시설(리드줄 착용 구역, 펜스 유무 등)을 사전에 철저히 확인하세요.
• 즐겨찾기 & 동선 담기: 마음에 드는 장소는 하트(❤️) 버튼으로 찜하고, '여행 동선에 추가' 버튼을 눌러 나만의 코스에 담을 수 있습니다.

4. 🗺️ 여행 동선 플래너 (Trip Planner)
• 지도 위 동선 시각화: 내가 담은 장소들이 지도 위에 번호와 선으로 연결되어 한눈에 이동 경로를 파악할 수 있습니다.
• 드래그 & 순서 편집: 일정 순서를 자유롭게 끌어서 변경하고, 최적 이동 동선을 손쉽게 계획할 수 있습니다.

5. 🐾 마이 프로필 & 반려동물 등록 (Profile)
• 다둥이 프로필 관리: 함께 사는 반려견들의 사진, 이름, 견종, 몸무게, 특이사항 등을 등록하세요.
• 대표 반려동물 설정: 대표 아이를 설정해두면 탐색 및 상세 페이지에서 해당 아이 기준으로 출입 가능 여부(Pass/Caution/Restricted)를 자동으로 판정해 드립니다.

6. ❤️ 즐겨찾기 (Bookmarks)
• 내가 찜한 명소 모아보기: 찜해둔 장소를 한곳에서 모아보고 언제든 빠르게 다시 찾아볼 수 있습니다.`
  },
  {
    id: 1,
    category: 'profile',
    categoryLabel: '반려동물 프로필',
    question: '반려동물 프로필은 여러 마리 등록할 수 있나요?',
    answer: '네, 가능합니다! [프로필] 페이지에서 다둥이 프로필을 제한 없이 등록할 수 있으며, 그중 주 여행 메이트인 아이를 [대표 반려동물]로 지정하면 탐색 및 상세 페이지에서 해당 아이 기준으로 맞춤 판정이 자동 적용됩니다.'
  },
  {
    id: 2,
    category: 'profile',
    categoryLabel: '반려동물 프로필',
    question: '대표로 설정되는 프로필은 무엇인가요?',
    answer: `[대표 반려동물] 프로필은 등록하신 여러 반려견 중 여행 탐색 및 출입 판정의 기본 기준이 되는 프로필입니다. 🐕👑

• 실시간 맞춤 동반 판정: 관광지 탐색, 홈 맞춤 추천, 장소 상세 페이지에서 별도의 필터 조작 없이도 대표 아이의 몸무게(소/중/대형견) 및 견종 특성에 맞춰 출입 가능 여부(Pass / Caution / Restricted)를 자동으로 계산하여 알려드립니다.
• 맞춤 추천 피드: 대표 아이의 체급과 조건에 최적화된 여행지와 테마가 우선적으로 추천됩니다.
• 대표 펫 간편 변경: [프로필] 페이지에서 등록된 반려견 카드 중 원하는 아이의 '대표 반려동물 설정'을 클릭하시면 언제든지 자유롭게 기준 아이를 바꾸실 수 있습니다.`
  },
  {
    id: 3,
    category: 'service',
    categoryLabel: '서비스 이용',
    question: '동반 가능 여부(Pass / Caution / Restricted) 판정 기준이 궁금해요.',
    answer: 'PawPass는 지자체 및 각 시설의 공식 반려동물 동반 가이드라인을 바탕으로 판정합니다.\n• 🟢 Pass: 체급 제한 없이 목줄 착용 후 자유롭게 동반 가능\n• 🟡 Caution: 특정 무게 이하(예: 10kg 미만), 케이지/유모차 필수, 야외 테라스만 허용 등 조건부 동반\n• 🔴 Restricted: 맹견 출입 제한 또는 특정 구역 동반 불가'
  },
  {
    id: 4,
    category: 'service',
    categoryLabel: '서비스 이용',
    question: '장소 정보가 실제와 다른 경우 어떻게 제보하나요?',
    answer: '이메일(pawpaw@pawpass.com)을 통해 변경된 영업시간, 동반 규정 변경 사항을 남겨주시면 관리자 검토 후 신속하게 반영됩니다.'
  },
  {
    id: 5,
    category: 'account',
    categoryLabel: '계정 관리',
    question: '회원 탈퇴 및 개인정보 삭제는 어떻게 하나요?',
    answer: '[프로필] 페이지 하단의 계정 관리 메뉴에서 탈퇴 신청이 가능하며, 등록된 반려동물 프로필 및 여행 동선 데이터는 즉시 안전하게 파기됩니다.'
  }
];

const categoryOptions = [
  { label: '전체', value: 'all' },
  { label: '서비스 이용', value: 'service' },
  { label: '반려동물 프로필', value: 'profile' },
  { label: '계정 관리', value: 'account' }
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
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;
    const matchesQuery = faq.question.toLowerCase().includes(query) || 
                         faq.answer.toLowerCase().includes(query);
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

      <div className="pawpass-support-container" style={{ padding: '36px 20px 60px 20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <style>{`
          .support-card { 
            transition: transform 0.2s ease, box-shadow 0.2s ease; 
            border: 1px solid rgba(226, 232, 240, 0.8) !important; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.03) !important; 
            border-radius: 22px !important; 
          }
          .support-card:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 10px 24px rgba(95, 80, 169, 0.08) !important; 
          }
          
          .support-pill-btn { 
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
            border-radius: 50px !important; 
          }
          .support-pill-btn:hover { 
            transform: translateY(-1px); 
          }
          
          .faq-accordion-item { 
            transition: transform 0.2s ease, box-shadow 0.2s ease; 
            border: 1.5px solid #f1f5f9 !important; 
            border-radius: 20px !important; 
            box-shadow: 0 4px 14px rgba(0,0,0,0.03) !important; 
            overflow: hidden;
            background-color: #ffffff;
          }
          .faq-accordion-item:hover { 
            border-color: rgba(201, 182, 215, 0.6) !important;
            box-shadow: 0 8px 22px rgba(95, 80, 169, 0.06) !important; 
          }
        `}</style>
      
        {/* 상단 모던 히어로 카드 배너 */}
        <div 
          className="support-header-banner"
          style={{ 
            textAlign: 'center', 
            padding: '34px 20px 28px 20px', 
            background: 'linear-gradient(135deg, rgba(201, 182, 215, 0.45) 0%, rgba(246, 202, 221, 0.35) 35%, rgba(197, 224, 251, 0.45) 70%, rgba(174, 210, 249, 0.4) 100%)',
            borderRadius: '28px',
            boxShadow: '0 12px 35px rgba(201, 182, 215, 0.22)',
            marginBottom: '24px',
            position: 'relative',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#5F50A9', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '5px 16px', borderRadius: '50px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            Help & Support
          </span>
          <h1 
            className="support-header-title"
            style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px', wordBreak: 'keep-all', lineHeight: '1.3' }}
          >
            📢 고객센터 & 공지사항
          </h1>
          <p 
            className="support-header-desc"
            style={{ fontSize: '15px', color: '#64748b', margin: '0', wordBreak: 'keep-all', lineHeight: '1.55' }}
          >
            서비스 소식과 자주 묻는 질문을<br />한곳에서 편리하게 확인해보세요
          </p>
        </div>

        {/* 모던 탭 네비게이션 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(226, 232, 240, 0.9)',
            padding: '5px', 
            borderRadius: '50px', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.04)', 
            width: '100%', 
            maxWidth: '360px',
            gap: '6px'
          }}>
            <button 
              type="button"
              onClick={() => setActiveTab('faq')}
              style={{
                flex: 1, 
                padding: '11px 0', 
                borderRadius: '50px', 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: '800', 
                fontSize: '14px', 
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: activeTab === 'faq' ? '#5F50A9' : 'transparent',
                color: activeTab === 'faq' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'faq' ? '0 4px 14px rgba(95, 80, 169, 0.35)' : 'none',
                transform: activeTab === 'faq' ? 'scale(1.02)' : 'none'
              }}
            >
              ❓ 자주 묻는 질문
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('notice')}
              style={{
                flex: 1, 
                padding: '11px 0', 
                borderRadius: '50px', 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: '800', 
                fontSize: '14px', 
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: activeTab === 'notice' ? '#5F50A9' : 'transparent',
                color: activeTab === 'notice' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'notice' ? '0 4px 14px rgba(95, 80, 169, 0.35)' : 'none',
                transform: activeTab === 'notice' ? 'scale(1.02)' : 'none'
              }}
            >
              📢 공지사항
            </button>
          </div>
        </div>

        {/* --- 1. FAQ 탭 (기본) --- */}
        {activeTab === 'faq' && (
          <div>
            {/* 검색바 & 카테고리 필터 영역 */}
            <div className="support-search-wrapper" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 캡슐 검색창 */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '50px',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                padding: '4px 8px 4px 18px',
                boxShadow: '0 8px 24px rgba(95, 80, 169, 0.06), 0 2px 6px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}>
                <span style={{ fontSize: '16px', marginRight: '8px', color: '#94a3b8', userSelect: 'none' }}>🔍</span>
                <input 
                  type="text"
                  placeholder="궁금한 내용을 검색해보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    color: '#1e293b',
                    padding: '9px 0',
                    backgroundColor: 'transparent',
                    minWidth: 0
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '6px 10px',
                      borderRadius: '50%'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 카테고리 칩 필터 */}
              <div 
                className="support-category-scroll"
                style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  overflowX: 'auto', 
                  paddingBottom: '2px', 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {categoryOptions.map(cat => {
                  const isSelected = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      className="support-pill-btn"
                      onClick={() => setSelectedCategory(cat.value)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '50px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        backgroundColor: isSelected ? '#5F50A9' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#64748b',
                        border: isSelected ? '1px solid #5F50A9' : '1px solid #e2e8f0',
                        boxShadow: isSelected ? '0 4px 12px rgba(95, 80, 169, 0.28)' : '0 2px 6px rgba(0,0,0,0.02)',
                        fontWeight: isSelected ? '800' : '600'
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
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
                      className="faq-accordion-item"
                    >
                      <div 
                        onClick={() => toggleFaq(faq.id)}
                        style={{ 
                          padding: '16px 20px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          cursor: 'pointer', 
                          backgroundColor: isOpen ? '#faf9fc' : '#ffffff',
                          transition: 'background-color 0.2s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, paddingRight: '12px' }}>
                          <span style={{ 
                            color: '#5F50A9', 
                            fontWeight: '900', 
                            fontSize: '16px',
                            flexShrink: 0
                          }}>
                            Q.
                          </span>
                          <span style={{ 
                            fontWeight: '700', 
                            fontSize: '14.5px', 
                            color: '#1e293b',
                            lineHeight: '1.45',
                            wordBreak: 'keep-all'
                          }}>
                            {faq.question}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '11px', 
                          color: isOpen ? '#5F50A9' : '#94a3b8', 
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                          transition: 'transform 0.25s ease, color 0.2s ease',
                          flexShrink: 0,
                          fontWeight: 'bold'
                        }}>
                          ▼
                        </span>
                      </div>

                      {isOpen && (
                        <div style={{ 
                          padding: '18px 22px 22px 22px', 
                          backgroundColor: '#ffffff', 
                          borderTop: '1px solid #f1f5f9', 
                          fontSize: '13.5px', 
                          color: '#334155', 
                          lineHeight: '1.7',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'keep-all'
                        }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#F79DC4', fontWeight: '900', fontSize: '15px', flexShrink: 0 }}>A.</span>
                            <div style={{ flex: 1 }}>{faq.answer}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '50px 20px', 
                  backgroundColor: '#ffffff', 
                  borderRadius: '22px', 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
                }}>
                  <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>🔍</span>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>검색 결과가 없습니다.</p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>다른 검색어를 입력하시거나 카테고리를 변경해 보세요.</p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#5F50A9',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    검색 초기화
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 2. 공지사항 탭 --- */}
        {activeTab === 'notice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                className="support-card"
                style={{ 
                  backgroundColor: '#ffffff', 
                  padding: '24px 22px',
                  borderRadius: '22px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    padding: '3px 10px', 
                    borderRadius: '50px',
                    backgroundColor: notice.category === 'NOTICE' ? 'rgba(95, 80, 169, 0.12)' : notice.category === 'UPDATE' ? '#dcfce7' : '#dbeafe',
                    color: notice.category === 'NOTICE' ? '#5F50A9' : notice.category === 'UPDATE' ? '#15803d' : '#1d4ed8'
                  }}>
                    {notice.category}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: '500' }}>{notice.date}</span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '16.5px', fontWeight: '800', letterSpacing: '-0.3px', wordBreak: 'keep-all' }}>
                  {notice.title}
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: '1.65', wordBreak: 'keep-all' }}>
                  {notice.content}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}

export default SupportPage;