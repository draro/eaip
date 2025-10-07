'use client';

import { useEffect } from 'react';

interface Props {
  logoUrl?: string;
  organizationName?: string;
}

/**
 * Dynamically updates the favicon for public pages
 * Uses organization logo if available
 */
export default function FaviconLoader({ logoUrl, organizationName }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Remove existing favicon
    const existingFavicons = window.document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(icon => icon.remove());

    if (logoUrl) {
      // Create new favicon with organization logo
      const link = window.document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = logoUrl;
      window.document.head.appendChild(link);

      // Create apple touch icon
      const appleLink = window.document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = logoUrl;
      window.document.head.appendChild(appleLink);
    }

    // Update document title in tab
    if (organizationName && !window.document.title.includes(organizationName)) {
      window.document.title = `${organizationName} - eAIP`;
    }

    // Cleanup
    return () => {
      const favicons = window.document.querySelectorAll(`link[rel*="icon"][href="${logoUrl}"]`);
      favicons.forEach(icon => icon.remove());
    };
  }, [logoUrl, organizationName]);

  return null;
}
