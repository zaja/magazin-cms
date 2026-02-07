'use client'

import React from 'react'

const tags = [
  { tag: '{{subscriberName}}', desc: 'Ime pretplatnika (ili "pretplatniče" ako nema)' },
  { tag: '{{subscriberEmail}}', desc: 'Email pretplatnika' },
  { tag: '{{unsubscribeUrl}}', desc: 'Link za odjavu' },
  { tag: '{{preferencesUrl}}', desc: 'Link za upravljanje obavijestima' },
  { tag: '{{siteName}}', desc: 'Naziv portala' },
  { tag: '{{siteUrl}}', desc: 'URL portala' },
  { tag: '{{date}}', desc: 'Današnji datum (dd.mm.yyyy.)' },
  { tag: '{{subscriberCount}}', desc: 'Ukupan broj aktivnih pretplatnika' },
]

export const NewsletterTagsInfo: React.FC = () => {
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        marginBottom: '1rem',
        fontSize: '13px',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '8px' }}>
        Dostupni replacement tagovi:
      </strong>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
        {tags.map(({ tag, desc }) => (
          <div key={tag}>
            <code
              style={{
                backgroundColor: '#e2e8f0',
                padding: '1px 4px',
                borderRadius: '2px',
                fontSize: '12px',
              }}
            >
              {tag}
            </code>{' '}
            <span style={{ color: '#666' }}>— {desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewsletterTagsInfo
