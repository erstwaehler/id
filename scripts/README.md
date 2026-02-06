# Auth Generation Script

## Übersicht

Das `auth-gen.ts` Script ist ein Wrapper um Better Auth CLI, der automatisch:

1. **Better Auth Schema generiert** mit korrektem `pgSchema`
2. **Encryption at Rest** für sensible Felder aktiviert
3. **Schutz vor Überschreibungen** durch Better Auth CLI

## Verwendung

```bash
# Schema generieren
bun auth:gen

# Migration erstellen und anwenden
bun auth:migrate

# Direkt in DB pushen (keine Migrationsdateien)
bun auth:push
```

## Was das Script macht

### 1. pgTable → pgSchema Konvertierung

Better Auth generiert standardmäßig:

```typescript
import { pgTable } from "drizzle-orm/pg-core";
export const user = pgTable("user", { ... });
```

Das Script konvertiert zu:

```typescript
import { pgSchema } from "drizzle-orm/pg-core";
const pgTable = pgSchema("betterauth").table;
export const user = pgTable("user", { ... });
```

✅ Alle Tabellen landen im `betterauth` Schema

### 2. Encryption at Rest

Better Auth generiert:

```typescript
export const user = pgTable("user", {
  email: text("email").notNull(),
  firstName: text("first_name"),
});
```

Das Script ersetzt automatisch sensible Felder:

```typescript
import { encryptedText } from "~/lib/db/custom-types";

export const user = pgTable("user", {
  email: encryptedText("email").notNull(),
  firstName: encryptedText("first_name"),
});
```

### 3. Verschlüsselte Felder

Das Script verschlüsselt automatisch folgende Felder:

| Tabelle              | Feld            | Grund                        |
| -------------------- | --------------- | ---------------------------- |
| `user`               | `email`         | PII (Personenbezogene Daten) |
| `user`               | `first_name`    | PII                          |
| `user`               | `last_name`     | PII                          |
| `session`            | `ip_address`    | PII                          |
| `account`            | `access_token`  | OAuth Token                  |
| `account`            | `refresh_token` | OAuth Token                  |
| `account`            | `id_token`      | OAuth Token                  |
| `account`            | `password`      | Passwort-Hash                |
| `two_factor`         | `secret`        | TOTP Secret                  |
| `two_factor`         | `backup_codes`  | 2FA Backup Codes             |
| `oauth_application`  | `client_secret` | OAuth Client Secret          |
| `oauth_access_token` | `access_token`  | OAuth Access Token           |
| `oauth_access_token` | `refresh_token` | OAuth Refresh Token          |
| `apikey`             | `key`           | API Key                      |

## Wie es funktioniert

### Step-by-Step

1. **Disable `server-only` Import**

   ```typescript
   // Better Auth CLI läuft nicht im Server-Kontext
   // import "server-only"; → // import "server-only";
   ```

2. **Better Auth CLI ausführen**

   ```bash
   bunx @better-auth/cli generate --config ./src/lib/auth.ts
   ```

3. **Schema Post-Processing** (`fixSchemaImports()`)
   - Ersetzt `pgTable` → `pgSchema`
   - Fügt `encryptedText` Import hinzu
   - Ersetzt sensible `text()` → `encryptedText()`

4. **Drizzle Migration generieren**

   ```bash
   bunx drizzle-kit generate
   ```

5. **Restore `server-only` Import**
   ```typescript
   // Stelle original auth.ts wieder her
   ```

## Weitere Felder verschlüsseln

Um zusätzliche Felder zu verschlüsseln, erweitere die `sensitiveFields` Liste:

```typescript
const sensitiveFields = [
  // ... existing fields ...

  // Dein neues Feld
  { field: "phone_number", table: "user" },
  { field: "address", table: "user" },
];
```

Oder manuell im Schema:

```typescript
export const user = pgTable("user", {
  phoneNumber: encryptedText("phone_number"),
  address: encryptedText("address"),
});
```

## Troubleshooting

### Better Auth CLI überschreibt meine Änderungen

✅ **Das ist normal!** Das Script wird NACH Better Auth CLI ausgeführt und stellt die Verschlüsselung wieder her.

### Neue Felder werden nicht verschlüsselt

1. Füge das Feld zur `sensitiveFields` Liste hinzu
2. Oder: Ändere manuell `text()` → `encryptedText()` im Schema
3. Run `bun auth:gen` erneut

### "Cannot find module '~/lib/db/custom-types'"

Der Import-Alias `~/*` muss in [tsconfig.json](../tsconfig.json) definiert sein:

```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

## Best Practices

### ✅ DO

- Run `bun auth:gen` nach Better Auth Updates
- Committe die generierten Migrationsdateien
- Teste Verschlüsselung lokal vor Deployment

### ❌ DON'T

- Manuelle Änderungen im Schema (werden überschrieben)
- Direct DB-Änderungen ohne Migration
- ENCRYPTION_KEY in Production ändern (ohne Re-Encryption)

## Siehe auch

- [ENCRYPTION.md](ENCRYPTION.md) - Vollständige Encryption-Dokumentation
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Drizzle Kit Docs](https://orm.drizzle.team/kit-docs/overview)
