# EWF-ID Copilot Prompts

## Phase 1-4: Core Authentication & User Management

```
@copilot 

**Lies zuerst:** `SPEC.md`, `INTEGRATED_APPS.md`, `FRONTEND_SKILL.md`, `IMPLEMENTATION_GUIDE.md`, `src/env.ts`

**Implementiere Phasen 1-4 vollständig:**
- Phase 1: Core Authentication (Email/Password, School OIDC, Basic UI)
- Phase 2: Advanced Auth (2FA, Passkeys, Multi-Session)
- Phase 3: User Management (Profile, Security, GDPR Features)
- Phase 4: Permissions & Roles (RBAC, Claims in Tokens)

**Kritisch:**
1. Effect.ts für alle Error Handling
2. ALLE Better Auth Plugins konfigurieren (SPEC §6)
3. Paraglide i18n (DE/EN) - ALLE Strings übersetzt
4. FRONTEND_SKILL.md befolgen - mutige Ästhetik wählen
5. Drizzle ORM + Migrations generieren
6. OTEL Tracing + PostHog Events
7. Rate Limiting + CAPTCHA + Input Validation

**STOPPE NICHT vor:**
✅ Alle Phase 1-4 Tasks komplett
✅ Tests geschrieben und passing
✅ Diagnostics clean
✅ Biome formatted
✅ Zusammenfassung erstellt

**Bei Unklarheiten:** SPEC.md ist die Bibel. Starte mit Phase 1, Task 1.1.
```

---

## Phase 5-8: Admin Dashboard & OIDC Provider

```
@copilot 

**Lies zuerst:** `SPEC.md`, `INTEGRATED_APPS.md`, `FRONTEND_SKILL.md`, `IMPLEMENTATION_GUIDE.md`

**Implementiere Phasen 5-8 vollständig:**
- Phase 5: Admin Dashboard (User Management, Impersonation, Audit Logs)
- Phase 6: OIDC Provider (Authorization, Token, Consent, Device Flow)
- Phase 7: API Layer (REST APIs, Documentation)
- Phase 8: Internationalization (Paraglide, DE/EN vollständig)

**Kritisch:**
1. Admin Dashboard: User CRUD, Impersonation mit Audit, API Keys, Statistics
2. OIDC: Standard-compliant (Discovery, Authorization, Token, UserInfo, JWKS)
3. APIs: Versioniert (/api/v1/), Auth required, Rate Limited, Documented
4. i18n: ALLE UI Strings, Error Messages, Email Templates übersetzt
5. Effect.ts für Business Logic
6. OTEL + PostHog bei allen kritischen Operationen
7. Permission Guards auf ALLEN geschützten Routes

**STOPPE NICHT vor:**
✅ Alle Phase 5-8 Tasks komplett
✅ OIDC Flow mit openid-client getestet
✅ Admin Dashboard voll funktionsfähig
✅ API Docs generiert
✅ Tests passing
✅ Diagnostics clean
✅ Zusammenfassung erstellt

**Bei Unklarheiten:** SPEC.md §4-7. Starte mit Phase 5, Task 5.1.
```

---

## Phase 9-12: Legal, Monitoring, Security & Polish

```
@copilot 

**Lies zuerst:** `SPEC.md`, `FRONTEND_SKILL.md`, `IMPLEMENTATION_GUIDE.md`

**Implementiere Phasen 9-12 vollständig:**
- Phase 9: Legal & Compliance (Privacy, Terms, DI.Day, GDPR Workflows)
- Phase 10: Monitoring & Observability (OTEL, Axiom, PostHog, Audit Logs)
- Phase 11: Security Hardening (Headers, Rate Limits, Input Validation)
- Phase 12: Frontend Polish (Responsive, Accessibility, Loading States, Error Handling)

**Kritisch:**
1. Legal Pages: Privacy Policy, ToS, DI.Day mit allen Subprocessors + mailto: Links
2. GDPR: Data Export (JSON), Account Deletion (14d grace), Retention Policies
3. OTEL: Instrumentierung ALLER kritischen Pfade mit Trace IDs
4. PostHog: ALLE Analytics Events (SPEC §10.3)
5. Security Headers: HSTS, CSP, X-Frame-Options, etc.
6. Rate Limiting: Konfiguriert per Endpoint-Type
7. WCAG 2.1 AA: Keyboard Nav, Screen Reader, Contrast
8. FRONTEND_SKILL.md: Distinctive Design, keine Generic AI Aesthetics

**STOPPE NICHT vor:**
✅ Alle Phase 9-12 Tasks komplett
✅ Legal Pages vollständig (DE/EN)
✅ Security Checklist (SPEC §12.6) abgehakt
✅ Accessibility Tests passing
✅ OTEL Traces in Axiom sichtbar
✅ Tests passing
✅ Diagnostics clean
✅ Zusammenfassung erstellt

**Bei Unklarheiten:** SPEC.md §9-12. Starte mit Phase 9, Task 9.1.
```

---

## Phase 13-14: Deployment & Launch

```
@copilot 

**Lies zuerst:** `SPEC.md`, `IMPLEMENTATION_GUIDE.md`

**Implementiere Phasen 13-14 vollständig:**
- Phase 13: CI/CD & Deployment (GitHub Actions, Vercel, Migrations)
- Phase 14: Documentation & Launch (Docs, Testing, Backup, Go-Live)

**Kritisch:**
1. GitHub Actions: Deploy Workflow mit Blacksmith Runner
2. Migration Job: Läuft VOR Deployment, mit Rollback
3. Vercel: Production + Preview Deployments, Custom Domain
4. Health Checks: Nach Deployment, Rollback on Failure
5. Documentation: README, API Docs, User Guide, Admin Guide, Integration Guide
6. Testing: E2E, Load, Security, UAT
7. Backup & Recovery: Neon Backups, Restore Procedure, Disaster Recovery Plan
8. Launch Checklist: SPEC §14.5 vollständig abarbeiten

**STOPPE NICHT vor:**
✅ Alle Phase 13-14 Tasks komplett
✅ GitHub Actions Workflows funktionieren
✅ Production Deployment erfolgreich
✅ Health Checks passing
✅ Alle Docs vollständig
✅ Launch Checklist komplett
✅ Monitoring aktiv und healthy
✅ Zusammenfassung + Go-Live Report erstellt

**Bei Unklarheiten:** SPEC.md §11, §13, §14. Starte mit Phase 13, Task 13.1.
```

---

## Quick Feature Prompts

### Implement 2FA
```
@copilot Implementiere vollständige 2FA gemäß SPEC §6.1.1: TOTP Setup mit QR Code, Backup Codes (encrypted), 2FA Challenge, Recovery Flow, UI bei /account/security. Effect.ts verwenden, Tests schreiben, NICHT STOPPEN bis komplett.
```

### Implement OIDC Provider
```
@copilot Implementiere OIDC Provider gemäß SPEC §4.4 und §6: Discovery, Authorization, Token, UserInfo, JWKS Endpoints. Authorization Code + PKCE + Device Flow. Consent Screen. JWT mit RS256. Custom Claims (INTEGRATED_APPS.md). NICHT STOPPEN bis mit openid-client getestet.
```

### Implement Admin Dashboard
```
@copilot Implementiere Admin Dashboard gemäß SPEC §5.3: User List (paginated), User CRUD, Impersonation mit Audit, API Key Management, Audit Log Viewer, System Statistics. Permission Guards. Effect.ts. NICHT STOPPEN bis voll funktionsfähig.
```

### Implement GDPR Features
```
@copilot Implementiere GDPR Features gemäß SPEC §9: Data Export (JSON), Account Deletion (14d grace + cancel), Privacy Policy Page, Terms Page, DI.Day Page. Alle mit mailto: Links zu compliance@ewf-stade.de. DE/EN. NICHT STOPPEN bis komplett.
```

---

## Usage Notes

1. **Immer zuerst Specs lesen lassen** - Die Prompts referenzieren die Specs
2. **"NICHT STOPPEN" ist wichtig** - Agents neigen dazu aufzugeben
3. **Spezifische SPEC Sections** - Hilft dem Agent sich zu orientieren
4. **Kritische Requirements** - Was MUSS beachtet werden
5. **Stop-Kriterien** - Klare Definition wann "fertig" ist

## Tips für beste Ergebnisse

- Stelle sicher alle Specs sind up-to-date
- Gib dem Agent Zeit, die Specs zu lesen
- Bei Blockern: Verweise auf spezifische SPEC Sections
- Fordere Tests ein: "Tests schreiben" explizit erwähnen
- Fordere Zusammenfassungen ein: Hilft zu validieren was gemacht wurde