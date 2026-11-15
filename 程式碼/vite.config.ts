import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages serves project sites from /<repository>/.
    // Keep local development at / so localhost previews remain unchanged.
    base: process.env.GITHUB_ACTIONS ? '/SCI-GAME/' : '/',
    plugins: [react(), tailwindcss(), {
      name: 'pages-public-assets',
      apply: 'build',
      generateBundle(_options, bundle) {
        if (!process.env.GITHUB_ACTIONS) return;
        // Source-authored /assets/... URLs bypass Vite's base-path rewriting.
        for (const output of Object.values(bundle)) {
          if (output.type === 'chunk') {
            output.code = output.code.replace(/(?<!\/SCI-GAME)\/assets\//g, '/SCI-GAME/assets/');
          } else if (output.fileName.endsWith('.css') && typeof output.source === 'string') {
            output.source = output.source.replace(/(?<!\/SCI-GAME)\/assets\//g, '/SCI-GAME/assets/');
          }
        }
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
