const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadEnvFile } = require('node:process');

try {
  loadEnvFile(path.join(__dirname, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || '';
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const pathname = request.url.split('?')[0];
  const file = pathname === '/' ? '/index.html' : pathname;
  const type = contentTypes[path.extname(file)];
  if (!type || (file !== '/index.html' && !/^\/(?:app|assets)\/[\w-]+\.[a-z]+$/.test(file))) {
    response.writeHead(404).end();
    return;
  }

  try {
    let body = await fs.readFile(path.join(__dirname, file.slice(1)));
    const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' };
    if (file === '/app/maps-config.js') {
      body = `${body}\nwindow.K406_MAPS_CONFIG.apiKey = ${JSON.stringify(apiKey)};\n`;
      headers['Cache-Control'] = 'no-store';
    }
    response.writeHead(200, headers).end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Kitchen406 is running at http://127.0.0.1:4173');
});
