'use client'

import { useState } from 'react'

interface SubscribeFormProps {
  variant?: 'default' | 'sidebar' | 'hero'
}

export function SubscribeForm({ variant = 'default' }: SubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'Hvala na prijavi! Provjerite email za potvrdu.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Došlo je do greške. Pokušajte ponovo.')
      }
    } catch {
      setStatus('error')
      setMessage('Došlo je do greške. Pokušajte ponovo.')
    }
  }

  if (variant === 'hero') {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-neutral-900 text-white p-12 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Pretplatite se na newsletter</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Primajte najnovije vijesti, ekskluzivne intervju i trendove iz svijeta mode i lepote
            direktno u inbox.
          </p>
          {status === 'success' ? (
            <p className="text-green-400 text-lg">{message}</p>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Vaša email adresa"
                required
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-3 bg-white text-neutral-900 font-semibold uppercase tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Slanje...' : 'Pretplati se'}
              </button>
            </form>
          )}
          {status === 'error' && <p className="text-red-400 mt-4">{message}</p>}
        </div>
      </section>
    )
  }

  if (variant === 'sidebar') {
    return (
      <div className="bg-neutral-900 text-white p-6">
        <h4 className="font-serif text-xl font-bold mb-2">Newsletter</h4>
        <p className="text-gray-400 text-sm mb-4">Pretplatite se na najnovije vijesti</p>
        {status === 'success' ? (
          <p className="text-green-400 text-sm">{message}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Vaš email"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm mb-3 focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-4 py-3 bg-white text-neutral-900 font-semibold uppercase tracking-wider text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Slanje...' : 'Pretplati se'}
            </button>
          </form>
        )}
        {status === 'error' && <p className="text-red-400 text-sm mt-2">{message}</p>}
      </div>
    )
  }

  return (
    <div className="bg-gray-100 p-6">
      <h4 className="font-serif text-lg font-bold mb-2">Newsletter</h4>
      <p className="text-gray-600 text-sm mb-4">Pretplatite se za najnovije vijesti</p>
      {status === 'success' ? (
        <p className="text-green-600 text-sm">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Vaš email"
            required
            className="flex-1 px-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'OK'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="text-red-600 text-sm mt-2">{message}</p>}
    </div>
  )
}
