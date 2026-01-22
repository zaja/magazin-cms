'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

export const TestEmailButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Get the current form field value (not just initial data)
  const testEmailField = useFormFields(([fields]) => fields.testEmail)
  const testEmail = testEmailField?.value as string | undefined

  const handleTestEmail = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Unesite email adresu za testiranje iznad.' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({ success: true, message: `Test email uspješno poslan na ${testEmail}!` })
      } else {
        setResult({ success: false, message: data.error || 'Greška pri slanju emaila.' })
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

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={handleTestEmail}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: loading ? '#6b7280' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {loading ? 'Slanje...' : '📧 Pošalji test email'}
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

export default TestEmailButton
