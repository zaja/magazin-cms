'use client'

import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="#1a1a1a" />
        <path
          d="M10 12h20v2H10zM10 18h14v2H10zM10 24h18v2H10zM10 30h10v2H10z"
          fill="#ffffff"
        />
        <circle cx="32" cy="14" r="3" fill="#10b981" />
      </svg>
      <span
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#1a1a1a',
          letterSpacing: '-0.02em',
        }}
      >
        Magazin CMS
      </span>
    </div>
  )
}

export default Logo
