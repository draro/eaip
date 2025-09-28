# eAIP Editor

A modern, full-featured Electronic Aeronautical Information Publication (eAIP) editor built with Next.js 14, MongoDB, and TipTap. This application is compliant with EUROCONTROL Specification 3.0 and provides comprehensive document management, versioning, and export capabilities.

## 🚀 Features

### Rich Text Editing
- **TipTap Editor**: Advanced rich text editor with support for:
  - Headings (H1, H2, H3)
  - Bold, italic, and other text formatting
  - Bullet and ordered lists
  - Tables with full editing capabilities
  - Drag-and-drop image uploads
  - Auto-numbering for sections/subsections

### Document Management
- **CRUD Operations**: Full create, read, update, delete functionality
- **Section Organization**: Support for GEN, ENR, and AD sections
- **Status Tracking**: Draft, review, and published states
- **Auto-numbering**: Automatic section numbering (GEN 1.1, ENR 1.2, etc.)

### Version Control & AIRAC Cycles
- **AIRAC Management**: Automated AIRAC cycle generation and tracking
- **Version Control**: Document versioning tied to AIRAC cycles
- **Effective Dates**: Proper date management for aviation compliance

### Export Functionality
- **Multiple Formats**: Export to DOCX, PDF, XML, and HTML
- **Image Preservation**: Images and tables preserved in all export formats
- **EUROCONTROL Compliance**: XML/HTML exports follow Spec 3.0 standards
- **Batch Export**: Export multiple documents at once

### n8n Integration
- **Outgoing Webhooks**: Document updates, exports, and publications
- **Incoming Webhooks**: Import content and trigger publications
- **Workflow Automation**: Automated notifications and static site generation

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **Editor**: TipTap with extensions for tables, images, and lists
- **Backend**: Next.js API Routes, MongoDB with Mongoose ODM
- **File Storage**: Local storage with S3 support ready
- **Export Libraries**: docx, pdfmake for document generation
- **Workflow Integration**: n8n webhooks for automation

## 📁 Project Structure

```
eAIP/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── api/                      # API routes
│   │   │   ├── documents/            # Document CRUD
│   │   │   ├── versions/             # Version management
│   │   │   ├── export/               # Export functionality
│   │   │   ├── upload/               # Image uploads
│   │   │   ├── airac/                # AIRAC cycle management
│   │   │   └── webhooks/n8n/         # n8n integrations
│   │   ├── documents/                # Document pages
│   │   ├── versions/                 # Version pages
│   │   ├── exports/                  # Export pages
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── editor/                   # TipTap editor
│   │   └── ImageManager.tsx          # Image management
│   ├── lib/                          # Utilities and services
│   │   ├── exporters/                # Export functionality
│   │   ├── mongodb.ts                # Database connection
│   │   ├── imageUpload.ts            # Image handling
│   │   ├── utils.ts                  # Utility functions
│   │   └── webhooks.ts               # Webhook service
│   ├── models/                       # MongoDB schemas
│   │   ├── User.ts
│   │   ├── AIPDocument.ts
│   │   ├── AIPVersion.ts
│   │   └── ExportJob.ts
│   └── types/                        # TypeScript definitions
│       └── index.ts
├── public/
│   ├── uploads/                      # Image uploads
│   └── exports/                      # Generated exports
├── n8n-examples.json                 # n8n workflow examples
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd eAIP
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/eaip
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
N8N_WEBHOOK_URL=http://localhost:5678/webhook/eaip
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=eaip-uploads
```

### 3. Database Setup

Start MongoDB and create initial data:

```bash
# Start MongoDB (if local)
mongod

# The application will automatically create indexes on first run
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`.

## 🔄 n8n Integration

### Outgoing Webhooks

The application sends webhooks to n8n for these events:

1. **Document Updates**: `document.updated`, `document.created`, `document.deleted`
2. **Version Publishing**: `version.published`
3. **Export Completion**: `export.completed`

### Incoming Webhooks

n8n can trigger these endpoints:

1. **Import Content**: `POST /api/webhooks/n8n/import`
2. **Trigger Publication**: `POST /api/webhooks/n8n/publish`

### Example n8n Workflows

See `n8n-examples.json` for complete workflow configurations including:
- Document update notifications to Slack
- Export completion email notifications
- Static site generation on publication
- Stakeholder notifications

## 📤 Export Formats

### DOCX Export
- Preserves all formatting, images, and tables
- Includes headers and footers with version information
- Compatible with Microsoft Word

### PDF Export
- Professional layout with proper typography
- Embedded images and styled tables
- Page numbering and metadata

### XML Export (EUROCONTROL Spec 3.0)
- Compliant with aviation standards
- Structured data format for systems integration
- Includes all metadata and content structure

### HTML Export
- Web-ready format with embedded CSS
- Responsive design for all devices
- Maintains all visual formatting

## 🗄️ Database Schema

### AIPDocument
- Document content in TipTap JSON format
- Section/subsection organization
- Version relationships
- Status tracking
- Image metadata

### AIPVersion
- AIRAC cycle management
- Version numbering
- Effective dates
- Document collections

### ExportJob
- Async export processing
- Download URL generation
- Status tracking
- Expiration management

### User
- Role-based access (admin, editor, viewer)
- Audit trail for document changes

## 🚦 API Endpoints

### Documents
- `GET /api/documents` - List documents with filtering
- `POST /api/documents` - Create new document
- `GET /api/documents/[id]` - Get document details
- `PUT /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document

### Versions
- `GET /api/versions` - List versions
- `POST /api/versions` - Create new version
- `GET /api/versions/[id]` - Get version details
- `PUT /api/versions/[id]` - Update version

### Export
- `POST /api/export` - Create export job
- Support for single or multiple documents
- Async processing with download URLs

### Upload
- `POST /api/upload` - Upload images
- Validation and file size limits
- Automatic metadata extraction

### AIRAC
- `GET /api/airac/generate` - Generate AIRAC cycles
- `POST /api/airac/generate` - Validate AIRAC format

## 🔒 Security Features

- Input validation on all endpoints
- File type and size restrictions for uploads
- MongoDB injection protection
- CORS configuration
- Environment variable protection

## 🎨 UI Components

Built with shadcn/ui for consistent, accessible design:
- Form controls with validation
- Modal dialogs for complex interactions
- Data tables with sorting and filtering
- Toast notifications for user feedback
- Responsive layout for all screen sizes

## 📝 Usage Examples

### Creating a Document
1. Navigate to Documents → New Document
2. Select section (GEN/ENR/AD) and subsection
3. Enter title and select AIRAC version
4. Use the rich text editor with full formatting
5. Add images via drag-and-drop or upload
6. Insert and edit tables as needed
7. Save and export in multiple formats

### Managing Versions
1. Create AIRAC cycles automatically
2. Associate documents with specific versions
3. Track effective dates and status
4. Publish versions to trigger workflows

### Export Workflow
1. Select documents for export
2. Choose format (DOCX, PDF, XML, HTML)
3. Download generated files
4. Files expire after 24 hours

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript and ESLint configurations
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Review the API documentation in the code
- Check n8n-examples.json for integration patterns
- Refer to EUROCONTROL Spec 3.0 for compliance requirements

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
- Set up MongoDB Atlas or dedicated instance
- Configure S3 bucket for image storage
- Set up n8n instance for workflow automation
- Configure proper CORS and security headers

---

Built with ❤️ for the aviation community. EUROCONTROL Specification 3.0 compliant.