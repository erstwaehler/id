# EWF-ID Specification

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technical Architecture](#technical-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [User Management](#user-management)
6. [Plugin Implementation](#plugin-implementation)
7. [API Specifications](#api-specifications)
8. [Frontend Implementation](#frontend-implementation)
9. [Data Privacy & Compliance](#data-privacy--compliance)
10. [Monitoring & Observability](#monitoring--observability)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Security Requirements](#security-requirements)
13. [Development Workflow](#development-workflow)
14. [Appendices](#appendices)

---

## 1. Executive Summary

**EWF-ID** is a centralized OpenID Connect (OIDC) provider designed specifically for the Erstwähler Forum (EWF) initiative in Stade, Germany. It serves as the single source of truth for authentication and authorization across all EWF applications.

### Key Objectives

- Provide secure, school-based authentication for students and staff
- Centralize identity management across multiple EWF applications
- Ensure GDPR compliance and data protection
- Offer multilingual support (German, English, Ukrainian)
- Implement comprehensive audit logging and monitoring

### Target Users

- **Students** from three partner schools (Athenaeum, VLG, IGS)
- **Teachers** and school staff
- **Team Members** (EWF organizers and volunteers)
- **Administrators** (system operators)

---

## 2. Project Overview

### 2.1 Purpose

EWF-ID functions as a Keycloak-like identity provider, offering:

- Single Sign-On (SSO) across all EWF applications
- Centralized user management
- Role-based access control (RBAC)
- OAuth 2.0 / OIDC compliant authorization
- Comprehensive administrative interface

### 2.2 Core Principles

1. **Security First**: All authentication flows must be secure by default
2. **Privacy by Design**: GDPR compliance built into every feature
3. **User Experience**: Intuitive interfaces for all user types
4. **Transparency**: Clear communication about data usage and rights
5. **Reliability**: 99.9% uptime target with comprehensive monitoring

### 2.3 Scope

**In Scope:**
- User authentication (Email/Password, OIDC, Passkeys)
- User registration via school OIDC providers
- Admin dashboard for user management
- OIDC provider functionality for downstream apps
- Multi-factor authentication (2FA)
- API key management
- Comprehensive audit logging
- GDPR compliance pages and workflows

**Out of Scope:**
- Direct integration with school systems (beyond OIDC)
- Event management functionality (handled by schedule.ewf-stade.de)
- Content management
- Payment processing

---

## 3. Technical Architecture

### 3.1 Technology Stack

#### Runtime & Framework
- **Framework**: TanStack Start (React-based)
- **Runtime**: Node.js on Vercel (Nitro/Custom Fluid Compute)
- **Language**: TypeScript (strict mode enabled)
- **Build Tool**: Vite

#### Core Libraries
- **Authentication**: Better Auth v1.x (latest)
- **Database ORM**: Drizzle ORM
- **Effect System**: Effect.ts (for error handling and functional programming)
- **Routing**: TanStack Router
- **State Management**: TanStack Query
- **Validation**: Zod

#### UI & Styling
- **Component Library**: Shadcn/UI (React)
- **Styling**: Tailwind CSS v4
- **Animations**: Motion library (Framer Motion)
- **Icons**: Lucide React
- **Theme**: Dark/Light mode support

#### Internationalization
- **i18n Framework**: Paraglide JS (Inlang)
- **Supported Languages**: German (de), English (en), Ukrainian (uk)
- **Implementation**: German and English initially

### 3.2 Infrastructure & Services

#### Database
- **Provider**: Neon.tech (Serverless Postgres)
- **Regions**: Frankfurt (primary)
- **Connection**: Pooled connections via Drizzle
- **Migrations**: Drizzle Kit with GitHub Actions automation

#### External Services
- **Hosting**: Vercel (Frankfurt region)
- **Email**: Resend (transactional emails)
- **Analytics**: PostHog (product analytics & feature flags)
- **Logging**: Axiom (OTEL traces & logs)
- **Error Tracking**: PostHog Exceptions with trace IDs
- **Cache**: Optional Redis (to be implemented if needed)

#### School OIDC Providers
1. **Gymnasium Athenaeum Stade** (Athenaeum)
   - Platform: IServ
   - Domain: `@athenetz.de`
2. **Vincent Lübeck Gymnasium** (VLG)
   - Platform: Moodle
   - Domain: `@vlg-stade.de`
3. **Integrierte Gesamtschule Stade** (IGS)
   - Platform: IServ
   - Domain: `@igs-stade.net`
4. **EWF Admin Domain**
   - Domain: `@ewf-stade.de`

### 3.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │   Mobile     │  │  External    │         │
│  │  (Web App)   │  │   Devices    │  │    Apps      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                          │
│                    (Frankfurt Region)                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TanStack Start App                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Frontend (React)                      │  │
│  │  • Authentication UI  • Admin Dashboard                 │  │
│  │  • Account Management • GDPR Pages                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Layer                             │  │
│  │  • Better Auth Endpoints  • Custom APIs                 │  │
│  │  • OIDC Endpoints        • Admin APIs                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Business Logic                        │  │
│  │  • Effect.ts Services  • Permission System              │  │
│  │  • Rate Limiting      • Audit Logging                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌─────────┐    ┌─────────┐   ┌──────────┐
    │ Neon   │    │ Resend  │    │ PostHog │   │  Axiom   │
    │  (DB)  │    │ (Email) │    │(Analytics)   │  (Logs)  │
    └────────┘    └─────────┘    └─────────┘   └──────────┘
         │
         ▼
    ┌────────────────────────────────────────┐
    │          External OIDC                 │
    │  • IServ (Athenaeum, IGS)             │
    │  • Moodle (VLG)                       │
    └────────────────────────────────────────┘
```

### 3.4 Data Flow

#### Registration Flow
1. User accesses registration page
2. User selects their school
3. Redirect to school OIDC provider
4. School authenticates user
5. Callback to EWF-ID with verified email
6. User completes profile (first name, last name, optional bio)
7. Account created with role assignment (student/teacher)
8. Welcome email sent via Resend
9. User redirected to dashboard

#### Authentication Flow
1. User accesses login page
2. User selects authentication method:
   - Email/Password
   - School OIDC
   - Passkey (WebAuthn)
3. Credentials validated
4. 2FA challenge (if enabled)
5. Session created in database
6. JWT tokens issued
7. User redirected to requested resource

#### Authorization Flow (OIDC)
1. External app redirects to `/authorize` endpoint
2. User authenticates (if not already)
3. Consent screen shown (if first time)
4. Authorization code issued
5. App exchanges code for tokens at `/token` endpoint
6. Access token includes claims (roles, permissions, user info)
7. App can refresh tokens at `/token` endpoint

---

## 4. Authentication & Authorization

### 4.1 Authentication Methods

#### 4.1.1 Email & Password
- **Password Requirements**:
  - Minimum 12 characters
  - Must contain: uppercase, lowercase, number, special character
  - Checked against Have I Been Pwned database
  - Argon2 hashing algorithm
- **Password Reset**:
  - One-time token sent via email
  - Token valid for 1 hour
  - Rate limited: 3 attempts per hour per email

#### 4.1.2 School OIDC
- **Supported Providers**:
  - IServ (Athenaeum, IGS)
  - Moodle (VLG)
- **Flow**: Standard OAuth 2.0 Authorization Code Flow
- **Email Verification**: Emails from school providers are pre-verified
- **Auto-Registration**: New users automatically created on first login

#### 4.1.3 Passkeys (WebAuthn)
- **Supported Authenticators**:
  - Platform authenticators (Face ID, Touch ID, Windows Hello)
  - Cross-platform authenticators (USB security keys)
- **Implementation**: `@better-auth/passkey` plugin
- **User Experience**: Optional, can be added post-registration

### 4.2 Multi-Factor Authentication (2FA)

- **Methods**:
  - TOTP (Time-based One-Time Password)
  - Backup codes (10 codes, single-use)
- **Enforcement**:
  - Required for admin and team roles
  - Optional but recommended for students and teachers
- **Setup Flow**:
  - QR code generation
  - Verification of first code
  - Backup codes displayed and must be confirmed as saved

### 4.3 Session Management

- **Storage**: Database-backed sessions
- **Expiration**: 
  - Standard sessions: 48 hours (2 days)
  - "Remember me": 14 days
  - Idle timeout: 24 hours
- **Refresh**: Automatic silent refresh 1 hour before expiration
- **Revocation**: Support for immediate session invalidation

### 4.4 OIDC Provider Configuration

EWF-ID acts as an OIDC provider for downstream applications.

#### Standard Endpoints
- **Discovery**: `/.well-known/openid-configuration`
- **Authorization**: `/api/auth/authorize`
- **Token**: `/api/auth/token`
- **UserInfo**: `/api/auth/userinfo`
- **JWKS**: `/.well-known/jwks.json`
- **Logout**: `/api/auth/logout`

#### Supported Flows
- Authorization Code Flow (recommended)
- Authorization Code Flow with PKCE
- Device Authorization Flow (RFC 8628)

#### Token Configuration
- **Access Token**: JWT, 1 hour expiration
- **Refresh Token**: Opaque, 30 days expiration
- **ID Token**: JWT with standard claims + custom claims

#### Custom Claims

Standard claims:
```json
{
  "sub": "user-uuid",
  "email": "user@athenetz.de",
  "email_verified": true,
  "name": "Max Mustermann",
  "given_name": "Max",
  "family_name": "Mustermann",
  "locale": "de",
  "picture": "https://..."
}
```

Custom claims:
```json
{
  "roles": ["student"],
  "school": "athenaeum",
  "permissions": ["schedule:event:view", "live:submit:question"],
  "team_member": false,
  "account_created": "2025-01-15T10:30:00Z"
}
```

### 4.5 Roles & Permissions

#### Role Hierarchy
1. **Admin** (highest privilege)
   - Full system access
   - User management
   - Impersonation capability
   - System configuration

2. **Team**
   - Access to team-specific applications
   - Event management permissions
   - Content moderation

3. **Teacher** (Lehrer)
   - School-specific permissions
   - Student oversight (limited)
   - Event participation

4. **Student** (Schüler)
   - Basic access to public events
   - Voting rights
   - Limited content submission

#### Permission Structure

Format: `app:resource:action`

Examples:
- `schedule:event:create`
- `schedule:event:edit`
- `schedule:event:delete`
- `schedule:event:publish`
- `vote:ballot:create`
- `vote:ballot:submit`
- `live:question:submit`
- `live:vote:submit`
- `screens:manage`

**See**: [INTEGRATED_APPS.md](./INTEGRATED_APPS.md) for comprehensive permission definitions.

#### Permission Assignment
- Permissions can be assigned to roles
- Permissions can be assigned directly to users (overrides)
- Permission checks use hierarchical evaluation

---

## 5. User Management

### 5.1 User Registration

#### Registration Methods

**Primary Method: School OIDC**
- Only registration method available to students/teachers
- Automatically verifies email
- Captures: email, first name (optional at school level)

**Post-OIDC Registration Flow**:
1. User redirected to profile completion page
2. Required fields:
   - First Name
   - Last Name
3. Optional fields:
   - Display Name
   - Bio (max 500 characters)
   - Profile Picture (via URL or upload)
4. Automatic role assignment based on email domain
5. Account activation

**Admin Creation**:
- Admins can manually create accounts via dashboard
- Can assign any role
- Can pre-set permissions
- Welcome email sent with temporary password

### 5.2 User Profile

#### User Model

```typescript
interface User {
  id: string; // UUID
  email: string; // Immutable, unique
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  profilePicture?: string;
  locale: 'de' | 'en' | 'uk';
  school: 'athenaeum' | 'vlg' | 'igs' | 'ewf';
  roles: Role[];
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastLoginMethod?: 'email' | 'oidc' | 'passkey';
  twoFactorEnabled: boolean;
  multiSessionEnabled: boolean; // Hidden from normal users
}
```

#### Profile Management

**User-Editable Fields**:
- First Name
- Last Name
- Display Name
- Bio
- Profile Picture
- Locale preference
- Password (if using email/password auth)

**Non-Editable Fields**:
- Email address (immutable for GDPR tracking)
- School affiliation
- Account creation date

**Admin-Editable Fields**:
- All user fields
- Roles
- Permissions
- Email verification status
- Account status (active/suspended/deleted)

### 5.3 Admin Dashboard

#### Features

**User Management**
- List all users (paginated, filterable)
- Search by: email, name, school, role
- Bulk operations (feature flag protected):
  - Bulk role assignment
  - Bulk permission assignment
  - Bulk email (via Resend)
- Individual user actions:
  - Edit profile
  - Change roles/permissions
  - Reset password
  - Enable/disable 2FA
  - Suspend account
  - Delete account (soft delete)
  - Impersonate user (with audit log)

**User Creation**
- Manual user creation form
- Fields:
  - Email (any domain for admin-created users)
  - First Name / Last Name
  - Role(s)
  - Temporary password (auto-generated or custom)
  - Send welcome email (checkbox)

**Impersonation**
- Click "Impersonate" on user profile
- Confirmation dialog with warning
- Logged to audit trail
- Banner shown during impersonation
- "Exit Impersonation" button always visible
- Original admin session preserved

**Audit Log Viewer**
- Real-time log stream
- Filters: user, action type, date range
- Export to CSV
- Retention: 7 days (standard), 30 days (admin actions)

**System Statistics**
- Total users
- Users by role
- Users by school
- Active sessions
- Failed login attempts (last 24h)
- Top accessed applications
- 2FA adoption rate

**API Key Management**
- List all API keys
- Create new keys for applications
- Revoke keys
- View usage statistics per key

### 5.4 Account Deletion & Data Export

#### User-Initiated Deletion
- Available at `/account/delete`
- Confirmation flow:
  1. User enters password
  2. Warning about data deletion
  3. Final confirmation checkbox
  4. Account marked for deletion
  5. Email sent confirming deletion request
  6. Grace period: 14 days
  7. After grace period: permanent deletion

#### Deletion Process
- Soft delete (mark as deleted, retain data)
- Hard delete after retention period (event date + 1 year)
- Cascade delete sessions, tokens, audit logs
- Retain: aggregated analytics (anonymized)

#### Data Export (GDPR Right to Access)
- Available at `/account/export`
- Generates JSON file with all user data:
  - Profile information
  - Account activity logs
  - Connected applications
  - Permissions and roles
  - Session history
- Generated asynchronously
- Download link sent via email
- Link valid for 7 days

---

## 6. Plugin Implementation

EWF-ID leverages Better Auth's plugin system extensively. All plugins must be fully configured and integrated.

### 6.1 Core Plugins

#### 6.1.1 Two-Factor Authentication
- **Plugin**: `better-auth/two-factor`
- **Implementation**:
  - TOTP setup flow in `/account/security`
  - QR code generation
  - Backup code generation and storage (encrypted)
  - Recovery flow
- **UI Requirements**:
  - Setup page with step-by-step guide
  - Device management (see trusted devices)
  - Backup code management (view remaining, regenerate)

#### 6.1.2 Admin Plugin
- **Plugin**: `better-auth/admin`
- **Implementation**:
  - Admin middleware for protected routes
  - Role checking utilities
  - Impersonation functionality
- **Dashboard Routes**:
  - `/admin` - Overview
  - `/admin/users` - User management
  - `/admin/roles` - Role configuration
  - `/admin/permissions` - Permission management
  - `/admin/audit` - Audit log viewer
  - `/admin/api-keys` - API key management
  - `/admin/system` - System settings

#### 6.1.3 API Key Management
- **Plugin**: `better-auth/api-key`
- **Implementation**:
  - API key generation (prefixed with `ewf_`)
  - Key rotation mechanism
  - Rate limiting per key
  - Usage tracking
- **Key Format**: `ewf_live_XXXXXXXXXXXXXXXXXXXXXXXX`
- **Scopes**: Keys can be scoped to specific permissions

#### 6.1.4 Bearer Token Support
- **Plugin**: `better-auth/bearer`
- **Implementation**:
  - Support for `Authorization: Bearer <token>` headers
  - Token validation middleware
  - Compatibility with mobile apps and SPAs

#### 6.1.5 Device Authorization
- **Plugin**: `better-auth/device-authorization`
- **RFC**: RFC 8628 (OAuth 2.0 Device Authorization Grant)
- **Use Case**: TV apps, CLI tools, IoT devices
- **Flow**:
  1. Device requests device code
  2. User visits `/device` and enters code
  3. User authorizes device
  4. Device polls for token
- **UI**: `/device` page with code input and authorization confirmation

### 6.2 Security Plugins

#### 6.2.1 CAPTCHA
- **Plugin**: `better-auth/captcha`
- **Provider**: Cloudflare Turnstile
- **Implementation**:
  - Login page (after 3 failed attempts)
  - Registration page (always)
  - Password reset page (always)
  - API endpoints (configurable)
- **Configuration**:
  - Site key in `env.ts`
  - Secret key for verification

#### 6.2.2 Have I Been Pwned
- **Plugin**: `better-auth/have-i-been-pwned`
- **Implementation**:
  - Check passwords during registration
  - Check passwords during password change
  - k-anonymity model (only send first 5 chars of hash)
  - Warning message if password is compromised
  - Block registration if password found in >100 breaches

#### 6.2.3 Rate Limiting
- **Plugin**: `better-auth/rate-limit`
- **Limits**:
  - Login: 5 attempts per 15 minutes per IP
  - Registration: 3 attempts per hour per IP
  - Password reset: 3 attempts per hour per email
  - API calls: 100 requests per minute per API key
  - Admin actions: 1000 requests per hour per admin user
- **Strategy**: Token bucket algorithm
- **Storage**: In-memory (consider Redis for production scale)

### 6.3 User Experience Plugins

#### 6.3.1 Last Login Method
- **Plugin**: `better-auth/last-login-method`
- **Implementation**:
  - Track last used authentication method
  - Show on login page: "Welcome back! Last time you signed in with [method]"
  - Pre-select last used method
  - Store in `lastLoginMethod` field

#### 6.3.2 Multi-Session Management
- **Plugin**: `better-auth/multi-session`
- **Implementation**:
  - Allow multiple concurrent sessions
  - Hidden from normal users (feature flag)
  - Visible in admin panel
  - Session list at `/account/sessions`:
    - Device/browser info
    - Last activity time
    - Current session indicator
    - "Revoke" button for each session
    - "Revoke all other sessions" button

#### 6.3.3 One-Time Tokens
- **Plugin**: `better-auth/one-time-token`
- **Use Cases**:
  - Email verification links
  - Password reset links
  - Magic link login (future consideration)
  - Device authorization codes
- **Configuration**:
  - Token length: 32 characters
  - Expiration: 1 hour (configurable per use case)
  - Single use only

#### 6.3.4 JWT Plugin
- **Plugin**: `better-auth/jwt`
- **Implementation**:
  - Sign tokens with RS256
  - Include custom claims
  - Token rotation
  - JWKS endpoint at `/.well-known/jwks.json`

### 6.4 Custom Plugins

#### 6.4.1 Localization Plugin
- **Plugin**: `github:marcellosso/better-auth-localization`
- **Integration**: Works with Paraglide
- **Implementation**:
  - Error messages localized
  - Email templates in user's preferred language
  - UI strings from Paraglide
  - Language switcher on all pages

#### 6.4.2 University/School Plugin
- **Plugin**: `github:LuyxLLC/better-auth-university`
- **Configuration**:
  - Allowed domains: `@athenetz.de`, `@igs-stade.net`, `@vlg-stade.de`, `@ewf-stade.de`
  - Domain-to-school mapping
  - Automatic role assignment based on domain
- **Validation**: Email must match allowed domains during registration

### 6.5 Plugin Dashboard Pages

Each plugin that supports UI should have a dedicated dashboard page:

- `/account/security` - 2FA setup and management
- `/account/sessions` - Multi-session management (admin/feature-flag)
- `/account/passkeys` - Passkey management
- `/account/api-keys` - Personal API keys (for developers)
- `/admin/api-keys` - System-wide API key management
- `/admin/rate-limits` - Rate limit configuration and monitoring
- `/device` - Device authorization flow

---

## 7. API Specifications

### 7.1 API Design Principles

- **RESTful**: Standard HTTP methods and status codes
- **Versioned**: `/api/v1/...` pattern for stability
- **Authenticated**: Most endpoints require authentication
- **Documented**: OpenAPI/Swagger documentation
- **Rate Limited**: All endpoints have rate limits
- **CORS Enabled**: For configured origins

### 7.2 Authentication APIs

#### Better Auth Endpoints

Better Auth provides standard endpoints:

- `POST /api/auth/sign-up/email` - Email/password registration
- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-in/social` - OAuth login
- `POST /api/auth/sign-out` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

#### Custom Authentication Endpoints

```typescript
// Get OIDC login URL for a school
GET /api/v1/auth/oidc/:school/login
Response: { url: string; state: string; }

// OIDC callback handler
GET /api/v1/auth/oidc/callback
Query: code, state
Response: Redirect to dashboard or error page

// Passkey registration challenge
POST /api/v1/auth/passkey/register/challenge
Response: { challenge: string; }

// Passkey registration verification
POST /api/v1/auth/passkey/register/verify
Body: { credential: PublicKeyCredential; }
Response: { success: boolean; }

// Passkey authentication challenge
POST /api/v1/auth/passkey/authenticate/challenge
Response: { challenge: string; }

// Passkey authentication verification
POST /api/v1/auth/passkey/authenticate/verify
Body: { credential: PublicKeyCredential; }
Response: { token: string; refreshToken: string; }
```

### 7.3 User Management APIs

```typescript
// Get current user profile
GET /api/v1/user/me
Response: User

// Update current user profile
PATCH /api/v1/user/me
Body: Partial<User>
Response: User

// Get user's permissions
GET /api/v1/user/me/permissions
Response: { permissions: string[]; }

// Get user's roles
GET /api/v1/user/me/roles
Response: { roles: Role[]; }

// Request account deletion
POST /api/v1/user/me/delete
Body: { password: string; confirmation: boolean; }
Response: { message: string; deletionDate: Date; }

// Cancel account deletion
POST /api/v1/user/me/cancel-deletion
Response: { message: string; }

// Export user data (GDPR)
POST /api/v1/user/me/export
Response: { jobId: string; estimatedTime: number; }

// Check export status
GET /api/v1/user/me/export/:jobId
Response: { status: 'pending' | 'complete'; downloadUrl?: string; }
```

### 7.4 Admin APIs

```typescript
// List all users (paginated)
GET /api/v1/admin/users
Query: page, limit, search, role, school
Response: { users: User[]; total: number; page: number; }

// Get specific user
GET /api/v1/admin/users/:userId
Response: User & { sessions: Session[]; auditLog: AuditEntry[]; }

// Create user
POST /api/v1/admin/users
Body: { email, firstName, lastName, roles, sendWelcomeEmail }
Response: User & { temporaryPassword?: string; }

// Update user
PATCH /api/v1/admin/users/:userId
Body: Partial<User>
Response: User

// Delete user (soft delete)
DELETE /api/v1/admin/users/:userId
Body: { reason: string; }
Response: { message: string; }

// Impersonate user
POST /api/v1/admin/users/:userId/impersonate
Response: { impersonationToken: string; }

// Stop impersonation
POST /api/v1/admin/impersonate/stop
Response: { message: string; }

// Assign role to user
POST /api/v1/admin/users/:userId/roles
Body: { role: string; }
Response: User

// Remove role from user
DELETE /api/v1/admin/users/:userId/roles/:role
Response: User

// Assign permission to user
POST /api/v1/admin/users/:userId/permissions
Body: { permission: string; }
Response: User

// Remove permission from user
DELETE /api/v1/admin/users/:userId/permissions/:permission
Response: User

// Reset user password
POST /api/v1/admin/users/:userId/reset-password
Body: { sendEmail: boolean; }
Response: { temporaryPassword?: string; message: string; }

// Get audit log
GET /api/v1/admin/audit
Query: page, limit, userId, action, startDate, endDate
Response: { entries: AuditEntry[]; total: number; }

// Get system statistics
GET /api/v1/admin/stats
Response: {
  totalUsers: number;
  usersByRole: Record<string, number>;
  usersBySchool: Record<string, number>;
  activeSessions: number;
  failedLogins24h: number;
  twoFactorAdoption: number;
}
```

### 7.5 API Key APIs

```typescript
// List API keys
GET /api/v1/api-keys
Response: { keys: APIKey[]; }

// Create API key
POST /api/v1/api-keys
Body: { name: string; scopes: string[]; expiresAt?: Date; }
Response: { key: string; keyId: string; }

// Revoke API key
DELETE /api/v1/api-keys/:keyId
Response: { message: string; }

// Get API key usage
GET /api/v1/api-keys/:keyId/usage
Query: startDate, endDate
Response: { requests: number; errors: number; lastUsed: Date; }
```

### 7.6 Claims & Permissions APIs

```typescript
// Get all available permissions
GET /api/v1/permissions
Response: { permissions: Permission[]; }

// Get user's claims (for external apps)
GET /api/v1/claims/:userId
Headers: { Authorization: "Bearer <api_key>" }
Response: {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  school: string;
  // ... other claims
}

// Verify permission
POST /api/v1/permissions/verify
Headers: { Authorization: "Bearer <api_key>" }
Body: { userId: string; permission: string; }
Response: { allowed: boolean; }

// Bulk verify permissions
POST /api/v1/permissions/verify-bulk
Headers: { Authorization: "Bearer <api_key>" }
Body: { userId: string; permissions: string[]; }
Response: { results: Record<string, boolean>; }
```

### 7.7 OIDC Standard Endpoints

```typescript
// OpenID Configuration
GET /.well-known/openid-configuration
Response: {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  claims_supported: string[];
}

// Authorization endpoint
GET /api/auth/authorize
Query: {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
}

// Token endpoint
POST /api/auth/token
Body: {
  grant_type: string;
  code?: string;
  refresh_token?: string;
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
}
Response: {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

// UserInfo endpoint
GET /api/auth/userinfo
Headers: { Authorization: "Bearer <access_token>" }
Response: {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  locale: string;
  picture?: string;
  // Custom claims
  roles: string[];
  permissions: string[];
  school: string;
}

// JWKS endpoint
GET /.well-known/jwks.json
Response: {
  keys: JWK[];
}
```

### 7.8 API Error Responses

Standardized error format:

```typescript
{
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message (localized)
    details?: any; // Additional context
    traceId: string; // OTEL trace ID for debugging
  }
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 8. Frontend Implementation

### 8.1 Design System

#### Adherence to FRONTEND_SKILL.md

All UI must follow the principles in `FRONTEND_SKILL.md`:

- **Bold Aesthetic Direction**: Choose a clear, distinctive visual identity
- **Typography**: Distinctive font pairings (avoid generic choices)
- **Color & Theme**: Cohesive dark/light themes with bold accent colors
- **Motion**: Meaningful animations using Motion library
- **Spatial Composition**: Unexpected layouts, asymmetry where appropriate
- **Visual Details**: Contextual effects, textures, and atmospheric elements

#### Design Direction for EWF-ID

**Identity**: Professional yet approachable, emphasizing trust and security

**Core Aesthetic**:
- Clean, modern interface with subtle brutalist influences
- Strong hierarchy and clear information architecture
- Thoughtful micro-interactions
- Accessibility-first design

**Typography**:
- Display Font: Consider distinctive choices (e.g., Space Grotesk, Clash Display, or custom)
- Body Font: Highly legible (e.g., Inter, IBM Plex Sans, or system fonts for performance)
- Monospace: For API keys, codes (e.g., JetBrains Mono, Fira Code)

**Color System**:
```css
/* Light Theme */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 221.2 83.2% 53.3%; /* Distinctive blue */
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96.1%;
--accent: 210 40% 96.1%;
--destructive: 0 84.2% 60.2%;

/* Dark Theme */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 217.2 91.2% 59.8%;
--primary-foreground: 222.2 47.4% 11.2%;
```

**Animation Guidelines**:
- Page transitions: 300ms ease-out
- Micro-interactions: 200ms ease-in-out
- Loading states: Skeleton screens with shimmer effect
- Success/error states: Subtle scale + fade animations

### 8.2 Page Structure

#### Public Pages

**Landing Page** (`/`)
- Hero section with value proposition
- "Sign In" and "Sign Up" CTAs
- Feature highlights
- Language switcher
- Link to GDPR pages

**Login Page** (`/login`)
- Email/password form
- "Sign in with [School]" buttons (3 schools)
- "Sign in with Passkey" button
- "Forgot password?" link
- CAPTCHA (after failed attempts)
- Language switcher
- Last login method indicator

**Registration Page** (`/register`)
- School selection (radio buttons or cards)
- Explanation of OIDC flow
- CAPTCHA
- Terms and Privacy Policy checkboxes
- Language switcher

**Password Reset** (`/forgot-password`, `/reset-password/:token`)
- Email input form
- Token verification + new password form
- CAPTCHA
- Success confirmation

**Device Authorization** (`/device`)
- Code input field (8-character format)
- Device information display
- Authorization confirmation button

#### Authenticated Pages

**Dashboard** (`/dashboard`)
- Welcome message with user's name
- Quick stats (connected apps, last login)
- Recent activity
- Quick actions (Edit Profile, Security Settings, etc.)

**Account Pages**
- `/account/profile` - Edit profile information
- `/account/security` - Password, 2FA, passkeys
- `/account/sessions` - Active sessions management
- `/account/connected-apps` - OAuth consents management
- `/account/api-keys` - Personal API keys (for developers)
- `/account/export` - Data export (GDPR)
- `/account/delete` - Account deletion

**Admin Pages**
- `/admin` - Dashboard overview
- `/admin/users` - User list and management
- `/admin/users/:id` - Individual user detail
- `/admin/users/create` - Create new user
- `/admin/roles` - Role management
- `/admin/permissions` - Permission management
- `/admin/api-keys` - System API keys
- `/admin/audit` - Audit log viewer
- `/admin/system` - System settings and stats

#### Legal/Compliance Pages

**Privacy Policy** (`/privacy`)
- Comprehensive GDPR-compliant privacy policy
- Sections:
  - Data we collect
  - How we use data
  - Data retention
  - Your rights (with mailto links)
  - Third-party services (subprocessors)
  - Contact information
- Language switcher
- Last updated date

**Terms of Service** (`/terms`)
- Terms and conditions for using EWF-ID
- Sections:
  - Service description
  - User responsibilities
  - Account termination
  - Limitation of liability
  - Governing law
- Language switcher
- Last updated date

**Digital Independence Day** (`/di.day`)
- Explanation of Digital Independence Day
- EWF's commitment to digital sovereignty
- List of subprocessors:
  - Vercel (hosting)
  - Neon.tech (database)
  - PostHog (analytics)
  - Axiom (logging)
  - Resend (email)
  - School OIDC providers
- Data handling practices
- Encryption and privacy measures
- Note: PII not stored unnecessarily

**GDPR Contact Links**

All legal pages should include prominent mailto links to `compliance@ewf-stade.de`:
- Recht auf Einsicht (Right to Access)
- Recht auf Löschung (Right to Erasure)
- Recht auf Berichtigung (Right to Rectification)
- Recht auf Datenübertragbarkeit (Right to Data Portability)
- Widerspruchsrecht (Right to Object)

### 8.3 Component Library

#### Custom Components (Shadcn/UI)

Required components:
- Button (variants: default, destructive, outline, ghost, link)
- Input (with validation states)
- Form (with Zod validation)
- Card
- Dialog/Modal
- Toast notifications
- Dropdown Menu
- Table (sortable, filterable)
- Pagination
- Tabs
- Badge
- Avatar
- Skeleton (loading states)
- Alert
- Progress bar
- Switch/Toggle
- Checkbox
- Radio Group
- Select/Combobox
- Command palette
- Sheet (slide-over)
- Tooltip
- Separator

#### Custom Components

```typescript
// LanguageSwitcher.tsx
<LanguageSwitcher
  currentLocale="de"
  availableLocales={["de", "en", "uk"]}
  onChange={(locale) => {}}
/>

// UserMenu.tsx
<UserMenu user={currentUser} onLogout={() => {}} />

// ImpersonationBanner.tsx
<ImpersonationBanner
  originalUser={admin}
  impersonatedUser={user}
  onExit={() => {}}
/>

// PermissionGuard.tsx
<PermissionGuard permission="admin:users:read">
  <AdminPanel />
</PermissionGuard>

// RoleGuard.tsx
<RoleGuard roles={["admin", "team"]}>
  <TeamFeature />
</RoleGuard>

// AuditLogViewer.tsx
<AuditLogViewer
  userId={userId}
  actions={["login", "profile_update"]}
  dateRange={{ start, end }}
/>

// SessionList.tsx
<SessionList
  sessions={sessions}
  currentSessionId={currentSessionId}
  onRevoke={(sessionId) => {}}
/>

// APIKeyManager.tsx
<APIKeyManager
  keys={apiKeys}
  onCreate={(key) => {}}
  onRevoke={(keyId) => {}}
/>

// TwoFactorSetup.tsx
<TwoFactorSetup
  qrCode={qrCodeUrl}
  secret={secret}
  backupCodes={codes}
  onVerify={(code) => {}}
/>

// PasskeyManager.tsx
<PasskeyManager
  passkeys={passkeys}
  onAdd={() => {}}
  onRemove={(passkeyId) => {}}
/>
```

### 8.4 Responsive Design

- **Mobile-first**: Design for mobile, enhance for desktop
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

- **Mobile Navigation**: Hamburger menu with slide-out drawer
- **Table Behavior**: Horizontal scroll on mobile, full table on desktop
- **Forms**: Single column on mobile, multi-column on desktop

### 8.5 Accessibility

- **WCAG 2.1 Level AA** compliance minimum
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Indicators**: Clear, visible focus states
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Skip Links**: "Skip to main content" link
- **Form Labels**: All inputs have associated labels
- **Error Messages**: Clear, actionable error messages

### 8.6 Internationalization (i18n)

#### Paraglide Integration

```typescript
// Example usage
import { t } from "@/paraglide/messages";

function LoginPage() {
  return (
    <div>
      <h1>{t.auth.login.title()}</h1>
      <p>{t.auth.login.subtitle()}</p>
      <Button>{t.auth.login.submit()}</Button>
    </div>
  );
}
```

#### Message Structure

```
messages/
├── de/
│   ├── common.json
│   ├── auth.json
│   ├── account.json
│   ├── admin.json
│   ├── errors.json
│   └── emails.json
├── en/
│   └── ...
└── uk/
    └── ...
```

#### Language Detection
1. User's saved preference (if logged in)
2. Browser `Accept-Language` header
3. Default to German

#### Language Switcher
- Available on all pages
- Persisted in user profile (logged in) or cookie (logged out)
- Triggers page reload if necessary

---

## 9. Data Privacy & Compliance

### 9.1 GDPR Compliance

#### Principles

1. **Lawfulness, Fairness, and Transparency**
   - Clear privacy policy
   - Transparent data collection practices
   - User consent where required

2. **Purpose Limitation**
   - Data collected only for specific purposes
   - No secondary use without consent

3. **Data Minimization**
   - Only collect necessary data
   - No excessive information gathering

4. **Accuracy**
   - Users can update their information
   - Processes to ensure data accuracy

5. **Storage Limitation**
   - Retention policy: Event date + 1 year
   - Automatic deletion after retention period

6. **Integrity and Confidentiality**
   - Encryption at rest and in transit
   - Access controls and audit logging

7. **Accountability**
   - Documentation of data processing activities
   - Regular compliance reviews

#### User Rights Implementation

**Right to Access** (`/account/export`)
- Full data export in JSON format
- Delivered within 72 hours
- Includes all personal data and activity logs

**Right to Erasure** (`/account/delete`)
- User-initiated deletion
- 14-day grace period
- Permanent deletion after grace period
- Anonymization of analytics data

**Right to Rectification** (`/account/profile`)
- Users can update their information
- Admins can correct inaccuracies

**Right to Data Portability**
- Data export in machine-readable format (JSON)
- Can be imported into other systems

**Right to Object**
- Contact form for objections
- Email: compliance@ewf-stade.de

**Right to Restrict Processing**
- Account suspension option (retains data but prevents use)

### 9.2 Data Protection

#### Encryption

**In Transit**
- TLS 1.3 for all connections
- HTTPS enforced (HSTS enabled)
- Secure WebSocket connections (WSS)

**At Rest**
- Database encryption (Neon.tech native encryption)
- Password hashing: Argon2id
- API keys: SHA-256 hashed, only prefix shown
- 2FA secrets: AES-256 encrypted
- Backup codes: Hashed with bcrypt

#### Data Categories

**Personal Data**
- Email address (identifier, immutable)
- First name, last name
- School affiliation
- Profile picture URL

**Authentication Data**
- Password hash (if using email/password)
- 2FA secret (encrypted)
- Passkey credentials
- Session tokens

**Activity Data**
- Login history (30 days)
- Audit logs (7 days standard, 30 days admin actions)
- API usage logs (90 days)

**Analytics Data**
- Aggregated, anonymized usage statistics
- No PII sent to PostHog (user ID is hashed)
- No IP addresses stored

### 9.3 Third-Party Data Processors

#### Subprocessors List

For `/di.day` page:

1. **Vercel** (Hosting)
   - Location: USA (with EU data residency options)
   - Purpose: Application hosting and CDN
   - Data: Request logs, performance metrics
   - GDPR: DPA available

2. **Neon.tech** (Database)
   - Location: EU (Frankfurt)
   - Purpose: PostgreSQL database
   - Data: All user data
   - GDPR: DPA available, SOC 2 compliant

3. **PostHog** (Analytics)
   - Location: EU
   - Purpose: Product analytics and feature flags
   - Data: Anonymized usage events
   - GDPR: Self-hosted option available, DPA

4. **Axiom** (Logging)
   - Location: USA/EU
   - Purpose: Application logs and traces
   - Data: System logs, error traces (sanitized)
   - GDPR: DPA available

5. **Resend** (Email)
   - Location: USA
   - Purpose: Transactional emails
   - Data: Email addresses, email content
   - GDPR: DPA available

6. **School OIDC Providers**
   - IServ (Athenaeum, IGS)
   - Moodle (VLG)
   - Purpose: Authentication
   - Data: Email, name (as provided by school)
   - GDPR: Schools are data controllers

7. **Cloudflare** (CAPTCHA)
   - Location: Global
   - Purpose: Bot protection
   - Data: Challenge responses, browser fingerprint
   - GDPR: DPA available

### 9.4 Privacy Policy Content

The Privacy Policy (`/privacy`) must include:

1. **Introduction**
   - Who we are (EWF)
   - Contact: compliance@ewf-stade.de

2. **Data We Collect**
   - Personal information (email, name)
   - Authentication data
   - Usage data
   - Device information (for security)

3. **How We Collect Data**
   - Registration via school OIDC
   - Direct input (profile updates)
   - Automatic collection (logs)

4. **Why We Collect Data**
   - Provide authentication services
   - Security and fraud prevention
   - Improve user experience
   - Legal compliance

5. **How We Use Data**
   - Account creation and management
   - Authentication to EWF applications
   - Communication (password resets, notifications)
   - Analytics (anonymized)

6. **Data Sharing**
   - With EWF applications (via OIDC)
   - With subprocessors (list all)
   - With schools (limited, as needed)
   - Never sold to third parties

7. **Data Retention**
   - Active accounts: Duration of EWF project + 1 year
   - Deleted accounts: Immediate soft delete, hard delete after retention
   - Logs: 7-90 days depending on type

8. **Security Measures**
   - Encryption
   - Access controls
   - Regular security audits
   - Incident response plan

9. **Your Rights**
   - Access your data
   - Correct your data
   - Delete your data
   - Export your data
   - Object to processing
   - How to exercise rights (mailto links)

10. **Cookies and Tracking**
    - Essential cookies (session)
    - Analytics cookies (optional, PostHog)
    - Cookie policy and preferences

11. **Children's Privacy**
    - Service designed for students (age 16+)
    - Parental consent process (via school)

12. **Changes to Policy**
    - How we notify users
    - Last updated date

13. **Contact Information**
    - Email: compliance@ewf-stade.de
    - Response time: 72 hours

### 9.5 Terms of Service Content

The Terms of Service (`/terms`) must include:

1. **Acceptance of Terms**
2. **Service Description**
3. **Eligibility** (students of partner schools)
4. **Account Registration and Security**
5. **User Responsibilities**
6. **Prohibited Activities**
7. **Data Usage** (reference Privacy Policy)
8. **Service Availability**
9. **Intellectual Property**
10. **Limitation of Liability**
11. **Indemnification**
12. **Account Termination**
13. **Dispute Resolution**
14. **Governing Law** (German law)
15. **Changes to Terms**
16. **Contact Information**

### 9.6 Digital Independence Day Content

The DI.Day page (`/di.day`) should explain:

1. **What is Digital Independence Day?**
   - Philosophy and principles
   - Why it matters for students

2. **EWF's Commitment**
   - Open-source where possible
   - Transparent data practices
   - User rights and control
   - No vendor lock-in

3. **Our Subprocessors**
   - Complete list (see 9.3)
   - Why we chose them
   - What data they process

4. **Data Handling Practices**
   - Encryption standards
   - Access controls
   - Minimal data collection
   - Regular security audits

5. **What We Don't Do**
   - No selling of user data
   - No tracking across the web
   - No unnecessary data collection
   - No dark patterns

6. **Your Control**
   - Data export
   - Account deletion
   - Preference management
   - How to contact us

---

## 10. Monitoring & Observability

### 10.1 Observability Strategy

**Three Pillars**:
1. **Metrics** - PostHog for product analytics
2. **Logs** - Axiom for centralized logging
3. **Traces** - OpenTelemetry (OTEL) for distributed tracing

### 10.2 OpenTelemetry (OTEL) Implementation

#### Configuration

```typescript
// src/lib/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'https://api.axiom.co/v1/traces',
    headers: {
      'Authorization': `Bearer ${process.env.AXIOM_TOKEN}`,
      'X-Axiom-Dataset': process.env.AXIOM_DATASET,
    },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

#### Instrumentation Points

**Automatic**:
- HTTP requests (incoming/outgoing)
- Database queries (via Drizzle)
- External API calls

**Manual**:
- Authentication flows
- Permission checks
- Admin actions
- API key usage
- Email sending
- Critical business logic

**Example**:
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('ewf-id');

async function authenticateUser(email: string, password: string) {
  const span = tracer.startSpan('authenticateUser');
  span.setAttribute('user.email', email);
  
  try {
    // Authentication logic
    const user = await verifyCredentials(email, password);
    span.setAttribute('auth.success', true);
    span.setAttribute('user.id', user.id);
    return user;
  } catch (error) {
    span.setAttribute('auth.success', false);
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

#### Trace Context Propagation

- Trace ID included in all error responses
- Trace ID logged to Axiom
- Trace ID sent to PostHog with exceptions
- Users can provide trace ID when reporting issues

### 10.3 PostHog Integration

#### Product Analytics Events

**Authentication Events**:
- `user_registered` - User completes registration
- `user_login` - User logs in (with method: email, oidc, passkey)
- `user_logout` - User logs out
- `password_reset_requested` - User requests password reset
- `password_reset_completed` - User completes password reset
- `2fa_enabled` - User enables 2FA
- `2fa_disabled` - User disables 2FA
- `passkey_added` - User adds a passkey
- `passkey_removed` - User removes a passkey

**Account Events**:
- `profile_updated` - User updates profile
- `language_changed` - User changes language preference
- `account_deletion_requested` - User requests account deletion
- `account_deletion_cancelled` - User cancels deletion
- `data_export_requested` - User requests data export

**Admin Events**:
- `admin_user_created` - Admin creates a user
- `admin_user_updated` - Admin updates a user
- `admin_user_deleted` - Admin deletes a user
- `admin_impersonation_started` - Admin impersonates user
- `admin_impersonation_ended` - Admin stops impersonating
- `admin_api_key_created` - Admin creates API key
- `admin_api_key_revoked` - Admin revokes API key

**OIDC Events**:
- `oidc_authorization_started` - External app initiates OIDC flow
- `oidc_authorization_granted` - User grants authorization
- `oidc_authorization_denied` - User denies authorization
- `oidc_token_issued` - Token issued to app
- `oidc_token_refreshed` - Token refreshed

**Error Events**:
- `auth_failed` - Failed authentication attempt
- `rate_limit_exceeded` - User hits rate limit
- `permission_denied` - User attempts unauthorized action
- `api_error` - API endpoint error

#### Feature Flags

```typescript
// src/lib/flags.ts
import { useFeatureFlagEnabled } from 'posthog-js/react';

// Feature flags
export const FLAGS = {
  MULTI_SESSION: 'multi-session',
  BULK_OPERATIONS: 'bulk-operations',
  CREATE_ADMIN_ACCOUNT: 'create-admin-account',
  DEVICE_AUTH: 'device-authorization',
  BETA_FEATURES: 'beta-features',
} as const;

// Usage
function AdminPanel() {
  const bulkOpsEnabled = useFeatureFlagEnabled(FLAGS.BULK_OPERATIONS);
  
  return (
    <div>
      {bulkOpsEnabled && <BulkOperationsPanel />}
    </div>
  );
}
```

#### PostHog Configuration

```typescript
// src/lib/posthog.ts
import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
  person_profiles: 'identified_only', // GDPR-friendly
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: false, // Manual event tracking only
  disable_session_recording: true, // Privacy: no session recording
  loaded: (posthog) => {
    if (process.env.NODE_ENV === 'development') {
      posthog.debug();
    }
  },
});
```

#### Exception Tracking

```typescript
// When catching errors
try {
  // Some operation
} catch (error) {
  const traceId = getCurrentTraceId(); // From OTEL
  
  posthog.captureException(error, {
    traceId,
    userId: currentUser?.id,
    context: {
      operation: 'user_login',
      // Additional context
    },
  });
  
  logger.error('Login failed', { error, traceId, userId });
}
```

### 10.4 Axiom Logging

#### Log Levels
- `DEBUG` - Detailed information for debugging
- `INFO` - General informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages
- `FATAL` - Critical errors requiring immediate attention

#### Structured Logging

```typescript
// src/lib/logger.ts
import { Effect } from 'effect';

interface LogContext {
  traceId?: string;
  userId?: string;
  [key: string]: any;
}

export const logger = {
  debug: (message: string, context?: LogContext) => 
    Effect.log({ level: 'DEBUG', message, ...context }),
  
  info: (message: string, context?: LogContext) =>
    Effect.log({ level: 'INFO', message, ...context }),
  
  warn: (message: string, context?: LogContext) =>
    Effect.log({ level: 'WARN', message, ...context }),
  
  error: (message: string, context?: LogContext) =>
    Effect.log({ level: 'ERROR', message, ...context }),
  
  fatal: (message: string, context?: LogContext) =>
    Effect.log({ level: 'FATAL', message, ...context }),
};
```

#### Log Categories

**Security Logs**:
- Failed login attempts
- Permission denied events
- API key usage
- Admin actions
- Rate limit violations

**Operational Logs**:
- Application startup/shutdown
- Database connections
- External API calls
- Email sending
- Cache operations

**Business Logs**:
- User registration
- OIDC flows
- Account deletions
- Data exports

### 10.5 Audit Logging

#### Audit Log Model

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actor: {
    id: string;
    type: 'user' | 'admin' | 'system';
    email: string;
  };
  action: string; // e.g., 'user.created', 'user.deleted'
  target?: {
    id: string;
    type: string; // e.g., 'user', 'api_key'
  };
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
}
```

#### Audited Actions

**All Admin Actions**:
- User creation, update, deletion
- Role/permission changes
- Impersonation start/stop
- API key creation/revocation
- System configuration changes

**Critical User Actions**:
- Account deletion request
- 2FA enable/disable
- Password changes
- Email verification

**System Actions**:
- Automated account deletions
- Token expirations
- Failed authentication attempts (threshold)

#### Retention
- Standard actions: 7 days
- Admin actions: 30 days
- Security-related: 90 days

### 10.6 Alerting

#### Alert Channels
- Email: devs@ewf-stade.de
- Vercel Alerts (for deployment issues)
- Axiom Monitors (for log patterns)

#### Alert Conditions

**Critical**:
- Error rate > 5% for 5 minutes
- Database connection failures
- External service downtime (Resend, OIDC providers)
- Unauthorized admin access attempts

**Warning**:
- Response time > 2s for 10 minutes
- Failed login rate spike (>100/min)
- Email sending failures
- API rate limit hit frequently

**Info**:
- Deployment completed
- Scheduled maintenance start/end
- Large data export completed

### 10.7 Dashboards

#### Axiom Dashboards

**Overview Dashboard**:
- Request rate (RPM)
- Error rate (%)
- Response time (P50, P95, P99)
- Active users
- Database query performance

**Security Dashboard**:
- Failed login attempts
- Rate limit violations
- Permission denied events
- API key usage
- Suspicious activity alerts

**OIDC Dashboard**:
- Authorization flow completions
- Token issuances
- Token refresh rate
- Connected applications
- Error rate by app

#### PostHog Dashboards

**Product Metrics**:
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- User registration rate
- Login method distribution
- 2FA adoption rate
- Feature usage (by feature flag)

**User Journey**:
- Registration funnel
- Login funnel
- Account deletion funnel
- Time to first login

**Engagement**:
- Sessions per user
- Session duration
- Return rate
- Churn rate

---

## 11. Deployment & Infrastructure

### 11.1 Hosting & Deployment

#### Vercel Configuration

- **Framework**: TanStack Start (detected automatically)
- **Region**: Frankfurt (fra1)
- **Node Version**: 20.x (Vercel's current default)
- **Build Command**: `bun run build`
- **Output Directory**: `.output`
- **Install Command**: `bun install`

#### Environment Variables

See `src/env.ts` for complete list. Required for deployment:

**Database** (Neon.tech):
- `AUTHDB_DATABASE`
- `AUTHDB_PASSWORD`
- `AUTHDB_READ_1`
- `AUTHDB_READ_2`
- `AUTHDB_USER`
- `AUTHDB_WRITE`

**Better Auth**:
- `BETTER_AUTH_SECRET` (min 32 characters, generated)
- `BETTER_AUTH_URL` (auto-set from Vercel)

**Email** (Resend):
- `RESEND_API_KEY`

**Analytics** (PostHog):
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

**Logging** (Axiom):
- `AXIOM_TOKEN`
- `AXIOM_DATASET`

**CAPTCHA** (Cloudflare Turnstile):
- `CLOUDFLARE_TURNSTILE_SITE_KEY`
- `CLOUDFLARE_TURNSTILE_SECRET_KEY`

**School OIDC**:
- `OIDC_ATHENAEUM_CLIENT_ID`
- `OIDC_ATHENAEUM_CLIENT_SECRET`
- `OIDC_ATHENAEUM_ISSUER`
- `OIDC_VLG_CLIENT_ID`
- `OIDC_VLG_CLIENT_SECRET`
- `OIDC_VLG_ISSUER`
- `OIDC_IGS_CLIENT_ID`
- `OIDC_IGS_CLIENT_SECRET`
- `OIDC_IGS_ISSUER`

**Feature Flags** (PostHog):
- Feature flags managed via PostHog dashboard

### 11.2 Database Management

#### Neon.tech Configuration

- **Region**: AWS eu-central-1 (Frankfurt)
- **Tier**: Pro (for production)
- **Compute**: Autoscaling (0.25 - 2 CU)
- **Storage**: Pay-as-you-grow
- **Connection Pooling**: Enabled (via Neon)

#### Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import { env } from './src/env';

export default {
  schema: './src/lib/auth/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.AUTHDB_WRITE,
  },
} satisfies Config;
```

#### Migration Strategy

**Development**:
```bash
bun run auth:push  # Push schema changes directly
bun run auth:studio  # View data in Drizzle Studio
```

**Production**:
- Generate migration: `bun run auth:gen`
- Review migration SQL
- Commit migration files
- GitHub Action applies migration on merge to `prod`

### 11.3 CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [prod]

jobs:
  migrate:
    name: Run Database Migrations
    runs-on: blacksmith-4vcpu-ubuntu-2204 # Blacksmith runner
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Run migrations
        run: bun run auth:migrate
        env:
          AUTHDB_WRITE: ${{ secrets.AUTHDB_WRITE }}
          AUTHDB_DATABASE: ${{ secrets.AUTHDB_DATABASE }}
          AUTHDB_USER: ${{ secrets.AUTHDB_USER }}
          AUTHDB_PASSWORD: ${{ secrets.AUTHDB_PASSWORD }}
  
  deploy:
    name: Deploy to Vercel
    needs: migrate
    runs-on: blacksmith-2vcpu-ubuntu-2204
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Wait for deployment
        uses: UnlyEd/github-action-await-vercel@v1
        with:
          deployment-url: ${{ steps.deploy.outputs.preview-url }}
          timeout: 300
          
  checks:
    name: Vercel Deployment Checks
    needs: deploy
    runs-on: blacksmith-2vcpu-ubuntu-2204
    steps:
      - name: Run health checks
        run: |
          curl -f https://id.ewf-stade.de/api/health || exit 1
          
      - name: Check OIDC discovery
        run: |
          curl -f https://id.ewf-stade.de/.well-known/openid-configuration || exit 1
```

#### Branch Strategy

- **`main`** → dev.id.ewf-stade.de (auto-deploy)
- **`prod`** → id.ewf-stade.de (auto-deploy with checks)
- **Feature branches** → Preview deployments

#### Vercel Deployment Protection

**Production Branch** (`prod`):
- Require passing checks before deployment
- Run migrations before deployment
- Health check after deployment
- Automatic rollback on failure

### 11.4 Monitoring Deployment

#### Deployment Notifications

- PostHog: Track deployment events
- Axiom: Log deployment completion
- Vercel: Deployment status webhooks

#### Health Check Endpoint

```typescript
// src/routes/api/health.ts
export async function GET() {
  try {
    // Check database
    await db.execute(sql`SELECT 1`);
    
    // Check external services (optional)
    const checks = {
      database: true,
      resend: await checkResend(),
      posthog: await checkPostHog(),
    };
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

### 11.5 Backup & Disaster Recovery

#### Database Backups
- **Neon.tech**: Automatic daily backups (retained 7 days on Pro plan)
- **Point-in-Time Recovery**: Available for last 7 days
- **Manual Backups**: Before major migrations

#### Disaster Recovery Plan

1. **Database Failure**:
   - Switch to Neon read replicas if available
   - Restore from latest backup
   - Replay transactions if possible

2. **Vercel Downtime**:
   - Traffic routes to Vercel's global network
   - Automatic failover to healthy regions
   - No action required (Vercel handles)

3. **Complete Outage**:
   - Status page: status.ewf-stade.de (future)
   - Communication via email to users
   - Estimated recovery time: 4 hours

4. **Data Breach**:
   - Immediate notification to compliance@ewf-stade.de
   - Incident response team activated
   - User notification within 72 hours (GDPR)
   - Forensic analysis
   - Remediation and hardening

#### Recovery Time Objectives (RTO)

- **Database**: 1 hour
- **Application**: 30 minutes (redeploy)
- **Complete System**: 4 hours

#### Recovery Point Objectives (RPO)

- **Database**: 24 hours (last backup)
- **With PITR**: 5 minutes

---

## 12. Security Requirements

### 12.1 Authentication Security

#### Password Security
- **Hashing**: Argon2id (memory-hard, recommended by OWASP)
- **Salt**: Unique per user (automatic)
- **Minimum Length**: 12 characters
- **Complexity**: Uppercase, lowercase, number, special character
- **Have I Been Pwned**: Check against known breaches
- **Password History**: Prevent reuse of last 5 passwords

#### Session Security
- **Session Token**: 256-bit random (secure)
- **HTTPOnly Cookies**: Prevents XSS access
- **Secure Flag**: HTTPS only
- **SameSite**: `Lax` (prevents CSRF)
- **Session Fixation Prevention**: New session on login
- **Concurrent Sessions**: Configurable (default: 3)

#### Two-Factor Authentication
- **TOTP**: RFC 6238 compliant
- **Secret Storage**: Encrypted with AES-256
- **Backup Codes**: 10 codes, bcrypt hashed
- **Rate Limiting**: 5 attempts per 5 minutes

### 12.2 API Security

#### Authentication
- **JWT**: RS256 signed, short-lived (1 hour)
- **API Keys**: SHA-256 hashed, prefixed (`ewf_`)
- **Bearer Tokens**: Standard `Authorization` header
- **Refresh Tokens**: Opaque, database-backed, long-lived (30 days)

#### Authorization
- **Permission Checks**: On every API call
- **Role Hierarchy**: Admin > Team > Teacher > Student
- **Scope Validation**: OIDC tokens include only granted scopes

#### Rate Limiting
- **Per IP**: 100 req/min (unauthenticated), 500 req/min (authenticated)
- **Per API Key**: 1000 req/min
- **Per User**: 200 req/min
- **Admin**: 1000 req/min
- **Sliding Window**: 1-minute windows

#### Input Validation
- **Zod Schemas**: All inputs validated
- **SQL Injection**: Prevented via Drizzle ORM (parameterized queries)
- **XSS**: Prevented via React (auto-escaping)
- **CSRF**: Prevented via SameSite cookies + CORS

### 12.3 HTTPS & Transport Security

#### TLS Configuration
- **Version**: TLS 1.3 (minimum 1.2)
- **Cipher Suites**: Strong ciphers only (Vercel default)
- **HSTS**: Enabled (`Strict-Transport-Security` header)
  - `max-age=31536000` (1 year)
  - `includeSubDomains`
  - `preload`

#### Security Headers

```typescript
// Applied to all responses
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://eu.posthog.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://eu.posthog.com https://api.axiom.co",
    "frame-ancestors 'none'",
  ].join('; '),
};
```

### 12.4 CORS Configuration

```typescript
// src/lib/cors.ts
const allowedOrigins = [
  'https://schedule.ewf-stade.de',
  'https://vote.ewf-stade.de',
  'https://live.ewf-stade.de',
  'https://screens.ewf-stade.de',
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
];

export const corsConfig = {
  origin: (origin: string) => allowedOrigins.includes(origin),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Trace-Id'],
  maxAge: 86400, // 24 hours
};
```

### 12.5 Secrets Management

#### Secret Storage
- **Development**: `.env.local` (gitignored)
- **Production**: Vercel Environment Variables (encrypted)
- **Rotation**: Manual (document rotation procedure)

#### Secret Types
- **API Keys**: External services (Resend, PostHog, Axiom)
- **OIDC Credentials**: Client IDs and secrets for schools
- **Better Auth Secret**: 32+ character random string
- **Database Credentials**: Neon.tech connection strings
- **Encryption Keys**: For 2FA secrets, backup codes

#### Secret Rotation Procedure
1. Generate new secret
2. Add to Vercel as new environment variable
3. Update application code to use new secret
4. Deploy
5. Verify functionality
6. Remove old secret after 24 hours

### 12.6 Security Auditing

#### Regular Security Tasks
- **Weekly**: Review failed login attempts
- **Weekly**: Review rate limit violations
- **Monthly**: Review API key usage
- **Monthly**: Review admin actions
- **Quarterly**: Dependency updates (npm audit)
- **Quarterly**: Security header audit
- **Annually**: Full security assessment

#### Vulnerability Disclosure
- Email: security@ewf-stade.de
- Response Time: 48 hours
- Public Disclosure: After fix deployed (coordinated)

#### Security Checklist (Pre-Production)
- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CAPTCHA configured
- [ ] 2FA available
- [ ] Audit logging enabled
- [ ] Error messages don't leak sensitive info
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] CSRF protection verified
- [ ] Password policy enforced
- [ ] Have I Been Pwned integration tested
- [ ] API authentication verified
- [ ] CORS properly configured
- [ ] Session management secure
- [ ] File upload validation (if applicable)

---

## 13. Development Workflow

### 13.1 Local Development

#### Setup

```bash
# Clone repository
git clone https://github.com/ewf-stade/ewf-id.git
cd ewf-id

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Push database schema
bun run auth:push

# Start development server
bun run dev
```

#### Environment Variables (Local)

Create `.env.local`:
```env
# Database (from Neon.tech)
AUTHDB_WRITE=postgresql://...
AUTHDB_READ_1=postgresql://...
AUTHDB_DATABASE=ewf_id_dev
AUTHDB_USER=your_user
AUTHDB_PASSWORD=your_password

# Better Auth
BETTER_AUTH_SECRET=your-32-char-secret
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend sandbox mode for dev)
RESEND_API_KEY=re_sandbox_...

# Analytics (optional for dev)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# Logging (optional for dev)
AXIOM_TOKEN=xaat-...
AXIOM_DATASET=ewf-id-dev

# CAPTCHA (optional for dev)
CLOUDFLARE_TURNSTILE_SITE_KEY=...
CLOUDFLARE_TURNSTILE_SECRET_KEY=...

# School OIDC (use test credentials)
OIDC_ATHENAEUM_CLIENT_ID=...
OIDC_ATHENAEUM_CLIENT_SECRET=...
OIDC_ATHENAEUM_ISSUER=...
# ... repeat for VLG and IGS
```

#### Development Commands

```bash
# Start dev server
bun run dev

# Type checking
bun run tsc --noEmit

# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
bun run format:write

# Database
bun run auth:studio    # Open Drizzle Studio
bun run auth:push      # Push schema changes
bun run auth:gen       # Generate migration
bun run auth:migrate   # Run migrations

# Storybook
bun run storybook

# Testing
bun run test
bun run test:watch
```

### 13.2 Code Quality

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Biome Configuration

Already configured in `biome.json`. Enforces:
- Consistent code style
- Import sorting
- No unused variables
- Prefer const over let
- Consistent quotes (single)

#### Code Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] Proper error handling (Effect.ts where applicable)
- [ ] Input validation (Zod schemas)
- [ ] Permission checks on protected routes
- [ ] Internationalization (all strings via Paraglide)
- [ ] Accessibility (keyboard nav, ARIA labels)
- [ ] Responsive design (mobile-first)
- [ ] Loading states
- [ ] Error states
- [ ] Tests for critical paths
- [ ] Documentation for complex logic
- [ ] No console.logs (use logger)
- [ ] No hardcoded secrets

### 13.3 Git Workflow

#### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

#### Commit Messages

Follow Conventional Commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(auth): add passkey support
fix(admin): correct user deletion flow
docs(api): update OIDC endpoint documentation
```

#### Pull Request Template

```markdown
## Description
[Describe the changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Tested on mobile
- [ ] Tested with screen reader

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Dependent changes merged
```

### 13.4 Testing Strategy

#### Testing Levels

**Unit Tests**:
- Utility functions
- Effect.ts services
- Permission checks
- Validation schemas

**Integration Tests**:
- API endpoints
- Database operations
- Authentication flows
- OIDC flows

**E2E Tests** (Future):
- User registration
- Login flows
- Admin operations
- OIDC authorization

#### Testing Tools
- **Vitest**: Unit and integration tests
- **Testing Library**: React component tests
- **MSW** (Mock Service Worker): API mocking

#### Example Test

```typescript
// src/lib/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { checkPermission } from './permissions';

describe('checkPermission', () => {
  it('should allow admin to access everything', () => {
    const user = { roles: ['admin'], permissions: [] };
    expect(checkPermission(user, 'schedule:event:delete')).toBe(true);
  });

  it('should deny student from managing screens', () => {
    const user = { roles: ['student'], permissions: [] };
    expect(checkPermission(user, 'screens:manage')).toBe(false);
  });
});
```

### 13.5 Documentation

#### Code Documentation

- **JSDoc**: For public APIs and complex functions
- **README**: In each major directory
- **Inline Comments**: For complex logic only

#### API Documentation

- OpenAPI/Swagger spec generated from routes
- Available at `/api/docs` in development
- Updated automatically from code

#### User Documentation

- Help pages in application
- Admin guide for user management
- OIDC integration guide for app developers

---

## 14. Appendices

### Appendix A: Environment Variables Reference

See `src/env.ts` for the complete, up-to-date list. This is maintained as the source of truth.

### Appendix B: Database Schema

Generated by Drizzle from Better Auth and custom tables.

**Core Tables**:
- `users` - User accounts
- `sessions` - Active sessions
- `accounts` - OIDC provider links
- `verificationTokens` - Email verification, password reset
- `twoFactorSecrets` - 2FA TOTP secrets (encrypted)
- `passkeys` - WebAuthn credentials
- `apiKeys` - API keys for external apps
- `auditLogs` - Audit trail
- `roles` - Role definitions
- `permissions` - Permission definitions
- `userRoles` - User-role mappings
- `userPermissions` - User-permission mappings

### Appendix C: OIDC Client Registration

For app developers wanting to integrate with EWF-ID:

1. Contact admin: devs@ewf-stade.de
2. Provide:
   - Application name
   - Redirect URIs
   - Requested scopes
   - Logo URL (optional)
3. Receive:
   - Client ID
   - Client Secret
4. Implement OIDC flow:
   - Discovery: `https://id.ewf-stade.de/.well-known/openid-configuration`
   - Use standard OIDC library
   - Request appropriate scopes

**Example (JavaScript)**:
```javascript
import { Issuer } from 'openid-client';

const issuer = await Issuer.discover('https://id.ewf-stade.de');

const client = new issuer.Client({
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  redirect_uris: ['https://your-app.com/callback'],
  response_types: ['code'],
});

// Generate authorization URL
const authUrl = client.authorizationUrl({
  scope: 'openid email profile schedule:event:view',
  state: generateRandomState(),
});

// Handle callback
const params = client.callbackParams(req);
const tokenSet = await client.callback('https://your-app.com/callback', params);

// Access user info
const userinfo = await client.userinfo(tokenSet.access_token);
```

### Appendix D: Permission Definitions

See [INTEGRATED_APPS.md](./INTEGRATED_APPS.md) for the complete, authoritative list of permissions for all integrated applications.

### Appendix E: Email Templates

Email templates to be created with Resend:

**Welcome Email** (`welcome.html`):
- Sent on registration
- Includes: Username, getting started guide, support link

**Password Reset** (`password-reset.html`):
- Sent on password reset request
- Includes: Reset link (1-hour expiration), security notice

**Email Verification** (`verify-email.html`):
- Sent when email changes (future feature)
- Includes: Verification link

**Account Deletion Confirmation** (`deletion-confirmation.html`):
- Sent when account deletion requested
- Includes: Grace period info, cancellation link

**Data Export Ready** (`data-export-ready.html`):
- Sent when data export is ready
- Includes: Download link (7-day expiration)

**2FA Enabled** (`2fa-enabled.html`):
- Sent when 2FA is enabled
- Includes: Security tips

**Security Alert** (`security-alert.html`):
- Sent on suspicious activity
- Includes: Activity details, action required

All templates must:
- Be responsive (mobile-friendly)
- Include EWF branding
- Have unsubscribe link (where applicable)
- Be available in DE/EN/UK

### Appendix F: Glossary

- **OIDC**: OpenID Connect, authentication layer on top of OAuth 2.0
- **OAuth 2.0**: Authorization framework
- **JWT**: JSON Web Token
- **TOTP**: Time-based One-Time Password (for 2FA)
- **WebAuthn**: Web Authentication API (for passkeys)
- **PKCE**: Proof Key for Code Exchange (OAuth security extension)
- **DPA**: Data Processing Agreement (GDPR)
- **PII**: Personally Identifiable Information
- **OTEL**: OpenTelemetry
- **RBAC**: Role-Based Access Control
- **SSO**: Single Sign-On
- **IdP**: Identity Provider
- **SP**: Service Provider (relying party)

### Appendix G: Related Documents

- [INTEGRATED_APPS.md](./INTEGRATED_APPS.md) - Integrated applications and their permission structures
- [FRONTEND_SKILL.md](./FRONTEND_SKILL.md) - Frontend design guidelines
- `README.md` - Project overview and quick start
- `.env.example` - Example environment variables
- `CONTRIBUTING.md` (to be created) - Contribution guidelines

### Appendix H: Change Log

**v1.0.0** - Initial specification

---

## Approval & Sign-off

**Prepared by**: AI Development Assistant  
**Date**: 2025-01-XX  
**Status**: Draft - Awaiting Review

**Review Required by**:
- [ ] Project Lead
- [ ] Technical Lead
- [ ] Security Officer
- [ ] Compliance Officer

---

**End of Specification**

This specification serves as the authoritative document for the EWF-ID project implementation. All development should reference and adhere to this specification.

For questions or clarifications, contact: devs@ewf-stade.de