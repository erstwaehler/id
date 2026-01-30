import { Crypto } from "'services/betterauth";
import { SERVER_ENV } from "'services/env";
import { Effect, Layer } from "effect";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { EncryptionError, DecryptionError } from "./defective/betterauth";
import { ENV_SERVER_LIVE } from "./env";

const ALGORITHM = "aes-256-gcm";
const getKey = (secret: string) => createHash("sha256").update(secret).digest();

export const CryptoAuthLive = Layer.effect(Crypto, Effect.gen(function* () {
  const env = yield* SERVER_ENV;
  // Optimierung: Key nur einmal berechnen, da er sich zur Laufzeit nicht ändert
  const key = getKey(env.ENCRYPTION_KEY);

  return {
    "encrypt": Effect.fn("CryptoAuthLiveEncrypt")(function* (plaintext: string) {
      return yield* Effect.try({
        try: () => {
          const iv = randomBytes(16);
          
          const cipher = createCipheriv(ALGORITHM, key, iv);
          
          let encrypted = cipher.update(plaintext, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          const authTag = cipher.getAuthTag().toString('hex');

          return `${iv.toString('hex')}:${authTag}:${encrypted}`;
        },
        catch: (err) => new EncryptionError({ 
          message: String(err), 
          reason: "SystemError" 
        }) 
      });
    }),
    "decrypt": Effect.fn("CryptoAuthLiveDecrypt")(function* (ciphertext:string) {
      return yield* Effect.try({
        try: () => {
          const parts = ciphertext.split(':');
          if (parts.length !== 3) {
            throw new DecryptionError({ 
              message: "Invalid ciphertext format (parts missing)", 
              reason: "InvalidFormat" 
            });
          }
          
          const [ivHex, authTagHex, encryptedData] = parts;
          if (!ivHex || !authTagHex || !encryptedData) {
             throw new DecryptionError({ 
              message: "Invalid ciphertext format (empty parts)", 
              reason: "InvalidFormat" 
            });
          }
          
          const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
          decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

          let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
          decrypted += decipher.final('utf8'); 

          return decrypted;
        },
        catch: (err) => {
          if (err instanceof DecryptionError) return err;
          const message = String(err);
          const reason = message.includes("authenticate data") 
            ? "AuthenticationFailed" 
            : "Unknown";
            
          return new DecryptionError({ message, reason });
        }
      });
    }),
  };
})).pipe(Layer.provide(ENV_SERVER_LIVE));
