import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const bridgeBaseUrl = process.env.BRIDGE_BASE_URL || 'http://127.0.0.1:8081';
const bridgeAdminToken = process.env.BRIDGE_ADMIN_TOKEN || '';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    proxy: {
      '/local-api': {
        target: bridgeBaseUrl,
        changeOrigin: true,
        pathRewrite: { '^/local-api': '/api' },
        headers: bridgeAdminToken ? { 'X-Admin-Token': bridgeAdminToken } : {},
      },
    },
  },
});
