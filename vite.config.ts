import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	resolve: {
		alias: {
			"#env": fileURLToPath(new URL("./src/env.ts", import.meta.url)),
			"#flags": fileURLToPath(new URL("./src/lib/flags.ts", import.meta.url)),
			"#auth": fileURLToPath(new URL("./src/lib/auth.ts", import.meta.url)),
			"#auth/client": fileURLToPath(
				new URL("./src/lib/auth-client.ts", import.meta.url),
			),
			"#logger": fileURLToPath(
				new URL("./src/lib/logging.ts", import.meta.url),
			),
			"~": fileURLToPath(new URL("./src", import.meta.url)),
			"@": fileURLToPath(new URL("./", import.meta.url)),
		},
	},
	plugins: [
		devtools(),
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			strategy: ["url"],
		}),
		nitro(),
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
