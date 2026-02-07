'use client'

import React, { useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

export const SendNewsletterButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const { id } = useDocumentInfo()
  const statusField = useFormFields(([fields]) => fields.status)
  const status = statusField?.value as string | undefined

  const handleSend = async () => {
    if (!id) {
      setResult({ success: false, message: 'Prvo spremite newsletter.' })
      return
    }

    if (status === 'sent') {
      setResult({ success: false, message: 'Ovaj newsletter je već poslan.' })
      return
    }

    if (!confirm('Jeste li sigurni da želite poslati ovaj newsletter svim pretplatnicima?')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/newsletters/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterId: id }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({ success: true, message: data.message || 'Newsletter je dodan u red za slanje!' })
      } else {
        setResult({ success: false, message: data.error || 'Greška pri slanju.' })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Nepoznata greška.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '4px',
            backgroundColor: '#d1fae5',
            color: '#065f46',
          }}
        >
          Newsletter je poslan.
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={handleSend}
        disabled={loading || !id}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: loading ? '#6b7280' : '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          width: '100%',
        }}
      >
        {loading ? 'Šaljem...' : 'Pošalji newsletter'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            borderRadius: '4px',
            backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
            color: result.success ? '#065f46' : '#991b1b',
          }}
        >
          {result.message}
        </div>
      )}
    </div>
  )
}

export default SendNewsletterButton
