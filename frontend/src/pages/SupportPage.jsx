// src/pages/SupportPage.jsx
import { useState } from 'react';

function SupportPage() {
  // 탭 상태 ('notice': 공지사항, 'faq': 자주 묻는 질문)
  const [activeTab, setActiveTab] = useState('notice');
  
  // FAQ 아코디언 열림/닫힘 상태 관리용 ID
  const [openFaqId, setOpenFaqId] = useState(null);

  // 샘플 공지사항 데이터 (notices.json 대응)
  const notices = [
    { id: 1, title: '[안내] Paw Pass 서비스 오픈 이벤트 안내', date: '2026-06-01', content: '반려동물 동반 관광지 추천 서비스 Paw Pass가 드디어 오픈했습니다! 많은 이용 바랍니다.' },
    { id: 2, title: '[공지] 여름철 반려동물 야외 활동 시 주의사항', date: '2026-05-15', content: '기온이 높아지는 여름철, 아스팔트 바닥 뜨거움 주의 및 충분한 수분 공급을 잊지 마세요.' },
    { id: 3, title: '[업데이트] 지도 및 동선 최적화 알고리즘 개선', date: '2026-04-20', content: '거리 계산 알고리즘이 개선되어 더욱 정확한 맞춤 동선을 제공합니다.' }
  ];

  // 샘플 FAQ 데이터 (faqs.json 대응)
  const faqs = [
    { id: 1, question: '반려동물 프로필은 여러 마리 등록할 수 있나요?', answer: '네! 마이페이지 또는 프로필 등록 페이지에서 제한 없이 여러 마리의 반려동물을 등록하고 관리하실 수 있습니다.' },
    { id: 2, question: '관광지 동반 가능 여부는 얼마나 정확한가요?', answer: '한국관광공사 OpenAPI 및 자체 수집 데이터를 기반으로 제공되나, 현장 상황이나 규정에 따라 변동될 수 있으니 방문 전 최종 확인을 권장합니다.' },
    { id: 3, question: '구글 로그인은 어떻게 하나요?', answer: '상단 우측의 [구글 로그인] 버튼을 누르시면 간편하게 구글 계정으로 로그인하실 수 있습니다.' }
  ];

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '850px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>💬 고객센터 & 안내</h2>
      <p style={{ textAlign: 'center', color: 'gray', marginBottom: '30px' }}>
        공지사항과 자주 묻는 질문을 확인해 보세요.
      </p>

      {/* 탭 버튼 영역 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
        <button 
          onClick={() => setActiveTab('notice')}
          style={{
            padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
            backgroundColor: activeTab === 'notice' ? '#1976d2' : '#f5f5f5',
            color: activeTab === 'notice' ? '#fff' : '#333',
            border: activeTab === 'notice' ? 'none' : '1px solid #ccc'
          }}
        >
          공지사항 📢
        </button>
        <button 
          onClick={() => setActiveTab('faq')}
          style={{
            padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
            backgroundColor: activeTab === 'faq' ? '#1976d2' : '#f5f5f5',
            color: activeTab === 'faq' ? '#fff' : '#333',
            border: activeTab === 'faq' ? 'none' : '1px solid #ccc'
          }}
        >
          자주 묻는 질문 (FAQ) ❓
        </button>
      </div>

      {/* --- 1. 공지사항 탭 내용 --- */}
      {activeTab === 'notice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {notices.map((notice) => (
            <div key={notice.id} style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#1976d2', fontSize: '16px' }}>{notice.title}</h4>
                <span style={{ fontSize: '12px', color: '#888' }}>{notice.date}</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: '1.5' }}>{notice.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* --- 2. FAQ 탭 내용 --- */}
      {activeTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div key={faq.id} style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                <div 
                  onClick={() => toggleFaq(faq.id)}
                  style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isOpen ? '#f0f7ff' : '#fff' }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>Q. {faq.question}</span>
                  <span style={{ fontSize: '14px', color: '#1976d2', fontWeight: 'bold' }}>{isOpen ? '▲ 닫기' : '▼ 열기'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '15px 20px', backgroundColor: '#f9f9f9', borderTop: '1px solid #eee', fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                    A. {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default SupportPage;