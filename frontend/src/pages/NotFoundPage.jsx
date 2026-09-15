import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '64px', color: '#cbd5e1', margin: '0 0 20px 0' }}>404</h1>
      <h2 style={{ fontSize: '24px', color: '#334155', marginBottom: '16px' }}>페이지를 찾을 수 없습니다</h2>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        요청하신 페이지가 사라졌거나 잘못된 경로입니다. 🐶
      </p>
      <Link 
        to="/" 
        style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default NotFoundPage;
