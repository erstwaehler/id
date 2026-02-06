# EWF-ID Comprehensive Audit Logging System

This document describes the comprehensive audit logging system implemented for EWF-ID's OIDC provider, which captures all security-relevant events across Better Auth plugins and integrates with OpenTelemetry/Axiom.

## Overview

The audit system provides:
- **Complete coverage** of all Better Auth plugins and endpoints
- **OTEL integration** with structured attributes for Axiom dashboards
- **Risk-based categorization** of security events
- **Path-specific metadata** extraction for detailed forensics
- **Real-time streaming** capabilities via Axiom

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Better Auth   │───▶│   Audit Hooks    │───▶│   OTEL Spans    │
│    Endpoints    │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Audit Events    │    │  Axiom Ingest   │
                       │   (Typed)        │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Covered Endpoints

### Core Authentication
- `/sign-in/email` → `user.login.email`
- `/sign-in/passkey` → `user.login.passkey`
- `/sign-up/email` → `user.register.email`
- `/sign-out` → `user.logout`
- `/verify-email` → `user.email.verify`
- `/reset-password` → `user.password.reset`
- `/change-password` → `user.password.change`

### Two-Factor Authentication (2FA)
- `/two-factor/enable` → `2fa.enable`
- `/two-factor/disable` → `2fa.disable`
- `/two-factor/verify-totp` → `2fa.totp.verify`
- `/two-factor/verify-otp` → `2fa.otp.verify`
- `/two-factor/generate-backup-codes` → `2fa.backup_codes.generate`
- `/two-factor/verify-backup-code` → `2fa.backup_codes.verify`

### Admin Operations
- `/admin/create-user` → `admin.user.create`
- `/admin/set-role` → `admin.user.role_change`
- `/admin/ban-user` → `admin.user.ban`
- `/admin/impersonate-user` → `admin.user.impersonate_start`
- `/admin/revoke-user-sessions` → `admin.session.revoke_all`

### Passkey (WebAuthn)
- `/passkey/add` → `passkey.register`
- `/passkey/sign-in` → `passkey.authenticate`
- `/passkey/delete` → `passkey.delete`

### OIDC Provider (EWF-ID as IdP)
- `/oauth2/register` → `oidc.client.register`
- `/oauth2/authorize` → `oidc.authorization.request`
- `/oauth2/token` → `oidc.token.issue`
- `/oauth2/userinfo` → `oidc.userinfo.access`
- `/oauth2/consent` → `oidc.consent.decision`

### OAuth Clients (School Integration)
- `/oauth2/callback/athenaeum` → `oauth.callback.athenaeum`
- `/oauth2/callback/vlg` → `oauth.callback.vlg`
- `/oauth2/callback/igs` → `oauth.callback.igs`
- `/oauth2/link` → `oauth.account.link`

### API Key Management
- `/api-key/create` → `api_key.create`
- `/api-key/delete` → `api_key.delete`
- `/api-key/verify` → `api_key.verify`

### Multi-Session Management
- `/multi-session/set-active` → `multi_session.switch`
- `/multi-session/revoke` → `multi_session.revoke`

## Security Risk Levels

Events are automatically categorized by risk level:

### CRITICAL (Immediate attention)
- `admin.user.delete` - User account deletion
- `admin.user.impersonate_start` - Admin impersonation
- `api_key.create` - API key creation
- `oidc.client.register` - New OIDC client
- `2fa.disable` - 2FA disabled
- `passkey.delete` - Passkey removal

### HIGH (Important security events)
- `user.login.email`, `user.login.passkey` - Authentication attempts
- `user.register.email` - New user registration
- `admin.user.role_change` - Permission changes
- `oidc.token.issue` - Token issuance
- `oauth.account.link` - Account linking

### MEDIUM (Routine security events)
- `user.logout` - User logout
- `2fa.totp.verify` - 2FA verification
- `passkey.authenticate` - Passkey authentication
- `multi_session.switch` - Session switching

### LOW (Informational events)
- `system.docs.access` - Documentation access
- `oidc.userinfo.access` - UserInfo endpoint
- `passkey.list` - Listing passkeys

## OTEL Attributes

All audit events include standardized OTEL attributes:

### Core Audit Attributes
```
audit.event_type: "user.login.email"
audit.event_category: "auth"
audit.timestamp: "2024-02-06T10:30:00.000Z"
audit.security_risk_level: "HIGH"
```

### Actor Information
```
audit.actor.id: "user_abc123"
audit.actor.type: "user" | "admin" | "system" | "anonymous"
audit.actor.email: "student@iserv.athenaeum-stade.de"
audit.actor.session_id: "ses_xyz789..."
```

### Resource Information
```
audit.resource.type: "user" | "session" | "client" | "api_key"
audit.resource.id: "user_def456"
audit.resource.name: "student@example.com"
```

### Action and Result
```
audit.action: "authenticate" | "create" | "update" | "delete"
audit.result: "success" | "failure" | "denied" | "error"
```

### Context Information
```
audit.context.ip_address: "192.168.1.100"
audit.context.user_agent: "Mozilla/5.0..."
audit.context.path: "/sign-in/email"
audit.context.method: "POST"
audit.context.client_id: "client_123" // For OIDC flows
```

### Path-Specific Metadata

#### Two-Factor Authentication
```
audit.metadata.auth_method: "totp" | "otp"
audit.metadata.trust_device: true | false
audit.metadata.backup_code_used: true
```

#### Admin Operations
```
audit.metadata.target_user_id: "user_target"
audit.metadata.target_role: "admin"
audit.metadata.ban_reason: "Policy violation"
audit.metadata.admin_operation: "impersonation"
```

#### OAuth/OIDC Flows
```
audit.metadata.client_id: "ewf_schedule"
audit.metadata.requested_scopes: "openid profile email"
audit.metadata.grant_type: "authorization_code"
audit.metadata.oauth_provider: "athenaeum"
```

#### Passkey Operations
```
audit.metadata.passkey_name: "iPhone Touch ID"
audit.metadata.authenticator_type: "platform"
audit.metadata.auth_method: "passkey"
```

## Usage

The audit system is automatically integrated into your Better Auth configuration:

```typescript
// src/lib/auth.ts
import { auditBeforeHook, auditAfterHook } from "./audit/hooks";

export const auth = betterAuth({
  // ... your config
  hooks: {
    before: auditBeforeHook,
    after: auditAfterHook,
  },
});
```

## Axiom Integration

### Querying Audit Events

**All authentication events:**
```aql
['logs'] 
| where ['audit.event_category'] == "auth"
| project ['audit.event_type'], ['audit.actor.email'], ['audit.result'], ['_time']
| order by ['_time'] desc
```

**Failed login attempts:**
```aql
['logs']
| where ['audit.event_type'] has_any("login") and ['audit.result'] == "failure"
| summarize count() by ['audit.actor.email'], bin(['_time'], 5m)
| order by ['_time'] desc
```

**Critical security events:**
```aql
['logs']
| where ['audit.security_risk_level'] == "CRITICAL"
| project ['audit.event_type'], ['audit.actor.email'], ['audit.metadata.*'], ['_time']
| order by ['_time'] desc
```

**Admin operations:**
```aql
['logs']
| where ['audit.event_category'] == "admin"
| project ['audit.event_type'], ['audit.metadata.admin_user_id'], ['audit.metadata.target_user_id'], ['_time']
| order by ['_time'] desc
```

**OIDC token issuance:**
```aql
['logs']
| where ['audit.event_type'] == "oidc.token.issue"
| summarize count() by ['audit.metadata.client_id'], bin(['_time'], 1h)
| order by ['_time'] desc
```

### Real-Time Dashboard Queries

**Authentication rate (last hour):**
```aql
['logs']
| where ['_time'] > ago(1h) and ['audit.event_category'] == "auth"
| summarize count() by bin(['_time'], 5m), ['audit.result']
| order by ['_time'] desc
```

**2FA usage patterns:**
```aql
['logs']
| where ['audit.event_type'] has_prefix("2fa.")
| summarize count() by ['audit.metadata.auth_method'], ['audit.result']
```

**School-wise login distribution:**
```aql
['logs']
| where ['audit.event_type'] contains "login"
| extend school = extract(@"@iserv\.([^\.]+)", 1, ['audit.actor.email'])
| summarize logins=count() by school, bin(['_time'], 1h)
| order by ['_time'] desc
```

## Export Capabilities

### JSONL Export

Axiom provides native .jsonl export via API:

```bash
curl -X GET "https://api.axiom.co/v1/datasets/{dataset}/query" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "apl": "[\"logs\"] | where [\"audit.event_category\"] == \"auth\"",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-31T23:59:59Z",
    "format": "jsonl"
  }'
```

### Export Structure

Each exported event contains:
- Complete audit event data
- OTEL trace context
- Correlation IDs for request tracking
- Full metadata for forensic analysis

## Performance Considerations

- **Dual-write pattern**: OTEL spans + audit events
- **Async processing**: No blocking on audit logging
- **Batched ingestion**: OTEL handles batching to Axiom
- **Attribute cardinality**: Optimized for Axiom's indexing
- **Sampling**: Configurable via OTEL sampler (currently all events)

## Compliance Features

- **Immutable audit trail** (once in Axiom)
- **Retention policies** (configurable in Axiom)
- **Export capabilities** for regulatory requirements
- **Actor attribution** for all events
- **Timestamp precision** with timezone information
- **Request correlation** via trace IDs

## Monitoring & Alerting

Set up alerts in Axiom for:

1. **Failed login attempts** > 5 per user per minute
2. **Critical events** (any occurrence)
3. **Admin operations** outside business hours
4. **API key creation** events
5. **2FA disable** events
6. **Multiple concurrent sessions** > 3 per user

## Event Examples

### Successful Login
```json
{
  "audit.event_type": "user.login.email",
  "audit.event_category": "auth",
  "audit.security_risk_level": "HIGH",
  "audit.actor.email": "student@iserv.athenaeum-stade.de",
  "audit.result": "success",
  "audit.metadata.auth_method": "email_password",
  "audit.metadata.email_domain": "iserv.athenaeum-stade.de",
  "audit.metadata.user_school": "athenaeum"
}
```

### Admin User Ban
```json
{
  "audit.event_type": "admin.user.ban",
  "audit.event_category": "admin",
  "audit.security_risk_level": "CRITICAL",
  "audit.actor.email": "admin@ewf-stade.de",
  "audit.result": "success",
  "audit.metadata.admin_user_id": "admin_123",
  "audit.metadata.target_user_id": "user_456",
  "audit.metadata.ban_reason": "Policy violation",
  "audit.metadata.ban_duration": "2592000"
}
```

### OIDC Token Issuance
```json
{
  "audit.event_type": "oidc.token.issue",
  "audit.event_category": "auth",
  "audit.security_risk_level": "HIGH",
  "audit.result": "success",
  "audit.metadata.client_id": "ewf_schedule",
  "audit.metadata.requested_scopes": "openid profile email",
  "audit.metadata.grant_type": "authorization_code",
  "audit.metadata.oidc_flow": "token_exchange"
}
```

This comprehensive audit system provides complete visibility into your OIDC provider's security events while leveraging your existing OTEL/Axiom infrastructure.