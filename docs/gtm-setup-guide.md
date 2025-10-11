# Google Tag Manager (GTM) Setup Guide for eAIP Platform

This guide will help you set up Google Tag Manager for the eAIP platform with Google Analytics 4 (GA4) integration, consent mode v2, and custom event tracking.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create GTM Container](#step-1-create-gtm-container)
3. [Step 2: Configure Environment Variable](#step-2-configure-environment-variable)
4. [Step 3: Set Up Google Analytics 4 in GTM](#step-3-set-up-google-analytics-4-in-gtm)
5. [Step 4: Configure Consent Mode](#step-4-configure-consent-mode)
6. [Step 5: Set Up Custom Event Triggers](#step-5-set-up-custom-event-triggers)
7. [Step 6: Testing & Debugging](#step-6-testing--debugging)
8. [Step 7: Publish Your Container](#step-7-publish-your-container)
9. [Custom Events Reference](#custom-events-reference)
10. [Best Practices](#best-practices)

---

## Prerequisites

- Google account with access to [Google Tag Manager](https://tagmanager.google.com/)
- Google Analytics 4 property (create one at [analytics.google.com](https://analytics.google.com/))
- Admin access to your eAIP deployment

---

## Step 1: Create GTM Container

### 1.1 Create New Container

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Click **Create Account** (or use existing account)
3. Fill in:
   - **Account Name**: Your organization name
   - **Country**: Your country
   - **Container Name**: `eAIP Platform` (or your domain)
   - **Target platform**: **Web**
4. Click **Create**
5. Accept the Terms of Service

### 1.2 Get Your GTM Container ID

- Your container ID will look like: `GTM-XXXXXXX`
- You'll see it in the top-right corner of your GTM workspace
- **Save this ID** - you'll need it in Step 2

---

## Step 2: Configure Environment Variable

Add your GTM Container ID to your environment variables:

### For Local Development

Edit `.env.local`:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### For Production

Set the environment variable in your hosting platform:

**Vercel:**
```bash
vercel env add NEXT_PUBLIC_GTM_ID
# Enter: GTM-XXXXXXX
```

**Docker:**
```yaml
environment:
  - NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

**Other platforms:** Add `NEXT_PUBLIC_GTM_ID` to your environment configuration.

---

## Step 3: Set Up Google Analytics 4 in GTM

### 3.1 Get Your GA4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (bottom left)
3. Select your property
4. Under **Property**, click **Data Streams**
5. Select your web stream (or create one)
6. Copy your **Measurement ID** (looks like `G-XXXXXXXXXX`)

### 3.2 Create GA4 Configuration Tag

1. In GTM, go to **Tags** → **New**
2. Click **Tag Configuration**
3. Select **Google Analytics: GA4 Configuration**
4. Enter your **Measurement ID** (`G-XXXXXXXXXX`)
5. Under **Fields to Set**, add:
   - **Field Name**: `anonymize_ip`
   - **Value**: `true`
6. Name the tag: `GA4 - Configuration`

### 3.3 Set Up Consent Settings

In the GA4 Configuration tag:

1. Click **Advanced Settings**
2. Under **Consent Settings**, select:
   - **Require additional consent for tag to fire**: Enable
   - **Analytics Storage**: Required
3. Click **Save**

### 3.4 Set Up Trigger

1. Under **Triggering**, click the trigger box
2. Select **Consent Initialization - All Pages**
   - If this trigger doesn't exist, create it:
     - Go to **Triggers** → **New**
     - Choose **Consent Initialization**
     - Name: `Consent Initialization - All Pages`
     - Save
3. Save the GA4 Configuration tag

---

## Step 4: Configure Consent Mode

The eAIP platform has consent mode built-in. You need to set up GTM to respect these consent signals.

### 4.1 Create Consent Default Tag

1. Go to **Tags** → **New**
2. Click **Tag Configuration**
3. Select **Custom HTML**
4. Add this code:

```html
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'functionality_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500
});
</script>
```

5. Name: `Consent - Default (Denied)`
6. Under **Triggering**, select **Consent Initialization - All Pages**
7. Under **Advanced Settings** → **Tag firing priority**, set to `100` (highest priority)
8. Save

### 4.2 Create Consent Update Trigger

The eAIP platform pushes consent updates automatically via the `consent_update` event.

1. Go to **Triggers** → **New**
2. Choose **Custom Event**
3. Event name: `consent_update`
4. Name: `Consent Update`
5. Save

### 4.3 Create Consent Update Tag

1. Go to **Tags** → **New**
2. Click **Tag Configuration**
3. Select **Custom HTML**
4. Add this code:

```html
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'update', {{Consent Object}});
</script>
```

5. Name: `Consent - Update`
6. Under **Triggering**, select the **Consent Update** trigger
7. Save

### 4.4 Create Consent Object Variable

1. Go to **Variables** → **User-Defined Variables** → **New**
2. Choose **Data Layer Variable**
3. Data Layer Variable Name: `consent`
4. Name: `Consent Object`
5. Save

---

## Step 5: Set Up Custom Event Triggers

The eAIP platform sends custom events for tracking user actions. Here's how to set them up:

### 5.1 Common Triggers

Create these triggers for tracking key events:

#### Document Created
1. **Triggers** → **New** → **Custom Event**
2. Event name: `document_created`
3. Name: `Event - Document Created`

#### Document Published
1. **Triggers** → **New** → **Custom Event**
2. Event name: `document_published`
3. Name: `Event - Document Published`

#### Workflow Submitted
1. **Triggers** → **New** → **Custom Event**
2. Event name: `workflow_submitted`
3. Name: `Event - Workflow Submitted`

#### File Uploaded
1. **Triggers** → **New** → **Custom Event**
2. Event name: `file_uploaded`
3. Name: `Event - File Uploaded`

### 5.2 Create GA4 Event Tags

For each event above, create a GA4 Event tag:

1. **Tags** → **New** → **Google Analytics: GA4 Event**
2. **Configuration Tag**: Select your GA4 Configuration tag
3. **Event Name**: Use the same name (e.g., `document_created`)
4. **Event Parameters**: Add relevant parameters
   - For `document_created`:
     - `document_id` → `{{DLV - document_id}}`
     - `document_type` → `{{DLV - document_type}}`
     - `user_id` → `{{DLV - user_id}}`
5. **Trigger**: Select the corresponding trigger
6. Name: `GA4 Event - Document Created`
7. Save

### 5.3 Create Data Layer Variables

For each parameter you want to track:

1. **Variables** → **User-Defined Variables** → **New**
2. Choose **Data Layer Variable**
3. Data Layer Variable Name: e.g., `document_id`
4. Name: `DLV - document_id`
5. Save

Repeat for:
- `document_type`
- `document_section`
- `user_id`
- `user_role`
- `organization`
- `workflow_id`
- `workflow_name`
- `file_id`
- `file_name`
- `file_type`

---

## Step 6: Testing & Debugging

### 6.1 Enable Preview Mode

1. In GTM, click **Preview** (top right)
2. Enter your website URL
3. Click **Connect**
4. A new window opens with Tag Assistant

### 6.2 Test Consent Mode

1. Visit your site in preview mode
2. You should see the cookie consent banner
3. Check Tag Assistant:
   - **Consent Default** tag should fire first
   - **GA4 Configuration** should be blocked until consent
4. Accept cookies
5. **Consent Update** tag should fire
6. **GA4 Configuration** should now fire

### 6.3 Test Custom Events

1. Perform actions in your app (create document, upload file, etc.)
2. Check Tag Assistant for corresponding events
3. Verify event parameters are captured correctly

### 6.4 Verify in Google Analytics

1. Go to Google Analytics → **Reports** → **Realtime**
2. Perform actions in your app
3. Events should appear in realtime within ~10 seconds

---

## Step 7: Publish Your Container

Once you've tested everything:

1. Click **Submit** (top right)
2. Add **Version Name**: e.g., "Initial GA4 Setup with Consent Mode"
3. Add **Version Description**: Describe what you configured
4. Click **Publish**

Your GTM container is now live!

---

## Custom Events Reference

The eAIP platform tracks these custom events automatically:

### User Events
- `user_login` - User logs in
- `user_logout` - User logs out
- `user_registration` - New user registers

### Document Events
- `document_created` - New document created
- `document_edited` - Document edited
- `document_published` - Document published
- `document_exported` - Document exported (PDF, DOCX, etc.)
- `document_deleted` - Document deleted

### NOTAM Events
- `notam_created` - New NOTAM created
- `notam_published` - NOTAM published

### Workflow Events
- `workflow_created` - New workflow created
- `workflow_submitted` - Item submitted to workflow
- `workflow_approved` - Workflow step approved
- `workflow_rejected` - Workflow step rejected
- `workflow_completed` - Workflow completed

### DMS (File) Events
- `file_uploaded` - File uploaded
- `file_downloaded` - File downloaded
- `file_version_created` - New file version created
- `file_version_restored` - File version restored

### Other Events
- `compliance_check_run` - Compliance check performed
- `search` - User performs search
- `form_submission` - Form submitted (contact, demo, etc.)
- `app_error` - Application error occurred
- `feature_used` - Feature usage tracked
- `conversion` - Conversion event (demo booked, trial started, etc.)

**Full event documentation**: See `/src/lib/gtmEvents.ts` for all parameters.

---

## Best Practices

### 1. Tag Organization

Use naming conventions:
- **Tags**: `GA4 Event - [Event Name]`
- **Triggers**: `Event - [Event Name]`
- **Variables**: `DLV - [Variable Name]`

### 2. Use Folders

Organize tags in folders:
- **Analytics**
- **Consent Management**
- **Custom Events**
- **Conversions**

### 3. Document Changes

Always add version descriptions when publishing changes.

### 4. Test Before Publishing

Use Preview mode extensively. Never publish untested changes.

### 5. Monitor Tag Performance

In GTM, go to **Admin** → **Container Settings** → **Tag Performance**
Check for:
- Slow tags
- Tag firing errors
- Consent blocking

### 6. Set Up Alerts

In Google Analytics:
1. Go to **Admin** → **Custom Alerts**
2. Create alerts for:
   - Sudden traffic drops
   - Error spikes
   - Conversion drops

### 7. Regular Audits

Monthly:
- Review unused tags/triggers/variables
- Check for broken tags
- Update variable mappings if data structure changes

---

## Troubleshooting

### Tags Not Firing

1. Check Preview mode - does tag fire there?
2. Verify trigger conditions
3. Check consent requirements
4. Look for JavaScript errors in browser console

### Events Not Appearing in GA4

1. Verify GA4 Measurement ID is correct
2. Check Tag Assistant - are events being sent?
3. Wait 24-48 hours for full processing (Realtime should be instant)
4. Check GA4 → **Admin** → **Data Streams** → **Enhanced Measurement** settings

### Consent Mode Issues

1. Check browser console for consent-related errors
2. Verify Cookie Consent banner is appearing
3. Test in incognito mode
4. Check localStorage: `eaip_cookie_consent`

---

## Advanced Configuration

### Multi-Domain Tracking

If your eAIP platform spans multiple domains:

1. In GA4 Configuration tag, add:
   - Field: `linker`
   - Value: `{"domains":["domain1.com","domain2.com"]}`

### Server-Side Tagging

For enhanced privacy and performance:

1. Set up Google Cloud Run server
2. Configure server-side GTM container
3. Update client-side GTM to send to server endpoint

### Custom Dimensions

Track additional user properties:

1. GA4 → **Admin** → **Custom Definitions** → **Custom Dimensions**
2. Create dimensions for:
   - `user_role`
   - `organization`
   - `organization_type`
3. Update GA4 Event tags to send these as event parameters

---

## Support

For issues or questions:
- **GTM Documentation**: [support.google.com/tagmanager](https://support.google.com/tagmanager)
- **GA4 Documentation**: [support.google.com/analytics](https://support.google.com/analytics)
- **eAIP Support**: Contact your system administrator

---

## Appendix: Quick Setup Checklist

- [ ] Create GTM container
- [ ] Add `NEXT_PUBLIC_GTM_ID` to environment variables
- [ ] Create GA4 property and get Measurement ID
- [ ] Set up GA4 Configuration tag in GTM
- [ ] Configure Consent Mode (default and update)
- [ ] Create custom event triggers
- [ ] Create GA4 event tags for key events
- [ ] Create data layer variables
- [ ] Test in Preview mode
- [ ] Verify events in GA4 Realtime
- [ ] Publish container
- [ ] Monitor for 24-48 hours

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Platform**: eAIP by FLYCLIM
