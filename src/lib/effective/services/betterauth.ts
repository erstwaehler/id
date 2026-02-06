import { CryptoError } from "'defective/betterauth";
import { Context, Effect } from "effect";
import crypto from "node:crypto";

class Crypto extends Context.Tag("Crypto Service")<
  Crypto,
  {
    encrypt: (plaintext: string) => Effect.Effect<string, CryptoError, never>;
    decrypt: (ciphertext: string) => Effect.Effect<string, CryptoError, never>;
    hash: (data: string) => Effect.Effect<string, CryptoError, never>;
    randomUUID: () => Effect.Effect<crypto.UUID, CryptoError, never>;
  }
>() {}

export { Crypto };

class EncryptedBetterauthHooks extends Context.Tag(
  "Encrypted Betterauth Hooks Service",
)<
  EncryptedBetterauthHooks,
  {
    createAuthMiddleware: () => Effect.Effect<
      void,
      never,
      Context.Context<Crypto>
    >;
  }
>() {}

export { EncryptedBetterauthHooks };
