
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string[];
}

const SEO: React.FC<SEOProps> = ({
  title = 'Figuro.AI - Design AI-powered Figurines, Download in 3D',
  description = 'Create custom 3D figurines from text prompts using AI. Select art styles, generate images, and download 3D models ready for printing.',
  canonicalUrl = window.location.href,
  ogImage = 'https://lovable.dev/opengraph-image-p98pqg.png',
  ogType = 'website',
  keywords = ['AI figurines', '3D models', 'custom figurines', 'AI design', '3D printing'],
}) => {
  const siteName = 'Figuro.AI';
  const defaultTitle = 'Figuro.AI - Design AI-powered Figurines, Download in 3D';
  const fullTitle = title !== defaultTitle ? `${title} | ${siteName}` : title;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@figuro_ai" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
