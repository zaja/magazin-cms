import type { Metadata } from 'next'
import { SubscribeForm } from '@/components/frontend/SubscribeForm'

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'Pretplatite se na naš newsletter i primajte najnovije vijesti.',
}

export default function SubscribePage() {
  return (
    <>
      {/* Page Header */}
      <section className="bg-neutral-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Newsletter</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Budite u toku s najnovijim trendovima, člancima i ekskluzivnim sadržajem.
          </p>
        </div>
      </section>

      {/* Subscribe Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 p-8 md:p-12">
            <h2 className="font-serif text-2xl font-bold mb-4 text-center">
              Pretplatite se na newsletter
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Primajte najnovije vijesti, ekskluzivne intervju i trendove iz svijeta mode i lepote
              direktno u vaš inbox. Bez spama, samo kvalitetan sadržaj.
            </p>

            <SubscribeForm />

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold mb-4">Što dobivate?</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Najnovije članke i trendove svaki tjedan</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Ekskluzivne intervju s poznatim licima</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Savjete stručnjaka iz mode i lepote</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Mogućnost odjave u bilo kojem trenutku</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
