import { Context, Effect } from "effect";
import { EncryptionError, DecryptionError } from "'defective/betterauth";

class Crypto extends Context.Tag("Crypto Service")<
  Crypto,
  {
    encrypt: (plaintext: string) => Effect.Effect<string, EncryptionError>;
    decrypt: (ciphertext: string) => Effect.Effect<string, DecryptionError>;
  }
>() {}

export { Crypto };

class EncryptedBetterauthHooks extends Context.Tag("Encrypted Betterauth Hooks Service")<
  EncryptedBetterauthHooks,
  {
    createAuthMiddleware: () => Effect.Effect<void, never, Context.Context<Crypto>>;
  }
>() {}

export { EncryptedBetterauthHooks };