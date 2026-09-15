// src/components/ConditionalBadge.jsx
// "조건부 가능" 판정 시 구체적인 방문 조건을 시각적으로 표시하는 컴포넌트

/**
 * ConditionalBadge
 * @param {string[]} tips - 방문 조건 목록 (예: ["15kg 이하만 실내 입장 가능", "이동장/케이지 필수"])
 * @param {string} reason - 조건부 판정 근거 (선택)
 */
export default function ConditionalBadge({ tips = [], reason = '' }) {
  if (!tips.length && !reason) return null;

  return (
    <div style={{ marginTop: '10px' }}>
      {reason && (
        <p style={{ fontSize: '13px', color: '#92400e', backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '8px', margin: '0 0 10px 0', border: '1px solid #fde68a' }}>
          ⚠️ {reason}
        </p>
      )}
      {tips.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {tips.map((tip, i) => (
            <span
              key={i}
              style={{
                backgroundColor: '#fff7ed',
                color: '#c2410c',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                border: '1px solid #fed7aa',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📌 {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
