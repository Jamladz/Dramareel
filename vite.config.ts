import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function tonConnectManifestPlugin() {
  return {
    name: 'ton-connect-manifest-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/tonconnect-manifest.json' || req.url?.startsWith('/tonconnect-manifest.json?')) {
          const protocol = req.headers['x-forwarded-proto'] || (req.headers['host']?.includes('localhost') ? 'http' : 'https');
          const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost:3000';
          const origin = `${protocol}://${host}`;
          
          const manifest = {
            url: origin,
            name: "DramaReel VIP",
            iconUrl: "https://ton.org/download/ton_symbol.png",
            termsOfUseUrl: origin,
            privacyPolicyUrl: origin
          };

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(manifest, null, 2));
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), tonConnectManifestPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
