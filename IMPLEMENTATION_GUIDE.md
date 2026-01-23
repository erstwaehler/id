# EWF-ID Implementation Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Status:** Ready for Implementation

---

## Quick Navigation

- **[SPEC.md](./SPEC.md)** - Complete technical specification (main document)
- **[INTEGRATED_APPS.md](./INTEGRATED_APPS.md)** - Application permissions and scopes
- **[FRONTEND_SKILL.md](./FRONTEND_SKILL.md)** - Frontend design guidelines
- **This Document** - Implementation roadmap and guidelines

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Implementation Phases](#implementation-phases)
5. [Development Workflow](#development-workflow)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

---

## 1. Overview

This guide walks through implementing the EWF-ID system as specified in `SPEC.md`. The implementation is divided into phases to ensure systematic development and testing.

### What You're Building

- **Central OIDC Provider** for all EWF applications
- **User Management System** with school-based authentication
- **Admin Dashboard** for user and permission management
- **Multi-language Support** (German, English, Ukrainian)
- **GDPR-Compliant** data handling and user rights

### Key Technologies

- TanStack Start (React framework)
- Better Auth (authentication)
- Drizzle ORM (database)
- Effect.ts (functional error handling)
- Neon.tech (PostgreSQL)
- Vercel (hosting)

---

## 2. Prerequisites

### Required Accounts & Services

Before starting, create accounts for:

- [ ] **Neon.tech** - Database hosting (free tier for dev)
- [ ] **Vercel** - Application hosting (hobby tier for dev)
- [ ] **Resend** - Email service (free tier: 100 emails/day)
- [ ] **PostHog** - Analytics & feature flags (free tier)
- [ ] **Axiom** - Logging & traces (free tier: 500MB/month)
- [ ] **Cloudflare** - Turnstile CAPTCHA (free)

### School OIDC Providers

Contact the following schools to obtain OIDC credentials:

- [ ] **Gymnasium Athenaeum Stade** (IServ)
- [ ] **Vincent Lübeck Gymnasium** (Moodle)
- [ ] **Integrierte Gesamtschule Stade** (IServ)

### Development Environment

- [ ] **Bun** v1.3+ installed
- [ ] **Git** for version control
- [ ] **Node.js** v20+ (for Vercel runtime)
- [ ] **Code Editor** (VS Code recommended)

---

## 3. Project Structure

```
id/
├── src/
│   ├── routes/                 # TanStack Start routes
│   │   ├── index.tsx          # Landing page
│   │   ├── login.tsx          # Login page
│   │   ├── register.tsx       # Registration page
│   │   ├── dashboard.tsx      # User dashboard
│   │   ├── account/           # Account management pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── device.tsx         # Device authorization
│   │   ├── privacy.tsx        # Privacy policy
│   │   ├── terms.tsx          # Terms of service
│   │   └── di.day.tsx         # Digital Independence Day
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn components
│   │   ├── auth/             # Auth-related components
│   │   ├── admin/            # Admin-specific components
│   │   └── layout/           # Layout components
│   │
│   ├── lib/                   # Core libraries
│   │   ├── auth.ts           # Better Auth configuration
│   │   ├── auth-client.ts    # Client-side auth utilities
│   │   ├── auth-db.ts        # Database connection
│   │   ├── permissions.ts    # Permission checking logic
│   │   ├── flags.ts          # Feature flags
│   │   ├── otel.ts           # OpenTelemetry setup
│   │   ├── logger.ts         # Structured logging
│   │   ├── email.ts          # Email sending (Resend)
│   │   └── utils.ts          # Utility functions
│   │
│   ├── lib/auth/              # Auth schema & plugins
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── plugins/          # Better Auth plugins
│   │   └── providers.ts      # OIDC provider configs
│   │
│   ├── integrations/          # Effect.ts services
│   │   ├── user-service.ts   # User management
│   │   ├── audit-service.ts  # Audit logging
│   │   ├── email-service.ts  # Email operations
│   │   └── oidc-service.ts   # OIDC operations
│   │
│   ├── data/                  # Static data
│   │   ├── schools.ts        # School definitions
│   │   ├── permissions.ts    # Permission definitions
│   │   └── roles.ts          # Role definitions
│   │
│   ├── paraglide/             # Internationalization
│   │   ├── messages/         # Translation files
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   └── uk.json
│   │   └── runtime.ts        # Paraglide runtime
│   │
│   ├── styles.css             # Global styles
│   ├── env.ts                 # Environment variables
│   ├── router.tsx             # Router configuration
│   └── server.ts              # Server entry point
│
├── drizzle/                   # Database migrations
│   └── [timestamp]_*.sql
│
├── scripts/                   # Utility scripts
│   ├── auth-gen.ts           # Auth schema generator
│   ├── postinstall.ts        # Post-install setup
│   └── seed-dev.ts           # Seed dev database
│
├── .github/
│   └── workflows/
│       ├── deploy.yml        # Production deployment
│       └── checks.yml        # CI checks
│
├── public/                    # Static assets
│   ├── logo.svg
│   └── favicon.ico
│
├── SPEC.md                    # Technical specification (THIS IS THE BIBLE)
├── INTEGRATED_APPS.md         # App permissions reference
├── FRONTEND_SKILL.md          # Design guidelines
├── IMPLEMENTATION_GUIDE.md    # This file
├── README.md                  # Project README
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
└── biome.json
```

---

## 4. Implementation Phases

### Phase 0: Setup & Configuration (Week 1)

**Goal:** Get development environment ready

**Tasks:**
- [ ] Set up all external services (see Prerequisites)
- [ ] Configure environment variables in `.env.local`
- [ ] Set up Neon.tech database (Frankfurt region)
- [ ] Configure Vercel project
- [ ] Set up GitHub repository
- [ ] Install dependencies: `bun install`
- [ ] Run initial migration: `bun run auth:push`
- [ ] Verify dev server starts: `bun run dev`

**Deliverables:**
- Working local development environment
- Database connected and schema pushed
- All services authenticated

---

### Phase 1: Core Authentication (Week 2-3)

**Goal:** Basic login/register functionality

**Tasks:**

#### 1.1 Better Auth Setup
- [ ] Configure Better Auth with all required plugins (see SPEC §6)
- [ ] Set up database schema with Drizzle
- [ ] Configure session management
- [ ] Set up JWT signing keys

#### 1.2 Email/Password Authentication
- [ ] Implement registration flow
- [ ] Implement login flow
- [ ] Add password strength validation
- [ ] Integrate Have I Been Pwned check
- [ ] Add CAPTCHA (Cloudflare Turnstile)
- [ ] Password reset flow with email

#### 1.3 School OIDC Integration
- [ ] Configure OIDC providers for 3 schools
- [ ] Implement OIDC login flow
- [ ] Handle OIDC callback
- [ ] Auto-create users from OIDC
- [ ] Map email domains to schools
- [ ] Assign roles based on email domain

#### 1.4 Basic UI
- [ ] Landing page
- [ ] Login page (email/password + OIDC buttons)
- [ ] Registration page
- [ ] Dashboard (placeholder)
- [ ] Language switcher

**Deliverables:**
- Users can register via school OIDC
- Users can log in (email/password or OIDC)
- Users can reset password
- Basic dashboard showing user info

**Testing:**
- Create test users from each school
- Test password reset flow
- Test OIDC flow for each school
- Verify email verification works

---

### Phase 2: Advanced Authentication (Week 4)

**Goal:** 2FA and Passkeys

**Tasks:**

#### 2.1 Two-Factor Authentication
- [ ] TOTP setup flow with QR code
- [ ] Backup code generation
- [ ] 2FA challenge during login
- [ ] Recovery flow with backup codes
- [ ] UI for 2FA management (`/account/security`)

#### 2.2 Passkey Support
- [ ] WebAuthn registration flow
- [ ] Passkey authentication flow
- [ ] Passkey management UI
- [ ] Support for platform authenticators
- [ ] Cross-platform authenticator support

#### 2.3 Multi-Session Management
- [ ] Track multiple sessions per user
- [ ] Session list UI (`/account/sessions`)
- [ ] Individual session revocation
- [ ] "Revoke all other sessions" feature
- [ ] Device/browser fingerprinting

#### 2.4 Last Login Method
- [ ] Track last used auth method
- [ ] Display on login page
- [ ] Pre-select last method

**Deliverables:**
- 2FA fully functional
- Passkeys working on all platforms
- Session management dashboard

**Testing:**
- Test 2FA setup and login
- Test passkey on different devices
- Test session revocation
- Test recovery flows

---

### Phase 3: User Management (Week 5)

**Goal:** Complete user profile and account management

**Tasks:**

#### 3.1 Profile Management
- [ ] Profile view page (`/account/profile`)
- [ ] Edit profile form
- [ ] Profile picture upload (or URL)
- [ ] Bio field (max 500 chars)
- [ ] Display name
- [ ] Language preference

#### 3.2 Security Settings
- [ ] Change password form
- [ ] 2FA toggle
- [ ] Passkey management
- [ ] View active sessions
- [ ] Security log (recent activity)

#### 3.3 Connected Apps
- [ ] List of authorized apps
- [ ] Revoke app authorization
- [ ] Per-app permission view
- [ ] Last accessed timestamp

#### 3.4 GDPR Features
- [ ] Data export request (`/account/export`)
- [ ] Account deletion request (`/account/delete`)
- [ ] Deletion grace period (14 days)
- [ ] Cancel deletion flow
- [ ] Data export download

**Deliverables:**
- Complete user account management
- All GDPR rights implemented
- Profile customization working

**Testing:**
- Test profile updates
- Test data export (verify JSON structure)
- Test account deletion flow
- Test deletion cancellation

---

### Phase 4: Permissions & Roles (Week 6)

**Goal:** Role-based access control system

**Tasks:**

#### 4.1 Permission System
- [ ] Define permission model (see INTEGRATED_APPS.md)
- [ ] Implement permission checking logic
- [ ] Create permission middleware
- [ ] Database schema for roles/permissions
- [ ] Role hierarchy implementation

#### 4.2 Permission Assignment
- [ ] Auto-assign roles based on email domain
- [ ] Default permissions per role
- [ ] User-specific permission overrides
- [ ] Permission inheritance

#### 4.3 Permission Utilities
- [ ] `checkPermission(user, permission)` function
- [ ] `hasRole(user, role)` function
- [ ] `requirePermission()` middleware
- [ ] `PermissionGuard` React component
- [ ] `RoleGuard` React component

#### 4.4 Claims in Tokens
- [ ] Include roles in ID token
- [ ] Include permissions in ID token
- [ ] Custom claim mappings
- [ ] School affiliation in claims

**Deliverables:**
- Full RBAC system
- Permissions automatically assigned
- Guards protecting routes and components

**Testing:**
- Test permission checks for all roles
- Verify hierarchical inheritance
- Test custom permission overrides
- Verify claims in tokens

---

### Phase 5: Admin Dashboard (Week 7-8)

**Goal:** Complete admin interface

**Tasks:**

#### 5.1 User Management
- [ ] User list with pagination (`/admin/users`)
- [ ] Search and filtering
- [ ] User detail view (`/admin/users/:id`)
- [ ] Edit user form
- [ ] Create user form (`/admin/users/create`)
- [ ] Delete user (with confirmation)

#### 5.2 Role & Permission Management
- [ ] Assign/remove roles
- [ ] Assign/remove permissions
- [ ] View user's effective permissions
- [ ] Bulk role assignment (feature flag)

#### 5.3 Impersonation
- [ ] "Impersonate" button on user profile
- [ ] Impersonation session handling
- [ ] Persistent banner during impersonation
- [ ] "Exit Impersonation" always visible
- [ ] Audit log for impersonation

#### 5.4 API Key Management
- [ ] List API keys (`/admin/api-keys`)
- [ ] Create new API key
- [ ] Scope/permission selection
- [ ] Key revocation
- [ ] Usage statistics

#### 5.5 Audit Log Viewer
- [ ] Real-time log stream (`/admin/audit`)
- [ ] Filtering (user, action, date)
- [ ] Export to CSV
- [ ] Auto-refresh option
- [ ] Detailed view per entry

#### 5.6 System Statistics
- [ ] Dashboard overview (`/admin`)
- [ ] User count by role
- [ ] User count by school
- [ ] Active sessions
- [ ] Failed login attempts (24h)
- [ ] 2FA adoption rate
- [ ] Top accessed apps

**Deliverables:**
- Full admin dashboard
- All admin functions operational
- Comprehensive audit logging

**Testing:**
- Test all admin actions as admin
- Verify non-admins cannot access
- Test impersonation flow
- Verify audit logs capture everything

---

### Phase 6: OIDC Provider (Week 9-10)

**Goal:** Act as OIDC provider for downstream apps

**Tasks:**

#### 6.1 OIDC Endpoints
- [ ] Discovery endpoint (`/.well-known/openid-configuration`)
- [ ] Authorization endpoint (`/api/auth/authorize`)
- [ ] Token endpoint (`/api/auth/token`)
- [ ] UserInfo endpoint (`/api/auth/userinfo`)
- [ ] JWKS endpoint (`/.well-known/jwks.json`)
- [ ] Revocation endpoint

#### 6.2 OAuth Flows
- [ ] Authorization Code Flow
- [ ] Authorization Code Flow with PKCE
- [ ] Refresh Token Flow
- [ ] Device Authorization Flow (RFC 8628)

#### 6.3 Consent Screen
- [ ] Show app requesting access
- [ ] Display requested scopes
- [ ] Allow/Deny buttons
- [ ] Remember consent option
- [ ] Manage consents in profile

#### 6.4 Token Management
- [ ] JWT signing (RS256)
- [ ] Token expiration (1 hour access, 30 days refresh)
- [ ] Token rotation
- [ ] Revocation list

#### 6.5 Client Registration
- [ ] Database schema for OAuth clients
- [ ] Admin UI for client registration
- [ ] Redirect URI validation
- [ ] Client secret generation

**Deliverables:**
- Full OIDC provider functionality
- Standard-compliant endpoints
- Token management working

**Testing:**
- Test with openid-client library
- Verify OIDC discovery
- Test authorization flow
- Test token refresh
- Test device flow

---

### Phase 7: API Layer (Week 11)

**Goal:** RESTful API for external apps

**Tasks:**

#### 7.1 Authentication APIs
- [ ] Better Auth endpoints (handled by plugin)
- [ ] Custom OIDC endpoints
- [ ] Passkey endpoints

#### 7.2 User Management APIs
- [ ] `GET /api/v1/user/me`
- [ ] `PATCH /api/v1/user/me`
- [ ] `GET /api/v1/user/me/permissions`
- [ ] `POST /api/v1/user/me/export`
- [ ] `POST /api/v1/user/me/delete`

#### 7.3 Admin APIs
- [ ] `GET /api/v1/admin/users`
- [ ] `POST /api/v1/admin/users`
- [ ] `PATCH /api/v1/admin/users/:id`
- [ ] `DELETE /api/v1/admin/users/:id`
- [ ] `POST /api/v1/admin/users/:id/impersonate`

#### 7.4 Permission APIs
- [ ] `GET /api/v1/permissions`
- [ ] `GET /api/v1/claims/:userId`
- [ ] `POST /api/v1/permissions/verify`
- [ ] `POST /api/v1/permissions/verify-bulk`

#### 7.5 API Documentation
- [ ] OpenAPI/Swagger spec
- [ ] API docs UI (`/api/docs` in dev)
- [ ] Example requests/responses

**Deliverables:**
- Complete REST API
- API documentation
- All endpoints tested

**Testing:**
- Test all endpoints with Postman/Insomnia
- Verify authentication required
- Test permission checks
- Test rate limiting

---

### Phase 8: Internationalization (Week 12)

**Goal:** Multi-language support

**Tasks:**

#### 8.1 Paraglide Setup
- [ ] Configure Paraglide with Inlang
- [ ] Set up message structure
- [ ] Language detection logic
- [ ] Language switcher component

#### 8.2 Translations
- [ ] German translations (complete)
- [ ] English translations (complete)
- [ ] Ukrainian translations (stub for future)

#### 8.3 Translation Coverage
- [ ] All UI strings
- [ ] All error messages
- [ ] All email templates
- [ ] Legal pages (Privacy, Terms, DI.Day)
- [ ] System notifications

#### 8.4 Language Persistence
- [ ] Store preference in user profile
- [ ] Cookie for unauthenticated users
- [ ] Language in JWT claims

**Deliverables:**
- Full German and English support
- Language switcher on all pages
- All content translated

**Testing:**
- Test language switching
- Verify all pages in both languages
- Test RTL layout (future Ukrainian)

---

### Phase 9: Legal & Compliance (Week 13)

**Goal:** GDPR compliance and legal pages

**Tasks:**

#### 9.1 Privacy Policy (`/privacy`)
- [ ] Draft comprehensive privacy policy
- [ ] List all data collected
- [ ] List all subprocessors
- [ ] Explain user rights
- [ ] mailto links for GDPR requests
- [ ] Translate to German and English

#### 9.2 Terms of Service (`/terms`)
- [ ] Draft terms of service
- [ ] Acceptable use policy
- [ ] Account termination clauses
- [ ] Liability limitations
- [ ] Translate to German and English

#### 9.3 Digital Independence Day (`/di.day`)
- [ ] Explain DI.Day philosophy
- [ ] EWF's commitment to digital sovereignty
- [ ] List all subprocessors with details
- [ ] Data handling practices
- [ ] Encryption information
- [ ] Contact information

#### 9.4 GDPR Workflows
- [ ] Data export implementation
- [ ] Account deletion with grace period
- [ ] Data retention policies
- [ ] Right to rectification (profile edit)
- [ ] Right to access (data export)

#### 9.5 Compliance Email
- [ ] Set up compliance@ewf-stade.de
- [ ] Document response procedures
- [ ] Template responses for common requests

**Deliverables:**
- All legal pages complete
- GDPR rights fully implemented
- Compliance workflows documented

**Testing:**
- Legal review of all content
- Test all GDPR workflows
- Verify data export completeness

---

### Phase 10: Monitoring & Observability (Week 14)

**Goal:** Production-ready monitoring

**Tasks:**

#### 10.1 OpenTelemetry Setup
- [ ] Configure OTEL SDK
- [ ] Instrument HTTP requests
- [ ] Instrument database queries
- [ ] Manual span creation for critical paths
- [ ] Context propagation

#### 10.2 Axiom Integration
- [ ] Send traces to Axiom
- [ ] Send logs to Axiom
- [ ] Create log dashboards
- [ ] Create trace views
- [ ] Set up monitors and alerts

#### 10.3 PostHog Events
- [ ] Implement all analytics events (see SPEC §10.3)
- [ ] User identification
- [ ] Feature flag integration
- [ ] Exception tracking with trace IDs
- [ ] Product analytics dashboards

#### 10.4 Audit Logging
- [ ] Log all admin actions
- [ ] Log security events
- [ ] Log OIDC flows
- [ ] Retention policies (7/30/90 days)
- [ ] Audit log cleanup job

#### 10.5 Health Checks
- [ ] `/api/health` endpoint
- [ ] Database connectivity check
- [ ] External service checks
- [ ] Vercel deployment checks

**Deliverables:**
- Full observability stack
- Dashboards configured
- Alerts set up

**Testing:**
- Generate sample events
- Verify traces in Axiom
- Test alert conditions
- Review dashboard data

---

### Phase 11: Security Hardening (Week 15)

**Goal:** Production security

**Tasks:**

#### 11.1 Security Headers
- [ ] HSTS header
- [ ] CSP policy
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy
- [ ] Permissions-Policy

#### 11.2 Rate Limiting
- [ ] Configure rate limits per endpoint type
- [ ] Token bucket algorithm
- [ ] IP-based limiting
- [ ] User-based limiting
- [ ] API key limiting

#### 11.3 Input Validation
- [ ] Zod schemas for all inputs
- [ ] SQL injection prevention (Drizzle)
- [ ] XSS prevention (React)
- [ ] CSRF protection

#### 11.4 Secrets Management
- [ ] Verify no secrets in code
- [ ] Environment variable validation
- [ ] Secret rotation procedure documented

#### 11.5 Security Audit
- [ ] Dependency audit (`bun audit`)
- [ ] Manual code review
- [ ] Penetration testing (if budget allows)
- [ ] Security checklist completion (SPEC §12.6)

**Deliverables:**
- Security hardened application
- All security tests passing
- Documentation updated

**Testing:**
- Test rate limiting
- Attempt SQL injection
- Attempt XSS
- Test CSRF protection

---

### Phase 12: Frontend Polish (Week 16)

**Goal:** Production-quality UI/UX

**Tasks:**

#### 12.1 Design Implementation
- [ ] Follow FRONTEND_SKILL.md guidelines
- [ ] Choose bold aesthetic direction
- [ ] Distinctive typography
- [ ] Cohesive color system
- [ ] Meaningful animations

#### 12.2 Responsive Design
- [ ] Mobile-first implementation
- [ ] Test on all breakpoints
- [ ] Touch-friendly UI elements
- [ ] Mobile navigation

#### 12.3 Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators
- [ ] Color contrast checks

#### 12.4 Loading States
- [ ] Skeleton screens
- [ ] Loading spinners
- [ ] Progress indicators
- [ ] Optimistic updates

#### 12.5 Error Handling
- [ ] User-friendly error messages
- [ ] Error boundaries
- [ ] Fallback UI
- [ ] Retry mechanisms

**Deliverables:**
- Polished, production-ready UI
- Fully responsive
- Accessible to all users

**Testing:**
- Test on multiple devices
- Test with keyboard only
- Test with screen reader
- Test error scenarios

---

### Phase 13: CI/CD & Deployment (Week 17)

**Goal:** Automated deployment pipeline

**Tasks:**

#### 13.1 GitHub Actions
- [ ] Create deployment workflow
- [ ] Database migration job
- [ ] Deployment job with Vercel
- [ ] Health check job
- [ ] Rollback on failure

#### 13.2 Vercel Configuration
- [ ] Production environment setup
- [ ] Environment variables configured
- [ ] Custom domains (id.ewf-stade.de)
- [ ] Preview deployments for PRs
- [ ] Deployment protection rules

#### 13.3 Database Migrations
- [ ] Production migration strategy
- [ ] Backup before migration
- [ ] Rollback procedure
- [ ] Migration testing in staging

#### 13.4 Monitoring Setup
- [ ] Vercel Analytics
- [ ] Error tracking configured
- [ ] Performance monitoring
- [ ] Uptime monitoring

**Deliverables:**
- Automated CI/CD pipeline
- Production deployment working
- Monitoring active

**Testing:**
- Test deployment to staging
- Test migration execution
- Test rollback procedure
- Verify monitoring alerts

---

### Phase 14: Documentation & Launch (Week 18)

**Goal:** Go live!

**Tasks:**

#### 14.1 Documentation
- [ ] Update README.md
- [ ] API documentation complete
- [ ] User guide
- [ ] Admin guide
- [ ] Integration guide for apps

#### 14.2 Testing
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security testing
- [ ] User acceptance testing

#### 14.3 Backup & Recovery
- [ ] Verify Neon backups
- [ ] Test restore procedure
- [ ] Disaster recovery plan
- [ ] Incident response plan

#### 14.4 Communication
- [ ] Announce to schools
- [ ] Send parent letter template
- [ ] Prepare launch email
- [ ] Social media posts

#### 14.5 Launch Checklist
- [ ] All features complete
- [ ] All tests passing
- [ ] Security audit done
- [ ] Legal review done
- [ ] Monitoring active
- [ ] Support email ready
- [ ] Documentation complete

#### 14.6 Go Live
- [ ] Deploy to production
- [ ] Verify all systems operational
- [ ] Send launch communications
- [ ] Monitor closely for 48 hours

**Deliverables:**
- EWF-ID live in production
- All documentation complete
- Support channels active

---

## 5. Development Workflow

### Daily Workflow

```bash
# Start development server
bun run dev

# In separate terminals:
bun run auth:studio  # Database viewer
bun run storybook    # Component development
```

### Before Committing

```bash
# Format code
bun run format

# Lint code
bun run lint

# Run tests
bun run test

# Type check
bun run tsc --noEmit
```

### Creating a Feature

```bash
# Create feature branch
git checkout -b feature/user-profile-edit

# Make changes
# ...

# Commit with conventional commits
git commit -m "feat(profile): add profile edit form"

# Push and create PR
git push origin feature/user-profile-edit
```

### Database Changes

```bash
# Modify schema in src/lib/auth/schema.ts

# Generate migration
bun run auth:gen

# Review generated SQL in drizzle/

# Apply to dev database
bun run auth:migrate

# Commit migration files
git add drizzle/
git commit -m "db: add profile picture field"
```

---

## 6. Testing Strategy

### Unit Tests

```typescript
// Example: Permission checking
describe('checkPermission', () => {
  it('should allow admin all permissions', () => {
    const user = { roles: ['admin'], permissions: [] };
    expect(checkPermission(user, 'schedule:event:delete')).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Example: API endpoint
describe('POST /api/v1/admin/users', () => {
  it('should create user as admin', async () => {
    const response = await fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ email: 'test@athenetz.de', ... }),
    });
    
    expect(response.status).toBe(201);
  });
});
```

### E2E Tests (Future)

```typescript
// Example: User registration
test('user can register via OIDC', async ({ page }) => {
  await page.goto('/register');
  await page.click('button:has-text("Athenaeum")');
  // ... follow OIDC flow
  await expect(page).toHaveURL('/dashboard');
});
```

### Manual Testing Checklist

Create test accounts:
- [ ] Student from each school (3 accounts)
- [ ] Teacher account
- [ ] Team member account
- [ ] Admin account

Test flows:
- [ ] Registration (all methods)
- [ ] Login (all methods)
- [ ] Password reset
- [ ] 2FA setup
- [ ] Passkey setup
- [ ] Profile edit
- [ ] Admin user management
- [ ] Impersonation
- [ ] Data export
- [ ] Account deletion
- [ ] OIDC authorization (use test app)

---

## 7. Deployment Guide

### First Deployment

1. **Set up Vercel project**
   ```bash
   vercel link
   vercel env pull .env.production
   ```

2. **Configure environment variables** in Vercel dashboard
   - Copy from SPEC.md §11.1
   - Set production URLs

3. **Set up custom domain**
   - Add `id.ewf-stade.de` in Vercel
   - Update DNS records

4. **Deploy**
   ```bash
   git push origin prod
   # GitHub Action will handle deployment
   ```

### Subsequent Deployments

1. **Merge to main** → deploys to dev.id.ewf-stade.de
2. **Merge to prod** → deploys to id.ewf-stade.de

### Rollback Procedure

1. Go to Vercel dashboard
2. Find previous deployment
3. Click "Promote to Production"
4. Verify system operational

---

## 8. Troubleshooting

### Common Issues

#### Database connection fails

```bash
# Check environment variables
echo $AUTHDB_WRITE

# Test connection
bun run auth:studio

# Verify Neon.tech is accessible
curl -I https://neon.tech
```

#### OIDC flow doesn't work

- Verify redirect URI matches exactly
- Check client ID and secret
- Verify issuer URL is correct
- Check OIDC provider logs

#### Build fails on Vercel

- Check Vercel logs
- Verify all environment variables set
- Test build locally: `bun run build`
- Check for TypeScript errors

#### Emails not sending

- Verify Resend API key
- Check Resend dashboard for errors
- Verify sender email domain
- Check rate limits

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*
bun run dev

# PostHog debug
export VITE_POSTHOG_DEBUG=true
```

### Getting Help

- Check SPEC.md for requirements
- Review Better Auth docs
- Ask in project Discord/Slack
- Email: devs@ewf-stade.de

---

## Quick Reference

### Important Commands

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run preview          # Preview production build

# Database
bun run auth:studio      # Database UI
bun run auth:gen         # Generate migration
bun run auth:migrate     # Run migrations
bun run auth:push        # Push schema (dev only)

# Code Quality
bun run lint             # Lint code
bun run format           # Format code
bun run test             # Run tests

# Storybook
bun run storybook        # Start Storybook
```

### Key Files

- `SPEC.md` - Technical specification
- `INTEGRATED_APPS.md` - App permissions
- `src/env.ts` - Environment variables
- `src/lib/auth.ts` - Auth configuration
- `drizzle.config.ts` - Database config

### Important URLs

- Dev: https://dev.id.ewf-stade.de
- Prod: https://id.ewf-stade.de
- Neon: https://console.neon.tech
- Vercel: https://vercel.com/dashboard
- PostHog: https://eu.posthog.com

---

## Success Criteria

Your implementation is complete when:

- [ ] All phases completed
- [ ] All tests passing
- [ ] Security audit passed
- [ ] Legal review approved
- [ ] Documentation complete
- [ ] Production deployment successful
- [ ] Monitoring active and healthy
- [ ] Users can successfully authenticate
- [ ] Apps can successfully integrate
- [ ] GDPR compliance verified
- [ ] School partners approve

---

## Next Steps

1. **Read SPEC.md thoroughly** - Understand every requirement
2. **Set up development environment** - Get all services configured
3. **Start with Phase 0** - Don't skip ahead
4. **Test continuously** - Don't wait until the end
5. **Document as you go** - Future you will thank you
6. **Ask questions early** - Don't waste time stuck

---

**Good luck with the implementation! 🚀**

For questions or support, contact: devs@ewf-stade.de