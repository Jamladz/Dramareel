const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const devMiddleware = `
          // Mock /api/monetag/claim for local dev
          if (req.method === 'POST' && req.url?.startsWith('/api/monetag/claim')) {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                // Just mock success for dev
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ 
                  success: true, 
                  points: 100,
                  newTotal: 9999, // dummy
                  lastClaim: Date.now()
                }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
`;

if (!code.includes('/api/monetag/claim')) {
  code = code.replace(
    "if (req.url === '/tonconnect-manifest.json' || req.url?.startsWith('/tonconnect-manifest.json?')) {",
    devMiddleware + "\n        if (req.url === '/tonconnect-manifest.json' || req.url?.startsWith('/tonconnect-manifest.json?')) {"
  );
  fs.writeFileSync('vite.config.ts', code);
  console.log('patched vite.config.ts');
}
