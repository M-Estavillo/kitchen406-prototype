const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadEnvFile } = require('node:process');
const createAuth = require('./auth-server.cjs');
const courierQuotation = require('./courier-quotation.cjs');

try {
  loadEnvFile(path.join(__dirname, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const auth = createAuth(process.env.K406_DATA_DIR || path.join(__dirname, '.data'));
const port = Number(process.env.K406_PORT || 4173);
const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || '';
const courierMode = process.env.K406_COURIER_MODE || 'mock';
const courierEnabled = ['mock', 'provider'].includes(courierMode);
const courier = courierMode === 'provider' ? courierQuotation(process.env) : { check: courierQuotation.demoQuotation };
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http.createServer(async (request, response) => {
  if (request.url.startsWith('/api/auth/')) return auth(request, response);
  if (request.url === '/api/courier-quotation' && request.method === 'POST') {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    if (!courierEnabled) {
      response.writeHead(503, headers).end(JSON.stringify({ status: 'unconfigured' }));
      return;
    }
    if (request.headers['sec-fetch-site'] && request.headers['sec-fetch-site'] !== 'same-origin') {
      response.writeHead(403, headers).end();
      return;
    }
    let body = '';
    try {
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 2048) break;
      }
      if (body.length > 2048) {
        response.writeHead(413, headers).end();
        return;
      }
      const input = JSON.parse(body);
      const result = await courier.check(input);
      if (result.status === 'ok') {
        result.checkoutQuote = courierQuotation.checkoutQuote(input.address, result.quotations);
      }
      response.writeHead(200, headers).end(JSON.stringify(result));
    } catch {
      response.writeHead(400, headers).end(JSON.stringify({ status: 'invalid' }));
    }
    return;
  }
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
      body += `window.K406_MAPS_CONFIG.courierProvider = ${courierEnabled};\n`;
      body += `window.K406_MAPS_CONFIG.courierMock = ${courierMode === 'mock'};\n`;
      headers['Cache-Control'] = 'no-store';
    }
    response.writeHead(200, headers).end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
}).listen(port, '127.0.0.1', function () {
  console.log('Kitchen406 is running at http://127.0.0.1:' + this.address().port);
});
