// src/pages/DetailPage.jsx
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSpotDetail } from '../hooks/useSpotDetail';
import { useFavorites } from '../hooks/useFavorites';
import { usePetMatching } from '../hooks/usePetMatching';

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'tourapi';

  const { detail, isLoading } = useSpotDetail(id, source);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { matchResult } = usePetMatching(detail?.petCondition);

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
        장소 상세 정보를 실시간으로 불러오는 중입니다...
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>장소 정보를 찾을 수 없습니다.</p>
        <button 
          onClick={() => navigate(-1)} 
          style={{ padding: '10px 18px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ← 뒤로 가기
        </button>
      </div>
    );
  }

  const liked = isFavorite(detail.contentId || detail.id);
  const cond = detail.petCondition;

  // 지도 바로가기 URL 생성 (좌표가 있을 때 네이버지도/카카오맵 검색 연결)
  const mapSearchUrl = detail.lat && detail.lng 
    ? `https://map.kakao.com/link/map/${encodeURIComponent(detail.name)},${detail.lat},${detail.lng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(detail.address || detail.name)}`;

  return (
    <div style={{ padding: '0 20px', paddingBottom: '60px', maxWidth: '680px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* 상단 네비게이션 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}
        >
          ← 뒤로 가기
        </button>
        
        <button 
          onClick={() => toggleFavorite(detail)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: liked ? '#ef4444' : '#fff', 
            color: liked ? '#fff' : '#ef4444', 
            border: '1.5px solid #ef4444', 
            borderRadius: '20px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {liked ? '❤️ 찜 완료' : '🤍 찜하기'}
        </button>
      </div>

      {/* 장소 타이틀 & 출처 뱃지 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '26px', color: '#1e293b' }}>{detail.name}</h2>
        <span style={{ 
          fontSize: '12px', 
          padding: '4px 8px', 
          borderRadius: '6px', 
          backgroundColor: detail.source === 'kcisa' ? '#e0f2fe' : '#fef3c7', 
          color: detail.source === 'kcisa' ? '#0369a1' : '#b45309', 
          fontWeight: 'bold' 
        }}>
          {detail.source === 'kcisa' ? '반려동물 시설' : '관광공사 여행지'}
        </span>
      </div>

      {/* 대표 이미지 & 미등록 플레이스홀더 */}
      {detail.imageUrl ? (
        <img 
          src={detail.imageUrl} 
          alt={detail.name} 
          style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#f1f5f9' }} 
        />
      ) : (
        <div style={{ width: '100%', height: '180px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '20px', border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>등록된 대표 이미지가 없습니다</span>
        </div>
      )}

      {/* 기본 이용 정보 */}
      <div style={{ lineHeight: '1.7', backgroundColor: '#fff', padding: '18px 20px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ margin: '0 0 8px 0', flex: 1 }}><strong>📍 주소:</strong> {detail.address}</p>
          <a 
            href={mapSearchUrl} 
            target="_blank" 
            rel="noreferrer" 
            style={{ fontSize: '13px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'none', marginLeft: '12px', whiteSpace: 'nowrap' }}
          >
            지도 보기 ↗
          </a>
        </div>
        <p style={{ margin: '0 0 8px 0' }}><strong>📞 전화번호:</strong> {detail.phone || '정보 미제공'}</p>
        <p style={{ margin: '0 0 8px 0' }}><strong>⏰ 운영시간:</strong> {detail.hours}</p>
        {cond.parkingAvailable && (
          <p style={{ margin: '0 0 8px 0' }}><strong>🚗 주차 정보:</strong> {cond.parkingAvailable}</p>
        )}
        {detail.description && (
          <p style={{ margin: '8px 0 0 0', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            {detail.description}
          </p>
        )}
      </div>

      {/* 내 반려동물 맞춤 판정 */}
      {matchResult && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐾 내 반려동물 맞춤 방문 판정</h3>
          <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: matchResult.color || '#0284c7', margin: '0 0 6px 0' }}>
              판정 결과: {matchResult.status}
            </p>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>
              근거: {matchResult.reason}
            </p>
          </div>
        </div>
      )}

      {/* 반려동물 동반 조건 상세 */}
      <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '10px' }}>🐶 반려동물 동반 조건 안내</h3>
      <div style={{ backgroundColor: '#f0fdf4', padding: '18px 20px', borderRadius: '12px', border: '1px solid #bbf7d0', lineHeight: '1.7', color: '#166534' }}>
        {detail.source === 'tourapi' ? (
          <>
            <p style={{ margin: '0 0 8px 0' }}><strong>동반 가능 유형:</strong> {cond.acmpyType || '현장 문의 필요'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>입장 가능 동물/크기:</strong> {cond.possibleBreeds || '제한 없음 (현장 확인 권장)'}</p>
            <p style={{ margin: '0 0 8px 0' }}><strong>필수 준비물:</strong> {cond.needItem || '목줄 및 배변봉투 지참'}</p>
            {cond.etcInfo && (
              <p style={{ margin: '0' }}><strong>기타 안내:</strong> {cond.etcInfo}</p>
            )}
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 8px 0' }}><strong>제한 사항:</strong> {cond.petRestriction || '현장 규정 확인 필요'}</p>
            <p style={{ margin: '0' }}><strong>기타 편의:</strong> {cond.parkingAvailable ? `주차 가능 여부: ${cond.parkingAvailable}` : '안내 사항 준수'}</p>
          </>
        )}
      </div>

    </div>
  );
}

export default DetailPage;