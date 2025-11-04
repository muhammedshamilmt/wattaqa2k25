/**
 * SEO Configuration and Utilities
 * Comprehensive SEO optimization for Wattaqa 2K25 website
 */

import { Metadata } from 'next';

// Base SEO configuration
export const baseSEO = {
  siteName: 'Wattaqa 2K25',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://fest.dawaacademy.in',
  defaultTitle: 'Wattaqa 2K25 arts & sporst islamic dawa academy',
  defaultDescription: 'Join Wattaqa 2K25, the premier annual inter-school competition featuring arts, sports, and academic programs. Register your team, track results, and compete for excellence.',
  keywords: [
    'Wattaqa 2K25',
    'islamic dawa academy',
    'akode islamic center',
    'school sports',
    'arts competition',
    'academic competition',
    'student competition',
    'school tournament',
    'educational events',
    'youth competition',
    'school programs'
  ],
  author: 'Wattaqa 2K25 Organizing Committee',
  language: 'en',
  locale: 'en_US',
  type: 'website'
};

// Generate metadata for pages
export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  noIndex = false
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title 
    ? `${title} | ${baseSEO.siteName}`
    : baseSEO.defaultTitle;
  
  const fullDescription = description || baseSEO.defaultDescription;
  const fullUrl = url ? `${baseSEO.siteUrl}${url}` : baseSEO.siteUrl;
  const fullKeywords = [...baseSEO.keywords, ...keywords];
  const ogImage = image || `${baseSEO.siteUrl}/images/og-default.jpg`;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords.join(', '),
    authors: [{ name: baseSEO.author }],
    creator: baseSEO.author,
    publisher: baseSEO.siteName,
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: baseSEO.siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        }
      ],
      locale: baseSEO.locale,
      type: type,
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
      creator: '@wattaqa2k25',
      site: '@wattaqa2k25',
    },
    
    // Additional meta tags
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: fullUrl,
    },
    
    // Verification tags (add your actual verification codes)
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
    
    // App-specific
    applicationName: baseSEO.siteName,
    category: 'Education',
    classification: 'Educational Competition Platform',
  };
}

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'Home',
    description: 'Welcome to Wattaqa 2K25, the premier annual inter-school competition. Discover exciting programs in arts, sports, and academics. Register your team today!',
    keywords: ['home', 'welcome', 'registration', 'programs'],
  },
  
  results: {
    title: 'Competition Results',
    description: 'View live results and rankings from Wattaqa 2K25 competitions. Track your team\'s performance across arts, sports, and academic programs.',
    keywords: ['results', 'rankings', 'scores', 'leaderboard', 'performance'],
  },
  
  programmes: {
    title: 'Competition Programs',
    description: 'Explore all available competition programs in Wattaqa 2K25. From arts and sports to academic challenges - find the perfect programs for your team.',
    keywords: ['programs', 'competitions', 'arts', 'sports', 'academic', 'events','toper'],
  },
  
  teamAdmin: {
    title: 'Team Administration',
    description: 'Manage your team\'s participation in Wattaqa 2K25. Register for programs, view results, and track your team\'s progress.',
    keywords: ['team management', 'registration', 'administration', 'dashboard','sumud','inthifada','aqsa'],
    noIndex: true, // Private area
  },
  
};

// Structured data generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: baseSEO.siteName,
    url: baseSEO.siteUrl,
    logo: `${baseSEO.siteUrl}/images/logo.png`,
    description: baseSEO.defaultDescription,
    sameAs: [
      // Add your social media URLs
      'https://facebook.com/wattaqa2k25',
      'https://twitter.com/wattaqa2k25',
      'https://www.instagram.com/islamicdawaacademy/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '7012453878',
      contactType: 'customer service',
      availableLanguage: 'English'
    }
  };
}

export function generateEventSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Wattaqa 2K25 Inter-School Competition',
    description: baseSEO.defaultDescription,
    startDate: '2025-01-01', // Update with actual dates
    endDate: '2025-12-31',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: 'Competition Venues', // Update with actual venue
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'City', // Update with actual location
        addressCountry: 'Country'
      }
    },
    organizer: {
      '@type': 'Organization',
      name: baseSEO.siteName,
      url: baseSEO.siteUrl
    },
    offers: {
      '@type': 'Offer',
      url: `${baseSEO.siteUrl}/register`,
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  };
}

export function generateCompetitionSchema(competition: {
  name: string;
  description: string;
  category: string;
  participants?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: competition.name,
    description: competition.description,
    sport: competition.category,
    competitor: competition.participants ? {
      '@type': 'SportsTeam',
      name: `${competition.participants} participating teams`
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: baseSEO.siteName,
      url: baseSEO.siteUrl
    }
  };
}

// Sitemap generation helper
export function generateSitemapUrls() {
  const baseUrls = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/results', priority: 0.9, changefreq: 'hourly' },
    { url: '/programmes', priority: 0.8, changefreq: 'weekly' },
    { url: '/programmes/arts', priority: 0.7, changefreq: 'weekly' },
    { url: '/programmes/sports', priority: 0.7, changefreq: 'weekly' },
    { url: '/about', priority: 0.6, changefreq: 'monthly' },
    { url: '/contact', priority: 0.6, changefreq: 'monthly' },
  ];

  return baseUrls.map(item => ({
    ...item,
    url: `${baseSEO.siteUrl}${item.url}`,
    lastmod: new Date().toISOString(),
  }));
}

// Performance and Core Web Vitals optimization
export const performanceConfig = {
  // Image optimization
  images: {
    domains: ['localhost', 'wattaqa2k25.com'],
    formats: ['image/webp', 'image/avif'],
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  },
  
  // Font optimization
  fonts: {
    preload: [
      '/fonts/satoshi-variable.woff2',
      '/fonts/satoshi-bold.woff2',
    ],
  },
  
  // Critical CSS
  criticalCSS: {
    inline: true,
    minify: true,
  },
};

// Analytics and tracking
export const analyticsConfig = {
  googleAnalytics: process.env.NEXT_PUBLIC_GA_ID,
  googleTagManager: process.env.NEXT_PUBLIC_GTM_ID,
  facebookPixel: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
  
  // Events to track
  events: {
    pageView: 'page_view',
    teamRegistration: 'team_registration',
    programmeRegistration: 'programme_registration',
    resultView: 'result_view',
    searchUsage: 'search_usage',
  },
};