// src/pages/DetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useSpotDetail } from '../hooks/useSpotDetail';
import { useFavorites } from '../hooks/useFavorites';
import { usePetMatching } from '../hooks/usePetMatching'; // 매칭 훅 불러오기

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { detail } = useSpotDetail(id);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // 관광지의 petInfo를 매칭 훅에 전달
  const { matchResult } = usePetMatching(detail?.petInfo);

  if (!detail) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '5px 10px', cursor: 'pointer' }}>
          ← 뒤로 가기
        </button>
        <p>관광지 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const liked = isFavorite(detail.contentId);

  return (
    <div style={{ padding: '0 20px', paddingBottom: '50px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          ← 뒤로 가기
        </button>
        
        <button 
          onClick={() => toggleFavorite(detail)} // 👈 detail.contentId 가 아니라 detail 객체 전체를 전달해야 합니다!
          style={{ 
            padding: '8px 15px', 
            backgroundColor: liked ? '#ff4081' : '#fff', 
            color: liked ? '#fff' : '#333', 
            border: '1px solid #ff4081', 
            borderRadius: '20px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {liked ? '❤️ 찜 완료' : '🤍 찜하기'}
        </button>
      </div>

      <h2>{detail.name}</h2>
      
      {detail.imageUrl && (
        <img 
          src={detail.imageUrl} 
          alt={detail.name} 
          style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }} 
        />
      )}
      
      <div style={{ lineHeight: '1.6', backgroundColor: '#fdfdfd', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
        <p><strong>📍 주소:</strong> {detail.address}</p>
        <p><strong>📞 전화번호:</strong> {detail.phone || '정보 없음'}</p>
        <p><strong>📝 설명:</strong> {detail.description}</p>
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

      {/* --- 개인별 맞춤 매칭 결과 영역 (기능명세서 반영) --- */}
      <h3>🐾 내 반려동물 맞춤 방문 판정</h3>
      <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '8px', border: '1px solid #d0e1fd', marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', fontWeight: 'bold', color: matchResult.color, margin: '0 0 8px 0' }}>
          판정 결과: {matchResult.status}
        </p>
        <p style={{ fontSize: '14px', color: '#444', margin: 0 }}>
          근거: {matchResult.reason}
        </p>
      </div>

      <h3>🐶 반려동물 동반 상세 안내</h3>
      <div style={{ backgroundColor: '#f4f9f4', padding: '15px', borderRadius: '8px', border: '1px solid #d4edda' }}>
        <p><strong>실내 출입:</strong> {detail.petInfo?.indoor ? '실내 동반 가능' : '야외만 가능'}</p>
        <p><strong>목줄 필요 여부:</strong> {detail.petInfo?.needLeash ? '필수' : '필요 없음'}</p>
        <p><strong>입장 가능 동물:</strong> {detail.petInfo?.allowedTypes?.join(', ') || '정보 없음'}</p>
        <p><strong>필수 준비물:</strong> {detail.petInfo?.preparation?.join(', ') || '없음'}</p>
      </div>
    </div>
  );
}

export default DetailPage;