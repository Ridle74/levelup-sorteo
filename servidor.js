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
  { prefix: '/winners', file: 'student.html' },
  { prefix: '/parents', file: 'padres.html'  },
  { prefix: '/horario', file: 'horarios.html' },
];

// Enlaces cortos: igual que _redirects (Cloudflare Pages solo aplica ese archivo
// en producción, así que aquí lo replicamos para que también funcionen en local).
const SHORT_REDIRECTS = {
  '/tablero': '/student/tablero',
  '/ranking': '/student/ranking',
  '/numeros': '/student/numeros',
  '/ganadores': '/winners',
  '/student/ganadores': '/winners',
  '/padres': '/parents',
  '/horario.html':  '/horario',
  '/horarios':      '/horario',
  '/horarios.html': '/horario',
};

// Redirects que preservan lo que venga después del prefijo (p.ej. /students/tablero
// → /student/tablero, /horarios/ciclo-3 → /horario/ciclo-3).
const PREFIX_REDIRECTS = [
  { prefix: '/students', to: '/student' },
  { prefix: '/horarios', to: '/horario' },
];

http.createServer((req, res) => {
  // Quitar query string para comparar rutas
  const urlPath = req.url.split('?')[0];
  // Comparación de rutas sin distinguir mayúsculas/minúsculas (así /PARENTS,
  // /Parents y /parents funcionan igual), pero solo para el matching de rutas —
  // los archivos estáticos de abajo se siguen leyendo con el path original.
  const routePath = urlPath.toLowerCase();

  // Enlaces cortos
  const shortKey = Object.keys(SHORT_REDIRECTS).find(k => k.toLowerCase() === routePath);
  if (shortKey) {
    res.writeHead(302, { Location: SHORT_REDIRECTS[shortKey] });
    return res.end();
  }

  // Redirects con prefijo (preservan el resto de la ruta)
  const prefixR = PREFIX_REDIRECTS.find(r => routePath === r.prefix || routePath.startsWith(r.prefix + '/'));
  if (prefixR) {
    const rest = urlPath.slice(prefixR.prefix.length); // '' o '/algo' (conserva may/min del resto)
    res.writeHead(302, { Location: prefixR.to + rest });
    return res.end();
  }

  // Ruta raíz
  if (routePath === '/') {
    return fs.readFile(path.join(ROOT, 'student.html'), (err, data) => {
      if (err) { res.writeHead(404); res.end('No encontrado'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }

  // Rutas SPA: si la ruta empieza con alguno de los prefijos, sirve su HTML.
  // También aplica si la URL tiene extensión .html pero coincide exactamente con el prefijo.
  const spa = SPA_ROUTES.find(r => routePath === r.prefix || routePath.startsWith(r.prefix + '/'));
  const spaByHtml = !spa && SPA_ROUTES.find(r => routePath === r.prefix + '.html');
  if ((spa && path.extname(urlPath) === '') || spaByHtml) {
    const spaFile = (spa || spaByHtml).file;
    return fs.readFile(path.join(ROOT, spaFile), (err, data) => {
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
