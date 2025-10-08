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

    // Remove existing favicon safely
    const existingFavicons = window.document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(icon => {
      if (icon.parentNode) {
        icon.parentNode.removeChild(icon);
      }
    });

    const addedElements: HTMLLinkElement[] = [];

    if (logoUrl) {
      // Create new favicon with organization logo
      const link = window.document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = logoUrl;
      link.setAttribute('data-component', 'favicon-loader');
      window.document.head.appendChild(link);
      addedElements.push(link);

      // Create apple touch icon
      const appleLink = window.document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = logoUrl;
      appleLink.setAttribute('data-component', 'favicon-loader');
      window.document.head.appendChild(appleLink);
      addedElements.push(appleLink);
    }

    // Update document title in tab
    if (organizationName && !window.document.title.includes(organizationName)) {
      window.document.title = `${organizationName} - eAIP`;
    }

    // Cleanup
    return () => {
      try {
        addedElements.forEach(element => {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      } catch (error) {
        console.debug('FaviconLoader cleanup error (safe to ignore):', error);
      }
    };
  }, [logoUrl, organizationName]);

  return null;
}
