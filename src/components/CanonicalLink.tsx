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
    if (existingCanonical && existingCanonical.parentNode) {
      existingCanonical.parentNode.removeChild(existingCanonical);
    }

    // Create and inject new canonical link
    const link = window.document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    link.setAttribute('data-component', 'canonical-link'); // Mark for safe cleanup
    window.document.head.appendChild(link);

    // Cleanup on unmount
    return () => {
      try {
        const canonical = window.document.querySelector(`link[rel="canonical"][href="${url}"]`);
        if (canonical && canonical.parentNode) {
          canonical.parentNode.removeChild(canonical);
        }
      } catch (error) {
        // Ignore errors during cleanup - element may already be removed
        console.debug('CanonicalLink cleanup error (safe to ignore):', error);
      }
    };
  }, [url]);

  return null;
}
