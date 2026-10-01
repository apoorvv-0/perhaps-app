'use client';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react';

const tabs = [
  {
    id: 'home', label: 'Home', path: '/dashboard',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a0a0' : '#3d3030'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    )
  },
  {
    id: 'directory', label: 'Browse', path: '/directory',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a0a0' : '#3d3030'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    )
  },
  {
    id: 'results', label: 'Match', path: '/results',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a0a0' : '#3d3030'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    )
  },
  {
    id: 'profile', label: 'Profile', path: '/profile',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a0a0' : '#3d3030'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  },
];

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <nav className="glass-panel" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      
      display: 'flex', height: 64,
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50
    }}>
      {tabs.map(tab => {
        const isActive = pathname.startsWith(tab.path);
        return (
          <button key={tab.id}
            onClick={() => router.push(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? '#c9a0a0' : '#3d3030',
              transition: 'color 0.2s'
            }}
          >
            {tab.icon(isActive)}
            <span style={{ fontSize: 10, fontFamily: 'Inter', letterSpacing: '0.05em' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
