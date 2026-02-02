import { fileURLToPath, URL } from "node:url";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import { vercelToolbar } from "@vercel/toolbar/plugins/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig(({ mode }) => {
  // Load env files explicitly
  const env = loadEnv(mode, process.cwd(), "");

  // Make all env vars available to process.env for server-side validation
  Object.assign(process.env, env);

  return {
    optimizeDeps: {
      include: [
        "@opentelemetry/resources",
        "@opentelemetry/semantic-conventions",
        "@opentelemetry/sdk-trace-web",
        "@opentelemetry/sdk-trace-base",
        "@opentelemetry/exporter-trace-otlp-http",
        "@opentelemetry/instrumentation",
        "@opentelemetry/instrumentation-fetch",
        "@opentelemetry/api",
      ],
    },
    resolve: {
      alias: {
        "#env": fileURLToPath(new URL("./src/env.ts", import.meta.url)),
        "#flags": fileURLToPath(new URL("./src/lib/flags.ts", import.meta.url)),
        "#auth/client": fileURLToPath(
          new URL("./src/lib/auth-client.ts", import.meta.url),
        ),
        "#auth": fileURLToPath(new URL("./src/lib/auth.ts", import.meta.url)),
        "#logger": fileURLToPath(
          new URL("./src/lib/logging.ts", import.meta.url),
        ),
        "'defective/*": fileURLToPath(
          new URL("./src/lib/effective/defective/*", import.meta.url),
        ),
        "'services/*": fileURLToPath(
          new URL("./src/lib/effective/services/*", import.meta.url),
        ),
        "'/*": fileURLToPath(new URL("./src/lib/effective/*", import.meta.url)),
        "~": fileURLToPath(new URL("./src", import.meta.url)),
        "@": fileURLToPath(new URL("./", import.meta.url)),
      },
    },
    plugins: [
      devtools(),
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./paraglide",
        strategy: ["url"],
      }),
      nitro(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart(),
      vercelToolbar(),
      viteReact(),
    ],
  };
});

export default config;
