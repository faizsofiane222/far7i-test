import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
    type: 'organization' | 'website' | 'article' | 'breadcrumb' | 'localbusiness';
    data?: any;
}

export const StructuredData = ({ type, data }: StructuredDataProps) => {
    const getStructuredData = () => {
        switch (type) {
            case 'organization':
                return {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name: 'Far7i',
                    url: 'https://far7i.com',
                    logo: 'https://far7i.com/favicon.png',
                    description: "L'annuaire premium pour vos événements en Algérie",
                    address: {
                        '@type': 'PostalAddress',
                        addressCountry: 'DZ'
                    },
                    sameAs: [
                        // Add social media URLs when available
                    ]
                };

            case 'website':
                return {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Far7i',
                    url: 'https://far7i.com',
                    description: "L'annuaire premium pour vos événements en Algérie",
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: {
                            '@type': 'EntryPoint',
                            urlTemplate: 'https://far7i.com/recherche?q={search_term_string}'
                        },
                        'query-input': 'required name=search_term_string'
                    }
                };

            case 'article':
                if (!data) return null;
                return {
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: data.title,
                    description: data.excerpt || data.description,
                    image: data.image_url || data.image,
                    datePublished: data.published_at || data.publishedAt,
                    dateModified: data.updated_at || data.updatedAt || data.published_at || data.publishedAt,
                    author: {
                        '@type': 'Organization',
                        name: 'Far7i'
                    },
                    publisher: {
                        '@type': 'Organization',
                        name: 'Far7i',
                        logo: {
                            '@type': 'ImageObject',
                            url: 'https://far7i.com/favicon.png'
                        }
                    },
                    mainEntityOfPage: {
                        '@type': 'WebPage',
                        '@id': data.url || window.location.href
                    }
                };

            case 'breadcrumb':
                if (!data || !data.items) return null;
                return {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: data.items.map((item: any, index: number) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        name: item.name,
                        item: item.url
                    }))
                };

            case 'localbusiness':
                return {
                    '@context': 'https://schema.org',
                    '@type': 'LocalBusiness',
                    name: 'Far7i',
                    description: "L'annuaire premium pour vos événements en Algérie",
                    url: 'https://far7i.com',
                    telephone: data?.telephone || '',
                    address: {
                        '@type': 'PostalAddress',
                        addressCountry: 'DZ',
                        addressLocality: data?.city || 'Alger'
                    },
                    geo: data?.geo || {
                        '@type': 'GeoCoordinates',
                        latitude: 36.7538,
                        longitude: 3.0588
                    },
                    priceRange: '$$',
                    aggregateRating: data?.rating ? {
                        '@type': 'AggregateRating',
                        ratingValue: data.rating.value,
                        reviewCount: data.rating.count
                    } : undefined
                };

            default:
                return null;
        }
    };

    const structuredData = getStructuredData();

    if (!structuredData) return null;

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
};
