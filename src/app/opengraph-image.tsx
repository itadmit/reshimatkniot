import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'רשימת קניות - אפליקציה לניהול קניות משפחתי';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffbc0d',
          padding: '40px',
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            backgroundColor: '#376e4b',
            borderRadius: '24px',
            marginBottom: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          <svg
            width="70"
            height="70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#376e4b',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          רשימת קניות
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '32px',
            color: '#376e4b',
            opacity: 0.8,
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          ניהול קניות משפחתי חכם
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'white',
              padding: '16px 24px',
              borderRadius: '50px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ fontSize: '24px' }}>👨‍👩‍👧‍👦</span>
            <span style={{ fontSize: '20px', color: '#376e4b', fontWeight: 'bold' }}>
              רשימה משותפת
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'white',
              padding: '16px 24px',
              borderRadius: '50px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ fontSize: '24px' }}>💬</span>
            <span style={{ fontSize: '20px', color: '#376e4b', fontWeight: 'bold' }}>
              שיתוף בוואטסאפ
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'white',
              padding: '16px 24px',
              borderRadius: '50px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ fontSize: '24px' }}>⚡</span>
            <span style={{ fontSize: '20px', color: '#376e4b', fontWeight: 'bold' }}>
              סנכרון בזמן אמת
            </span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '20px',
            color: '#376e4b',
            opacity: 0.6,
          }}
        >
          kitchenlistil.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

