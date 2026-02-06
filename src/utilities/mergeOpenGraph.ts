import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Magazin CMS',
  images: [
    {
      url: `${getServerSideURL()}/favicon.svg`,
    },
  ],
  siteName: 'Magazin CMS',
  title: 'Magazin CMS',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
