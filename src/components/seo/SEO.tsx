import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    image?: string;
    type?: 'website' | 'article';
    keywords?: string;
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    noindex?: boolean;
}

export const SEO = ({
    title,
    description,
    canonical,
    image = 'https://far7i.com/images/blog/karakou-1.jpg',
    type = 'website',
    keywords,
    author = 'Far7i',
    publishedTime,
    modifiedTime,
    noindex = false
}: SEOProps) => {
    const siteTitle = 'Far7i';
    const fullTitle = `${title} | ${siteTitle}`;
    const currentUrl =
        canonical ||
        (typeof window !== 'undefined'
            ? window.location.href
            : 'https://far7i.com');

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta name="author" content={author} />
            <meta
                name="robots"
                content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}
            />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:site_name" content={siteTitle} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Far7i - Prestataires mariage et événements en Algérie" />
            <meta property="og:locale" content="fr_DZ" />

            {/* Article specific */}
            {type === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            {type === 'article' && modifiedTime && (
                <meta property="article:modified_time" content={modifiedTime} />
            )}
            {type === 'article' && author && (
                <meta property="article:author" content={author} />
            )}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};
