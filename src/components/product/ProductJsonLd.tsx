type Props = {
  name: string
  description: string
  imageUrl: string
  price: number
  inStock: boolean
}

/**
 * Renders structured data (JSON-LD) for product SEO.
 *
 * Security note: All inputs originate from Payload CMS admin panel (trusted content).
 * JSON.stringify naturally escapes HTML special characters (<, >, &, ", ') making
 * the output safe for embedding in a script tag. No user-generated content flows here.
 */
export function ProductJsonLd({ name, description, imageUrl, price, inStock }: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: imageUrl,
    offers: {
      '@type': 'AggregateOffer',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price,
      priceCurrency: 'RUB',
    },
  }

  // Using dangerouslySetInnerHTML is the standard Next.js pattern for JSON-LD.
  // JSON.stringify escapes all HTML-special characters, preventing injection.
  // eslint-disable-next-line react/no-danger
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
