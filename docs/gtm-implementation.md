# Google Tag Manager Implementation - eAIP Platform

## Overview

The eAIP platform uses **Google Tag Manager (GTM)** for flexible, code-free analytics and tracking management. This implementation includes:

✅ **Google Analytics 4 (GA4)** integration
✅ **Consent Mode v2** for GDPR compliance
✅ **Custom event tracking** for eAIP-specific actions
✅ **Cookie Consent Management Platform (CMP)**
✅ **dataLayer architecture** for scalable tracking

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         eAIP Application (React)            │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   Cookie Consent Banner               │ │
│  │   (User accepts/rejects cookies)      │ │
│  └───────────────┬───────────────────────┘ │
│                  │                         │
│                  ▼                         │
│  ┌───────────────────────────────────────┐ │
│  │   useCookieConsent Hook               │ │
│  │   (Manages consent state)             │ │
│  └───────────────┬───────────────────────┘ │
│                  │                         │
│                  ▼                         │
│  ┌───────────────────────────────────────┐ │
│  │   window.dataLayer                    │ │
│  │   - consent_default (denied)          │ │
│  │   - consent_update (granted/denied)   │ │
│  │   - custom events (document_created)  │ │
│  └───────────────┬───────────────────────┘ │
└──────────────────┼───────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Google Tag Manager Container (GTM)       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   Consent Mode Tags                   │ │
│  │   - Default: All denied               │ │
│  │   - Update: Based on user choice      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   GA4 Configuration Tag               │ │
│  │   (Fires when analytics_storage=granted)│
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   Custom Event Tags                   │ │
│  │   - Document events                   │ │
│  │   - Workflow events                   │ │
│  │   - File events                       │ │
│  └───────────────────────────────────────┘ │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Google Analytics 4 Property          │
│        (Data collection & reporting)        │
└─────────────────────────────────────────────┘
```

---

## Files Structure

```
eAIP/
├── src/
│   ├── components/
│   │   ├── GoogleTagManager.tsx          # GTM integration component
│   │   ├── CookieConsentBanner.tsx       # Cookie consent UI
│   │   └── GoogleAnalytics.tsx           # (Legacy - kept for reference)
│   ├── hooks/
│   │   └── useCookieConsent.ts           # Consent state management
│   ├── lib/
│   │   └── gtmEvents.ts                  # Custom event helpers
│   ├── types/
│   │   └── cookieConsent.ts              # Cookie consent types
│   └── app/
│       ├── layout.tsx                    # GTM component integration
│       └── legal/
│           ├── cookie-preferences/       # Cookie preferences page
│           ├── cookies/                  # Cookie policy
│           └── privacy/                  # Privacy policy
├── docs/
│   ├── gtm-setup-guide.md                # Complete setup guide
│   └── gtm-implementation.md             # This file
└── .env.example                          # Environment variables template
```

---

## Quick Start

### 1. Environment Setup

Add your GTM Container ID to `.env.local`:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### 2. GTM Container Setup

Follow the detailed guide: [`docs/gtm-setup-guide.md`](./gtm-setup-guide.md)

Quick checklist:
- [ ] Create GTM container
- [ ] Set up GA4 Configuration tag
- [ ] Configure Consent Mode
- [ ] Create custom event triggers
- [ ] Test in Preview mode
- [ ] Publish container

### 3. Verify Installation

1. Open your eAIP site
2. Open browser DevTools → Console
3. Type: `window.dataLayer`
4. You should see an array with consent events

---

## Usage Examples

### Tracking Custom Events

Import the helper functions in your components:

```typescript
import { trackDocumentCreated, trackFileUploaded } from '@/lib/gtmEvents';

// When a document is created
const handleDocumentCreate = async (doc) => {
  // ... your document creation logic

  trackDocumentCreated({
    documentId: doc.id,
    documentType: doc.type,
    section: doc.section,
    userId: user.id
  });
};

// When a file is uploaded
const handleFileUpload = async (file) => {
  // ... your file upload logic

  trackFileUploaded({
    fileId: file.id,
    fileName: file.name,
    fileType: file.mimeType,
    fileSize: file.size,
    userId: user.id
  });
};
```

### Setting User Properties

Track user information when they log in:

```typescript
import { setUserProperties } from '@/components/GoogleTagManager';

const handleLogin = async (user) => {
  // ... your login logic

  setUserProperties({
    userId: user.id,
    userRole: user.role,
    organization: user.organization.name,
    organizationType: user.organization.type
  });
};
```

### Available Event Trackers

See [`src/lib/gtmEvents.ts`](../src/lib/gtmEvents.ts) for all available functions:

**User Events:**
- `trackUserLogin()`
- `trackUserLogout()`
- `trackUserRegistration()`

**Document Events:**
- `trackDocumentCreated()`
- `trackDocumentEdited()`
- `trackDocumentPublished()`
- `trackDocumentExported()`
- `trackDocumentDeleted()`

**Workflow Events:**
- `trackWorkflowCreated()`
- `trackWorkflowSubmitted()`
- `trackWorkflowApproved()`
- `trackWorkflowRejected()`
- `trackWorkflowCompleted()`

**File Events:**
- `trackFileUploaded()`
- `trackFileDownloaded()`
- `trackFileVersionCreated()`
- `trackFileVersionRestored()`

**Other Events:**
- `trackSearch()`
- `trackFormSubmission()`
- `trackError()`
- `trackFeatureUsed()`
- `trackConversion()`

---

## Consent Mode Implementation

### How It Works

1. **Default State**: All non-essential cookies denied
2. **User Interaction**: Cookie banner appears on first visit
3. **User Choice**:
   - Accept All → All cookies granted
   - Reject Optional → Only essential cookies
   - Customize → Granular control
4. **Consent Update**: GTM receives consent state
5. **Tag Firing**: Tags fire based on consent requirements

### Consent Categories

| Category | Always Active | Used For |
|----------|---------------|----------|
| **Essential** | ✅ Yes | Authentication, security, core functionality |
| **Functional** | ❌ No | User preferences, UI settings, language |
| **Analytics** | ❌ No | Google Analytics, usage tracking, performance |

### Cookie Policy Compliance

The implementation is compliant with:
- ✅ **GDPR** (EU General Data Protection Regulation)
- ✅ **ePrivacy Directive** (Cookie Law)
- ✅ **CCPA** (California Consumer Privacy Act)
- ✅ **Google Consent Mode v2**

---

## Data Flow

### Consent Default (Page Load)

```javascript
// Automatically pushed on page load
window.dataLayer.push({
  event: 'consent_default',
  consent: {
    'analytics_storage': 'denied',
    'functionality_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  }
});
```

### Consent Update (User Action)

```javascript
// Pushed when user accepts cookies
window.dataLayer.push({
  event: 'consent_update',
  consent: {
    'analytics_storage': 'granted',      // If user accepts
    'functionality_storage': 'granted',  // If user accepts
    'ad_storage': 'denied',              // We don't use ads
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  }
});
```

### Custom Event

```javascript
// Example: Document created
window.dataLayer.push({
  event: 'document_created',
  document_id: '123',
  document_type: 'AIP',
  document_section: 'GEN',
  user_id: 'user456',
  timestamp: '2025-01-11T10:30:00.000Z'
});
```

---

## Debugging

### Chrome DevTools

1. Open DevTools → **Console**
2. Type: `window.dataLayer`
3. Expand array to see all events

### GTM Preview Mode

1. Go to GTM → Click **Preview**
2. Enter your site URL
3. Tag Assistant opens
4. Perform actions and watch tags fire in real-time

### Common Issues

**Issue**: GTM not loading
**Fix**: Check `NEXT_PUBLIC_GTM_ID` is set correctly

**Issue**: Tags not firing
**Fix**: Verify consent is granted in dataLayer

**Issue**: Events not appearing in GA4
**Fix**: Wait 24-48 hours for full processing, check Realtime reports

---

## Performance Considerations

### Script Loading Strategy

GTM is loaded with `strategy="afterInteractive"`:
- Doesn't block page render
- Loads after page is interactive
- Minimal impact on Core Web Vitals

### Consent Mode Benefits

With Consent Mode:
- Tags don't fire until consent granted
- Reduces unnecessary network requests
- Improves page load performance
- Privacy-friendly tracking

### Best Practices

1. **Lazy Load**: Only load GTM after user interaction if possible
2. **Minimize Tags**: Remove unused tags in GTM
3. **Use Built-in Variables**: Instead of custom JavaScript
4. **Monitor Performance**: Check Tag Performance in GTM Admin

---

## Migration from Direct GA4

If you previously used direct GA4 integration:

### What Changed

| Before (GA4) | After (GTM) |
|--------------|-------------|
| `GoogleAnalytics.tsx` | `GoogleTagManager.tsx` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `NEXT_PUBLIC_GTM_ID` |
| Direct gtag.js loading | GTM container loading |
| Code changes for new tracking | GTM UI for new tags |

### Migration Steps

1. ✅ Create GTM container
2. ✅ Set up GA4 tag in GTM (use same Measurement ID)
3. ✅ Update environment variable
4. ✅ Replace component in layout
5. ✅ Test in Preview mode
6. ✅ Publish GTM container

**Note**: The old `GoogleAnalytics.tsx` component is kept for reference but is no longer used.

---

## Advanced Features

### Server-Side Tagging

For enhanced privacy and performance:

1. Set up Google Cloud Run server
2. Configure server-side GTM container
3. Route client-side GTM to server endpoint
4. Process tags server-side

**Benefits**:
- Bypass ad blockers
- Enhanced data security
- Better performance
- More control over data

### Custom Dimensions

Track additional user properties in GA4:

```typescript
// In your GTM event tag, add event parameters:
{
  user_role: {{DLV - user_role}},
  organization: {{DLV - organization}},
  organization_type: {{DLV - organization_type}}
}
```

Then in GA4:
- Admin → Custom Definitions → Create Custom Dimension
- Map to event parameter

### Multi-Domain Tracking

If eAIP spans multiple domains:

```javascript
// In GA4 Configuration tag, add field:
{
  linker: {
    domains: ['eaip.flyclim.com', 'admin.flyclim.com']
  }
}
```

---

## Security & Privacy

### Data Minimization

Only track what's necessary:
- ✅ User actions (document creation, workflow transitions)
- ✅ Feature usage (for product improvements)
- ✅ Performance metrics
- ❌ Personal data (email, names, addresses)
- ❌ Sensitive information

### IP Anonymization

Enabled by default in GA4 Configuration tag:
```javascript
anonymize_ip: true
```

### Data Retention

Configure in GA4:
- Admin → Data Settings → Data Retention
- Recommended: 14 months

### GDPR Compliance

- ✅ Consent before non-essential cookies
- ✅ Clear cookie policy
- ✅ Easy opt-out mechanism
- ✅ Data deletion request process
- ✅ Privacy policy transparency

---

## Support & Resources

### Documentation
- [GTM Setup Guide](./gtm-setup-guide.md)
- [Cookie Consent Implementation](../src/hooks/useCookieConsent.ts)
- [Custom Events Library](../src/lib/gtmEvents.ts)

### External Resources
- [Google Tag Manager Documentation](https://support.google.com/tagmanager)
- [GA4 Documentation](https://support.google.com/analytics)
- [Consent Mode Documentation](https://developers.google.com/tag-platform/security/guides/consent)

### Getting Help
- **GTM Issues**: Check Preview mode first
- **GA4 Issues**: Verify in Realtime reports
- **Implementation Questions**: Review this documentation
- **Bugs**: Report to development team

---

## Changelog

### Version 1.0.0 (January 2025)
- Initial GTM implementation
- Consent Mode v2 integration
- Custom event tracking library
- Cookie Consent Management Platform
- Migration from direct GA4

---

**Maintained by**: FLYCLIM Development Team
**Last Updated**: January 2025
**Platform**: eAIP - Electronic Aeronautical Information Publication
