
export type PageSEO = {
  title: string;
  description: string;
  keywords: string[];
  ogType: 'website' | 'article' | 'product';
};

export const defaultSEO = {
  title: 'Figuro.AI - Design AI-powered Figurines, Download in 3D',
  description: 'Create custom 3D figurines from text prompts using AI. Select art styles, generate images, and download 3D models ready for printing.',
  keywords: ['AI figurines', '3D models', 'custom figurines', 'AI design', '3D printing'],
  ogImage: 'https://lovable.dev/opengraph-image-p98pqg.png',
  ogType: 'website',
};

export const pageSEO: Record<string, PageSEO> = {
  home: {
    title: 'Figuro.AI - Design AI-powered Figurines, Download in 3D',
    description: 'Create custom 3D figurines from text prompts using AI. Select art styles, generate images, and download 3D models ready for printing.',
    keywords: ['AI figurines', '3D models', 'custom figurines', 'AI design', '3D printing'],
    ogType: 'website',
  },
  studio: {
    title: 'Studio - Create Your Custom Figurines | Figuro.AI',
    description: 'Use our AI-powered studio to create custom figurines from text prompts. Choose art styles and download 3D models ready for printing.',
    keywords: ['AI studio', 'figurine design', '3D model generator', 'custom figurines', 'text to 3D'],
    ogType: 'website',
  },
  gallery: {
    title: 'Gallery - Explore AI-Generated Figurines | Figuro.AI',
    description: 'Browse our gallery of AI-generated 3D figurines. Get inspired and create your own unique designs with our AI-powered platform.',
    keywords: ['3D model gallery', 'AI figurines', 'inspiration', 'figurine examples', 'AI artwork'],
    ogType: 'website',
  },
  pricing: {
    title: 'Pricing - Affordable AI Figurine Creation | Figuro.AI',
    description: 'View our pricing plans for creating AI-generated figurines. Choose the perfect plan for your needs, from hobbyists to professionals.',
    keywords: ['AI figurine pricing', '3D model subscription', 'affordable 3D printing', 'AI generation cost'],
    ogType: 'website',
  },
};

export const structuredData = {
  organization: {
    name: 'Figuro.AI',
    url: 'https://figuro.ai',
    logo: 'https://figuro.ai/logo.png',
    sameAs: [
      'https://twitter.com/figuro_ai',
      'https://github.com/figuro-ai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@figuro.ai',
      contactType: 'customer service',
    },
  },
  webApplication: {
    name: 'Figuro.AI',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  },
};
