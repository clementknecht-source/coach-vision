// ═══ COACH VISION — Serveur local ═══════════════════════════════
// Lance avec : node server.js
// Puis ouvre http://localhost:3000 dans ton navigateur

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 3000;

// Types MIME
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  // ── CORS headers (pour que l'app puisse appeler l'API) ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── PROXY vers l'API Groq ──
  if (req.url === '/api/claude' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid JSON' } }));
        return;
      }

      // Convertir le format Anthropic → format OpenAI/Groq
      const groqBody = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...(parsed.system ? [{ role: 'system', content: parsed.system }] : []),
          ...(parsed.messages || []),
        ],
        max_tokens: parsed.max_tokens || 1024,
        temperature: 0.7,
      });

      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (process.env.GROQ_API_KEY || loadEnvKey()),
        }
      };

      const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          try {
            const groqRes = JSON.parse(data);
            // Convertir réponse Groq → format Anthropic attendu par l'app
            const anthropicFormat = {
              content: [{ type: 'text', text: groqRes.choices?.[0]?.message?.content || '' }],
              model: groqRes.model,
              usage: {
                input_tokens: groqRes.usage?.prompt_tokens || 0,
                output_tokens: groqRes.usage?.completion_tokens || 0,
              }
            };
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(anthropicFormat));
          } catch(e) {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(data);
          }
        });
      });

      proxyReq.on('error', (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Proxy error: ' + e.message } }));
      });

      proxyReq.write(groqBody);
      proxyReq.end();
    });
    return;
  }

  // ── Fichiers statiques ──
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath.split('?')[0]);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

function loadEnvKey() {
  try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const match = env.match(/GROQ_API_KEY\s*=\s*(.+)/);
    return match ? match[1].trim() : '';
  } catch { return ''; }
}

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║       COACH VISION — Serveur OK       ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Ouvre : http://localhost:${PORT}        ║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  const key = process.env.GROQ_API_KEY || loadEnvKey();
  if (!key) {
    console.log('⚠  Clé API non trouvée !');
    console.log('   Crée un fichier .env avec :');
    console.log('   GROQ_API_KEY=gsk_...');
  } else {
    console.log('✓  Clé Groq chargée');
  }
  console.log('');
  console.log('   Appuie sur CTRL+C pour arrêter');
});
