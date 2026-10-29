import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const frappeBaseUrl = process.env.FRAPPE_BASE_URL || 'http://nextgrp.localhost:8000';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    // Bind locally; the browser can still use nextgrp.localhost when that hostname resolves to loopback.
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: frappeBaseUrl,
        changeOrigin: true,
      },
    },
  },
});
