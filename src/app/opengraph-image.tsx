import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'eAIP - Electronic Aeronautical Information Publication';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #3b77b0 0%, #2fb0d0 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 140, marginBottom: 20 }}>eAIP</div>
        <div style={{ fontSize: 48, fontWeight: 'normal', opacity: 0.9 }}>
          Electronic Aeronautical Information Publication
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
