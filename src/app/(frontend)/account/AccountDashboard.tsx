'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Subscriber } from '@/payload-types'

interface AccountDashboardProps {
  member: Subscriber
}

export function AccountDashboard({ member }: AccountDashboardProps) {
  const router = useRouter()
  const [name, setName] = useState(member.name || '')
  const [preferences, setPreferences] = useState({
    newPosts: member.preferences?.newPosts ?? true,
    commentReplies: member.preferences?.commentReplies ?? true,
    newsletter: member.preferences?.newsletter ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, preferences }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri spremanju')
      }

      setMessage('Postavke su uspješno spremljene!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri spremanju')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const handleUnsubscribe = async () => {
    if (!confirm('Jeste li sigurni da se želite odjaviti sa svih obavijesti?')) {
      return
    }

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { newPosts: false, commentReplies: false, newsletter: false },
          status: 'unsubscribed',
        }),
      })

      if (!response.ok) {
        throw new Error('Greška pri odjavi')
      }

      setMessage('Uspješno ste se odjavili sa svih obavijesti.')
      setPreferences({ newPosts: false, commentReplies: false, newsletter: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri odjavi')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold">Moj račun</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-neutral-900 transition-colors"
        >
          Odjava
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      {/* Profile Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Profil</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={member.email}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email adresa se ne može promijeniti</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Ime
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-colors"
              placeholder="Vaše ime"
            />
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Obavijesti</h2>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.newPosts}
              onChange={(e) => setPreferences({ ...preferences, newPosts: e.target.checked })}
              className="mt-1 w-5 h-5 text-neutral-900 border-gray-300 rounded focus:ring-neutral-900"
            />
            <div>
              <span className="font-medium">Novi članci</span>
              <p className="text-sm text-gray-500">Primajte obavijesti kada objavimo novi članak</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.commentReplies}
              onChange={(e) => setPreferences({ ...preferences, commentReplies: e.target.checked })}
              className="mt-1 w-5 h-5 text-neutral-900 border-gray-300 rounded focus:ring-neutral-900"
            />
            <div>
              <span className="font-medium">Odgovori na komentare</span>
              <p className="text-sm text-gray-500">
                Primajte obavijesti kada netko odgovori na vaš komentar
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.newsletter}
              onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
              className="mt-1 w-5 h-5 text-neutral-900 border-gray-300 rounded focus:ring-neutral-900"
            />
            <div>
              <span className="font-medium">Newsletter</span>
              <p className="text-sm text-gray-500">Primajte tjedni pregled najboljih članaka</p>
            </div>
          </label>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-neutral-900 text-white py-3 px-6 font-semibold uppercase tracking-wider text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Spremam...' : 'Spremi promjene'}
        </button>
      </div>

      {/* Danger Zone */}
      <section className="mt-12 pt-8 border-t border-red-200">
        <h2 className="text-lg font-semibold mb-4 text-red-600">Zona opasnosti</h2>
        <p className="text-sm text-gray-600 mb-4">
          Odjavom se isključujete sa svih email obavijesti. Možete se ponovno prijaviti u bilo kojem
          trenutku.
        </p>
        <button
          onClick={handleUnsubscribe}
          className="px-6 py-2 border-2 border-red-500 text-red-500 font-medium hover:bg-red-50 transition-colors"
        >
          Odjavi se sa svih obavijesti
        </button>
      </section>

      {/* Account Info */}
      <section className="mt-10 pt-6 border-t text-sm text-gray-500">
        <p>
          Član od:{' '}
          {member.subscribedAt ? new Date(member.subscribedAt).toLocaleDateString('hr-HR') : 'N/A'}
        </p>
        <p>
          Status:{' '}
          {member.status === 'active'
            ? 'Aktivan'
            : member.status === 'unsubscribed'
              ? 'Odjavljen'
              : member.status}
        </p>
      </section>
    </div>
  )
}
