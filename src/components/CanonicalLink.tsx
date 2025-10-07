'use client';

import { useEffect } from 'react';

interface Props {
  url: string;
}

/**
 * Client-side canonical link injection
 * This ensures canonical URLs are present even when metadata doesn't render properly
 */
export default function CanonicalLink({ url }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Remove any existing canonical links
    const existingCanonical = window.document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Create and inject new canonical link
    const link = window.document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    window.document.head.appendChild(link);

    // Cleanup on unmount
    return () => {
      const canonical = window.document.querySelector(`link[rel="canonical"][href="${url}"]`);
      if (canonical) {
        canonical.remove();
      }
    };
  }, [url]);

  return null;
}
