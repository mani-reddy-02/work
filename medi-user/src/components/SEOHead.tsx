import React, { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  keywords?: string[];
  jsonLd?: Record<string, any> | Record<string, any>[];
}

function upsertMeta(selectorAttr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${selectorAttr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(selectorAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl = 'https://mediquee.in',
  ogImage = 'https://mediquee.in/og-image.jpg',
  ogType = 'website',
  keywords = ['MediQuee', 'healthcare', 'doctor consultation', 'online doctor appointment', 'hospital op booking', 'home nursing', 'lab tests'],
  jsonLd
}) => {
  const fullTitle = title.includes('MediQuee') ? title : `${title} | MediQuee`;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords.join(', '));
    upsertCanonical(canonicalUrl);

    upsertMeta('property', 'og:site_name', 'MediQuee');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', ogImage);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);
  }, [fullTitle, description, canonicalUrl, ogImage, ogType, keywords]);

  return (
    <>
      {/* Dynamic Structured Data (JSON-LD) */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g, '\\u003c')
              .replace(/>/g, '\\u003e')
              .replace(/&/g, '\\u0026')
          }}
        />
      )}
    </>
  );
};

export default SEOHead;
