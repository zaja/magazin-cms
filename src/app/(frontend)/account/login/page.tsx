'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const redirectTo = searchParams.get('redirectTo')

  const errorMessages: Record<string, string> = {
    missing_token: 'Link za prijavu nije valjan.',
    invalid_token: 'Link za prijavu nije valjan ili je već iskorišten.',
    expired_token: 'Link za prijavu je istekao. Zatražite novi.',
    verification_failed: 'Greška pri verifikaciji. Pokušajte ponovo.',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri slanju')
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri slanju')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-4">Provjerite email</h1>
          <p className="text-gray-600 mb-6">
            Poslali smo link za prijavu na <strong>{email}</strong>. Kliknite na link u emailu za
            pristup vašem računu.
          </p>
          <p className="text-sm text-gray-500">
            Link vrijedi 15 minuta. Ako ne vidite email, provjerite spam folder.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-neutral-900 underline hover:no-underline"
          >
            Pošalji ponovo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2">Prijava</h1>
          <p className="text-gray-600">Unesite vaš email i poslat ćemo vam link za prijavu.</p>
        </div>

        {(urlError || error) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {errorMessages[urlError || ''] || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email adresa
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors"
              placeholder="vas@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3 px-6 font-semibold uppercase tracking-wider text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Šaljem...' : 'Pošalji link za prijavu'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Nemate račun? Unesite email iznad i automatski ćemo vam kreirati račun.
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-neutral-900 hover:underline text-sm">
            ← Natrag na naslovnicu
          </Link>
        </div>
      </div>
    </div>
  )
}
