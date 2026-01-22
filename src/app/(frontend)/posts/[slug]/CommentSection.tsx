'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface MemberSession {
  email: string
  name?: string
}

interface Comment {
  id: number | string
  author: {
    name: string
    avatar?: string
  }
  content: string
  createdAt: string
  status: string
  parentComment?: { id: number | string } | number | string | null
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Build nested comment tree from flat array
function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<number | string, Comment>()
  const rootComments: Comment[] = []

  // First pass: create map of all comments with empty replies array
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree structure
  comments.forEach((comment) => {
    const mappedComment = commentMap.get(comment.id)!
    const parentId = comment.parentComment
      ? typeof comment.parentComment === 'object'
        ? comment.parentComment.id
        : comment.parentComment
      : null

    if (parentId && commentMap.has(parentId)) {
      commentMap.get(parentId)!.replies!.push(mappedComment)
    } else {
      rootComments.push(mappedComment)
    }
  })

  return rootComments
}

// Single comment component with reply functionality
function CommentItem({
  comment,
  postId,
  depth = 0,
  onReplySubmitted,
}: {
  comment: Comment
  postId: string
  depth?: number
  onReplySubmitted: () => void
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyData, setReplyData] = useState({ name: '', email: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const maxDepth = 3 // Limit nesting depth

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus('idle')

    try {
      const res = await fetch('/api/frontend/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentCommentId: comment.id,
          name: replyData.name,
          email: replyData.email,
          content: replyData.content,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitStatus('success')
        setMessage('Vaš odgovor je poslan i čeka odobrenje.')
        setReplyData({ name: '', email: '', content: '' })
        setTimeout(() => {
          setShowReplyForm(false)
          setSubmitStatus('idle')
          onReplySubmitted()
        }, 2000)
      } else {
        setSubmitStatus('error')
        setMessage(data.error || 'Došlo je do greške.')
      }
    } catch {
      setSubmitStatus('error')
      setMessage('Došlo je do greške. Pokušajte ponovo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={depth > 0 ? 'ml-6 md:ml-10 border-l-2 border-gray-200 pl-4 md:pl-6' : ''}>
      <div className="bg-gray-50 p-4 md:p-6">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-neutral-200 flex items-center justify-center flex-shrink-0">
            <span className="font-serif font-bold text-neutral-700 text-xs md:text-sm">
              {comment.author.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'AN'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-semibold text-sm md:text-base">{comment.author.name}</span>
              <span className="text-gray-400 text-xs md:text-sm">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-gray-700 text-sm md:text-base">{comment.content}</p>

            {/* Reply button - only show if not at max depth */}
            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="mt-3 text-sm text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                {showReplyForm ? 'Odustani' : 'Odgovori'}
              </button>
            )}
          </div>
        </div>

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {submitStatus === 'success' ? (
              <p className="text-green-600 text-sm">{message}</p>
            ) : (
              <form onSubmit={handleReplySubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Ime *"
                    value={replyData.name}
                    onChange={(e) => setReplyData({ ...replyData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={replyData.email}
                    onChange={(e) => setReplyData({ ...replyData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <textarea
                  placeholder="Vaš odgovor *"
                  rows={3}
                  value={replyData.content}
                  onChange={(e) => setReplyData({ ...replyData, content: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-neutral-900 resize-none"
                />
                {submitStatus === 'error' && <p className="text-red-600 text-xs">{message}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Slanje...' : 'Pošalji odgovor'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onReplySubmitted={onReplySubmitted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    content: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [member, setMember] = useState<MemberSession | null>(null)
  const [memberLoading, setMemberLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setMember(data.member)
          setFormData((prev) => ({
            ...prev,
            name: data.member.name || '',
            email: data.member.email || '',
          }))
        }
      })
      .catch(() => {})
      .finally(() => setMemberLoading(false))
  }, [])

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/frontend/comments?postId=${postId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.docs || [])
      }
    } catch {
      console.error('Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!member) {
      setSubmitStatus('error')
      setMessage('Morate biti prijavljeni za komentiranje.')
      return
    }

    setSubmitting(true)
    setSubmitStatus('idle')

    try {
      const res = await fetch('/api/frontend/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: formData.content,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitStatus('success')
        setMessage(
          data.approved ? 'Vaš komentar je objavljen!' : 'Vaš komentar je poslan na pregled.',
        )
        setFormData({ name: '', email: '', content: '' })
        // Refresh comments if auto-approved
        if (data.approved) {
          fetchComments()
        }
      } else {
        setSubmitStatus('error')
        setMessage(data.error || 'Došlo je do greške.')
      }
    } catch {
      setSubmitStatus('error')
      setMessage('Došlo je do greške. Pokušajte ponovo.')
    } finally {
      setSubmitting(false)
    }
  }

  // Build nested tree from flat comments
  const commentTree = buildCommentTree(comments)
  const totalComments = comments.length

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="font-serif text-2xl font-bold mb-8">
        Komentari {totalComments > 0 && `(${totalComments})`}
      </h3>

      {/* Comment List */}
      {loading ? (
        <p className="text-gray-500">Učitavanje komentara...</p>
      ) : commentTree.length > 0 ? (
        <div className="space-y-4 mb-12">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReplySubmitted={fetchComments}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mb-8">Još nema komentara. Budite prvi!</p>
      )}

      {/* Main Comment Form */}
      <div className="bg-gray-50 p-6">
        <h4 className="font-serif text-lg font-bold mb-4">Ostavite komentar</h4>

        {submitStatus === 'success' ? (
          <p className="text-green-600">{message}</p>
        ) : memberLoading ? (
          <p className="text-gray-500">Učitavanje...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {member ? (
              <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded">
                <div className="w-10 h-10 bg-neutral-200 flex items-center justify-center flex-shrink-0">
                  <span className="font-serif font-bold text-neutral-700 text-sm">
                    {(member.name || member.email)
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name || 'Korisnik'}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <Link href="/account" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Postavke
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-white border border-gray-200 rounded text-center">
                <p className="text-gray-600 mb-3">Prijavite se za komentiranje</p>
                <Link
                  href={`/account/login?redirectTo=/posts/${postId}#comments`}
                  className="inline-block px-6 py-2 bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors"
                >
                  Prijava
                </Link>
              </div>
            )}
            {member && (
              <>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Komentar *
                  </label>
                  <textarea
                    id="content"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-neutral-900 resize-none"
                  />
                </div>
                {submitStatus === 'error' && <p className="text-red-600 text-sm">{message}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-neutral-900 text-white font-semibold uppercase tracking-wider text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Slanje...' : 'Pošalji komentar'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
