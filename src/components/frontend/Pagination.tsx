import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const getPageUrl = (page: number) => {
    if (page === 1) return baseUrl
    return `${baseUrl}?page=${page}`
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      {currentPage > 1 && (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="pagination-link w-12 h-12 flex items-center justify-center border border-gray-200 hover:bg-neutral-900 hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
      )}

      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="w-12 h-12 flex items-center justify-center text-gray-400"
            >
              ...
            </span>
          )
        }

        const pageNum = page as number
        const isActive = pageNum === currentPage

        return (
          <Link
            key={pageNum}
            href={getPageUrl(pageNum)}
            className={`pagination-link w-12 h-12 flex items-center justify-center font-semibold transition-all ${
              isActive
                ? 'border-2 border-neutral-900 bg-neutral-900 text-white'
                : 'border border-gray-200 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            {pageNum}
          </Link>
        )
      })}

      {currentPage < totalPages && (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="pagination-link w-12 h-12 flex items-center justify-center border border-gray-200 hover:bg-neutral-900 hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  )
}
