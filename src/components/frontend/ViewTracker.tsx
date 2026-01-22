'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  postId: string | number
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  useEffect(() => {
    // Only track views once per session per post
    const viewedKey = `viewed_${postId}`
    const viewed = sessionStorage.getItem(viewedKey)

    if (!viewed) {
      fetch(`/api/frontend/posts/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      }).catch(() => {
        // Silently fail - view tracking is not critical
      })

      sessionStorage.setItem(viewedKey, 'true')
    }
  }, [postId])

  return null
}
