'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const TriggerPollButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleTriggerPoll = async () => {
    if (!id) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/rss-feeds/trigger-poll/${id}`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: `✓ Pronađeno ${data.result?.itemsFound || 0} članaka, ${data.result?.newItems || 0} novih dodano u queue`,
        })
      } else {
        setResult({
          success: false,
          message: `✗ Greška: ${data.error}`,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `✗ Greška: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!id) {
    return (
      <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: '#666' }}>Spremi feed prije pokretanja poll-a</p>
      </div>
    )
  }

  return (
    <div
      style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Ručno Pokretanje</h4>

      <button
        onClick={handleTriggerPoll}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        {loading ? 'Polling...' : '🔄 Poll Feed Sada'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px',
            background: result.success ? '#d4edda' : '#f8d7da',
            color: result.success ? '#155724' : '#721c24',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          {result.message}
        </div>
      )}

      <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#666' }}>
        Ovo će dohvatiti RSS feed i dodati nove članke u queue za procesiranje.
      </p>
    </div>
  )
}
