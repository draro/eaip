# eAIP Platform Documentation

Welcome to the eAIP Platform documentation. This directory contains comprehensive guides for implementing, configuring, and using the eAIP system.

## 📚 Documentation Index

### Analytics & Tracking

- **[GTM Setup Guide](./gtm-setup-guide.md)** - Complete step-by-step guide for setting up Google Tag Manager with GA4 integration
- **[GTM Implementation](./gtm-implementation.md)** - Technical documentation of the GTM implementation architecture

### Security & Compliance

- **[Cybersecurity Audit](./final_updated_aviation_cybersecurity_audit.md)** - Aviation cybersecurity audit and compliance documentation

## 🚀 Quick Start Guides

### Setting Up Analytics

1. **Create GTM Container**
   ```bash
   # Go to https://tagmanager.google.com/
   # Create a new container for your eAIP platform
   # Note your GTM ID (GTM-XXXXXXX)
   ```

2. **Configure Environment**
   ```bash
   # Add to .env.local
   echo "NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX" >> .env.local
   ```

3. **Follow Setup Guide**
   - Read: [`gtm-setup-guide.md`](./gtm-setup-guide.md)
   - Configure GA4 in GTM
   - Set up Consent Mode
   - Test and publish

### Using Custom Event Tracking

```typescript
import { trackDocumentCreated } from '@/lib/gtmEvents';

// Track when a document is created
trackDocumentCreated({
  documentId: '123',
  documentType: 'AIP',
  section: 'GEN',
  userId: 'user456'
});
```

See full event library: [`/src/lib/gtmEvents.ts`](../src/lib/gtmEvents.ts)

## 🎯 Key Features Documented

### Cookie Consent Management
- GDPR-compliant cookie banner
- Granular consent controls
- Cookie preferences page
- Consent mode v2 integration

**Files:**
- `/src/components/CookieConsentBanner.tsx`
- `/src/hooks/useCookieConsent.ts`
- `/src/app/legal/cookie-preferences/page.tsx`

### Google Tag Manager Integration
- Flexible tag management
- Custom event tracking
- Consent-aware tag firing
- GA4 integration

**Files:**
- `/src/components/GoogleTagManager.tsx`
- `/src/lib/gtmEvents.ts`
- `/docs/gtm-setup-guide.md`

### Analytics Events
- Document lifecycle events
- Workflow events
- File management events
- User actions
- Compliance checks
- Error tracking

**Reference:** [`/src/lib/gtmEvents.ts`](../src/lib/gtmEvents.ts)

## 📋 Implementation Checklists

### Initial Setup

- [ ] Create GTM container at [tagmanager.google.com](https://tagmanager.google.com/)
- [ ] Create GA4 property at [analytics.google.com](https://analytics.google.com/)
- [ ] Add `NEXT_PUBLIC_GTM_ID` to environment variables
- [ ] Configure GA4 tag in GTM
- [ ] Set up Consent Mode (default and update)
- [ ] Test in GTM Preview mode
- [ ] Verify events in GA4 Realtime
- [ ] Publish GTM container

### GDPR Compliance

- [x] Cookie consent banner implemented
- [x] Cookie policy page created
- [x] Privacy policy page created
- [x] Cookie preferences management page
- [x] Consent mode v2 integration
- [x] Data deletion request process
- [x] GDPR compliance notice in footer

### Analytics Tracking

- [x] GTM component created
- [x] Custom event library implemented
- [x] User property tracking
- [x] Consent-aware tracking
- [x] Documentation created

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env.local` | Local environment variables (not committed) |
| `.env.example` | Template for environment variables |
| `src/app/layout.tsx` | GTM integration point |
| `src/lib/gtmEvents.ts` | Event tracking helpers |

## 📖 External Resources

### Google Documentation
- [Google Tag Manager Help](https://support.google.com/tagmanager)
- [Google Analytics 4 Help](https://support.google.com/analytics)
- [Consent Mode Documentation](https://developers.google.com/tag-platform/security/guides/consent)

### Compliance Resources
- [GDPR Official Text](https://gdpr-info.eu/)
- [ePrivacy Directive](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002L0058)
- [Google Consent Mode v2](https://support.google.com/google-ads/answer/10000067)

## 🐛 Troubleshooting

### GTM Not Loading

**Problem**: GTM container not loading on page
**Solution**:
1. Check `NEXT_PUBLIC_GTM_ID` is set correctly
2. Verify environment variable is prefixed with `NEXT_PUBLIC_`
3. Restart development server after adding env variable

### Tags Not Firing

**Problem**: Tags not firing in GTM
**Solution**:
1. Open GTM Preview mode
2. Check if consent is granted in dataLayer
3. Verify trigger conditions are met
4. Check console for JavaScript errors

### Events Not in GA4

**Problem**: Events pushed to dataLayer but not appearing in GA4
**Solution**:
1. Check GA4 Realtime reports (not Overview)
2. Verify GA4 Measurement ID is correct in GTM
3. Wait 24-48 hours for full data processing
4. Check GTM Preview mode - are events being sent?

### Cookie Banner Not Showing

**Problem**: Cookie consent banner doesn't appear
**Solution**:
1. Check localStorage: `eaip_cookie_consent`
2. Clear localStorage and refresh
3. Open in incognito mode
4. Check browser console for errors

## 🤝 Contributing

When adding new documentation:

1. **Follow Structure**: Use the existing format
2. **Add to Index**: Update this README with links
3. **Include Examples**: Provide code examples where relevant
4. **Test Instructions**: Verify all steps work
5. **Keep Updated**: Update docs when implementation changes

## 📞 Support

For questions or issues:

1. **Check Documentation**: Start with relevant docs in this folder
2. **Review Code**: Check implementation files
3. **Test in Preview**: Use GTM Preview mode for debugging
4. **Contact Team**: Reach out to development team

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained by**: FLYCLIM Development Team
