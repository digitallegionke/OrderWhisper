import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

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

export default defineConfig({
  server: {
    port: Number(process.env.PORT || 3000),
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 64999,
    },
    fs: {
      allow: ["app", "node_modules"],
    },
    allowedHosts: [
      'localhost',
      '.trycloudflare.com',
      'practitioner-conf-stock-perfume.trycloudflare.com',
      'architects-lending-nowhere-legends.trycloudflare.com'
    ],
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning",
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: false,
        v3_routeConfig: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    cssMinify: process.env.NODE_ENV === "production",
    assetsInlineLimit: 0,
    rollupOptions: {
      external: ['@shopify/shopify-api'],
    }
  },
});
