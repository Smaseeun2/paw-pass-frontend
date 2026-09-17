// src/pages/SupportPage.jsx
import { useState } from 'react';

function SupportPage() {
  const [activeTab, setActiveTab] = useState('notice');
  const [openFaqId, setOpenFaqId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 형식적인 공지사항 데이터 (카테고리 추가)
  const notices = [
    { 
      id: 1, 
      category: 'EVENT', 
      title: 'Paw Pass 정식 서비스 오픈 및 이벤트 안내', 
      date: '2026.06.01', 
      content: '반려동물과 함께하는 즐거운 여행의 시작, Paw Pass가 정식 오픈하였습니다. 신규 가입 회원분들을 위한 특별 혜택을 확인해 보세요.' 
    },
    { 
      id: 2, 
      category: 'UPDATE', 
      title: '[업데이트 v1.2] 맞춤형 동반 판정 알고리즘 고도화', 
      date: '2026.05.15', 
      content: '반려동물 체중 및 견종별 출입 조건 판정 정확도가 더욱 향상되었습니다. 프로필 정보를 최신 상태로 유지해 주세요.' 
    },
    { 
      id: 3, 
      category: 'NOTICE', 
      title: '여름철 야외 활동 시 반려동물 안전 수칙 안내', 
      date: '2026.04.20', 
      content: '기온 상승에 따른 지면 화상 주의 및 충분한 수분 섭취 안내 등 여름철 야외 관광지 방문 시 필수 수칙을 정리해 드립니다.' 
    }
  ];

  // 세분화된 FAQ 데이터
  const faqs = [
    { 
      id: 1, 
      category: 'profile',
      question: '반려동물 프로필은 여러 마리 등록할 수 있나요?', 
      answer: '네, 제한 없이 여러 마리 등록하실 수 있습니다. 각 반려동물별 체중, 견종, 성향에 맞춰 개별 맞춤 방문 판정을 제공받으실 수 있습니다.' 
    },
    { 
      id: 2, 
      category: 'service',
      question: '관광지 및 시설의 동반 가능 여부는 얼마나 정확한가요?', 
      answer: '한국관광공사 Open API 및 문화시설 DB를 실시간으로 연동하여 제공하고 있습니다. 다만 현장 규정이나 지침은 수시로 변동될 수 있으므로 방문 전 최종 확인을 권장합니다.' 
    },
    { 
      id: 3, 
      category: 'account',
      question: '구글 소셜 로그인은 어떻게 이용하나요?', 
      answer: '네비게이션 상단 우측 [구글 로그인] 버튼을 클릭하시면 별도의 가입 절차 없이 기존 구글 계정으로 안전하고 간편하게 이용하실 수 있습니다.' 
    },
    { 
      id: 4, 
      category: 'service',
      question: '방문 판정 결과가 "방문 불가"로 나오는 이유는 무엇인가요?', 
      answer: '반려동물 출입이 제한된 구역이거나, 등록된 시설 정보 기준으로 동반 입장이 불가능한 장소일 때 "방문 불가"로 표시돼요.\n\n다만, 현장 상황이나 시설 규정에 따라 변동이 있을 수 있으니, 방문하시기 전에 해당 장소나 업체를 통해 한 번 더 확인해 보시는 걸 추천해드립니다.' 
    },
    { 
      id: 5, 
      category: 'service',
      question: '특정 지역을 선택했는데 관광지가 나오지 않거나 비어 있어요.', 
      answer: '현재 PawPass는 오픈 API 연동 및 데이터 정합성 검증을 순차적으로 진행하고 있습니다. 데이터가 아직 충분히 수집되지 않은 일부 지역의 경우 검색 결과가 조회되지 않을 수 있습니다.\n\n누락된 지역의 관광지 정보는 지속적으로 업데이트될 예정이오니, 이용에 조금만 양해를 부탁드립니다. 빠른 시일내에 더 많은 지역에서 편리하게 반려동물 동반 장소를 찾으실 수 있도록 최선을 다하겠습니다.' 
    }
  ];

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // FAQ 검색 및 카테고리 필터링
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesQuery = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ padding: '40px 20px 80px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* 헤더 타이틀 */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>고객센터 & 도움말</h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          서비스 소식과 자주 묻는 질문을 한곳에서 확인하세요.
        </p>
      </div>

      {/* 모던 탭 네비게이션 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', width: '100%', maxWidth: '360px' }}>
          <button 
            onClick={() => setActiveTab('notice')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
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
              flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
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
              style={{ 
                backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', 
                padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)' 
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
              placeholder="궁금한 내용을 검색해보세요 (예: 프로필, 로그인)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, minWidth: '220px', padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff'
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: '전체', value: 'all' },
                { label: '프로필', value: 'profile' },
                { label: '서비스', value: 'service' },
                { label: '계정', value: 'account' }
              ].map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    padding: '0 12px', height: '45px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                    backgroundColor: selectedCategory === cat.value ? '#334155' : '#f8fafc',
                    color: selectedCategory === cat.value ? '#fff' : '#64748b',
                    border: selectedCategory === cat.value ? 'none' : '1px solid #cbd5e1',
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
                    style={{ 
                      backgroundColor: '#fff', border: '1px solid #e2e8f0', 
                      borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' 
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
                        <span style={{ color: '#2563eb', marginRight: '8px' }}>Q.</span> {faq.question}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        ▼
                      </span>
                    </div>
                    {isOpen && (
                      <div style={{ 
                        padding: '16px 20px 20px 20px', backgroundColor: '#f8fafc', 
                        borderTop: '1px solid #f1f5f9', fontSize: '14px', color: '#475569', lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}>
                        <span style={{ color: '#16a34a', fontWeight: 'bold', marginRight: '8px' }}>A.</span> {faq.answer}
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
  );
}

export default SupportPage;