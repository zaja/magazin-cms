import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container py-28 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="mb-8">
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Stranica nije pronađena</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Stranica koju tražite ne postoji ili je premještena. Provjerite URL adresu ili se vratite
          na početnu stranicu.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link href="/">Početna stranica</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/posts">Pregledaj objave</Link>
        </Button>
      </div>
    </div>
  )
}
