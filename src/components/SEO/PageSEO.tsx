'use client';

import Head from 'next/head';
import { generateMetadata, pageSEO } from '@/lib/seo';

interface PageSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

export function PageSEO({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  noIndex = false
}: PageSEOProps) {
  const metadata = generateMetadata({
    title,
    description,
    keywords,
    image,
    url,
    type,
    noIndex
  });

  return (
    <Head>
      <title>{metadata.title as string}</title>
      <meta name="description" content={metadata.description || ''} />
      <meta name="keywords" content={metadata.keywords || ''} />
      
      {/* Open Graph */}
      <meta property="og:title" content={metadata.openGraph?.title || ''} />
      <meta property="og:description" content={metadata.openGraph?.description || ''} />
      <meta property="og:url" content={metadata.openGraph?.url || ''} />
      <meta property="og:type" content={metadata.openGraph?.type || 'website'} />
      <meta property="og:site_name" content={metadata.openGraph?.siteName || ''} />
      {metadata.openGraph?.images?.[0] && (
        <>
          <meta property="og:image" content={metadata.openGraph.images[0].url} />
          <meta property="og:image:width" content={metadata.openGraph.images[0].width?.toString()} />
          <meta property="og:image:height" content={metadata.openGraph.images[0].height?.toString()} />
          <meta property="og:image:alt" content={metadata.openGraph.images[0].alt || ''} />
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={metadata.twitter?.card || 'summary_large_image'} />
      <meta name="twitter:title" content={metadata.twitter?.title || ''} />
      <meta name="twitter:description" content={metadata.twitter?.description || ''} />
      {metadata.twitter?.images?.[0] && (
        <meta name="twitter:image" content={metadata.twitter.images[0]} />
      )}
      
      {/* Robots */}
      <meta name="robots" content={metadata.robots || 'index, follow'} />
      
      {/* Canonical URL */}
      {metadata.alternates?.canonical && (
        <link rel="canonical" href={metadata.alternates.canonical} />
      )}
    </Head>
  );
}

// Pre-configured SEO components for common pages
export function HomePageSEO() {
  return (
    <PageSEO
      title={pageSEO.home.title}
      description={pageSEO.home.description}
      keywords={pageSEO.home.keywords}
      url="/"
    />
  );
}

export function ResultsPageSEO() {
  return (
    <PageSEO
      title={pageSEO.results.title}
      description={pageSEO.results.description}
      keywords={pageSEO.results.keywords}
      url="/results"
    />
  );
}

export function ProgrammesPageSEO() {
  return (
    <PageSEO
      title={pageSEO.programmes.title}
      description={pageSEO.programmes.description}
      keywords={pageSEO.programmes.keywords}
      url="/programmes"
    />
  );
}

export function TeamAdminPageSEO() {
  return (
    <PageSEO
      title={pageSEO.teamAdmin.title}
      description={pageSEO.teamAdmin.description}
      keywords={pageSEO.teamAdmin.keywords}
      url="/team-admin"
      noIndex={pageSEO.teamAdmin.noIndex}
    />
  );
}