# EWF-ID Integrated Applications Reference

**Version:** 2.0.0  
**Last Updated:** 2025-01-XX  
**Format:** AI Agent Reference & Integration Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [OIDC Claims Reference](#oidc-claims-reference)
4. [Application Registry](#application-registry)
5. [Permission System](#permission-system)
6. [Integration Implementation Guide](#integration-implementation-guide)
7. [Testing & Verification](#testing--verification)
8. [Adding New Applications](#adding-new-applications)

---

## 1. Overview

### Purpose

This document defines all applications that integrate with EWF-ID as an OIDC provider. It serves as:

- **Permission Registry**: Authoritative list of all permissions across the EWF ecosystem
- **Integration Guide**: Implementation instructions for connecting new apps
- **Claims Reference**: Standard and custom OIDC claims available
- **Access Control Matrix**: Role-based access rules per application

### Key Concepts

- **Application**: A web application that uses EWF-ID for authentication
- **Permission**: A specific capability within an application (format: `app:resource:action`)
- **Scope**: OIDC scope that grants access to specific claims or permissions
- **Claims**: Data about the user included in the ID token
- **Access Level**: Who can use the application (public, authenticated, team, admin)

---

## 2. Data Models

### Application Model

```typescript
interface Application {
  id: string                          // Unique application identifier
  name: string                        // Display name
  domain: string                      // Application domain
  description: string                 // Short description
  accessLevel: AccessLevel            // Minimum access level required
  clientId: string                    // OIDC client ID
  clientSecret: string                // OIDC client secret (hashed)
  redirectUris: string[]              // Allowed redirect URIs
  postLogoutRedirectUris: string[]    // Allowed logout redirect URIs
  scopes: string[]                    // Available scopes
  permissions: Permission[]           // Application-specific permissions
  logo?: string                       // Logo URL
  homepageUrl: string                 // Application homepage
  termsUrl?: string                   // Terms of service URL
  privacyUrl?: string                 // Privacy policy URL
  contactEmail: string                // Support contact
  active: boolean                     // Is application active?
  createdAt: Date
  updatedAt: Date
}
```

### Access Level

```typescript
type AccessLevel = 
  | 'public'          // Anyone can access (no authentication required)
  | 'authenticated'   // Any authenticated user
  | 'student'         // School-verified students only
  | 'team'            // EWF team members only
  | 'admin'           // System administrators only
```

### Permission Model

```typescript
interface Permission {
  id: string                    // Format: app:resource:action
  app: string                   // Application identifier
  resource: string              // Resource type (e.g., 'event', 'ballot')
  action: string                // Action (e.g., 'read', 'create', 'delete')
  description: string           // Human-readable description
  requiredRoles: Role[]         // Roles that have this permission
  grantableBy: Role[]           // Roles that can grant this permission
}
```

### Role Hierarchy

```typescript
enum Role {
  USER = 'user',          // Base role - all authenticated users
  STUDENT = 'student',    // School-verified students
  TEAM = 'team',          // EWF team members
  ADMIN = 'admin'         // System administrators
}

// Hierarchy: ADMIN > TEAM > STUDENT > USER
```

---

## 3. OIDC Claims Reference

### Standard Claims (Always Included)

These claims are included in every ID token:

```typescript
interface StandardClaims {
  // OIDC Standard
  sub: string                    // User ID (UUID)
  email: string                  // User email address
  email_verified: boolean        // Email verification status
  name: string                   // Full name (given_name + family_name)
  given_name: string             // First name
  family_name: string            // Last name
  locale: string                 // User locale (de/en/uk)
  
  // EWF Custom (always included)
  roles: Role[]                  // User roles
  school?: {
    id: string                   // School ID
    name: string                 // School display name
    student_id: string           // Student ID at school
  }
  account_created: string        // ISO 8601 timestamp
  last_login?: string            // ISO 8601 timestamp
}
```

### Optional Claims (Request via Scopes)

These claims require specific scopes:

```typescript
interface OptionalClaims {
  // Scope: profile
  picture?: string               // Avatar URL
  preferred_username?: string    // Display name or username
  
  // Scope: ewf:team
  team_member: boolean           // Is user a team member?
  
  // Scope: permissions
  permissions: string[]          // Array of permission strings
}
```

### Scope Definitions

```typescript
const SCOPES = {
  // Standard OIDC
  'openid': 'Required - enables OIDC',
  'profile': 'Basic profile information (name, picture, etc.)',
  'email': 'Email address and verification status',
  
  // EWF Custom
  'ewf:team': 'Team membership status',
  'permissions': 'User permissions array',
  'offline_access': 'Refresh token for long-lived access',
  
  // Application-specific (request only what you need)
  'schedule:read': 'Read schedule data',
  'schedule:write': 'Modify schedule data',
  'vote:participate': 'Participate in votes',
  'live:interact': 'Interact in live events',
  'screens:manage': 'Manage screens',
} as const
```

---

## 4. Application Registry

### 4.1 Schedule (schedule.ewf-stade.de)

**Purpose**: Event scheduling and calendar management for EWF events

**Access Level**: `authenticated`

**Scopes** (as defined in permissions.ts):
- `openid` (required)
- `profile`
- `email`
- `schedule` (with sub-actions)

**Permissions**:

```typescript
// From permissions.ts statement.schedule
const SCHEDULE_PERMISSIONS = [
  'schedule:access',              // Access the schedule app
  'schedule:event:view',          // View published events
  'schedule:event:view:draft',    // View draft events (teacher+)
  'schedule:event:create',        // Create events (team+)
  'schedule:event:edit',          // Edit events (team+)
  'schedule:event:delete',        // Delete own events (team+)
  'schedule:event:delete:any',    // Delete any event (admin)
  'schedule:event:publish',       // Publish events (team+)
  'schedule:rsvp:create',         // RSVP to events (student+)
  'schedule:rsvp:manage',         // Manage RSVPs (teacher+)
] as const
```

**Role Mapping**:
- `student`: access, event:view, rsvp:create
- `teacher`: student + event:view:draft, rsvp:manage
- `team`: teacher + event:create, event:edit, event:delete, event:publish
- `admin`: team + event:delete:any

**Integration Notes**:
- Students can view and RSVP to published events
- Teachers can view drafts and manage RSVPs
- Team members can create, edit, and publish events
- Only admins can delete any event (others can only delete own)

---

### 4.2 Vote (vote.ewf-stade.de)

**Purpose**: Voting and polling system for EWF democratic processes

**Access Level**: `student` (only school-verified students can vote)

**Scopes** (as defined in permissions.ts):
- `openid` (required)
- `profile`
- `email`
- `vote` (with sub-actions)

**Permissions**:

```typescript
// From permissions.ts statement.vote
const VOTE_PERMISSIONS = [
  'vote:access',                  // Access the vote app
  'vote:ballot:view',             // View ballots (student+)
  'vote:ballot:cast',             // Cast votes (student+)
  'vote:ballot:create',           // Create ballots (admin)
  'vote:results:view',            // View results (teacher+)
  'vote:audit:view',              // View audit logs (admin)
] as const
```

**Role Mapping**:
- `student`: access, ballot:view, ballot:cast
- `teacher`: student + results:view
- `team`: teacher (no additional vote permissions)
- `admin`: team + ballot:create, audit:view

**Integration Notes**:
- Students can view and cast votes
- Teachers can view results
- Only admins can create new ballots
- Audit trail viewable by admins only

---

### 4.3 Live (live.ewf-stade.de)

**Purpose**: Live event interaction (Q&A, polls, reactions)

**Access Level**: `authenticated`

**Scopes** (as defined in permissions.ts):
- `openid` (required)
- `profile`
- `live` (with sub-actions)

**Permissions**:

```typescript
// From permissions.ts statement.live
const LIVE_PERMISSIONS = [
  'live:access',                  // Access the live app
  'live:question:submit',         // Submit questions (student+)
  'live:vote:submit',             // Vote in polls (student+)
  'live:event:manage',            // Manage events (team+)
  'live:question:moderate',       // Moderate questions (team+)
] as const
```

**Role Mapping**:
- `student`: access, question:submit, vote:submit
- `teacher`: student (no additional live permissions)
- `team`: teacher + event:manage, question:moderate
- `admin`: team (same permissions)

**Integration Notes**:
- Students can submit questions and vote
- Team members can manage events and moderate questions
- Real-time WebSocket connection
- Rate limiting enforced at application level

---

### 4.4 Screens (screens.ewf-stade.de)

**Purpose**: Digital signage and display management

**Access Level**: `team` (team members only)

**Scopes** (as defined in permissions.ts):
- `openid` (required)
- `profile`
- `screens` (with sub-actions)

**Permissions**:

```typescript
// From permissions.ts statement.screens
const SCREENS_PERMISSIONS = [
  'screens:access',               // Access screens app (team+)
  'screens:manage',               // Manage screen content (team+)
  'screens:emergency',            // Emergency override (team+)
] as const
```

**Role Mapping**:
- `student`: No access
- `teacher`: No access
- `team`: access, manage, emergency
- `admin`: team (same permissions)

**Integration Notes**:
- Team-only application (students and teachers cannot access)
- Team members can manage all screens
- Emergency override available for urgent messages

---

### 4.5 Info (info.ewf-stade.de)

**Purpose**: Information portal and resource hub

**Access Level**: `public` (no authentication required for viewing)

**Access Level**: `public` (viewing), `team` (management)

**Scopes**:
- `openid` (for authenticated features)
- `profile`

**Permissions**:

```typescript
// Info app does not have specific permissions in permissions.ts
// Public viewing requires no authentication
// Content management handled through team/admin role checks
```

**Role Mapping**:
- `anonymous`: View published content
- `student`, `teacher`: View published content
- `team`: Content management (implementation-specific)
- `admin`: Full content management

**Integration Notes**:
- Public pages don't require authentication
- No specific permission checks (role-based access only)
- Team members can manage content via team role

---

### 4.6 Admin Dashboard (admin.ewf-stade.de)

**Purpose**: Cross-application administration and analytics

**Access Level**: `team` (team members only)

**Scopes** (as defined in permissions.ts):
- `openid` (required)
- `profile`
- `email`
- `permissions`
- `admin` (with sub-actions)

**Permissions**:

```typescript
// From permissions.ts statement.admin
const ADMIN_PERMISSIONS = [
  'admin:access',                 // Access admin dashboard (admin)
  'admin:users:view',             // View users (admin)
  'admin:users:edit',             // Edit users (admin)
  'admin:users:delete',           // Delete users (admin)
  'admin:users:impersonate',      // Impersonate users (admin)
  'admin:roles:manage',           // Manage roles (admin)
  'admin:audit:view',             // View audit logs (admin)
] as const
```

**Role Mapping**:
- `student`, `teacher`: No access
- `team`: No access (use Better Auth admin plugin directly)
- `admin`: Full access to all admin permissions

**Integration Notes**:
- Admin-only application
- Aggregates data from all applications
- Uses Better Auth admin plugin for user management
- Cross-application analytics and auditing

---

### 4.7 Profile (profile.ewf-stade.de)

**Purpose**: User profile management and account settings

**Access Level**: `authenticated`

**Scopes** (as defined in permissions.ts):
- `openid` (required)
- `profile`
- `email`

**Permissions**:

```typescript
// From permissions.ts statement.profile
const PROFILE_PERMISSIONS = [
  'profile:view',                 // View own profile (all users)
  'profile:edit',                 // Edit own profile (all users)
  'profile:security:edit',        // Edit security settings (all users)
  'profile:data:export',          // Export data (GDPR) (all users)
  'profile:account:delete',       // Request account deletion (all users)
] as const
```

**Role Mapping**:
- `student`: All profile permissions (self-management)
- `teacher`: All profile permissions
- `team`: All profile permissions
- `admin`: All profile permissions (same as others for own profile)

**Integration Notes**:
- All users have equal permissions for their own profile
- Part of EWF-ID (same domain: id.ewf-stade.de/profile)
- GDPR data export and account deletion available to all
- Email address cannot be changed (immutable for GDPR tracking)

---

## 5. Permission System

### 5.1 Permission Naming Convention

All permissions follow the format: `app:resource:action`

**Examples**:
```
schedule:event:create
vote:ballot:cast
live:question:submit
screens:manage
admin:users:edit
profile:view
```

**Components**:
- `app`: Application identifier (schedule, vote, live, screens, admin, info)
- `resource`: Resource type (event, ballot, question, screen, user, etc.)
- `action`: Action verb (create, read, update, delete, list, view, manage, etc.)

### 5.2 Standard Actions

```typescript
const STANDARD_ACTIONS = {
  // Access control
  'access': 'Access the application',
  
  // CRUD operations
  'create': 'Create new resource',
  'view': 'View/read resource',
  'edit': 'Edit/update existing resource',
  'delete': 'Delete resource',
  
  // Special actions
  'manage': 'Full management capabilities',
  'moderate': 'Content moderation',
  'publish': 'Make resource public',
  'cast': 'Cast a vote/ballot',
  'submit': 'Submit content (questions, votes)',
  'emergency': 'Emergency override',
} as const
```

### 5.3 Permission Checking

#### Server-Side (Backend)

```typescript
import { checkPermission } from '@/lib/permissions'

function requirePermission(permission: string) {
  return async (req, res, next) => {
    const user = req.user // From auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const hasPermission = await checkPermission(user.id, permission)
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    
    next()
  }
}

// Usage
app.post('/api/events', requirePermission('schedule:event:create'), createEvent)
```

#### Client-Side (Frontend)

```typescript
import { usePermission } from '@/hooks/usePermission'

function CreateEventButton() {
  const canCreate = usePermission('schedule:event:create')
  
  if (!canCreate) {
    return null // Hide button if no permission
  }
  
  return <Button onClick={createEvent}>Create Event</Button>
}
```

### 5.4 Role-Based Permission Inheritance

Permissions are inherited through the role hierarchy:

```
ADMIN (all permissions)
  ↓
TEAM (team + student + user permissions)
  ↓
STUDENT (student + user permissions)
  ↓
USER (base permissions)
```

**Example**:
- If `TEAM` has `schedule:event:create`
- Then `ADMIN` automatically has `schedule:event:create`
- But `STUDENT` does NOT have it (no upward inheritance)

### 5.5 Wildcard Permissions

For administrative convenience, wildcard permissions are supported:

```typescript
// Grant all permissions for an app
'schedule:*:*'

// Grant all actions on a resource
'vote:ballot:*'

// Grant specific action on all resources in an app
'live:*:view'
```

**Security Note**: Use wildcards sparingly and only for admin roles.

---

## 6. Integration Implementation Guide

### 6.1 Overview

To integrate your application with EWF-ID:

1. Register your application with EWF-ID admin
2. Implement OIDC authentication flow
3. Check permissions before protected actions
4. Handle token refresh for long-lived sessions

### 6.2 Step 1: Register Your Application

**Contact**: devs@ewf-stade.de

**Information Required**:
- Application name
- Domain (e.g., `myapp.ewf-stade.de`)
- Description
- Access level (`public`, `authenticated`, `student`, `team`, `admin`)
- Redirect URIs (for OAuth callbacks)
- Post-logout redirect URIs
- Required scopes
- Required permissions (list all app-specific permissions)
- Logo URL (optional)
- Support contact email

**You Will Receive**:
- `client_id`: Your application's OIDC client ID
- `client_secret`: Your application's OIDC client secret (keep secure!)
- Confirmation of registered redirect URIs

### 6.3 Step 2: Implement OIDC Flow

#### Discovery Endpoint

EWF-ID provides OpenID Discovery at:
```
https://id.ewf-stade.de/.well-known/openid-configuration
```

#### Using a Standard OIDC Library

**Node.js Example** (using `openid-client`):

```typescript
import { Issuer, generators } from 'openid-client'

// Discover OIDC endpoints
const issuer = await Issuer.discover('https://id.ewf-stade.de')

// Configure client
const client = new issuer.Client({
  client_id: process.env.OIDC_CLIENT_ID!,
  client_secret: process.env.OIDC_CLIENT_SECRET!,
  redirect_uris: ['https://myapp.ewf-stade.de/auth/callback'],
  response_types: ['code'],
})

// Generate authorization URL
const codeVerifier = generators.codeVerifier()
const codeChallenge = generators.codeChallenge(codeVerifier)

const authUrl = client.authorizationUrl({
  scope: 'openid profile email schedule:read schedule:write',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  state: generators.state(),
})

// Redirect user to authUrl
res.redirect(authUrl)

// Handle callback
app.get('/auth/callback', async (req, res) => {
  const params = client.callbackParams(req)
  
  const tokenSet = await client.callback(
    'https://myapp.ewf-stade.de/auth/callback',
    params,
    {
      code_verifier: codeVerifier,
      state: expectedState,
    }
  )
  
  // tokenSet contains:
  // - access_token: For API calls
  // - id_token: User information (JWT)
  // - refresh_token: For refreshing access
  
  // Decode ID token to get user info
  const claims = tokenSet.claims()
  console.log(claims)
  /*
  {
    sub: 'user-uuid',
    email: 'user@athenetz.de',
    name: 'Max Mustermann',
    roles: ['student'],
    school: { id: 'athenaeum', name: 'Athenaeum', student_id: '12345' },
    permissions: ['schedule:event:read', 'schedule:event:create']
  }
  */
  
  // Store tokens in session
  req.session.tokenSet = tokenSet
  req.session.user = claims
  
  res.redirect('/dashboard')
})
```

**React/Next.js Example** (using `next-auth`):

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import type { OIDCConfig } from 'next-auth/providers'

const ewfIdProvider: OIDCConfig<any> = {
  id: 'ewf-id',
  name: 'EWF-ID',
  type: 'oidc',
  issuer: 'https://id.ewf-stade.de',
  clientId: process.env.OIDC_CLIENT_ID!,
  clientSecret: process.env.OIDC_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid profile email schedule:read schedule:write',
    },
  },
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
      roles: profile.roles,
      school: profile.school,
      permissions: profile.permissions,
    }
  },
}

export default NextAuth({
  providers: [ewfIdProvider],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.permissions = profile.permissions
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.permissions = token.permissions
      return session
    },
  },
})
```

### 6.4 Step 3: Check Permissions

#### Backend Permission Middleware

```typescript
// lib/permissions.ts
import type { User } from '@/types'

export function hasPermission(user: User, permission: string): boolean {
  if (!user || !user.permissions) {
    return false
  }
  
  // Check exact match
  if (user.permissions.includes(permission)) {
    return true
  }
  
  // Check wildcard permissions
  const [app, resource, action] = permission.split(':')
  
  const wildcards = [
    `${app}:*:*`,        // All permissions in app
    `${app}:${resource}:*`, // All actions on resource
    `${app}:*:${action}`, // Action on all resources in app
  ]
  
  return wildcards.some(w => user.permissions.includes(w))
}

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user // From auth middleware
    
    if (!hasPermission(user, permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Missing required permission: ${permission}`,
      })
    }
    
    next()
  }
}

// Usage in routes
app.post(
  '/api/events',
  authenticateToken,
  requirePermission('schedule:event:create'),
  async (req, res) => {
    // Create event logic
  }
)
```

#### Frontend Permission Hook

```typescript
// hooks/usePermission.ts
import { useSession } from 'next-auth/react'

export function usePermission(permission: string): boolean {
  const { data: session } = useSession()
  
  if (!session?.user?.permissions) {
    return false
  }
  
  const permissions = session.user.permissions as string[]
  
  // Check exact match
  if (permissions.includes(permission)) {
    return true
  }
  
  // Check wildcards
  const [app, resource, action] = permission.split(':')
  
  const wildcards = [
    `${app}:*:*`,
    `${app}:${resource}:*`,
    `${app}:*:${action}`,
  ]
  
  return wildcards.some(w => permissions.includes(w))
}

// Usage in components
function CreateEventButton() {
  const canCreate = usePermission('schedule:event:create')
  
  if (!canCreate) {
    return null
  }
  
  return (
    <button onClick={handleCreate}>
      Create Event
    </button>
  )
}
```

### 6.5 Step 4: Handle Token Refresh

Access tokens expire after 1 hour. Use refresh tokens to get new access tokens:

```typescript
import { TokenSet } from 'openid-client'

async function refreshAccessToken(refreshToken: string): Promise<TokenSet> {
  const tokenSet = await client.refresh(refreshToken)
  
  // Update stored tokens
  return tokenSet
}

// Middleware to ensure fresh token
async function ensureFreshToken(req, res, next) {
  const tokenSet = req.session.tokenSet
  
  // Check if token expires in next 5 minutes
  const expiresIn = tokenSet.expires_at - Date.now() / 1000
  
  if (expiresIn < 300) {
    try {
      const newTokenSet = await refreshAccessToken(tokenSet.refresh_token)
      req.session.tokenSet = newTokenSet
    } catch (error) {
      // Refresh failed, redirect to login
      return res.redirect('/auth/login')
    }
  }
  
  next()
}
```

### 6.6 API Authentication

For API-to-API communication, use the access token:

```typescript
// Calling EWF-ID APIs
const response = await fetch('https://id.ewf-stade.de/api/v1/user/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
})

const user = await response.json()
```

---

## 7. Testing & Verification

### 7.1 Development Environment

**Test Instance**: `https://dev.id.ewf-stade.de`

**Test Accounts**:
```
Student Account:
  Email: student@test.athenetz.de
  Password: TestPassword123!
  Roles: [user, student]
  School: Athenaeum

Team Account:
  Email: team@test.ewf-stade.de
  Password: TestPassword123!
  Roles: [user, team]

Admin Account:
  Email: admin@test.ewf-stade.de
  Password: TestPassword123!
  Roles: [user, admin]
```

### 7.2 Integration Testing Checklist

- [ ] Discovery endpoint accessible
- [ ] Authorization redirect works
- [ ] Callback handler receives code
- [ ] Token exchange successful
- [ ] ID token contains expected claims
- [ ] Access token works for API calls
- [ ] Refresh token renews access token
- [ ] Logout redirects correctly
- [ ] Permission checks work
- [ ] Role-based access enforced
- [ ] Error handling for invalid tokens
- [ ] Session persistence works
- [ ] Concurrent sessions handled (if applicable)

### 7.3 Common Issues

**Issue**: "Invalid redirect_uri"
- **Solution**: Ensure redirect URI exactly matches registered URI (including trailing slash)

**Issue**: "Invalid scope"
- **Solution**: Only request scopes that were registered for your application

**Issue**: "Token expired"
- **Solution**: Implement token refresh before expiration

**Issue**: "Missing permissions"
- **Solution**: User may not have required role or permission was not granted

---

## 8. Adding New Applications

### 8.1 Application Registration Process

1. **Submit Registration Request**
   - Email: devs@ewf-stade.de
   - Include all required information (see Section 6.2)

2. **Technical Review**
   - Security review of requested permissions
   - Scope validation
   - Access level justification

3. **Permission Definition**
   - Define all app-specific permissions
   - Document permission requirements per role
   - Add to this document

4. **Client Registration**
   - Generate client ID and secret
   - Register redirect URIs
   - Configure scopes and permissions

5. **Integration Testing**
   - Test on development environment
   - Verify OIDC flow
   - Test permission checks
   - Test token refresh

6. **Production Approval**
   - Security checklist completion
   - Documentation review
   - Go-live approval

### 8.2 Application Template

When adding a new application to this document, use this template:

```markdown
### X.X Application Name (app.ewf-stade.de)

**Purpose**: Brief description of what the application does

**Access Level**: `authenticated` | `student` | `team` | `admin` | `public`

**Scopes**:
- `openid` (required)
- `profile`
- `email`
- `app:scope1`
- `app:scope2`

**Permissions**:

\```typescript
const APP_PERMISSIONS = [
  // Category 1 (role requirements)
  'app:resource:action1',
  'app:resource:action2',
  
  // Category 2 (role requirements)
  'app:resource:action3',
] as const
\```

**Role Mapping**:
- `user`, `student`: Description of access
- `team`: Description of access
- `admin`: Description of access

**Integration Notes**:
- Any special considerations for integration
- Rate limiting information
- Business logic notes
- Authentication requirements

---

**Note**: All permissions are defined in `src/lib/permissions.ts`. Always refer to that file as the source of truth for the actual permission structure and role mappings.
```

### 8.3 Permission Naming Guidelines

When defining new permissions:

1. **Use consistent naming**: `app:resource:action`
2. **Keep resources singular**: `event` not `events`
3. **Use standard actions**: Prefer standard actions (create, read, update, delete, list, view)
4. **Be specific**: `question:moderate` is better than `question:manage`
5. **Document clearly**: Include description of what permission allows
6. **Consider hierarchy**: Don't duplicate permissions that roles already have

### 8.4 Review Checklist

Before submitting a new application:

- [ ] Application purpose clearly defined
- [ ] Access level appropriate
- [ ] All required scopes listed
- [ ] Permissions follow naming convention
- [ ] Role mappings documented
- [ ] Integration notes complete
- [ ] Security considerations addressed
- [ ] GDPR compliance verified
- [ ] Rate limiting defined
- [ ] Error handling documented

---

## 9. Permission Updates & Maintenance

### 9.1 Adding New Permissions

To add new permissions to an existing application:

1. Define permission following naming convention
2. Document in this file under application's permission list
3. Update role mappings
4. Submit PR for review
5. Notify affected applications

### 9.2 Deprecating Permissions

To deprecate a permission:

1. Mark as deprecated in documentation
2. Set deprecation date (minimum 90 days notice)
3. Notify all applications using the permission
4. Provide migration path to new permission
5. After deprecation date, remove from system

### 9.3 Version History

**Version 2.0.0** (2025-01-XX)
- Reformatted for AI agent implementation
- Updated structure and examples
- Added comprehensive integration guide
- Clarified role hierarchy and permission inheritance

**Version 1.0.0** (2024-XX-XX)
- Initial application registry
- Basic permission definitions
- OIDC integration guidelines

---

## 10. Contact & Support

### For Application Developers

**Integration Support**: devs@ewf-stade.de  
**Response Time**: Within 48 hours

**Documentation**: https://docs.ewf-stade.de (future)  
**Status Page**: https://status.ewf-stade.de (future)

### For Users

**Support**: support@ewf-stade.de  
**Privacy Questions**: compliance@ewf-stade.de

### For Security Issues

**Security Contact**: security@ewf-stade.de  
**Response Time**: Within 24 hours  
**Disclosure Policy**: Coordinated disclosure after fix deployed

---

## Appendix: Quick Reference

### OIDC Endpoints

```
Discovery:       https://id.ewf-stade.de/.well-known/openid-configuration
Authorization:   https://id.ewf-stade.de/authorize
Token:          https://id.ewf-stade.de/api/auth/token
UserInfo:       https://id.ewf-stade.de/api/auth/userinfo
JWKS:           https://id.ewf-stade.de/.well-known/jwks.json
Logout:         https://id.ewf-stade.de/api/auth/logout
```

### Standard Scopes

```
openid              - Required for OIDC
profile             - Name, picture, locale
email               - Email and verification status
offline_access      - Refresh token
permissions         - User permissions array
ewf:team           - Team membership status
```

### Permission Format

```
Format: app:resource:action

Examples:
  schedule:event:create
  vote:ballot:view
  live:question:moderate
  admin:users:manage
```

### Role Hierarchy

```
admin > team > student > user
```

---

**End of Document**

This document is maintained by the EWF development team and should be updated whenever new applications are integrated or permissions are modified.