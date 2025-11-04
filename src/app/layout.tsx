// import "./globals.css";

import type { Metadata, Viewport } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import { Poppins } from "next/font/google";
import { generateMetadata as generateSEOMetadata, generateOrganizationSchema, generateEventSchema, analyticsConfig } from "@/lib/seo";
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap", // Optimize font loading
});

// Enhanced SEO metadata
export const metadata: Metadata = generateSEOMetadata({
  title: "Wattaqa 2K25 - Annual Inter-School Competition",
  description: "Join Wattaqa 2K25, the premier annual inter-school competition featuring arts, sports, and academic programs. Register your team, track results, and compete for excellence.",
  keywords: ["wattaqa 2k25", "inter-school competition", "arts", "sports", "academic programs", "student competition"],
});

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5750F1' },
    { media: '(prefers-color-scheme: dark)', color: '#5750F1' }
  ],
};

export default function RootLayout({ children }: PropsWithChildren) {
  const organizationSchema = generateOrganizationSchema();
  const eventSchema = generateEventSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />
        
        {/* Critical CSS - Tailwind CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      poppins: ['Poppins', 'sans-serif'],
                    },
                    animation: {
                      'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                      'shimmer': 'shimmer 2s ease-in-out infinite',
                    },
                    keyframes: {
                      fadeInUp: {
                        '0%': { opacity: '0', transform: 'translateY(30px)' },
                        '100%': { opacity: '1', transform: 'translateY(0)' },
                      },
                      shimmer: {
                        '0%': { transform: 'translateX(-100%)' },
                        '100%': { transform: 'translateX(100%)' },
                      },
                    },
                  }
                }
              }
            `,
          }}
        />
        
        {/* Optimized font loading */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(eventSchema),
          }}
        />
        
        {/* Performance hints */}
        <link rel="preload" href="/images/logo.png" as="image" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${poppins.variable} font-poppins`}>
        {/* Google Analytics */}
        {analyticsConfig.googleAnalytics && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.googleAnalytics}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analyticsConfig.googleAnalytics}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `}
            </Script>
          </>
        )}
        
        {/* Google Tag Manager */}
        {analyticsConfig.googleTagManager && (
          <>
            <Script id="google-tag-manager" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${analyticsConfig.googleTagManager}');
              `}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${analyticsConfig.googleTagManager}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}
        
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
