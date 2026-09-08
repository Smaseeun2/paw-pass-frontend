// src/pages/MapPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapSpots } from '../hooks/useMapSpots';
import { useTrips } from '../hooks/useTrips';
import { useRouteOptimizer } from '../hooks/useRouteOptimizer'; // 동선 최적화 훅 불러오기
import mockSpots from '../mocks/tourist-spots.json';

function MapPage() {
  const { spots, selectedSpot, handleMarkerClick } = useMapSpots();
  const { trips, addTrip, deleteTrip } = useTrips();
  const navigate = useNavigate();
  const [tripTitle, setTripTitle] = useState('');

  // 현재 모의 관광지 전체를 대상으로 최적화된 동선 순서를 계산해 둠
  const optimizedSpots = useRouteOptimizer(mockSpots);

  const handleSaveTrip = () => {
    if (!selectedSpot) return;
    addTrip(tripTitle, selectedSpot.name);
    setTripTitle('');
  };

  return (
    <div style={{ padding: '0 20px', paddingBottom: '50px', maxWidth: '1100px', margin: '0 auto' }}>
      <h2>🗺️ 반려동물 동반 지도 및 최적 동선 관리</h2>
      <p style={{ color: 'gray', marginBottom: '20px' }}>
        위경도 데이터를 기반으로 계산된 최적의 방문 순서를 확인하고 나만의 동선을 짜보세요.
      </p>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* 왼쪽: 지도 시뮬레이터 및 알고리즘 적용된 추천 순서 안내 */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '320px' }}>
          
          <div style={{ 
            height: '380px', border: '2px solid #2196F3', borderRadius: '12px', 
            backgroundColor: '#eef6fc', position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#1976d2' }}>
              📍 PawPass 스마트 동선 시뮬레이터
            </div>

            {/* 알고리즘으로 최적화된 순서대로 핀 버튼 배치 */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', padding: '20px', maxWidth: '90%' }}>
              {optimizedSpots.map((spot, index) => {
                const isSelected = selectedSpot?.contentId === spot.contentId;
                return (
                  <button
                    key={spot.contentId}
                    onClick={() => handleMarkerClick(spot)}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: isSelected ? '#ff4081' : '#fff',
                      color: isSelected ? '#fff' : '#333',
                      border: '2px solid #1976d2',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontSize: '13px'
                    }}
                  >
                    🚗 추천 순서 #{index + 1}. {spot.name}
                  </button>
                );
              })}
            </div>
            <span style={{ position: 'absolute', bottom: '10px', fontSize: '12px', color: '#555' }}>
              * 위경도 거리 계산 알고리즘(Haversine)에 의해 이동 거리가 최소화되도록 자동 정렬되었습니다.
            </span>
          </div>

          {/* 저장된 내 여행 동선 목록 */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>🎒 저장된 나의 여행 동선 목록</h3>
            {trips.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trips.map((trip) => (
                  <li key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                    <div>
                      <strong>{trip.title}</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>경유지: {trip.spots.join(', ')} | 날짜: {trip.date}</p>
                    </div>
                    <button 
                      onClick={() => deleteTrip(trip.id)}
                      style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#888', margin: 0 }}>저장된 여행 동선이 없습니다.</p>
            )}
          </div>

        </div>

        {/* 오른쪽: 선택된 장소 정보 및 동선 추가 패널 */}
        <div style={{ 
          flex: 1, minWidth: '300px', border: '1px solid #ddd', borderRadius: '12px', 
          padding: '20px', backgroundColor: '#fafafa'
        }}>
          {selectedSpot ? (
            <div>
              <h3 style={{ marginTop: 0, color: '#333' }}>📌 선택된 관광지</h3>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{selectedSpot.name}</h4>
              <p style={{ fontSize: '13px', color: '#555', margin: '0 0 15px 0' }}>📍 {selectedSpot.address}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>새 동선 이름 입력:</label>
                <input 
                  type="text" 
                  value={tripTitle} 
                  onChange={(e) => setTripTitle(e.target.value)} 
                  placeholder="예: 주말 댕댕이 나들이" 
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
                />
                <button 
                  onClick={handleSaveTrip}
                  style={{ padding: '10px', backgroundColor: '#ff4081', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  + 이 장소를 동선에 추가하기
                </button>
              </div>

              <button 
                onClick={() => navigate(`/detail/${selectedSpot.contentId}`)}
                style={{ width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                상세 정보 및 조건 확인하기 →
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '100px' }}>
              <p>🗺️ 지도 시뮬레이터에서 핀을 클릭하시면<br/>해당 장소를 동선에 추가할 수 있습니다.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MapPage;