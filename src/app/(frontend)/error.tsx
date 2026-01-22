'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="container py-28 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="mb-8">
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">500</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Došlo je do greške</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Nažalost, došlo je do neočekivane greške. Molimo pokušajte ponovo ili se vratite na
          početnu stranicu.
        </p>
        {error.digest && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">ID greške: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Pokušaj ponovo
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Početna stranica</Link>
        </Button>
      </div>
    </div>
  )
}
