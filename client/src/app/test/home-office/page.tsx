'use client';

import HomeOffice from '@/components/3d/environments/HomeOffice';

/**
 * Test page for Home Office Environment
 * Go to: http://localhost:3003/test/home-office
 *
 * Controls:
 * - WASD to move around
 * - Mouse to look
 * - Click glowing objects to interact
 */
export default function HomeOfficeTest() {
  return <HomeOffice />;
}

function LoadingScreen() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#fff',
        fontSize: '24px',
      }}
    >
      Loading 3D World...
    </div>
  );
}
