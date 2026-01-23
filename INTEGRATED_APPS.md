# EWF-ID Integrated Applications

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Application Structure](#application-structure)
3. [Standard Claims](#standard-claims)
4. [Application Definitions](#application-definitions)
5. [Permission Matrix](#permission-matrix)
6. [Integration Guidelines](#integration-guidelines)

---

## 1. Overview

This document defines all applications that integrate with EWF-ID as their identity provider, including their required claims, permissions (scopes), and access control rules.

### Purpose

- Provide a single source of truth for all integrated applications
- Define permission structures for each application
- Establish role-based access patterns
- Guide implementation of new integrations

### Terminology

- **Claim**: User attribute included in OIDC tokens (e.g., `email`, `roles`)
- **Permission/Scope**: Action a user can perform (e.g., `schedule:event:create`)
- **Role**: Collection of permissions assigned to user types
- **Access Level**: Minimum requirement to access an application

---

## 2. Application Structure

Each application follows this structure:

```typescript
interface Application {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  shortName: string;             // Abbreviated name
  description: string;           // Purpose and functionality
  url: {
    production: string;
    development: string;
  };
  accessLevel: AccessLevel;      // Who can access
  standardClaims: string[];      // OIDC standard claims required
  customClaims: string[];        // Custom claims required
  permissions: Permission[];     // Available permissions
  defaultPermissions: {          // Auto-granted permissions by role
    student: string[];
    teacher: string[];
    team: string[];
    admin: string[];
  };
}

type AccessLevel = 
  | 'public'        // All authenticated users
  | 'team_only'     // Only team members and admins
  | 'admin_only'    // Only administrators
  | 'restricted';   // Custom access rules

interface Permission {
  scope: string;               // Permission identifier (app:resource:action)
  name: string;                // Display name
  description: string;         // What this permission allows
  requiredRole?: Role[];       // Minimum role requirement
  dangerous?: boolean;         // Requires extra confirmation
}
```

---

## 3. Standard Claims

All applications receive these standard OIDC claims:

### Always Included

```typescript
{
  // Standard OIDC Claims
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User ID (UUID)
  "email": "max.mustermann@athenetz.de",           // Email address
  "email_verified": true,                          // Always true (from school OIDC)
  "name": "Max Mustermann",                        // Full name
  "given_name": "Max",                             // First name
  "family_name": "Mustermann",                     // Last name
  "locale": "de",                                  // User's language preference
  
  // Custom EWF Claims
  "roles": ["student"],                            // User roles
  "school": "athenaeum",                           // School identifier
  "school_name": "Gymnasium Athenaeum Stade",      // School display name
  "account_created": "2025-01-15T10:30:00Z",       // Account creation timestamp
  "last_login": "2025-01-20T14:22:00Z"             // Last login timestamp
}
```

### Optional (Request via Scopes)

```typescript
{
  "picture": "https://...",           // Profile picture URL (scope: profile)
  "preferred_username": "maxm",       // Display name (scope: profile)
  "team_member": true,                // Is user a team member (scope: team)
  "permissions": [...],               // User's permissions (scope: permissions)
}
```

---

## 4. Application Definitions

### 4.1 Schedule (schedule.ewf-stade.de)

**Purpose**: Event planning, scheduling, and management for the Erstwähler Forum

**Access Level**: `restricted` (team members and specific students)

**Description**: 
The scheduling application allows team members to create, manage, and publish events for the Erstwähler Forum. Students can view published events and RSVP. Teachers have oversight capabilities.

**Standard Claims Required**:
- `sub`, `email`, `name`, `given_name`, `family_name`
- `roles`, `school`

**Custom Claims Required**:
- `permissions` (to check event management rights)
- `team_member`

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `schedule:access` | Access Schedule | View the schedule application | `student`+ |
| `schedule:event:view` | View Events | View all published events | `student`+ |
| `schedule:event:view:draft` | View Draft Events | View unpublished events | `team`+ |
| `schedule:event:create` | Create Events | Create new events | `team`+ |
| `schedule:event:edit` | Edit Events | Edit existing events | `team`+ |
| `schedule:event:edit:any` | Edit Any Event | Edit events created by others | `team`+ |
| `schedule:event:delete` | Delete Events | Delete own events | `team`+ |
| `schedule:event:delete:any` | Delete Any Event | Delete any event | `admin` |
| `schedule:event:publish` | Publish Events | Publish events (make visible to students) | `team`+ |
| `schedule:event:unpublish` | Unpublish Events | Unpublish events | `team`+ |
| `schedule:rsvp:create` | RSVP to Events | Register for events | `student`+ |
| `schedule:rsvp:cancel` | Cancel RSVP | Cancel own RSVP | `student`+ |
| `schedule:rsvp:manage` | Manage RSVPs | View and manage all RSVPs | `team`+ |
| `schedule:location:manage` | Manage Locations | Add/edit/delete locations | `team`+ |
| `schedule:category:manage` | Manage Categories | Add/edit/delete event categories | `team`+ |
| `schedule:analytics:view` | View Analytics | View event analytics and statistics | `team`+ |
| `schedule:export` | Export Data | Export schedule data | `team`+ |

**Default Permissions by Role**:
- **Student**: `schedule:access`, `schedule:event:view`, `schedule:rsvp:create`, `schedule:rsvp:cancel`
- **Teacher**: All student permissions + `schedule:event:view:draft`, `schedule:rsvp:manage`, `schedule:analytics:view`
- **Team**: All teacher permissions + `schedule:event:create`, `schedule:event:edit`, `schedule:event:publish`, `schedule:event:unpublish`, `schedule:location:manage`, `schedule:category:manage`, `schedule:export`
- **Admin**: All permissions

---

### 4.2 Vote (vote.ewf-stade.de)

**Purpose**: Digital voting system for elections and polls

**Access Level**: `public` (all authenticated users during event)

**Description**: 
The voting application enables democratic participation through secure digital voting. Supports multiple ballot types, real-time results, and ensures one vote per person.

**Standard Claims Required**:
- `sub`, `email`, `name`
- `roles`, `school`

**Custom Claims Required**:
- `permissions`
- `email_verified` (must be true to vote)

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `vote:access` | Access Voting | Access the voting application | `student`+ |
| `vote:ballot:view` | View Ballots | View active ballots | `student`+ |
| `vote:ballot:view:closed` | View Closed Ballots | View results of closed ballots | `student`+ |
| `vote:ballot:cast` | Cast Vote | Submit a vote | `student`+ |
| `vote:ballot:verify` | Verify Vote | Verify own vote was counted | `student`+ |
| `vote:ballot:create` | Create Ballot | Create new ballots/polls | `team`+ |
| `vote:ballot:edit` | Edit Ballot | Edit ballot (before opening) | `team`+ |
| `vote:ballot:delete` | Delete Ballot | Delete ballot | `team`+ |
| `vote:ballot:open` | Open Ballot | Open ballot for voting | `team`+ |
| `vote:ballot:close` | Close Ballot | Close ballot and finalize results | `team`+ |
| `vote:results:view` | View Results | View live/final results | `team`+ |
| `vote:results:export` | Export Results | Export results and analytics | `team`+ |
| `vote:audit:view` | View Audit Log | View voting audit trail | `admin` |
| `vote:moderate` | Moderate Votes | Invalidate fraudulent votes | `admin` |

**Default Permissions by Role**:
- **Student**: `vote:access`, `vote:ballot:view`, `vote:ballot:view:closed`, `vote:ballot:cast`, `vote:ballot:verify`
- **Teacher**: All student permissions + `vote:results:view`
- **Team**: All teacher permissions + `vote:ballot:create`, `vote:ballot:edit`, `vote:ballot:delete`, `vote:ballot:open`, `vote:ballot:close`, `vote:results:export`
- **Admin**: All permissions

**Special Rules**:
- Students can only vote during open ballot period
- Each user can vote once per ballot (enforced at application level)
- Votes are anonymous but verifiable (cryptographic receipts)

---

### 4.3 Live (live.ewf-stade.de)

**Purpose**: Real-time interaction during live events (Q&A, polls, reactions)

**Access Level**: `public` (all authenticated users during events)

**Description**: 
Live engagement platform for real-time interaction during EWF events. Supports live Q&A, instant polls, emoji reactions, and moderation.

**Standard Claims Required**:
- `sub`, `name`, `given_name`
- `roles`, `school`

**Custom Claims Required**:
- `permissions`

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `live:access` | Access Live | Access the live interaction app | `student`+ |
| `live:event:view` | View Live Event | View live event stream | `student`+ |
| `live:question:submit` | Submit Question | Submit questions during Q&A | `student`+ |
| `live:vote:submit` | Submit Vote | Vote in live polls | `student`+ |
| `live:reaction:send` | Send Reaction | Send emoji reactions | `student`+ |
| `live:chat:send` | Send Chat | Send chat messages (if enabled) | `student`+ |
| `live:event:create` | Create Live Event | Create new live event session | `team`+ |
| `live:event:start` | Start Event | Start live event | `team`+ |
| `live:event:stop` | Stop Event | Stop live event | `team`+ |
| `live:event:manage` | Manage Event | Configure event settings | `team`+ |
| `live:question:moderate` | Moderate Questions | Approve/reject questions | `team`+ |
| `live:question:highlight` | Highlight Question | Feature question on screen | `team`+ |
| `live:poll:create` | Create Poll | Create instant polls | `team`+ |
| `live:poll:close` | Close Poll | Close poll and show results | `team`+ |
| `live:chat:moderate` | Moderate Chat | Delete messages, timeout users | `team`+ |
| `live:analytics:view` | View Analytics | View engagement analytics | `team`+ |
| `live:export` | Export Data | Export questions, polls, analytics | `team`+ |

**Default Permissions by Role**:
- **Student**: `live:access`, `live:event:view`, `live:question:submit`, `live:vote:submit`, `live:reaction:send`, `live:chat:send`
- **Teacher**: All student permissions + `live:analytics:view`
- **Team**: All teacher permissions + all `live:event:*`, `live:question:moderate`, `live:question:highlight`, `live:poll:*`, `live:chat:moderate`, `live:export`
- **Admin**: All permissions

**Rate Limits** (enforced at app level):
- Questions: 5 per 5 minutes per user
- Reactions: 20 per minute per user
- Chat messages: 10 per minute per user

---

### 4.4 Screens (screens.ewf-stade.de)

**Purpose**: Display management system for physical screens/projectors at events

**Access Level**: `team_only` (students cannot access)

**Description**: 
Control panel for managing content displayed on physical screens during events. Supports slides, live feeds, schedules, announcements, and emergency alerts.

**Standard Claims Required**:
- `sub`, `email`, `name`
- `roles`

**Custom Claims Required**:
- `permissions`
- `team_member` (must be true)

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `screens:access` | Access Screens | Access the screens management app | `team`+ |
| `screens:view` | View Screens | View current screen content | `team`+ |
| `screens:manage` | Manage Screens | Control screen content | `team`+ |
| `screens:content:upload` | Upload Content | Upload slides, images, videos | `team`+ |
| `screens:content:edit` | Edit Content | Edit/delete uploaded content | `team`+ |
| `screens:content:delete` | Delete Content | Delete content | `team`+ |
| `screens:playlist:create` | Create Playlist | Create content playlists | `team`+ |
| `screens:playlist:edit` | Edit Playlist | Edit existing playlists | `team`+ |
| `screens:playlist:activate` | Activate Playlist | Set active playlist for screens | `team`+ |
| `screens:emergency` | Emergency Override | Show emergency message on all screens | `team`+ |
| `screens:display:control` | Display Control | Control individual displays | `team`+ |
| `screens:display:configure` | Configure Displays | Configure display settings | `admin` |

**Default Permissions by Role**:
- **Student**: *No access* (redirected with error message)
- **Teacher**: `screens:access`, `screens:view`
- **Team**: All permissions except `screens:display:configure`
- **Admin**: All permissions

**Special Rules**:
- Students attempting to access are shown: "This application is only available to team members."
- Emergency override can be triggered by any team member
- Display configuration requires admin role

---

### 4.5 Info (info.ewf-stade.de)

**Purpose**: Public information website about the Erstwähler Forum

**Access Level**: `public` (no authentication required for viewing, auth required for management)

**Description**: 
Public-facing website with information about the Erstwähler Forum, participating schools, upcoming events, and resources for first-time voters.

**Standard Claims Required** (when authenticated):
- `sub`, `email`, `name`
- `roles`

**Custom Claims Required**:
- `permissions` (for management functions)

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `info:view` | View Info Site | View public information | *Public* |
| `info:content:edit` | Edit Content | Edit website content | `team`+ |
| `info:content:publish` | Publish Content | Publish content changes | `team`+ |
| `info:page:create` | Create Page | Create new pages | `team`+ |
| `info:page:delete` | Delete Page | Delete pages | `admin` |
| `info:media:upload` | Upload Media | Upload images/videos | `team`+ |
| `info:media:delete` | Delete Media | Delete media files | `team`+ |
| `info:analytics:view` | View Analytics | View site analytics | `team`+ |

**Default Permissions by Role**:
- **Student**: `info:view` (public access, no auth required)
- **Teacher**: Same as student
- **Team**: All permissions except `info:page:delete`
- **Admin**: All permissions

---

### 4.6 Admin Dashboard (admin.ewf-stade.de)

**Purpose**: Centralized administration panel for all EWF applications

**Access Level**: `admin_only`

**Description**: 
Unified admin interface for managing users, monitoring applications, viewing analytics, and configuring system settings across all EWF applications.

**Standard Claims Required**:
- `sub`, `email`, `name`
- `roles`

**Custom Claims Required**:
- `permissions`

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `admin:access` | Access Admin Panel | Access the admin dashboard | `admin` |
| `admin:users:view` | View Users | View user list and details | `admin` |
| `admin:users:edit` | Edit Users | Edit user information | `admin` |
| `admin:users:delete` | Delete Users | Delete user accounts | `admin` |
| `admin:users:impersonate` | Impersonate Users | Sign in as another user | `admin` |
| `admin:roles:manage` | Manage Roles | Create/edit/delete roles | `admin` |
| `admin:permissions:manage` | Manage Permissions | Assign/revoke permissions | `admin` |
| `admin:apps:view` | View Applications | View all connected apps | `admin` |
| `admin:apps:configure` | Configure Applications | Configure app settings | `admin` |
| `admin:analytics:view` | View Analytics | View system-wide analytics | `admin` |
| `admin:audit:view` | View Audit Logs | View all audit logs | `admin` |
| `admin:system:configure` | System Configuration | Configure system settings | `admin` |

**Default Permissions by Role**:
- **Student**: *No access*
- **Teacher**: *No access*
- **Team**: *No access* (use individual app admin features)
- **Admin**: All permissions

---

### 4.7 Profile (profile.ewf-stade.de)

**Purpose**: User profile management and account settings

**Access Level**: `public` (all authenticated users)

**Description**: 
Personal profile page where users can view and edit their account information, manage security settings, view connected apps, and exercise GDPR rights.

**Standard Claims Required**:
- `sub`, `email`, `name`, `given_name`, `family_name`
- `roles`, `school`
- `account_created`, `last_login`

**Custom Claims Required**:
- `permissions`
- `picture`

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `profile:view` | View Profile | View own profile | `student`+ |
| `profile:edit` | Edit Profile | Edit own profile information | `student`+ |
| `profile:picture:upload` | Upload Picture | Upload profile picture | `student`+ |
| `profile:security:view` | View Security Settings | View security settings | `student`+ |
| `profile:security:edit` | Edit Security Settings | Change password, enable 2FA | `student`+ |
| `profile:apps:view` | View Connected Apps | View apps with access to account | `student`+ |
| `profile:apps:revoke` | Revoke App Access | Revoke app authorization | `student`+ |
| `profile:data:export` | Export Data | Request GDPR data export | `student`+ |
| `profile:account:delete` | Delete Account | Request account deletion | `student`+ |

**Default Permissions by Role**:
- **Student**: All permissions
- **Teacher**: All permissions
- **Team**: All permissions
- **Admin**: All permissions

**Special Notes**:
- Email address cannot be changed (GDPR compliance)
- All users have equal permissions in profile management
- Profile app is part of EWF-ID (same domain: id.ewf-stade.de/profile)

---

## 5. Permission Matrix

### 5.1 Permission Naming Convention

Format: `app:resource:action`

- **app**: Application identifier (schedule, vote, live, screens, admin, profile)
- **resource**: Resource type (event, ballot, question, screen, user, etc.)
- **action**: Action verb (view, create, edit, delete, manage, etc.)

### 5.2 Role-Based Access Summary

| Application | Student | Teacher | Team | Admin |
|-------------|---------|---------|------|-------|
| **Schedule** | View, RSVP | + View drafts, Manage RSVPs | + Create, Edit, Publish | Full Control |
| **Vote** | Vote, View results | + View live results | + Create ballots, Manage votes | + Audit, Moderate |
| **Live** | Participate | + Analytics | + Manage events, Moderate | Full Control |
| **Screens** | ❌ No Access | View only | Full Management | + Configure |
| **Info** | Public view | Public view | Edit content | + Delete pages |
| **Admin** | ❌ No Access | ❌ No Access | ❌ No Access | Full Control |
| **Profile** | Full Control | Full Control | Full Control | Full Control |

### 5.3 Wildcard Permissions

Admins automatically receive wildcard permissions:
- `*:*:*` - All permissions across all apps
- `admin:*:*` - All admin permissions
- `{app}:*:*` - All permissions for specific app

### 5.4 Permission Inheritance

Roles inherit permissions hierarchically:
```
Admin
  ├─ All Team permissions
  └─ All admin-specific permissions

Team
  ├─ All Teacher permissions
  └─ All team-specific permissions

Teacher
  ├─ All Student permissions
  └─ All teacher-specific permissions

Student
  └─ Base permissions
```

---

## 6. Integration Guidelines

### 6.1 For Application Developers

#### Step 1: Register Your Application

Contact: devs@ewf-stade.de

Provide:
- Application name and description
- URLs (production, development)
- Required scopes/permissions
- Redirect URIs
- Logo and branding assets

Receive:
- Client ID
- Client Secret
- Documentation and example code

#### Step 2: Implement OIDC Flow

```typescript
// Example using openid-client
import { Issuer } from 'openid-client';

const issuer = await Issuer.discover('https://id.ewf-stade.de');

const client = new issuer.Client({
  client_id: process.env.OIDC_CLIENT_ID,
  client_secret: process.env.OIDC_CLIENT_SECRET,
  redirect_uris: ['https://your-app.ewf-stade.de/callback'],
  response_types: ['code'],
});

// Redirect to authorization
app.get('/login', (req, res) => {
  const authUrl = client.authorizationUrl({
    scope: 'openid email profile schedule:event:view schedule:event:create',
    state: generateState(),
  });
  res.redirect(authUrl);
});

// Handle callback
app.get('/callback', async (req, res) => {
  const params = client.callbackParams(req);
  const tokenSet = await client.callback(
    'https://your-app.ewf-stade.de/callback',
    params,
    { state: req.session.state }
  );
  
  const userinfo = await client.userinfo(tokenSet.access_token);
  // userinfo contains standard + custom claims
  
  req.session.user = userinfo;
  res.redirect('/dashboard');
});
```

#### Step 3: Check Permissions

```typescript
// Middleware to check permissions
function requirePermission(permission: string) {
  return (req, res, next) => {
    const user = req.session.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!user.permissions?.includes(permission) && !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    next();
  };
}

// Usage
app.post('/events', 
  requirePermission('schedule:event:create'),
  async (req, res) => {
    // Create event
  }
);
```

#### Step 4: Handle Token Refresh

```typescript
// Refresh token before expiration
async function refreshAccessToken(refreshToken: string) {
  const tokenSet = await client.refresh(refreshToken);
  // Update stored tokens
  return tokenSet;
}

// Middleware to ensure fresh token
async function ensureFreshToken(req, res, next) {
  const tokenSet = req.session.tokenSet;
  
  if (tokenSet.expired()) {
    try {
      req.session.tokenSet = await refreshAccessToken(tokenSet.refresh_token);
    } catch (error) {
      // Refresh failed, require re-authentication
      return res.redirect('/login');
    }
  }
  
  next();
}
```

### 6.2 Testing Your Integration

#### Development Environment

- Use development URLs: `dev.id.ewf-stade.de`
- Test users available with different roles
- Feature flags can be enabled for testing

#### Test Checklist

- [ ] OIDC discovery works
- [ ] Authorization flow completes successfully
- [ ] Tokens contain expected claims
- [ ] Token refresh works
- [ ] Permission checks work correctly
- [ ] Error handling (expired token, invalid scope)
- [ ] Logout flow works
- [ ] Works across different user roles
- [ ] Mobile responsive
- [ ] Internationalization works (DE/EN)

### 6.3 Production Deployment

#### Prerequisites

- [ ] Security review completed
- [ ] GDPR compliance verified
- [ ] Rate limiting configured
- [ ] Error logging set up
- [ ] Monitoring enabled
- [ ] Backup/recovery plan
- [ ] Documentation complete

#### Go-Live Checklist

- [ ] Production OIDC credentials configured
- [ ] HTTPS enforced
- [ ] Redirect URIs updated
- [ ] CORS configured
- [ ] Security headers set
- [ ] CSP policy configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] User documentation available
- [ ] Support contact information provided

### 6.4 Requesting New Permissions

If your application needs new permissions:

1. Document the use case
2. Explain why existing permissions don't suffice
3. Specify the permission scope format
4. Indicate which roles should have access
5. Submit proposal to: devs@ewf-stade.de

Evaluation criteria:
- Principle of least privilege
- User privacy impact
- Security implications
- Alignment with EWF values

---

## 7. Adding New Applications

To add a new application to this registry:

### 7.1 Application Template

```markdown
### X.X Application Name (app.ewf-stade.de)

**Purpose**: Brief description

**Access Level**: `public|restricted|team_only|admin_only`

**Description**: 
Detailed description of what the application does.

**Standard Claims Required**:
- List of required standard claims

**Custom Claims Required**:
- List of required custom claims

**Permissions**:

| Scope | Name | Description | Required Role |
|-------|------|-------------|---------------|
| `app:resource:action` | Display Name | What it does | `role`+ |

**Default Permissions by Role**:
- **Student**: List
- **Teacher**: List
- **Team**: List
- **Admin**: List

**Special Rules** (if any):
- Any special access rules or notes
```

### 7.2 Review Process

1. Submit application definition
2. Security review
3. Permission structure review
4. Integration with EWF-ID
5. Testing phase
6. Documentation update
7. Production approval

---

## 8. Maintenance

### 8.1 Permission Updates

When modifying permissions:

1. Update this document first
2. Update EWF-ID permission definitions
3. Update affected applications
4. Test with all role types
5. Document migration path for existing users
6. Announce changes to users (if breaking)

### 8.2 Version History

**v1.0.0** - 2025-01-XX
- Initial application registry
- Defined: Schedule, Vote, Live, Screens, Info, Admin, Profile
- Established permission naming convention
- Created integration guidelines

---

## 9. Contact & Support

**For Application Developers:**
- Email: devs@ewf-stade.de
- Documentation: https://docs.ewf-stade.de
- Support Hours: Mon-Fri 9:00-17:00 CET

**For Security Issues:**
- Email: security@ewf-stade.de
- Response Time: 48 hours
- Coordinated disclosure preferred

**For Permission Requests:**
- Email: devs@ewf-stade.de
- Response Time: 5 business days
- Include use case and justification

---

**End of Document**

This document is maintained by the EWF development team and serves as the authoritative source for all application integrations with EWF-ID.