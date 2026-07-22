const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// Rutas SPA: igual que _redirects
const SPA_ROUTES = [
  { prefix: '/levelup', file: 'student.html' },
  { prefix: '/student', file: 'student.html' },
  { prefix: '/padres',  file: 'padres.html'  },
  { prefix: '/horarios',file: 'horarios.html' },
];

http.createServer((req, res) => {
  // Quitar query string para comparar rutas
  const urlPath = req.url.split('?')[0];

  // Ruta raíz
  if (urlPath === '/') {
    return fs.readFile(path.join(ROOT, 'student.html'), (err, data) => {
      if (err) { res.writeHead(404); res.end('No encontrado'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }

  // Rutas SPA: si la ruta empieza con alguno de los prefijos, sirve su HTML
  const spa = SPA_ROUTES.find(r => urlPath === r.prefix || urlPath.startsWith(r.prefix + '/'));
  if (spa && path.extname(urlPath) === '') {
    return fs.readFile(path.join(ROOT, spa.file), (err, data) => {
      if (err) { res.writeHead(404); res.end('No encontrado'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }

  // Archivo estático normal
  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('No encontrado: ' + req.url);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('');
  console.log('  ✓ Servidor corriendo en http://localhost:' + PORT + '/student.html');
  console.log('');
  console.log('  Para detenerlo: cierra esta ventana.');
  console.log('');
});
