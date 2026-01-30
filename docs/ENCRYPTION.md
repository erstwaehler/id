# Encryption at Rest mit Drizzle ORM + Effect

## Übersicht

Dieses Projekt implementiert **vollständige Encryption at Rest** für sensible Datenbankfelder mit:

- **Drizzle ORM** - Type-safe database access
- **Effect** - Functional error handling und dependency injection
- **AES-256-GCM** - Moderne authenticated encryption

## Wie es funktioniert

### 1. Custom Type Definition

Der `encryptedText` Custom Type ([src/lib/db/custom-types.ts](src/lib/db/custom-types.ts)) nutzt deinen existierenden Effect-basierten `Crypto` Service:

```typescript
import { encryptedText } from "@/lib/db/custom-types";

export const user = pgTable("user", {
  email: encryptedText("email").notNull(),
  firstName: encryptedText("first_name"),
});
```

### 2. Transparente En-/Decryption

- **`toDriver`**: Verschlüsselt Daten _bevor_ sie in die DB geschrieben werden
- **`fromDriver`**: Entschlüsselt Daten _nachdem_ sie aus der DB gelesen wurden

```typescript
// Im Code: Klartext
await db.insert(user).values({
  email: "max@example.com",
  firstName: "Max",
});

// In der DB: Verschlüsselt
// email = "a3f1d2....:8b2c....:99c4...."
// firstName = "7d9e2....:4a1b....:2f6d...."

// Beim Lesen: Automatisch entschlüsselt
const result = await db.query.user.findFirst();
console.log(result.email); // "max@example.com"
```

### 3. Effect Integration

Der Custom Type nutzt den existierenden `CryptoAuthLive` Layer:

```typescript
const program = Effect.gen(function* () {
  const crypto = yield* Crypto;
  return yield* crypto.encrypt(value);
}).pipe(Effect.provide(CryptoAuthLive));

const result = Runtime.runSync(runtime)(program);
```

## Verschlüsselte Felder

Folgende sensible Felder sind jetzt encrypted at rest:

### User Table

- `email` - E-Mail-Adressen (PII)
- `firstName` - Vorname (PII)
- `lastName` - Nachname (PII)

### Session Table

- `ipAddress` - IP-Adressen (PII)

### Account Table

- `accessToken` - OAuth Access Tokens
- `refreshToken` - OAuth Refresh Tokens
- `idToken` - OAuth ID Tokens
- `password` - Passwort-Hashes

### TwoFactor Table

- `secret` - TOTP Secrets
- `backupCodes` - 2FA Backup Codes

### OAuth Tables

- `oauthApplication.clientSecret` - OAuth Client Secrets
- `oauthAccessToken.accessToken` - Access Tokens
- `oauthAccessToken.refreshToken` - Refresh Tokens

### API Key Table

- `apikey.key` - API Keys

## Migration

Um die Verschlüsselung zu aktivieren:

1. **Backup erstellen**

   ```bash
   pg_dump your_database > backup.sql
   ```

2. **Migration generieren**

   ```bash
   bun auth:gen
   ```

   **Das Script macht automatisch:**
   - ✅ Fügt `encryptedText` Import hinzu
   - ✅ Ersetzt sensible `text()` Felder mit `encryptedText()`
   - ✅ Schützt vor Better Auth CLI Überschreibungen

3. **Migration anwenden**

   ```bash
   bun auth:migrate
   ```

   ⚠️ **Achtung**: Existierende Klartext-Daten werden **nicht** automatisch verschlüsselt. Du benötigst eine Datenmigration:

4. **Daten migrieren** (manuell)

   ```typescript
   // Beispiel: Alle User-Emails verschlüsseln
   const users = await db.select().from(user);

   for (const u of users) {
     // Email wird automatisch verschlüsselt durch encryptedText
     await db
       .update(user)
       .set({ email: u.email }) // Re-save triggert Verschlüsselung
       .where(eq(user.id, u.id));
   }
   ```

## Sicherheitshinweise

### ✅ Was geschützt ist

- **Data at Rest**: Daten sind auf der Festplatte verschlüsselt
- **Backups**: Datenbank-Backups enthalten verschlüsselte Daten
- **DB Admin Access**: Admins sehen nur Ciphertext in der DB

### ⚠️ Was NICHT geschützt ist

- **In-Transit**: Nutze TLS/SSL für Verbindungen (bereits via `sslmode=require`)
- **Application Memory**: Daten sind im RAM im Klartext
- **Application Access**: Jeder mit Zugriff zur App kann Daten lesen
- **Search/Indexes**: Verschlüsselte Felder können nicht effizient durchsucht werden

### 🔑 Key Management

- **ENCRYPTION_KEY** ist in `.env` als 64-Zeichen Hex-String (32 Bytes)
- Key wird gehasht mit SHA-256 vor Nutzung
- **WICHTIG**: Key-Rotation erfordert Re-Encryption aller Daten

## Performance

- **Overhead**: ~1-2ms pro Verschlüsselung/Entschlüsselung
- **Caching**: Effect-Runtime ist persistent (kein Layer-Overhead)
- **Batch Operations**: Jedes Feld wird einzeln ver-/entschlüsselt

### Optimization Tips

1. Verschlüssle nur **wirklich** sensible Felder
2. Nutze `select({ email: user.email })` statt `select()` um Decryption zu minimieren
3. Vermeide `LIKE` Queries auf verschlüsselten Feldern

## Entwicklung

### Neues verschlüsseltes Feld hinzufügen

```typescript
import { encryptedText } from "@/lib/db/custom-types";

export const myTable = pgTable("my_table", {
  sensitiveData: encryptedText("sensitive_data"),
});
```

### Testen

```typescript
import { describe, it, expect } from "vitest";
import { db } from "./db";

it("should encrypt and decrypt data", async () => {
  const secret = "my-secret-value";

  const [inserted] = await db
    .insert(myTable)
    .values({ sensitiveData: secret })
    .returning();

  expect(inserted.sensitiveData).toBe(secret);
});
```

## Troubleshooting

### "Invalid encrypted format" Error

- Daten im falschen Format (erwartet `iv:authTag:ciphertext`)
- Versuch, Klartext zu entschlüsseln
- **Lösung**: Datenmigration durchführen

### "Authentication failed" Error

- Falscher ENCRYPTION_KEY
- Daten wurden mit anderem Key verschlüsselt
- **Lösung**: Korrekten Key in `.env` setzen

### Performance Issues

- Zu viele Felder verschlüsselt
- Große Datasets ohne Pagination
- **Lösung**: Selektive Queries, Pagination nutzen

## Weiterführende Informationen

- [Effect Documentation](https://effect.website/)
- [Drizzle Custom Types](https://orm.drizzle.team/docs/custom-types)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
