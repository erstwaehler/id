/**
 * Example: Using Database Service with Encrypted Fields
 *
 * This example shows how to:
 * 1. Define a Drizzle table with encrypted fields
 * 2. Create an Effect Schema with automatic encryption/decryption
 * 3. Query and insert data with type-safe encrypted fields
 */

import { Effect } from "effect";
import { Database, Encrypted } from "../database";
import { eq } from "drizzle-orm";
import { pgTable, text, serial } from "drizzle-orm/pg-core";

// 1. Define your Drizzle table
const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  // These fields will be encrypted at rest
  ssn: text("ssn").notNull(), // Social Security Number
  creditCard: text("credit_card"), // Credit Card Number
});

// 2. Define the TypeScript type from the table
type NewUser = typeof usersTable.$inferInsert;

// 3. Usage: Insert a user (with encryption)
// The Encrypted class wraps encrypted strings and provides runtime type checking
const insertUser = (newUser: Omit<NewUser, "id">) =>
  Effect.gen(function* () {
    const db = yield* Database;

    // Encrypt sensitive fields before insert - returns Encrypted instances
    const encryptedSSN = yield* db.encryptField(newUser.ssn, "ssn");
    const encryptedCC = newUser.creditCard
      ? yield* db.encryptField(newUser.creditCard, "creditCard")
      : null;

    console.log(
      "✓ Encrypted SSN:",
      encryptedSSN.toString().slice(0, 20) + "...",
    );
    console.log("  Tag:", encryptedSSN.tag);
    console.log("  Is Encrypted?", Encrypted.isEncrypted(encryptedSSN));

    // Insert into database - store the encrypted string
    const result = yield* db.runQuery(
      db.db
        .insert(usersTable)
        .values({
          ...newUser,
          ssn: encryptedSSN.toString(), // Convert to string for DB storage
          creditCard: encryptedCC?.toString() ?? null,
        })
        .returning(),
    );

    return result[0];
  });

// 4. Usage: Query a user (with decryption)
const getUserById = (id: number) =>
  Effect.gen(function* () {
    const db = yield* Database;

    // Query from database (returns encrypted data)
    const [user] = yield* db.runQuery(
      db.db.select().from(usersTable).where(eq(usersTable.id, id)),
    );

    if (!user) {
      return null;
    }

    // Wrap encrypted strings in Encrypted instances
    const encryptedSSN = Encrypted.fromString<string>(user.ssn, "ssn");
    const encryptedCC = user.creditCard
      ? Encrypted.fromString<string>(user.creditCard, "creditCard")
      : null;

    console.log(
      "✓ Retrieved encrypted SSN:",
      encryptedSSN.toString().slice(0, 20) + "...",
    );
    console.log("  Tag:", encryptedSSN.tag);

    // Decrypt using Encrypted instances
    const decryptedSSN = yield* db.decryptField(encryptedSSN);
    const decryptedCC = encryptedCC
      ? yield* db.decryptField(encryptedCC)
      : null;

    return {
      ...user,
      ssn: decryptedSSN,
      creditCard: decryptedCC,
    };
  });

// 5. Usage: Query multiple users
const getAllUsers = Effect.gen(function* () {
  const db = yield* Database;

  // Query all users (encrypted)
  const users = yield* db.runQuery(db.db.select().from(usersTable));

  // Decrypt all users in parallel using Encrypted class
  const decryptedUsers = yield* Effect.all(
    users.map((user) =>
      Effect.gen(function* () {
        // Wrap in Encrypted instances
        const encryptedSSN = Encrypted.fromString<string>(user.ssn, "ssn");
        const encryptedCC = user.creditCard
          ? Encrypted.fromString<string>(user.creditCard, "creditCard")
          : null;

        // Decrypt
        const decryptedSSN = yield* db.decryptField(encryptedSSN);
        const decryptedCC = encryptedCC
          ? yield* db.decryptField(encryptedCC)
          : null;

        return {
          ...user,
          ssn: decryptedSSN,
          creditCard: decryptedCC,
        };
      }),
    ),
    { concurrency: "unbounded" }, // Decrypt all in parallel
  );

  return decryptedUsers;
});

// 6. Example: Direct usage of Encrypted class
const demonstrateEncryptedClass = Effect.gen(function* () {
  const db = yield* Database;

  console.log("\n=== Encrypted Class Demo ===");

  // Create an Encrypted instance
  const sensitiveData = "123-45-6789";
  const encrypted = yield* db.encryptField(sensitiveData, "demo");

  console.log("✓ Created Encrypted instance");
  console.log("  Tag:", encrypted.tag);
  console.log("  Is Encrypted?", Encrypted.isEncrypted(encrypted));
  console.log("  Encrypted string:", encrypted.toString().slice(0, 30) + "...");

  // Can also create from existing encrypted string
  const fromString = Encrypted.fromString(encrypted.toString(), "demo");
  console.log("\n✓ Created from string");
  console.log("  Is Encrypted?", Encrypted.isEncrypted(fromString));

  // Decrypt
  const decrypted = yield* db.decryptField<string>(fromString);
  console.log("\n✓ Decrypted value:", decrypted);
  console.log("  Matches original?", decrypted === sensitiveData);
});

// 7. Example: Main program
const program = Effect.gen(function* () {
  console.log("=== Encrypted Database Example ===\n");

  // Insert a new user with sensitive data
  console.log("1. Inserting user with encrypted fields...");
  const newUser = yield* insertUser({
    name: "John Doe",
    email: "john@example.com",
    ssn: "123-45-6789",
    creditCard: "4532-1234-5678-9010",
  });
  console.log("✓ User inserted (fields are encrypted in DB)");
  console.log("  ID:", newUser.id);

  // Query the user (automatic decryption)
  console.log("\n2. Querying user with decryption...");
  const user = yield* getUserById(newUser.id);

  if (user) {
    console.log("✓ User retrieved and decrypted:");
    console.log("  Name:", user.name);
    console.log("  Email:", user.email);
    console.log("  SSN:", user.ssn); // Decrypted!
    console.log("  Credit Card:", user.creditCard); // Decrypted!
  }

  // Query all users
  console.log("\n3. Querying all users...");
  const users = yield* getAllUsers;
  console.log(`✓ Retrieved ${users.length} user(s) with decrypted fields`);

  // Demonstrate Encrypted class
  yield* demonstrateEncryptedClass;
});

// To run this example, you need to provide the Database and SERVER_ENV layers:
// import { DatabaseLive } from "../database";
// import { T3_SERVER } from "../env";
//
// const runnable = program.pipe(
//   Effect.provide(DatabaseLive),
//   Effect.provide(T3_SERVER)
// );
//
// Effect.runPromise(runnable)
//   .then(() => console.log("\n✓ Example completed successfully"))
//   .catch(console.error);

export {
  program,
  insertUser,
  getUserById,
  getAllUsers,
  demonstrateEncryptedClass,
};
