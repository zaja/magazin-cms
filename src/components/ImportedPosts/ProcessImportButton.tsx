'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export const ProcessImportButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleProcessImport = async () => {
    if (!id) return

    setLoading(true)
    setResult(null)

    try {
      // First, trigger retry which resets status to pending
      const retryResponse = await fetch(`/api/imported-posts/retry/${id}`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!retryResponse.ok) {
        const retryData = await retryResponse.json()
        // If already pending or processing, that's fine
        if (!retryData.error?.includes('Only failed')) {
          throw new Error(retryData.error || 'Failed to queue import')
        }
      }

      // Now trigger processing via the cron endpoint
      const processResponse = await fetch('/api/rss-feeds/process-single', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId: id }),
      })

      const data = await processResponse.json()

      if (data.success) {
        setResult({
          success: true,
          message: `✓ ${data.message || 'Import procesiran uspješno!'}`,
        })
        // Reload the page to see updated status
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setResult({
          success: false,
          message: `✗ ${data.error || 'Procesiranje nije uspjelo'}`,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `✗ ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!id) {
    return null
  }

  return (
    <div
      style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        Ručno Procesiranje
      </h4>

      <button
        onClick={handleProcessImport}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        {loading ? 'Procesiranje...' : '⚡ Procesiraj Sada'}
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
        Ovo će prevesti članak i kreirati draft post.
      </p>
    </div>
  )
}
