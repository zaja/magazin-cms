interface OrganizationJsonLdProps {
  name: string
  logo?: string
  sameAs?: string[]
}

export function OrganizationJsonLd({ name, logo, sameAs }: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    ...(logo && { logo }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
