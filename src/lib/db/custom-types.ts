/**
 * Drizzle Custom Types with Effect-based encryption
 * Provides transparent encryption at rest for sensitive database fields
 */

import { customType } from "drizzle-orm/pg-core";
import { Effect, Runtime } from "effect";
import { CryptoAuthLive } from "'/betterauth";
import { Crypto } from "'services/betterauth";

/**
 * Creates a runtime with the Crypto service
 * This is initialized once at module load time for performance
 */
const runtime = Runtime.defaultRuntime;

/**
 * Drizzle custom type that encrypts data before storing in DB
 * and decrypts it when reading from DB.
 * 
 * Uses AES-256-GCM encryption via the Effect-based Crypto service.
 * 
 * @example
 * ```typescript
 * import { encryptedText } from '@/lib/db/custom-types';
 * 
 * export const user = pgTable('user', {
 *   email: encryptedText('email').notNull(),
 *   ssn: encryptedText('ssn'),
 * });
 * ```
 */
export const encryptedText = customType<{
	data: string;
	driverData: string;
}>({
	dataType() {
		return "text";
	},

	toDriver(value: string): string {
		// Encrypt before storing in database
		const program = Effect.gen(function* () {
			const crypto = yield* Crypto;
			return yield* crypto.encrypt(value);
		}).pipe(Effect.provide(CryptoAuthLive));

		// Run synchronously - Drizzle doesn't support async in customType
		const result = Runtime.runSync(runtime)(program);
		return result;
	},

	fromDriver(value: string): string {
		// Decrypt when reading from database
		const program = Effect.gen(function* () {
			const crypto = yield* Crypto;
			return yield* crypto.decrypt(value);
		}).pipe(Effect.provide(CryptoAuthLive));

		// Run synchronously
		const result = Runtime.runSync(runtime)(program);
		return result;
	},
});
