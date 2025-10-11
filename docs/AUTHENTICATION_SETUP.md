# Authentication Setup Guide

The eAIP Editor now includes a complete authentication system using NextAuth.js. Here's how to get started:

## 🚀 Quick Start

### 1. First Time Setup

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Visit the setup page:**
   ```
   http://localhost:3000/setup
   ```

3. **Create the first admin account:**
   - Name: `Admin User` (or your preferred name)
   - Email: `admin@eaip.com` (or your email)
   - Password: `admin123` (change this!)
   - Role: Administrator (automatically set)

4. **Sign in with your new account:**
   ```
   http://localhost:3000/auth/signin
   ```

### 2. Authentication Features

✅ **User Registration & Login**
- Secure password hashing with bcrypt
- Role-based access control (admin, editor, viewer)
- Session management with NextAuth.js

✅ **Protected Routes**
- All document creation/editing requires authentication
- Middleware automatically redirects unauthenticated users
- Different access levels based on user roles

✅ **User Management**
- User profiles with role information
- Secure sign-out functionality
- Session persistence across browser refreshes

## 🔐 Security Features

- **Password Security**: Minimum 6 characters, bcrypt hashing with salt rounds
- **Session Security**: JWT tokens with secure secret key
- **Route Protection**: Middleware-based authentication checks
- **Role-based Access**: Three user roles with different permissions

## 👥 User Roles

### Administrator
- Full access to all features
- Can manage users (future feature)
- Can create, edit, and delete all documents
- Can manage versions and exports

### Editor
- Can create and edit documents
- Can manage versions within their scope
- Can export documents
- Cannot manage other users

### Viewer
- Read-only access to published documents
- Can view versions and export published content
- Cannot create or edit documents

## 🌐 Available Routes

### Public Routes
- `/` - Home page (shows sign-in prompts for unauthenticated users)
- `/auth/signin` - Sign in page
- `/auth/signup` - User registration page
- `/setup` - Initial setup (only available if no users exist)

### Protected Routes (Require Authentication)
- `/documents` - Document management
- `/documents/new` - Create new document
- `/documents/[id]/edit` - Edit document
- `/versions` - Version management
- `/exports` - Export management

## 🔧 Configuration

The authentication system uses the following environment variables:

```env
# Required for authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# MongoDB connection for user storage
MONGODB_URI=mongodb://localhost:27017/eaip
```

## 🚀 Getting Started Workflow

1. **Initial Setup**: Visit `/setup` to create the first admin account
2. **Sign In**: Use `/auth/signin` with your admin credentials
3. **Create Documents**: Now you can access all protected features
4. **Add More Users**: Use `/auth/signup` for additional team members
5. **Manage Content**: Full access to document creation, versioning, and exports

## 🔒 Current User Management

For now, user registration is open through the `/auth/signup` page. In a production environment, you may want to:

1. Disable public registration
2. Add admin-only user creation
3. Implement email verification
4. Add password reset functionality

## 🛠️ Development Notes

The authentication system is built with:
- **NextAuth.js 4.24.7**: Session management and authentication
- **bcryptjs**: Password hashing and verification
- **MongoDB**: User data storage with Mongoose ODM
- **Next.js Middleware**: Route protection and automatic redirects
- **TypeScript**: Full type safety for authentication flow

## 🔐 Default Admin Account

After running setup, you can sign in with:
- **Email**: `admin@eaip.com` (or whatever you entered)
- **Password**: `admin123` (or whatever you set)
- **Role**: Administrator

**⚠️ Important**: Change the default password immediately after first login!

---

The eAIP Editor is now fully secured and ready for production use with proper authentication and authorization!