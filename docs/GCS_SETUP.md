Step-by-Step Google Cloud Storage Setup Procedure

  Phase 1: Google Cloud Console Setup

  Step 1: Create or Select a Google Cloud Project
  1. Go to https://console.cloud.google.com/
  2. Sign in with your Google account
  3. Click the project dropdown at the top of the page
  4. Click "New Project"
  5. Enter project name (e.g., "eaip-storage")
  6. Select your billing account (or create one if needed)
  7. Click "Create"
  8. Wait for the project to be created and select it

  Step 2: Enable Cloud Storage API
  1. In the Google Cloud Console, go to "APIs & Services" > "Library"
  2. Search for "Cloud Storage API"
  3. Click on "Cloud Storage API"
  4. Click "Enable" button
  5. Wait for the API to be enabled (takes a few seconds)

  Step 3: Create a Storage Bucket
  1. Go to "Cloud Storage" > "Buckets" from the left menu
  2. Click "Create Bucket"
  3. Configure bucket settings:
    - Name: Choose a globally unique name (e.g., "eaip-documents-production")
    - Location type: Choose based on your needs:
        - "Region" for lowest latency (e.g., asia-southeast1 for Malaysia)
      - "Multi-region" for higher availability
    - Storage class: Choose "Standard" (best for frequently accessed data)
    - Access control: Select "Uniform" (recommended)
    - Protection tools:
        - Enable "Object versioning" if you want version history
      - Optional: Enable "Retention policy" for compliance
  4. Click "Create"
  5. Note down your bucket name for later use

  Step 4: Create a Service Account
  1. Go to "IAM & Admin" > "Service Accounts"
  2. Click "Create Service Account"
  3. Enter service account details:
    - Name: "eaip-storage-service"
    - Description: "Service account for eAIP file storage"
  4. Click "Create and Continue"
  5. Grant permissions:
    - Add role: "Storage Object Admin" (full control over objects)
    - Add role: "Storage Object Creator" (can create objects)
    - Add role: "Storage Object Viewer" (can view objects)
  6. Click "Continue"
  7. Click "Done"

  Step 5: Create and Download Service Account Key
  1. In the Service Accounts list, find the account you just created
  2. Click on the service account email
  3. Go to the "Keys" tab
  4. Click "Add Key" > "Create new key"
  5. Select "JSON" format
  6. Click "Create"
  7. A JSON file will download automatically - save this securely!
  8. The file contains sensitive credentials - never commit it to version control

  Step 6: Configure Bucket Permissions (Optional but Recommended)
  1. Go back to "Cloud Storage" > "Buckets"
  2. Click on your bucket name
  3. Go to the "Permissions" tab
  4. Click "Grant Access"
  5. Add your service account email (from Step 4)
  6. Assign role: "Storage Object Admin"
  7. Click "Save"

  Step 7: Set CORS Configuration (If needed for browser uploads)
  1. Click on your bucket name
  2. Go to "Configuration" tab
  3. Click "Edit" under CORS
  4. Add this configuration:
  [
    {
      "origin": ["https://eaip.flyclim.com", "http://localhost:3000"],
      "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
      "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
      "maxAgeSeconds": 3600
    }
  ]
  5. Click "Save"

  ---
  Phase 2: Application Configuration

  Step 8: Prepare Your Environment Variables

  Option A: Using JSON Credentials (Recommended for Production)
  1. Open the downloaded JSON key file
  2. Copy the entire JSON content
  3. Convert it to a single line (remove all line breaks)
  4. Open your .env file
  5. Add these variables:
  # Google Cloud Storage Configuration
  GCS_PROJECT_ID=your-project-id-here
  GCS_BUCKET_NAME=your-bucket-name-here
  GCS_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project","private_key_id":"...","priv
  ate_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE 
  KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x50
  9_cert_url":"...","client_x509_cert_url":"..."}'

  Option B: Using Key File Path (Recommended for Local Development)
  1. Move the downloaded JSON key file to a secure location (e.g.,
  /Users/davideraro/eAIP/config/gcs-key.json)
  2. Make sure this path is in your .gitignore
  3. Add these variables to your .env:
  # Google Cloud Storage Configuration
  GCS_PROJECT_ID=your-project-id-here
  GCS_BUCKET_NAME=your-bucket-name-here
  GCS_KEY_FILE=/Users/davideraro/eAIP/config/gcs-key.json

  Step 9: Update .gitignore
  1. Open .gitignore file
  2. Add these lines if not already present:
  # Google Cloud Storage credentials
  config/gcs-key.json
  *.json
  !package.json
  !package-lock.json
  !tsconfig.json

  Step 10: Extract Values from JSON Key
  Open your downloaded JSON key file and extract:
  - project_id - Use this for GCS_PROJECT_ID
  - The bucket name you created in Step 3 - Use for GCS_BUCKET_NAME

  Example .env configuration:
  # MongoDB Atlas Configuration
  MONGODB_URI=mongodb+srv://davide:!!!Sasha2015!!!Eliana2019!!!@flyclimweb.qj1barl.mongodb.net/eaip?retryW
  rites=true&w=majority&appName=flyclimWeb

  # NextAuth Configuration
  NEXTAUTH_URL=https://eaip.flyclim.com
  NEXTAUTH_SECRET=eAIP_salt_2025

  # AI Provider Configuration
  ANTHROPIC_API_KEY=sk-ant-api03-88axSYiqO1nYe4eGTcFzOiiYaKLz28_wUPkGzYmXmapEnct4yb5gaJ5AosXHxrmddhDjjVmd9
  _Yp1CVCeGqowQ-1XH96AAA
  OPENAI_API_KEY="sk-proj-f0NFLaxrme5Y4M3p1RVpmA_penKtM6c7jp8QqGFkUZezXkdf7R1mwDxEL-264ngs5w6iAH5pO0T3Blbk
  FJTB53ng-1CNehAbuUEQd6vOR9rO6kMZTtABlYtsWiyRaZGx5uJUVfDnFioxn_0UuQ4hlgfFhdAA"

  # n8n Webhook Configuration
  N8N_WEBHOOK_URL=https://n8n.srv1050461.hstgr.cloud/webhook/eaip
  N8N_EMAIL_TEST_WEBHOOK=https://n8n.srv1050461.hstgr.cloud/webhook/email-password
  N8N_EMAIL_WEBHOOK=https://n8n.srv1050461.hstgr.cloud/webhook/email-password
  N8N_EMAIL_TEST_MODE=false

  # Domain Configuration
  EAIP_TARGET_IP=72.60.213.232

  # Git Storage
  GIT_STORAGE_PATH=./git-repos

  # Google Cloud Storage Configuration
  GCS_PROJECT_ID=eaip-storage-123456
  GCS_BUCKET_NAME=eaip-documents-production
  GCS_KEY_FILE=/Users/davideraro/eAIP/config/gcs-key.json

  # Node Environment
  NODE_ENV=production

  ---
  Phase 3: Testing and Verification

  Step 11: Test the Connection
  1. Restart your development server (npm run dev)
  2. Check the console for any GCS-related errors
  3. Log in to your eAIP application
  4. Navigate to the DMS page (http://localhost:3000/dms)
  5. Try uploading a test file

  Step 12: Verify File Upload
  1. Go back to Google Cloud Console > Cloud Storage > Buckets
  2. Click on your bucket name
  3. Navigate through the folder structure: organizations/{orgId}/folders/{folderId}/ or
  organizations/{orgId}/root/
  4. You should see your uploaded file with a timestamped name

  Step 13: Test File Download
  1. In the eAIP application, try downloading the uploaded file
  2. Verify it downloads correctly
  3. Check the browser's network tab to see the signed URL being generated

  Step 14: Test File Operations
  1. Test drag-and-drop to move files between folders
  2. Test file deletion (if implemented)
  3. Verify all operations work correctly

  ---
  Phase 4: Production Deployment

  Step 15: Production Environment Setup
  1. For production, create a separate bucket (e.g., "eaip-documents-production")
  2. Create a separate service account for production
  3. Use the JSON credentials method for production deployment
  4. Set environment variables on your production server

  Step 16: Security Best Practices
  1. Never commit service account keys to version control
  2. Use different buckets for development, staging, and production
  3. Enable object versioning for production buckets
  4. Set up bucket lifecycle policies to manage old files
  5. Enable audit logging for compliance
  6. Consider setting up VPC Service Controls for additional security

  Step 17: Set Up Lifecycle Rules (Optional)
  1. Go to your bucket in Google Cloud Console
  2. Click on "Lifecycle" tab
  3. Click "Add a rule"
  4. Example rules:
    - Delete objects older than 365 days
    - Move objects to Nearline storage after 90 days
    - Delete incomplete multipart uploads after 7 days

  Step 18: Set Up Monitoring (Optional)
  1. Go to "Operations" > "Monitoring" in Google Cloud Console
  2. Create alerts for:
    - Storage quota usage
    - Request rates
    - Error rates
  3. Set up email notifications

  ---
  Phase 5: Backup and Recovery

  Step 19: Set Up Bucket Versioning
  1. Go to your bucket in Google Cloud Console
  2. Click on "Protection" tab
  3. Enable "Object versioning"
  4. This allows you to recover previous versions of files

  Step 20: Document Your Setup
  Create a document with:
  - Bucket names for each environment
  - Service account emails
  - Location of credentials
  - Recovery procedures
  - Access procedures for team members

  ---
  Common Issues and Solutions

  Issue 1: "Permission Denied" Errors
  - Solution: Verify service account has "Storage Object Admin" role
  - Check that the bucket name in .env matches exactly

  Issue 2: "Bucket Not Found" Errors
  - Solution: Verify GCS_BUCKET_NAME is correct
  - Ensure the bucket exists and is in the correct project

  Issue 3: "Invalid Credentials" Errors
  - Solution: Verify JSON key file is valid and not corrupted
  - Check that GCS_PROJECT_ID matches the project in your credentials
  - Ensure there are no extra spaces or line breaks in GCS_CREDENTIALS_JSON

  Issue 4: CORS Errors in Browser
  - Solution: Configure CORS settings in bucket (Step 7)
  - Add your application domain to allowed origins

  Issue 5: Signed URL Expired
  - Solution: This is normal - signed URLs expire after 1 hour
  - The application automatically refreshes URLs via /api/dms/files/[id]/url

  ---
  Cost Considerations

  Estimated Costs (as of 2024):
  - Storage: ~$0.020 per GB/month (Standard storage in Asia)
  - Operations:
    - Class A (writes): $0.05 per 10,000 operations
    - Class B (reads): $0.004 per 10,000 operations
  - Network:
    - Egress to internet: $0.12 per GB (first 1 GB free)
    - Within same region: Free

  Example monthly cost for 100 GB storage with 10,000 downloads:
  - Storage: 100 GB × $0.020 = $2.00
  - Downloads (reads): 10,000 × $0.004/10,000 = $0.004
  - Egress: 100 GB × $0.12 = $12.00 (if downloading full files)
  - Total: ~$14/month

  ---
  Quick Reference Checklist

  - Create Google Cloud Project
  - Enable Cloud Storage API
  - Create Storage Bucket
  - Create Service Account
  - Download JSON Key
  - Configure .env variables
  - Add credentials to .gitignore
  - Test file upload
  - Test file download
  - Verify files in bucket
  - Set up production bucket
  - Configure CORS (if needed)
  - Enable versioning
  - Set up monitoring
  - Document configuration

  This setup will provide you with a secure, scalable, and cost-effective file storage solution for your
  eAIP application!