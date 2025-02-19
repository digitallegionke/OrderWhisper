import { defineConfig, loadEnv } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3000', 10);
const HMR_HOST = process.env.HMR_HOST || 'localhost';
const HMR_PORT = parseInt(process.env.HMR_PORT || '64999', 10);

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the remix server. The CLI will eventually
// stop passing in HOST, so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  plugins: [remix(), tsconfigPaths()],
  server: {
    port: FRONTEND_PORT,
    host: true,
    hmr: {
      protocol: 'ws',
      host: HMR_HOST,
      port: HMR_PORT,
    },
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"],
    },
    allowedHosts: ["56e3-197-237-117-29.ngrok-free.app"],
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning",
    },
  },
  build: {
    cssMinify: process.env.NODE_ENV === "production",
    assetsInlineLimit: 0,
  },
});
