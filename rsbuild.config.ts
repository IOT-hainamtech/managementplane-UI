
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const frappeBaseUrl =
  process.env.FRAPPE_BASE_URL ||
  'http://nextgrp.localhost:8000';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    host: '127.0.0.1',
    port: 3001,
    proxy: {
      '/api': {
        target: frappeBaseUrl,
        changeOrigin: true,
        headers: {
          'X-Frappe-Site-Name': 'nextgrp.localhost',
        },
      },
    },
  },
});
