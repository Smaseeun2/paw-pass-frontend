// src/pages/DetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useSpotDetail } from '../hooks/useSpotDetail';
import { useFavorites } from '../hooks/useFavorites';

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { detail } = useSpotDetail(id);
  const { toggleFavorite, isFavorite } = useFavorites();

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
        
        {/* 찜하기(즐겨찾기) 버튼 */}
        <button 
          onClick={() => toggleFavorite(detail.contentId)}
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

      <h3>🐶 반려동물 동반 안내</h3>
      <div style={{ backgroundColor: '#f4f9f4', padding: '15px', borderRadius: '8px', border: '1px solid #d4edda' }}>
        <p><strong>동반 가능 여부:</strong> {detail.petInfo?.allowed ? '✅ 가능' : '❌ 불가'}</p>
        <p><strong>실내 출입:</strong> {detail.petInfo?.indoor ? '실내 동반 가능' : '야외만 가능'}</p>
        <p><strong>목줄 필요 여부:</strong> {detail.petInfo?.needLeash ? '필수' : '필요 없음'}</p>
        <p><strong>입장 가능 동물:</strong> {detail.petInfo?.allowedTypes?.join(', ') || '정보 없음'}</p>
        <p><strong>필수 준비물:</strong> {detail.petInfo?.preparation?.join(', ') || '없음'}</p>
      </div>
    </div>
  );
}

export default DetailPage;