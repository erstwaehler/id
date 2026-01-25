# EWF-ID Implementation Specification

**Version:** 2.0.0  
**Last Updated:** 2025-01-XX  
**Status:** Active Development  
**Format:** AI Agent Task & Phase Plan

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
5. [Phase 2: Authentication & Authorization](#phase-2-authentication--authorization)
6. [Phase 3: User Management](#phase-3-user-management)
7. [Phase 4: Plugin System](#phase-4-plugin-system)
8. [Phase 5: API Implementation](#phase-5-api-implementation)
9. [Phase 6: Frontend & UI](#phase-6-frontend--ui)
10. [Phase 7: Monitoring & Observability](#phase-7-monitoring--observability)
11. [Phase 8: Privacy & Compliance](#phase-8-privacy--compliance)
12. [Phase 9: Testing & Quality](#phase-9-testing--quality)
13. [Phase 10: Production Deployment](#phase-10-production-deployment)
14. [Technical References](#technical-references)

---

## 1. Project Overview

**EWF-ID** is a centralized OpenID Connect (OIDC) provider for the Erstwähler Forum (EWF) initiative in Stade, Germany. It provides secure authentication and authorization for students, teachers, and team members across all EWF applications.

### Core Requirements

- **Primary Users**: Students from three schools (Athenaeum, VLG, IGS), teachers, EWF team members, administrators
- **Languages**: German (default), English, Ukrainian
- **Compliance**: GDPR-compliant with full audit trails
- **Uptime Target**: 99.9%
- **Authentication Methods**: Email/Password, School OIDC, Passkeys (WebAuthn), 2FA
- **Role Hierarchy**: User → Student → Team → Admin

### Key Principles

1. Security first - all flows secure by default
2. Privacy by design - GDPR compliance built-in
3. Comprehensive observability - OTEL everywhere possible
4. Product analytics for user behavior insights
5. Feature flag driven development

---

## 2. Technology Stack

### Core Framework & Runtime
- **Framework**: TanStack Start (React-based)
- **Runtime**: Node.js on Vercel
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Package Manager**: bun

### State Management & Data Fetching
- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand
- **Form Management**: React Hook Form
- **Form Validation**: Zod

### Authentication & Database
- **Authentication**: Better Auth v1.x
- **Database**: Neon.tech (PostgreSQL)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit

### UI & Styling
- **Component Library**: Shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Design System**: Custom EWF theme

### Internationalization
- **i18n Library**: Inlang Paraglide
- **Message Compiler**: Paraglide Compiler
- **Supported Locales**: de (default), en, uk

### Email
- **Email Service**: Resend
- **Email Templates**: React Email (NOT raw HTML)

### Observability & Analytics
- **Tracing**: OpenTelemetry (Effect.ts integration)
- **Logging**: Axiom
- **Analytics**: PostHog (product analytics + feature flags)
- **Error Tracking**: PostHog exceptions with OTEL trace IDs

### Feature Management
- **Feature Flags**: Vercel Flags SDK + PostHog
- **Toolbar**: Vercel Toolbar (development)

### Security & Compliance
- **Password Checking**: Have I Been Pwned API
- **CAPTCHA**: Turnstile (Cloudflare)
- **Rate Limiting**: Better Auth + Upstash Redis
- **Cookie Consent**: Custom cookie banner

### Development Tools
- **Linting/Formatting**: Biome
- **Component Development**: Storybook
- **Testing**: Vitest + Testing Library
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel

---

## 3. Architecture & Data Flow

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Applications                        │
│  (schedule.ewf-stade.de, screens.ewf-stade.de, etc.)       │
└────────────────────┬────────────────────────────────────────┘
                     │ OIDC/OAuth 2.0
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      EWF-ID (id.ewf-stade.de)               │
├─────────────────────────────────────────────────────────────┤
│  Frontend (TanStack Start)                                   │
│  ├─ Public Pages (Login, Register, Legal)                   │
│  ├─ User Pages (Profile, Settings, Devices)                 │
│  ├─ Admin Pages (User Management, Analytics)                │
│  └─ Error Pages (404, 500)                                  │
├─────────────────────────────────────────────────────────────┤
│  Backend APIs                                                │
│  ├─ Better Auth Endpoints                                   │
│  ├─ OIDC Standard Endpoints (.well-known, authorize, token) │
│  ├─ User Management APIs                                    │
│  ├─ Admin APIs (team/admin protected)                       │
│  └─ Health Check & Monitoring                               │
├─────────────────────────────────────────────────────────────┤
│  Middleware & Services                                       │
│  ├─ OTEL Instrumentation (Effect.ts)                        │
│  ├─ Feature Flags (Vercel + PostHog)                        │
│  ├─ Session Management                                      │
│  ├─ Permission Checking                                     │
│  └─ Audit Logging                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        ▼             ▼             ▼              ▼
   ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
   │  Neon   │  │ Resend  │  │ PostHog  │  │  Axiom   │
   │(Postgres)│  │(Email)  │  │(Analytics)│ │(Logs)    │
   └─────────┘  └─────────┘  └──────────┘  └──────────┘
        │
        ▼
   ┌──────────────────┐
   │ School OIDC      │
   │ Providers        │
   │ (Athenaeum, etc.)│
   └──────────────────┘
```

### Data Flow Patterns

#### Registration Flow
1. User initiates registration via school OIDC provider
2. OTEL span created for entire flow
3. School authenticates user, returns profile data
4. Better Auth creates account with school metadata
5. PostHog captures `user_registered` event
6. Welcome email sent via React Email + Resend
7. Audit log entry created

#### Authentication Flow
1. User submits credentials
2. OTEL span tracks authentication attempt
3. Better Auth validates credentials
4. 2FA challenge if enabled
5. Session created with JWT
6. PostHog captures `user_signed_in` event
7. Last login method stored
8. Audit log entry created

#### Authorization Flow (OIDC Client)
1. Client app redirects to `/authorize`
2. User authenticates (if not already)
3. Consent screen shown (first time)
4. Authorization code generated
5. Client exchanges code for tokens
6. Access token includes custom claims (roles, school, permissions)
7. PostHog captures `oidc_authorization` event
8. Audit log entry created

---

## Phase 1: Foundation Setup

### Task 1.1: Project Initialization
**Objective**: Set up base project structure with all required tools

**Actions**:
1. Initialize TanStack Start project with TypeScript
2. Configure pnpm workspace if needed
3. Set up Biome for linting/formatting
4. Configure TypeScript strict mode
5. Remove all TanStack Start boilerplate (demos, sidebar examples)
6. Set up Git repository with proper .gitignore

**Acceptance Criteria**:
- Clean project structure without boilerplate
- Biome runs without errors
- TypeScript strict mode enabled
- Development server starts successfully

### Task 1.2: Database Setup
**Objective**: Configure Neon PostgreSQL with Drizzle ORM

**Actions**:
1. Install Drizzle ORM and Drizzle Kit
2. Create database connection configuration
3. Set up Drizzle config file with Neon credentials
4. Create initial schema for Better Auth tables
5. Create custom tables:
   - `schools` (id, name, oidc_config, enabled)
   - `user_schools` (user_id, school_id, student_id, verified_at)
   - `audit_logs` (id, user_id, action, resource, metadata, ip, trace_id, created_at)
   - `api_keys` (id, user_id, name, key_hash, permissions, last_used, expires_at)
   - `plugin_settings` (plugin_id, user_id, settings)
6. Create migration scripts
7. Set up seed data for development

**Acceptance Criteria**:
- Database migrations run successfully
- All tables created with proper indexes
- Seed data includes test schools and users
- Connection pooling configured

### Task 1.3: Environment Configuration
**Objective**: Set up all required environment variables

**Actions**:
1. Create `.env.example` template
2. Document all required variables:
   ```
   # Database
   DATABASE_URL=
   
   # Better Auth
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=
   
   # Email
   RESEND_API_KEY=
   EMAIL_FROM=
   
   # Observability
   AXIOM_TOKEN=
   AXIOM_DATASET=
   OTEL_EXPORTER_OTLP_ENDPOINT=
   POSTHOG_API_KEY=
   POSTHOG_HOST=
   
   # Vercel
   VERCEL_API_TOKEN=
   
   # Security
   TURNSTILE_SECRET_KEY=
   TURNSTILE_SITE_KEY=
   HIBP_API_KEY=
   
   # School OIDC (per school)
   SCHOOL_ATHENAEUM_CLIENT_ID=
   SCHOOL_ATHENAEUM_CLIENT_SECRET=
   SCHOOL_ATHENAEUM_ISSUER=
   # ... repeat for VLG, IGS
   ```
3. Configure Vercel environment variables
4. Set up local development .env

**Acceptance Criteria**:
- All services can authenticate with environment variables
- .env.example is complete and documented
- Secrets are never committed to Git

### Task 1.4: Better Auth Configuration
**Objective**: Initialize Better Auth with all required plugins

**Actions**:
1. Install Better Auth and required plugins
2. Create auth configuration file
3. Enable plugins:
   - Two-Factor Authentication
   - Admin Plugin
   - API Key Management
   - Bearer Token Support
   - Device Authorization (OAuth 2.0 device flow)
   - CAPTCHA (Turnstile)
   - Rate Limiting
   - Multi-Session Management
   - One-Time Tokens
   - JWT Plugin
4. Configure session settings:
   - Session lifetime: 30 days
   - Refresh token rotation
   - Secure cookies (httpOnly, sameSite, secure in production)
5. Configure password policy:
   - Minimum 12 characters
   - Must include uppercase, lowercase, number
   - Check against HIBP database
6. Set up custom user model with additional fields:
   - `locale` (de/en/uk)
   - `picture` (avatar URL)
   - `roles` (array)
   - `permissions` (array)
   - `school_verified` (boolean)
   - `last_login_method` (string)

**Acceptance Criteria**:
- Better Auth initializes without errors
- All plugins are active
- Sessions persist correctly
- Password validation works with HIBP

---

## Phase 2: Authentication & Authorization

### Task 2.1: Email/Password Authentication
**Objective**: Implement basic email/password auth flow

**Actions**:
1. Create login page with React Hook Form
2. Implement form validation with Zod
3. Add Turnstile CAPTCHA after 3 failed attempts
4. Create registration page
5. Implement email verification flow using React Email templates
6. Add password reset flow with React Email templates
7. Store last login method in user profile
8. Instrument all flows with OTEL spans using Effect.ts
9. Track PostHog events:
   - `user_registered`
   - `user_signed_in`
   - `user_signed_out`
   - `email_verified`
   - `password_reset_requested`
   - `password_reset_completed`
10. Create audit log entries for all auth events

**Acceptance Criteria**:
- Users can register with email/password
- Email verification works
- Password reset works
- CAPTCHA appears after failed attempts
- All events tracked in PostHog
- All flows have OTEL traces
- Audit logs created

### Task 2.2: School OIDC Authentication
**Objective**: Enable SSO with school identity providers

**Actions**:
1. Create OIDC client configurations for each school
2. Implement OIDC callback handler
3. Extract and map school user data:
   - `sub` → unique school student ID
   - `email` → user email
   - `given_name`, `family_name` → name fields
   - Custom claims for school metadata
4. Create or link user account on successful auth
5. Store school relationship in `user_schools` table
6. Mark account as `school_verified`
7. Add school badge/indicator in UI
8. Instrument with OTEL
9. Track PostHog events:
   - `school_sso_initiated`
   - `school_sso_completed`
   - `school_sso_failed`

**Acceptance Criteria**:
- Users can sign in via school OIDC
- School metadata correctly stored
- Existing users can link school accounts
- OTEL traces complete
- PostHog events tracked

### Task 2.3: Passkey (WebAuthn) Support
**Objective**: Enable passwordless authentication with passkeys

**Actions**:
1. Configure WebAuthn in Better Auth
2. Create passkey registration UI
3. Create passkey authentication UI
4. Support multiple passkeys per user
5. Add passkey management page (list, rename, delete)
6. Instrument with OTEL
7. Track PostHog events:
   - `passkey_registered`
   - `passkey_authentication`
   - `passkey_removed`

**Acceptance Criteria**:
- Users can register passkeys
- Users can authenticate with passkeys
- Multiple passkeys supported
- Management UI functional

### Task 2.4: Two-Factor Authentication (2FA)
**Objective**: Add TOTP-based 2FA for enhanced security

**Actions**:
1. Create 2FA setup page with QR code
2. Implement TOTP verification
3. Generate backup codes
4. Add 2FA requirement for sensitive operations
5. Create 2FA management UI
6. Instrument with OTEL
7. Track PostHog events:
   - `2fa_enabled`
   - `2fa_disabled`
   - `2fa_challenge_passed`
   - `2fa_challenge_failed`
   - `2fa_backup_code_used`

**Acceptance Criteria**:
- Users can enable/disable 2FA
- TOTP verification works
- Backup codes can be regenerated
- 2FA required for admin actions

### Task 2.5: Role-Based Access Control (RBAC)
**Objective**: Implement comprehensive permission system

**Actions**:
1. Define role hierarchy:
   ```typescript
   enum Role {
     USER = 'user',          // Base role (all authenticated users)
     STUDENT = 'student',    // School-verified students
     TEAM = 'team',          // EWF team members
     ADMIN = 'admin'         // System administrators
   }
   ```
2. Define permission structure:
   ```typescript
   type Permission = 
     | 'users:read'
     | 'users:write'
     | 'users:delete'
     | 'admin:access'
     | 'admin:manage'
     | 'screens:manage'
     | 'events:manage'
     | 'oidc:admin'
     | 'audit:read'
     | 'analytics:read'
   ```
3. Create permission checking utilities
4. Implement role assignment (admin only)
5. Create middleware for route protection:
   - `/admin/*` routes require `team` role
   - POST/PUT/DELETE on `/admin/*` require `admin` role
6. Add permission-based UI rendering
7. Create permission management UI (admin only)

**Acceptance Criteria**:
- Role hierarchy enforced
- Permissions checked on all protected routes
- UI adapts based on user permissions
- Admin can assign/revoke roles

### Task 2.6: Session Management
**Objective**: Implement robust multi-device session handling

**Actions**:
1. Create session model with metadata:
   - Device name/type
   - IP address
   - Last activity
   - User agent
2. Implement session listing page
3. Add "current session" indicator
4. Add session revocation (individual or all)
5. Implement session activity tracking
6. Add session security alerts for suspicious activity
7. Configure session limits per user (feature flag)
8. Instrument with OTEL
9. Track PostHog events:
   - `session_created`
   - `session_revoked`
   - `session_expired`
   - `suspicious_session_detected`

**Acceptance Criteria**:
- Users can see all active sessions
- Users can revoke sessions
- Session metadata accurate
- Security alerts triggered appropriately

---

## Phase 3: User Management

### Task 3.1: User Profile Pages
**Objective**: Create comprehensive user profile management

**Actions**:
1. Create profile overview page showing:
   - Basic info (name, email, avatar)
   - School affiliation (if applicable)
   - Account created date
   - Roles and permissions
   - Statistics (logins, last activity)
2. Create profile edit page with React Hook Form:
   - Name fields
   - Email (requires verification if changed)
   - Language preference
   - Avatar upload
3. Create security settings page:
   - Change password
   - Enable/disable 2FA
   - Manage passkeys
   - View active sessions
4. Create privacy settings page:
   - Data export request
   - Account deletion request
   - Privacy preferences
5. Create connected accounts page:
   - Linked school accounts
   - Connected OIDC providers
   - Link/unlink options
6. Use TanStack Query for all data fetching
7. Use Zustand for local UI state
8. Instrument with OTEL
9. Track PostHog events for all profile actions

**Acceptance Criteria**:
- All profile pages functional
- Forms validate correctly
- Changes persist to database
- Real-time updates with TanStack Query
- OTEL traces complete

### Task 3.2: Admin User Management Dashboard
**Objective**: Build comprehensive admin interface for user management

**Actions**:
1. Create admin dashboard layout with navigation
2. Implement user list with features:
   - Search by name/email/school
   - Filter by role, verification status, school
   - Sort by created date, last login
   - Pagination (50 users per page)
   - Bulk selection
3. Create user detail modal showing:
   - Complete user profile
   - Audit log history
   - Session history
   - Permission assignments
   - Account status
4. Implement user actions (admin role required):
   - Edit user details
   - Assign/revoke roles
   - Grant/revoke permissions
   - Suspend/unsuspend account
   - Reset password (generates temporary password)
   - Delete account (with confirmation)
   - Send email notification
5. Implement bulk operations (feature flag):
   - Bulk role assignment
   - Bulk email notifications
   - Bulk export
6. Add admin analytics dashboard:
   - Total users, new users (weekly/monthly)
   - Users by school
   - Users by role
   - Authentication method distribution
   - Active sessions count
7. Protect with permission checks:
   - `admin:access` for viewing
   - `admin:manage` for modifications
8. Use TanStack Query with optimistic updates
9. Instrument with OTEL
10. Track PostHog events for all admin actions

**Acceptance Criteria**:
- Admin can view and manage all users
- Bulk operations work correctly
- Permission checks enforced
- Analytics dashboard displays correct data
- Optimistic updates provide good UX

### Task 3.3: Account Deletion & Data Export (GDPR)
**Objective**: Implement GDPR-compliant data portability and deletion

**Actions**:
1. Create data export functionality:
   - User profile data
   - Authentication history
   - Session history
   - Audit logs
   - Connected accounts
   - Export format: JSON
2. Implement export request flow:
   - User requests export
   - Background job generates export
   - Email sent with download link (React Email)
   - Link expires after 7 days
3. Create account deletion flow:
   - User requests deletion
   - Confirmation required (email + password/2FA)
   - 30-day grace period before permanent deletion
   - User can cancel deletion during grace period
   - Email notifications at request and completion
4. Implement deletion process:
   - Anonymize audit logs (keep events, remove PII)
   - Delete sessions
   - Delete passkeys
   - Delete API keys
   - Remove user data from external services (PostHog)
   - Mark account as deleted
5. Admin override for immediate deletion
6. Instrument with OTEL
7. Track PostHog events:
   - `data_export_requested`
   - `data_export_downloaded`
   - `account_deletion_requested`
   - `account_deletion_cancelled`
   - `account_deletion_completed`

**Acceptance Criteria**:
- Users can export all their data
- Export contains complete user data
- Deletion flow respects grace period
- Audit logs properly anonymized
- GDPR compliance verified

---

## Phase 4: Plugin System

### Task 4.1: API Key Management Plugin
**Objective**: Enable programmatic API access for users

**Actions**:
1. Create API key generation endpoint
2. Implement API key authentication middleware
3. Create API key management UI:
   - List all API keys
   - Create new key with name and permissions
   - Revoke key
   - View last used timestamp
4. Store keys as bcrypt hashes
5. Set expiration dates (optional)
6. Scope permissions per key
7. Rate limit API key requests
8. Instrument with OTEL
9. Track PostHog events:
   - `api_key_created`
   - `api_key_used`
   - `api_key_revoked`

**Acceptance Criteria**:
- Users can create/manage API keys
- API keys work for authentication
- Keys properly scoped to permissions
- Rate limiting active

### Task 4.2: Device Authorization Plugin
**Objective**: Support OAuth 2.0 device authorization flow

**Actions**:
1. Implement `/device/code` endpoint
2. Implement device verification UI
3. Handle device polling
4. Create device confirmation flow
5. Instrument with OTEL
6. Track PostHog events:
   - `device_auth_initiated`
   - `device_auth_approved`
   - `device_auth_denied`

**Acceptance Criteria**:
- Device flow works end-to-end
- User can approve/deny devices
- Polling respects rate limits

### Task 4.3: University/School Plugin
**Objective**: Extend school management capabilities

**Actions**:
1. Create school management UI (admin only)
2. Add school CRUD operations:
   - Create new school
   - Edit school details
   - Configure OIDC settings
   - Enable/disable school
3. Display school statistics
4. School-specific user filtering
5. Instrument with OTEL

**Acceptance Criteria**:
- Admins can manage schools
- School OIDC configs updateable
- Statistics accurate

### Task 4.4: Localization Plugin Enhancement
**Objective**: Extend i18n capabilities with user preferences

**Actions**:
1. Store user locale preference
2. Auto-detect locale from browser
3. Allow manual locale switching
4. Persist preference across sessions
5. Apply locale to all emails (React Email)
6. Track PostHog events:
   - `locale_changed`

**Acceptance Criteria**:
- Locale persists per user
- All UI respects user locale
- Emails in correct language

---

## Phase 5: API Implementation

### Task 5.1: OIDC Provider Endpoints
**Objective**: Implement full OIDC provider specification

**Actions**:
1. Implement discovery endpoint:
   - `GET /.well-known/openid-configuration`
   - Return provider metadata
2. Implement JWKS endpoint:
   - `GET /.well-known/jwks.json`
   - Return public keys for token verification
3. Implement authorization endpoint:
   - `GET /authorize`
   - Handle authorization requests
   - Show consent screen (first time)
   - Support response types: code, token, id_token
4. Implement token endpoint:
   - `POST /token`
   - Exchange authorization code for tokens
   - Support grant types: authorization_code, refresh_token, client_credentials
5. Implement userinfo endpoint:
   - `GET /userinfo`
   - Return user claims based on scope
6. Implement custom claims:
   ```typescript
   interface CustomClaims {
     sub: string              // User ID
     email: string
     email_verified: boolean
     name: string
     given_name: string
     family_name: string
     locale: string           // de/en/uk
     picture: string          // Avatar URL
     roles: Role[]
     school?: {
       id: string
       name: string
       student_id: string
     }
     permissions: Permission[]
     team_member: boolean
     account_created: string  // ISO timestamp
   }
   ```
7. Implement token refresh logic
8. Add token revocation endpoint
9. Instrument all endpoints with OTEL
10. Track PostHog events:
    - `oidc_authorization_request`
    - `oidc_token_issued`
    - `oidc_token_refreshed`
    - `oidc_userinfo_accessed`

**Acceptance Criteria**:
- All OIDC endpoints functional
- Custom claims included in tokens
- Token refresh works
- Compatible with standard OIDC clients

### Task 5.2: User Management APIs
**Objective**: Create REST APIs for user operations

**Actions**:
1. Implement user endpoints:
   - `GET /api/users/me` - Current user profile
   - `PUT /api/users/me` - Update profile
   - `POST /api/users/me/avatar` - Upload avatar
   - `GET /api/users/me/sessions` - List sessions
   - `DELETE /api/users/me/sessions/:id` - Revoke session
   - `POST /api/users/me/export` - Request data export
   - `POST /api/users/me/delete` - Request deletion
2. Use TanStack Query for client-side integration
3. Validate all inputs with Zod
4. Instrument with OTEL
5. Return proper error responses

**Acceptance Criteria**:
- All endpoints functional
- Input validation works
- Errors properly formatted
- OTEL traces complete

### Task 5.3: Admin APIs
**Objective**: Create admin-only management APIs

**Actions**:
1. Implement admin user endpoints (require `team` role):
   - `GET /api/admin/users` - List users (paginated, filtered)
   - `GET /api/admin/users/:id` - Get user details
   - `GET /api/admin/users/:id/audit-logs` - User audit history
2. Implement admin modification endpoints (require `admin` role):
   - `PUT /api/admin/users/:id` - Update user
   - `POST /api/admin/users/:id/roles` - Assign role
   - `DELETE /api/admin/users/:id/roles/:role` - Revoke role
   - `POST /api/admin/users/:id/suspend` - Suspend account
   - `POST /api/admin/users/:id/unsuspend` - Unsuspend account
   - `DELETE /api/admin/users/:id` - Delete account
   - `POST /api/admin/users/:id/reset-password` - Generate temp password
   - `POST /api/admin/users/:id/notify` - Send notification email
3. Implement bulk endpoints (feature flag):
   - `POST /api/admin/users/bulk/roles` - Bulk role assignment
   - `POST /api/admin/users/bulk/notify` - Bulk notification
   - `POST /api/admin/users/bulk/export` - Bulk export
4. Implement analytics endpoints:
   - `GET /api/admin/analytics/overview` - Dashboard stats
   - `GET /api/admin/analytics/users` - User metrics
   - `GET /api/admin/analytics/authentication` - Auth metrics
5. Enforce permission checks on all routes
6. Instrument with OTEL
7. Track all admin actions in PostHog

**Acceptance Criteria**:
- All admin endpoints functional
- Permission checks enforced correctly
- Bulk operations work (if enabled)
- Analytics return correct data

### Task 5.4: API Key Authentication
**Objective**: Support API key-based authentication for all endpoints

**Actions**:
1. Create API key authentication middleware
2. Accept keys via `Authorization: Bearer <key>` header
3. Validate and rate limit API key requests
4. Scope permissions per key
5. Log API key usage
6. Instrument with OTEL

**Acceptance Criteria**:
- API keys work for authentication
- Rate limiting active
- Permission scoping works

### Task 5.5: Health Check & Monitoring Endpoint
**Objective**: Create comprehensive health check for monitoring

**Actions**:
1. Implement `GET /api/health` endpoint returning:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-15T12:00:00Z",
     "checks": {
       "database": "healthy",
       "email": "healthy",
       "posthog": "healthy",
       "oidc_discovery": "healthy"
     },
     "version": "1.0.0"
   }
   ```
2. Check database connectivity
3. Check external service availability
4. Return 503 if any critical service down
5. Instrument with OTEL

**Acceptance Criteria**:
- Health check returns accurate status
- Used by monitoring systems
- Fails correctly on issues

---

## Phase 6: Frontend & UI

### Task 6.1: Design System Setup
**Objective**: Establish consistent design system with Shadcn/ui

**Actions**:
1. Install Shadcn/ui components:
   ```bash
   pnpm dlx shadcn@latest add button
   pnpm dlx shadcn@latest add input
   pnpm dlx shadcn@latest add form
   pnpm dlx shadcn@latest add card
   pnpm dlx shadcn@latest add dialog
   pnpm dlx shadcn@latest add dropdown-menu
   pnpm dlx shadcn@latest add table
   pnpm dlx shadcn@latest add badge
   pnpm dlx shadcn@latest add avatar
   pnpm dlx shadcn@latest add toast
   pnpm dlx shadcn@latest add select
   pnpm dlx shadcn@latest add checkbox
   pnpm dlx shadcn@latest add radio-group
   pnpm dlx shadcn@latest add tabs
   pnpm dlx shadcn@latest add alert
   pnpm dlx shadcn@latest add separator
   pnpm dlx shadcn@latest add skeleton
   ```
2. Configure Tailwind theme with EWF colors:
   ```javascript
   colors: {
     primary: {...},    // EWF purple
     secondary: {...},  // EWF blue
     accent: {...},     // EWF orange
     // ... etc
   }
   ```
3. Create custom components:
   - `UserAvatar` - with fallback initials
   - `RoleBadge` - styled by role
   - `SchoolBadge` - with school logo
   - `PermissionGuard` - hide content based on permissions
   - `LoadingSpinner` - branded loading state
   - `EmptyState` - for empty lists/pages
   - `ErrorBoundary` - with user-friendly error messages
4. Set up component documentation in Storybook
5. Create component stories for all custom components

**Acceptance Criteria**:
- All Shadcn components installed
- Custom components created and documented
- Storybook running with all components
- Design system consistent across app

### Task 6.2: Layout & Navigation
**Objective**: Create responsive app layout with navigation

**Actions**:
1. Create main layout component with:
   - Header with logo, user menu
   - Mobile-responsive hamburger menu
   - Language switcher
   - Breadcrumbs
2. Create user navigation menu:
   - Profile
   - Settings
   - Security
   - Sessions
   - Privacy
   - Sign out
3. Create admin navigation (role-gated):
   - Dashboard
   - Users
   - Analytics
   - Schools
   - Audit Logs
   - Settings
4. Implement active route highlighting
5. Add keyboard navigation support
6. Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)

**Acceptance Criteria**:
- Layout responsive on all devices
- Navigation accessible via keyboard
- Admin menu only visible to authorized users

### Task 6.3: Public Pages
**Objective**: Create all public-facing pages

**Actions**:
1. Create landing page (`/`):
   - Hero section explaining EWF-ID
   - Feature highlights
   - Call-to-action (Sign in / Register)
   - Links to legal pages
2. Create login page (`/login`):
   - Email/password form (React Hook Form)
   - School OIDC buttons
   - Passkey option
   - "Forgot password?" link
   - "Register" link
   - Turnstile CAPTCHA (conditional)
3. Create registration page (`/register`):
   - Email registration form
   - School OIDC registration
   - Terms acceptance checkbox
   - Privacy policy link
4. Create password reset pages:
   - Request page (`/reset-password`)
   - Reset form page (`/reset-password/:token`)
5. Create email verification page (`/verify-email/:token`)
6. Create error pages:
   - 404 Not Found page (custom design)
   - 500 Server Error page
   - 403 Forbidden page
7. All forms use React Hook Form + Zod
8. Add Storybook stories for all pages

**Acceptance Criteria**:
- All public pages functional
- Forms validate correctly
- Error pages show appropriate messages
- Responsive on all devices
- Storybook stories complete

### Task 6.4: Authenticated User Pages
**Objective**: Create user-facing authenticated pages

**Actions**:
1. Create dashboard (`/dashboard`):
   - Welcome message
   - Recent activity
   - Quick actions
2. Create profile page (`/profile`):
   - View/edit profile
   - Upload avatar
   - School affiliation display
3. Create settings page (`/settings`):
   - Account settings
   - Language preference
   - Email preferences
4. Create security page (`/security`):
   - Change password
   - 2FA management
   - Passkey management
   - API keys (if applicable)
5. Create sessions page (`/sessions`):
   - List active sessions
   - Session details
   - Revoke options
6. Create privacy page (`/privacy`):
   - Data export button
   - Account deletion button
   - Privacy preferences
7. Use TanStack Query for data fetching
8. Implement optimistic updates with Zustand
9. Add loading states (Skeleton components)
10. Add Storybook stories

**Acceptance Criteria**:
- All pages functional
- Real-time data updates
- Loading states smooth
- Error handling robust

### Task 6.5: Admin Pages
**Objective**: Create comprehensive admin interface

**Actions**:
1. Create admin dashboard (`/admin`):
   - Statistics cards
   - Charts (users over time, by school, by role)
   - Recent activity feed
   - Quick actions
2. Create user management page (`/admin/users`):
   - Searchable, filterable, sortable table
   - Bulk selection
   - User detail modal
   - Action buttons (edit, suspend, delete)
3. Create user detail page (`/admin/users/:id`):
   - Full user profile
   - Edit form
   - Role/permission management
   - Session history
   - Audit log
4. Create analytics page (`/admin/analytics`):
   - Detailed metrics
   - Charts and graphs
   - Export functionality
5. Create schools page (`/admin/schools`):
   - School list
   - CRUD operations
   - OIDC configuration
6. Create audit logs page (`/admin/audit-logs`):
   - Filterable log viewer
   - Export logs
7. Protect all pages with permission guards
8. Use TanStack Query for data
9. Add Storybook stories

**Acceptance Criteria**:
- All admin pages functional
- Permission checks enforced
- Data updates correctly
- Bulk operations work

### Task 6.6: Legal & Compliance Pages
**Objective**: Create GDPR-compliant legal pages

**Actions**:
1. Create privacy policy page (`/privacy-policy`):
   - Data collection practices
   - Data usage
   - User rights
   - Contact information
   - Subprocessor list
2. Create terms of service page (`/terms`):
   - Service description
   - User obligations
   - Liability limitations
   - Termination conditions
3. Create cookie policy page (`/cookies`):
   - Cookie usage explanation
   - Cookie types
   - Opt-out instructions
4. Create imprint page (`/impressum`):
   - Legal entity information
   - Contact details
   - Regulatory information
5. Create Digital Independence Day page (`/digital-independence`):
   - EWF mission
   - Why digital sovereignty matters
   - How EWF-ID supports independence
6. Ensure all pages are internationalized
7. Add last updated dates
8. Add Storybook stories

**Acceptance Criteria**:
- All legal pages complete
- Content in all languages
- Accessible and readable

### Task 6.7: Cookie Consent Banner
**Objective**: Implement GDPR-compliant cookie consent

**Actions**:
1. Create cookie banner component:
   - Appears on first visit
   - Explains cookie usage
   - Options: Accept All, Reject All, Customize
2. Create cookie preferences dialog:
   - Essential cookies (always on)
   - Analytics cookies (PostHog)
   - Preference cookies
3. Store consent in localStorage
4. Respect consent for PostHog initialization
5. Add cookie settings link in footer
6. Track consent events in PostHog (if analytics accepted)
7. Add Storybook story

**Acceptance Criteria**:
- Banner appears on first visit
- Consent persisted correctly
- PostHog respects consent
- Can change preferences later

### Task 6.8: Internationalization Implementation
**Objective**: Full i18n support with Paraglide

**Actions**:
1. Set up Paraglide compiler
2. Create message files:
   - `messages/de.json` (German - default)
   - `messages/en.json` (English)
   - `messages/uk.json` (Ukrainian)
3. Translate all UI strings
4. Translate all email templates (React Email)
5. Translate error messages
6. Implement language switcher component
7. Detect browser language on first visit
8. Persist language preference
9. Update HTML lang attribute dynamically

**Acceptance Criteria**:
- All strings translated
- Language switcher works
- Emails in correct language
- No missing translations

### Task 6.9: Responsive Design & Accessibility
**Objective**: Ensure app works on all devices and is accessible

**Actions**:
1. Test all pages on mobile, tablet, desktop
2. Implement responsive navigation
3. Ensure touch targets are at least 44x44px
4. Add proper ARIA labels
5. Ensure keyboard navigation works everywhere
6. Test with screen readers
7. Ensure color contrast meets WCAG AA
8. Add focus indicators
9. Ensure forms are accessible
10. Add skip links

**Acceptance Criteria**:
- All pages responsive
- WCAG AA compliance verified
- Keyboard navigation complete
- Screen reader compatible

---

## Phase 7: Monitoring & Observability

### Task 7.1: OpenTelemetry Setup with Effect.ts
**Objective**: Implement comprehensive distributed tracing

**Actions**:
1. Install OpenTelemetry packages:
   - `@opentelemetry/sdk-node`
   - `@opentelemetry/auto-instrumentations-node`
   - `@opentelemetry/exporter-trace-otlp-http`
   - `@effect/opentelemetry`
2. Configure OTEL SDK with Axiom exporter:
   ```typescript
   import { NodeSDK } from '@opentelemetry/sdk-node'
   import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
   import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
   
   const sdk = new NodeSDK({
     traceExporter: new OTLPTraceExporter({
       url: 'https://api.axiom.co/v1/traces',
       headers: {
         'Authorization': `Bearer ${process.env.AXIOM_TOKEN}`,
         'X-Axiom-Dataset': process.env.AXIOM_DATASET,
       },
     }),
     instrumentations: [getNodeAutoInstrumentations()],
   })
   
   sdk.start()
   ```
3. Integrate Effect.ts OTEL module:
   ```typescript
   import * as Otel from '@effect/opentelemetry'
   import { Effect } from 'effect'
   
   const program = Effect.gen(function* (_) {
     yield* _(Effect.logInfo('Starting operation'))
     // ... operation code
   })
   
   const traced = program.pipe(
     Effect.withSpan('operation-name', { attributes: { userId: 'xxx' } })
   )
   ```
4. Instrument critical paths:
   - All authentication flows
   - All API endpoints
   - Database queries
   - External API calls (Resend, PostHog, schools)
   - Session operations
   - OIDC flows
5. Add custom spans with attributes:
   ```typescript
   span.setAttribute('user.id', userId)
   span.setAttribute('user.role', role)
   span.setAttribute('school.id', schoolId)
   span.setAttribute('operation.type', 'authentication')
   ```
6. Propagate trace context across service boundaries
7. Use Effect.ts everywhere possible for automatic instrumentation

**Acceptance Criteria**:
- OTEL SDK configured correctly
- Traces appear in Axiom
- Effect.ts integrated throughout codebase
- All critical paths instrumented
- Trace context propagates correctly

### Task 7.2: PostHog Integration
**Objective**: Implement product analytics and feature flags

**Actions**:
1. Install PostHog:
   ```bash
   pnpm add posthog-js posthog-node
   ```
2. Configure PostHog client-side:
   ```typescript
   import posthog from 'posthog-js'
   
   if (typeof window !== 'undefined') {
     posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
       api_host: 'https://eu.posthog.com',
       person_profiles: 'identified_only',
       capture_pageview: true,
       capture_pageleave: true,
       autocapture: true,
       disable_session_recording: false, // Enable session replay
       loaded: (posthog) => {
         if (process.env.NODE_ENV === 'development') {
           posthog.debug()
         }
       },
     })
   }
   ```
3. Identify users after authentication:
   ```typescript
   posthog.identify(user.id, {
     email: user.email,
     name: user.name,
     role: user.roles[0],
     school: user.school?.name,
   })
   ```
4. Implement product analytics events:
   - `user_registered` - with method (email/school/passkey)
   - `user_signed_in` - with method and success/failure
   - `user_signed_out`
   - `email_verified`
   - `password_reset_requested`
   - `password_reset_completed`
   - `2fa_enabled` / `2fa_disabled`
   - `passkey_registered` / `passkey_removed`
   - `school_sso_initiated` / `school_sso_completed`
   - `session_revoked`
   - `api_key_created` / `api_key_revoked`
   - `profile_updated`
   - `avatar_uploaded`
   - `locale_changed`
   - `data_export_requested` / `data_export_downloaded`
   - `account_deletion_requested` / `account_deletion_completed`
   - `oidc_authorization_request` / `oidc_token_issued`
   - `admin_user_created` / `admin_user_updated` / `admin_user_deleted`
   - `admin_role_assigned` / `admin_role_revoked`
   - `cookie_consent_given` / `cookie_consent_changed`
5. Implement feature flags with Vercel Flags SDK + PostHog:
   ```typescript
   import { get } from '@vercel/flags'
   
   const FLAGS = {
     MULTI_SESSION: 'multi-session-management',
     BULK_OPERATIONS: 'admin-bulk-operations',
     DEVICE_AUTH: 'oauth-device-flow',
     BETA_FEATURES: 'beta-features',
   }
   
   // In component
   const bulkOpsEnabled = await get(FLAGS.BULK_OPERATIONS)
   ```
6. Add Vercel Toolbar for development:
   ```typescript
   import { VercelToolbar } from '@vercel/toolbar/next'
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           {process.env.NODE_ENV === 'development' && <VercelToolbar />}
         </body>
       </html>
     )
   }
   ```
7. Implement exception tracking with OTEL trace IDs:
   ```typescript
   import { trace } from '@opentelemetry/api'
   import posthog from 'posthog-js'
   
   function captureException(error: Error, context?: Record<string, any>) {
     const span = trace.getActiveSpan()
     const traceId = span?.spanContext().traceId
     
     posthog.capture('$exception', {
       error: error.message,
       stack: error.stack,
       traceId, // Link to OTEL trace
       userId: user?.id,
       context: {
         ...context,
         operation: 'your-operation',
       },
     })
   }
   ```

**Acceptance Criteria**:
- PostHog configured correctly
- All required events tracked
- Feature flags work with Vercel SDK
- Vercel Toolbar visible in development
- Exceptions include OTEL trace IDs
- Session replay functional

### Task 7.3: Axiom Logging
**Objective**: Implement structured logging to Axiom

**Actions**:
1. Install Axiom client
2. Create logger utility with levels:
   - `debug` - development information
   - `info` - general information
   - `warn` - warning conditions
   - `error` - error conditions
   - `fatal` - critical failures
3. Implement structured logging:
   ```typescript
   interface LogContext {
     userId?: string
     traceId?: string
     spanId?: string
     operation?: string
     [key: string]: any
   }
   
   const logger = {
     debug: (message: string, context?: LogContext) => {...},
     info: (message: string, context?: LogContext) => {...},
     warn: (message: string, context?: LogContext) => {...},
     error: (message: string, context?: LogContext) => {...},
     fatal: (message: string, context?: LogContext) => {...},
   }
   ```
4. Include OTEL trace IDs in logs:
   ```typescript
   const span = trace.getActiveSpan()
   const traceId = span?.spanContext().traceId
   
   logger.info('User authenticated', {
     userId: user.id,
     traceId,
     operation: 'authentication',
   })
   ```
5. Log categories:
   - **Auth**: login, logout, registration, verification
   - **Admin**: user management actions
   - **Security**: suspicious activity, rate limits
   - **OIDC**: authorization, token issuance
   - **System**: startup, shutdown, health checks
   - **Error**: exceptions, failures
6. Configure log levels per environment

**Acceptance Criteria**:
- Logs appear in Axiom
- Structured logging works
- Trace IDs included
- Log levels respected

### Task 7.4: Audit Logging
**Objective**: Comprehensive audit trail for compliance

**Actions**:
1. Create audit log model:
   ```typescript
   interface AuditLogEntry {
     id: string
     timestamp: Date
     userId?: string
     action: string          // e.g., 'user.created', 'role.assigned'
     resource: string        // e.g., 'user:123', 'session:abc'
     resourceId?: string
     metadata: Record<string, any>
     ip: string
     userAgent: string
     traceId?: string        // Link to OTEL trace
     result: 'success' | 'failure'
   }
   ```
2. Implement audit logging for:
   - User registration, login, logout
   - Password changes, resets
   - 2FA changes
   - Profile updates
   - Role assignments/revocations
   - Permission changes
   - Account suspension/deletion
   - Admin actions on users
   - OIDC authorizations
   - API key creation/revocation
   - Session revocations
   - Data exports
3. Create audit log viewer in admin panel:
   - Filter by user, action, date range
   - Search functionality
   - Export to CSV
4. Set retention policy: 2 years
5. Anonymize on user deletion (remove PII, keep events)

**Acceptance Criteria**:
- All actions audited
- Audit viewer functional
- Export works
- Anonymization on deletion

### Task 7.5: Alerting Configuration
**Objective**: Set up alerts for critical events

**Actions**:
1. Configure Axiom alerts:
   - Error rate > 5% for 5 minutes
   - Failed login attempts > 100/hour for single IP
   - Database connection failures
   - External service failures (Resend, PostHog)
   - OIDC endpoint errors > 10/minute
2. Configure PostHog alerts:
   - Significant drop in daily active users
   - Spike in exceptions
   - Failed registrations > 20% of attempts
3. Set up alert channels:
   - Email notifications
   - Webhook to monitoring dashboard
4. Test alert delivery

**Acceptance Criteria**:
- Alerts configured correctly
- Notifications received on triggers
- Alert thresholds appropriate

### Task 7.6: Monitoring Dashboards
**Objective**: Create operational dashboards

**Actions**:
1. Create Axiom dashboard with panels:
   - Request rate (by endpoint)
   - Error rate (by endpoint)
   - Response time percentiles (p50, p95, p99)
   - Database query performance
   - Authentication success/failure rates
   - OIDC flow success rates
   - Active sessions count
2. Create PostHog dashboard with insights:
   - Daily/weekly/monthly active users
   - New user registrations (by method)
   - Authentication method distribution
   - Feature adoption (2FA, passkeys)
   - User retention cohorts
   - OIDC client usage
   - Admin activity
3. Create custom admin analytics page pulling from both

**Acceptance Criteria**:
- Dashboards accessible
- Data accurate and real-time
- Visualizations clear

---

## Phase 8: Privacy & Compliance

### Task 8.1: GDPR Compliance Implementation
**Objective**: Ensure full GDPR compliance

**Actions**:
1. Implement data minimization:
   - Only collect necessary data
   - Justify each data field
2. Implement purpose limitation:
   - Clear purposes for each data type
   - Don't use data for unintended purposes
3. Implement storage limitation:
   - Set retention periods
   - Automated deletion of expired data
4. Implement data accuracy:
   - Allow users to update their data
   - Verify email addresses
5. Implement integrity & confidentiality:
   - Encrypt sensitive data
   - Secure authentication
   - Regular security audits
6. Implement accountability:
   - Document data processing
   - Maintain processing records
   - DPA with subprocessors

**Acceptance Criteria**:
- GDPR principles implemented
- Documentation complete
- User rights accessible

### Task 8.2: Privacy Policy & Legal Pages
**Objective**: Create comprehensive legal documentation

**Actions**:
1. Write privacy policy covering:
   - Data controller information
   - Data collected and purposes
   - Legal basis for processing
   - Data retention periods
   - User rights (access, rectification, erasure, portability, objection)
   - Third-party data processors (subprocessors)
   - International data transfers
   - Security measures
   - Cookie usage
   - Contact information for privacy inquiries
   - Right to lodge complaint with supervisory authority
2. Write terms of service covering:
   - Service description
   - User eligibility (age requirements)
   - Account creation and security
   - Acceptable use policy
   - Intellectual property
   - Liability limitations
   - Indemnification
   - Termination conditions
   - Governing law and jurisdiction
   - Changes to terms
3. Write cookie policy
4. Create impressum (legal notice)
5. Translate all documents to de/en/uk
6. Add "last updated" dates
7. Require acceptance on registration

**Acceptance Criteria**:
- All legal pages complete and accurate
- Reviewed by legal counsel (if available)
- Translations complete
- Users must accept on registration

### Task 8.3: Subprocessor Documentation
**Objective**: Document all third-party data processors

**Actions**:
1. Create subprocessor list:
   - **Vercel** (hosting) - USA - Privacy Shield certified
   - **Neon** (database) - USA - GDPR compliant
   - **Resend** (email) - USA - GDPR compliant
   - **PostHog** (analytics) - EU option - GDPR compliant
   - **Axiom** (logging) - EU/USA - GDPR compliant
   - **Cloudflare** (Turnstile) - USA/EU - GDPR compliant
2. Document data processing agreements (DPA)
3. Ensure all processors are GDPR compliant
4. Add to privacy policy
5. Notify users of changes to subprocessors

**Acceptance Criteria**:
- Subprocessor list complete
- DPAs in place
- Privacy policy updated

### Task 8.4: User Rights Implementation
**Objective**: Enable all GDPR user rights

**Actions**:
1. **Right to Access**: Data export functionality (already in Phase 3)
2. **Right to Rectification**: Profile editing (already in Phase 3)
3. **Right to Erasure**: Account deletion (already in Phase 3)
4. **Right to Data Portability**: JSON export (already in Phase 3)
5. **Right to Object**: Opt-out of analytics in cookie banner
6. **Right to Restrict Processing**: Account suspension option
7. Create contact form for rights requests
8. Document response procedures (30-day deadline)

**Acceptance Criteria**:
- All rights implementable through UI or support
- Response procedures documented
- Timelines tracked

---

## Phase 9: Testing & Quality

### Task 9.1: Storybook Setup
**Objective**: Document all custom components in Storybook

**Actions**:
1. Install Storybook:
   ```bash
   pnpm dlx storybook@latest init
   ```
2. Configure Storybook for TanStack Start
3. Create stories for all custom components:
   - UserAvatar
   - RoleBadge
   - SchoolBadge
   - PermissionGuard
   - LoadingSpinner
   - EmptyState
   - ErrorBoundary
   - Cookie banner
   - Language switcher
   - Navigation components
4. Create stories for all page components:
   - Login page
   - Registration page
   - Profile pages
   - Admin pages
   - Error pages (404, 500)
5. Add interaction tests in Storybook
6. Document component props and usage
7. Deploy Storybook to Vercel

**Acceptance Criteria**:
- All custom components in Storybook
- All pages have stories
- Interactive documentation
- Deployed and accessible

### Task 9.2: Unit Testing
**Objective**: Test critical business logic

**Actions**:
1. Set up Vitest
2. Write unit tests for:
   - Permission checking utilities
   - Role hierarchy logic
   - OIDC claim generation
   - Token validation
   - Password validation
   - Email validation
   - Session management utilities
   - Audit log utilities
3. Aim for >80% coverage on utilities
4. Mock external services
5. Run tests in CI/CD

**Acceptance Criteria**:
- Critical logic tested
- Tests pass consistently
- Coverage >80% on tested modules

### Task 9.3: Integration Testing
**Objective**: Test API endpoints and flows

**Actions**:
1. Set up integration test environment
2. Write integration tests for:
   - Authentication flows (email, OIDC, passkeys)
   - Registration flows
   - Password reset flow
   - 2FA enrollment and verification
   - Session management
   - OIDC authorization flow
   - Admin user management
   - API key authentication
3. Use test database
4. Clean up after tests
5. Run in CI/CD

**Acceptance Criteria**:
- All critical flows tested
- Tests isolated and repeatable
- CI/CD integration working

### Task 9.4: E2E Testing (Optional)
**Objective**: Test complete user journeys

**Actions**:
1. Set up Playwright (if desired)
2. Write E2E tests for:
   - User registration → email verification → login
   - Login → profile edit → logout
   - Admin login → user management → logout
   - OIDC flow from client app
3. Run against staging environment
4. Include in CI/CD (optional)

**Acceptance Criteria**:
- Key journeys tested
- Tests reliable
- Can run on demand

### Task 9.5: Security Testing
**Objective**: Verify security measures

**Actions**:
1. Test authentication security:
   - Password policy enforcement
   - HIBP integration
   - Rate limiting on login
   - CAPTCHA after failed attempts
   - 2FA enforcement
2. Test authorization:
   - Permission checks on all protected routes
   - Role hierarchy enforcement
   - API key scoping
3. Test input validation:
   - SQL injection attempts
   - XSS attempts
   - CSRF protection
4. Test session security:
   - Session fixation prevention
   - Session hijacking prevention
   - Proper cookie flags
5. Test HTTPS/TLS:
   - Valid certificates
   - Security headers present
   - HSTS working
6. Run automated security scans (npm audit, Snyk)

**Acceptance Criteria**:
- No critical security vulnerabilities
- All security measures working
- Automated scans clean

### Task 9.6: Performance Testing
**Objective**: Ensure acceptable performance

**Actions**:
1. Test page load times (target < 2s)
2. Test API response times (target < 200ms for p95)
3. Test database query performance
4. Test under load (simulate 100 concurrent users)
5. Optimize slow queries
6. Implement caching where appropriate
7. Monitor with Axiom dashboards

**Acceptance Criteria**:
- Performance targets met
- No obvious bottlenecks
- Monitoring in place

### Task 9.7: Accessibility Testing
**Objective**: Ensure WCAG AA compliance

**Actions**:
1. Run automated accessibility tests (axe, Lighthouse)
2. Test with screen readers (NVDA, VoiceOver)
3. Test keyboard navigation
4. Test color contrast
5. Test with browser zoom (200%)
6. Fix all critical accessibility issues

**Acceptance Criteria**:
- WCAG AA compliance verified
- Screen reader compatible
- Keyboard navigation complete
- Automated tests pass

---

## Phase 10: Production Deployment

### Task 10.1: Environment Setup
**Objective**: Configure production environment on Vercel

**Actions**:
1. Create Vercel project
2. Configure all environment variables
3. Set up Neon production database
4. Configure custom domain (id.ewf-stade.de)
5. Enable Vercel Analytics
6. Enable Vercel Web Vitals
7. Configure deployment protection (require approval)
8. Set up preview deployments

**Acceptance Criteria**:
- Production environment ready
- Domain configured
- All secrets set

### Task 10.2: Database Migration Strategy
**Objective**: Safe production database migrations

**Actions**:
1. Create migration workflow:
   - Migrations run before deployment
   - Backup database before migration
   - Test migrations on staging first
   - Rollback plan for failures
2. Set up GitHub Actions workflow:
   ```yaml
   name: Deploy to Production
   on:
     push:
       branches: [main]
   jobs:
     migrate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Setup Bun
           uses: oven-sh/setup-bun@v1
         - name: Install dependencies
           run: pnpm install
         - name: Run migrations
           run: pnpm run db:migrate
           env:
             DATABASE_URL: ${{ secrets.DATABASE_URL }}
     deploy:
       needs: migrate
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             vercel-args: '--prod'
   ```
3. Document rollback procedure

**Acceptance Criteria**:
- Migrations run automatically
- Backup process in place
- Rollback documented

### Task 10.3: CI/CD Pipeline
**Objective**: Automated testing and deployment

**Actions**:
1. Configure GitHub Actions for:
   - Lint on PR
   - Type check on PR
   - Run tests on PR
   - Build preview deployment on PR
   - Run migrations on merge to main
   - Deploy to production on merge to main
2. Set up branch protection:
   - Require PR reviews
   - Require status checks to pass
   - Require up-to-date branches
3. Configure deployment notifications

**Acceptance Criteria**:
- CI/CD pipeline working
- Tests run automatically
- Deployments automated
- Branch protection active

### Task 10.4: Monitoring Setup
**Objective**: Production monitoring and alerting

**Actions**:
1. Verify Axiom receiving logs
2. Verify OTEL traces appearing
3. Verify PostHog receiving events
4. Configure production alerts
5. Set up status page (optional)
6. Create runbook for common issues
7. Set up on-call rotation (if applicable)

**Acceptance Criteria**:
- All monitoring active
- Alerts configured
- Runbook documented

### Task 10.5: Backup & Recovery
**Objective**: Ensure data can be recovered

**Actions**:
1. Configure Neon automatic backups (continuous)
2. Test backup restoration procedure
3. Document recovery time objective (RTO): 1 hour
4. Document recovery point objective (RPO): 5 minutes
5. Create disaster recovery plan:
   - Database failure → restore from Neon backup
   - Vercel failure → redeploy to different region
   - Complete data loss → restore from last backup
6. Test recovery procedures quarterly

**Acceptance Criteria**:
- Backups running automatically
- Recovery tested and documented
- RTO/RPO achievable

### Task 10.6: Security Hardening
**Objective**: Final security checks before launch

**Actions**:
1. Verify all security headers present
2. Verify HTTPS enforced
3. Verify rate limiting active
4. Verify CAPTCHA working
5. Verify 2FA enforced for admins
6. Verify API key permissions scoped
7. Verify audit logging complete
8. Verify secrets not exposed
9. Run final security scan
10. Review security checklist:
    - [ ] HTTPS/TLS configured
    - [ ] Security headers set
    - [ ] CORS configured
    - [ ] Rate limiting active
    - [ ] CAPTCHA enabled
    - [ ] Password policy enforced
    - [ ] HIBP integration working
    - [ ] 2FA available
    - [ ] Session security verified
    - [ ] Input validation complete
    - [ ] SQL injection prevention verified
    - [ ] XSS prevention verified
    - [ ] CSRF protection enabled
    - [ ] API authentication working
    - [ ] Permission checks enforced
    - [ ] Audit logging complete
    - [ ] Secrets in environment variables
    - [ ] No secrets in code
    - [ ] Dependencies updated
    - [ ] Security scan passed

**Acceptance Criteria**:
- All security items checked
- No critical vulnerabilities
- Ready for production traffic

### Task 10.7: Performance Optimization
**Objective**: Optimize for production load

**Actions**:
1. Enable Vercel Edge Network
2. Configure caching headers
3. Optimize images (if any)
4. Minimize bundle size
5. Enable compression
6. Configure database connection pooling
7. Add database indexes for common queries
8. Implement query result caching (if needed)
9. Monitor Web Vitals
10. Optimize Core Web Vitals (LCP, FID, CLS)

**Acceptance Criteria**:
- Good Web Vitals scores
- Fast page loads
- Efficient database queries

### Task 10.8: Documentation
**Objective**: Complete all documentation

**Actions**:
1. Update README with:
   - Project description
   - Setup instructions
   - Development workflow
   - Deployment process
   - Environment variables
   - Troubleshooting
2. Create API documentation:
   - All endpoints documented
   - Request/response examples
   - Authentication requirements
   - Rate limits
3. Create admin documentation:
   - User management guide
   - Permission system
   - Analytics interpretation
   - Common tasks
4. Create user documentation:
   - How to register
   - How to manage profile
   - How to enable 2FA
   - How to use passkeys
   - How to request data export
   - How to delete account
5. Create runbook for operations:
   - Common issues and solutions
   - Monitoring dashboards
   - Alert responses
   - Backup restoration
   - Deployment process
6. Update SPEC.md with actual implementation details

**Acceptance Criteria**:
- All documentation complete
- Clear and understandable
- Up to date with implementation

### Task 10.9: Launch Checklist
**Objective**: Final verification before going live

**Actions**:
1. Complete pre-launch checklist:
   - [ ] All tests passing
   - [ ] Security audit complete
   - [ ] Performance optimization done
   - [ ] Monitoring configured
   - [ ] Alerts set up
   - [ ] Backups configured
   - [ ] Documentation complete
   - [ ] Legal pages published
   - [ ] Privacy policy accepted on registration
   - [ ] Cookie banner working
   - [ ] GDPR compliance verified
   - [ ] All translations complete
   - [ ] Storybook deployed
   - [ ] Health check endpoint working
   - [ ] OIDC discovery endpoint working
   - [ ] Integration with downstream apps tested
   - [ ] Team trained (if applicable)
   - [ ] Support procedures in place
   - [ ] Rollback plan documented
   - [ ] Go/no-go decision made
2. Perform smoke tests on production:
   - User registration works
   - Login works (all methods)
   - OIDC flow works
   - Admin panel accessible
   - Monitoring receiving data
3. Monitor closely for first 24 hours

**Acceptance Criteria**:
- All checklist items complete
- Smoke tests passed
- Monitoring shows healthy system
- No critical issues

---

## Technical References

### Database Schema

#### Users Table (Better Auth)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  given_name TEXT,
  family_name TEXT,
  picture TEXT,
  locale TEXT DEFAULT 'de',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Custom Tables
```sql
CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  oidc_issuer TEXT,
  oidc_client_id TEXT,
  oidc_client_secret TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_schools (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT REFERENCES schools(id),
  student_id TEXT,
  verified_at TIMESTAMP,
  PRIMARY KEY (user_id, school_id)
);

CREATE TABLE user_roles (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_by TEXT REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role)
);

CREATE TABLE user_permissions (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by TEXT REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip TEXT,
  user_agent TEXT,
  trace_id TEXT,
  result TEXT CHECK (result IN ('success', 'failure'))
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_trace ON audit_logs(trace_id);

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB,
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

### Permission Definitions

```typescript
// Role definitions
enum Role {
  USER = 'user',          // All authenticated users
  STUDENT = 'student',    // School-verified students
  TEAM = 'team',          // EWF team members
  ADMIN = 'admin'         // System administrators
}

// Permission definitions
type Permission = 
  // User permissions
  | 'users:read'          // View users
  | 'users:write'         // Edit users
  | 'users:delete'        // Delete users
  
  // Admin permissions
  | 'admin:access'        // Access admin panel (team+)
  | 'admin:manage'        // Manage users (admin only)
  
  // Application permissions
  | 'screens:manage'      // Manage screens app (team+)
  | 'events:manage'       // Manage events app (team+)
  
  // OIDC permissions
  | 'oidc:admin'          // Manage OIDC clients (admin)
  
  // Audit permissions
  | 'audit:read'          // Read audit logs (team+)
  
  // Analytics permissions
  | 'analytics:read'      // View analytics (team+)

// Role → Permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [],
  [Role.STUDENT]: [],
  [Role.TEAM]: [
    'admin:access',
    'screens:manage',
    'events:manage',
    'audit:read',
    'analytics:read',
  ],
  [Role.ADMIN]: [
    'admin:access',
    'admin:manage',
    'users:read',
    'users:write',
    'users:delete',
    'screens:manage',
    'events:manage',
    'oidc:admin',
    'audit:read',
    'analytics:read',
  ],
}
```

### OIDC Custom Claims

```typescript
interface CustomClaims {
  // Standard OIDC claims
  sub: string                    // User ID
  email: string
  email_verified: boolean
  name: string
  given_name: string
  family_name: string
  locale: string                 // de/en/uk
  picture: string                // Avatar URL
  
  // Custom EWF claims
  roles: Role[]
  school?: {
    id: string
    name: string
    student_id: string
  }
  permissions: Permission[]
  team_member: boolean           // Convenience flag
  account_created: string        // ISO timestamp
}
```

### Email Templates (React Email)

**Example: Welcome Email**
```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  locale: string
}

export const WelcomeEmail = ({ name, locale }: WelcomeEmailProps) => {
  const messages = {
    de: {
      preview: 'Willkommen bei EWF-ID',
      heading: `Hallo ${name}!`,
      body: 'Dein Account wurde erfolgreich erstellt.',
    },
    // ... en, uk
  }
  
  const t = messages[locale] || messages.de
  
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body>
        <Container>
          <Heading>{t.heading}</Heading>
          <Text>{t.body}</Text>
          <Link href="https://id.ewf-stade.de">
            Zur Anmeldung
          </Link>
        </Container>
      </Body>
    </Html>
  )
}
```

### Feature Flags

```typescript
// Define flags in Vercel Dashboard and PostHog

const FLAGS = {
  MULTI_SESSION: 'multi-session-management',
  BULK_OPERATIONS: 'admin-bulk-operations',
  CREATE_ADMIN_ACCOUNT: 'allow-admin-creation',
  DEVICE_AUTH: 'oauth-device-flow',
  BETA_FEATURES: 'beta-features',
}

// Usage
import { get } from '@vercel/flags'

async function AdminBulkOperations() {
  const enabled = await get(FLAGS.BULK_OPERATIONS)
  
  if (!enabled) {
    return null
  }
  
  return <BulkOperationsUI />
}
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Better Auth
BETTER_AUTH_SECRET=random-secret-min-32-chars
BETTER_AUTH_URL=https://id.ewf-stade.de

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@ewf-stade.de

# Observability
AXIOM_TOKEN=xaat-xxxxx
AXIOM_DATASET=ewf-id-production
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.axiom.co/v1/traces
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
POSTHOG_API_KEY=phx_xxxxx

# Vercel
VERCEL_API_TOKEN=xxxxx

# Security
TURNSTILE_SECRET_KEY=xxxxx
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxxxx
HIBP_API_KEY=xxxxx

# School OIDC
SCHOOL_ATHENAEUM_CLIENT_ID=xxxxx
SCHOOL_ATHENAEUM_CLIENT_SECRET=xxxxx
SCHOOL_ATHENAEUM_ISSUER=https://athenaeum.example.com

SCHOOL_VLG_CLIENT_ID=xxxxx
SCHOOL_VLG_CLIENT_SECRET=xxxxx
SCHOOL_VLG_ISSUER=https://vlg.example.com

SCHOOL_IGS_CLIENT_ID=xxxxx
SCHOOL_IGS_CLIENT_SECRET=xxxxx
SCHOOL_IGS_ISSUER=https://igs.example.com
```

---

## Implementation Notes

### Key Differences from Original Spec

1. **Email Templates**: Use React Email instead of raw HTML
2. **Feature Flags**: Use Vercel Flags SDK + PostHog instead of environment variables
3. **Toolbar**: Vercel Toolbar added for development
4. **State Management**: TanStack Query, React Hook Form, and Zustand specified
5. **Admin Permissions**: Clear distinction between `team` (read) and `admin` (write)
6. **404 Page**: Custom not found page added
7. **Storybook**: All custom components must be added to Storybook
8. **OTEL**: Use Effect.ts for OTEL instrumentation everywhere possible
9. **Exception Tracking**: PostHog exceptions include OTEL trace IDs
10. **Cookie Banner**: Added requirement for GDPR cookie consent
11. **Product Analytics**: Comprehensive PostHog event tracking specified
12. **Format**: Reformulated as AI agent task/phase plan

### Previous Feedback Applied

- Removed TanStack Start boilerplate (demos, sidebar)
- PR descriptions should append/edit, not replace (maintain history)
- Old phases remain in task lists
- Added product analytics requirements
- OTEL trace IDs linked to PostHog exceptions

### Important Reminders

- **Always use OTEL with Effect.ts** wherever possible
- **Never use raw HTML emails** - only React Email components
- **Feature flags** go through Vercel SDK + PostHog, not env vars
- **Admin routes** (`/admin/*`) require `team` role minimum
- **Admin mutations** (POST/PUT/DELETE on `/admin/*`) require `admin` role
- **Every custom component** needs a Storybook story
- **All exceptions** should include the OTEL trace ID when sent to PostHog

---

## Glossary

- **OTEL**: OpenTelemetry - distributed tracing standard
- **OIDC**: OpenID Connect - authentication layer on top of OAuth 2.0
- **GDPR**: General Data Protection Regulation - EU privacy law
- **RBAC**: Role-Based Access Control
- **2FA**: Two-Factor Authentication
- **TOTP**: Time-based One-Time Password
- **WebAuthn**: Web Authentication API for passkeys
- **HIBP**: Have I Been Pwned - password breach database
- **JWT**: JSON Web Token
- **DPA**: Data Processing Agreement
- **RTO**: Recovery Time Objective
- **RPO**: Recovery Point Objective

---

**End of Specification**

This specification is a living document and should be updated as implementation progresses and requirements evolve. The AI agent should work through phases sequentially, completing all tasks in a phase before moving to the next. Each task should result in working, tested code with proper instrumentation and documentation.
