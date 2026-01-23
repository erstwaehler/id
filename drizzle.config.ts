import { defineConfig } from "drizzle-kit";
import env from "./src/env.ts";

const createConnectionString = (host: string) =>
  `postgres://${env.AUTHDB_USER}:${env.AUTHDB_PASSWORD}@${host}/${env.AUTHDB_DATABASE}?sslmode=require`;

export default defineConfig({
  schema: "./src/lib/auth/schema.ts",
  out: "./src/lib/auth/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: createConnectionString(env.AUTHDB_WRITE),
  },
});
