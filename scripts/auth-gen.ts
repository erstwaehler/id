#!/usr/bin/env bun
import { $ } from "bun";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const AUTH_FILE_PATH = path.join(process.cwd(), "src/lib/auth.ts");
const SCHEMA_FILE_PATH = path.join(
  process.cwd(),
  "src/lib/auth/schema/betterauth.ts",
);

async function runCommand(command: string) {
  console.log(`\n🚀 Running: ${command}`);
  try {
    await $`${{ raw: command }}`;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error;
  }
}

async function fixSchemaImports() {
  console.log("\n🔍 Checking schema.ts for pgTable imports...");

  try {
    const schemaContent = await readFile(SCHEMA_FILE_PATH, "utf-8");

    // Check if pgTable is imported and pgSchema is not
    const hasPgTableImport =
      /import\s+\{[^}]*\bpgTable\b[^}]*\}\s+from\s+["']drizzle-orm\/pg-core["']/g.test(
        schemaContent,
      );
    const hasPgSchemaImport =
      /import\s+\{[^}]*\bpgSchema\b[^}]*\}\s+from\s+["']drizzle-orm\/pg-core["']/g.test(
        schemaContent,
      );

    if (hasPgTableImport && !hasPgSchemaImport) {
      console.log("✏️ Replacing pgTable with pgSchema...");

      // Replace pgTable with pgSchema in the import
      let updatedContent = schemaContent.replace(
        /import\s+\{([^}]*)\bpgTable\b([^}]*)\}\s+from\s+["']drizzle-orm\/pg-core["'];?/g,
        (_match, before, after) => {
          const cleanBefore = before.trim();
          const cleanAfter = after.trim();
          const beforeWithComma = cleanBefore ? `${cleanBefore},` : "";
          const afterWithComma = cleanAfter.startsWith(",")
            ? cleanAfter
            : cleanAfter
              ? `, ${cleanAfter}`
              : "";

          return `import {\n  ${beforeWithComma}\n  pgSchema${afterWithComma}\n} from "drizzle-orm/pg-core";`;
        },
      );

      // Find where the import block ends and inject the pgTable definition
      const importBlockEnd = updatedContent.lastIndexOf(
        'from "drizzle-orm/pg-core";',
      );
      if (importBlockEnd !== -1) {
        const insertPosition = updatedContent.indexOf("\n", importBlockEnd) + 1;
        const pgTableDefinition =
          '\nconst pgTable = pgSchema("betterauth").table;\n';

        updatedContent =
          updatedContent.slice(0, insertPosition) +
          pgTableDefinition +
          updatedContent.slice(insertPosition);

        await writeFile(SCHEMA_FILE_PATH, updatedContent);
        console.log("✅ Schema imports fixed successfully.");
      } else {
        console.warn("⚠️ Could not find import block end, skipping injection.");
      }
    } else if (hasPgSchemaImport) {
      console.log("✅ pgSchema already imported, no changes needed.");
    } else {
      console.log("ℹ️ No pgTable import found, skipping.");
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("ℹ️ schema.ts not found, skipping import fix.");
    } else {
      console.error("❌ Error fixing schema imports:", error);
      throw error;
    }
  }
}

async function main() {
  const mode = process.argv[2];

  if (!["generate", "migrate", "push"].includes(mode)) {
    console.error("Usage: bun scripts/auth-gen.ts [generate|migrate|push]");
    process.exit(1);
  }

  console.log("🛡️ Temporarily disabling 'server-only' in auth.ts...");
  const originalContent = await readFile(AUTH_FILE_PATH, "utf-8");

  // Robust replacement for server-only to satisfy Better Auth CLI
  const disabledContent = originalContent.replace(
    /import\s+["']server-only["'];?/g,
    '// import "server-only"; // disabled for CLI',
  );

  if (
    originalContent === disabledContent &&
    originalContent.includes("server-only")
  ) {
    console.warn(
      "⚠️ Could not find 'server-only' import with exact regex, skipping replacement.",
    );
  }

  await writeFile(AUTH_FILE_PATH, disabledContent);

  try {
    const baseCli = `bunx @better-auth/cli`;
    const configFlag = `--config ./src/lib/auth.ts -y`;

    if (mode === "generate") {
      try {
        await runCommand(
          `${baseCli} generate ${configFlag} --output ./src/lib/auth/schema/betterauth.ts`,
        );
      } catch (e) {
        console.warn(
          "⚠️ 'generate' failed (likely better-sqlite3), falling back to 'migrate'...",
        );
        await runCommand(`${baseCli} migrate ${configFlag}`);
      }
      await fixSchemaImports();
      await runCommand("bunx drizzle-kit generate");
    } else if (mode === "migrate") {
      await runCommand(`${baseCli} migrate ${configFlag}`);
      await fixSchemaImports();
      await runCommand("bunx drizzle-kit migrate");
    } else if (mode === "push") {
      await runCommand(`${baseCli} migrate ${configFlag}`);
      await fixSchemaImports();
      await runCommand("bunx drizzle-kit push");
    }

    console.log("\n✅ Auth and DB operations completed successfully.");
  } catch (error) {
    console.error("\n💥 Operation failed during execution.");
    throw error;
  } finally {
    console.log("🔒 Restoring 'server-only' in auth.ts...");
    await writeFile(AUTH_FILE_PATH, originalContent);
  }
}

main().catch(() => {
  process.exit(1);
});
