import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const kok = path.resolve(process.argv[2] || '..');
const tur = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json' };
http.createServer((q, s) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  let f = path.join(kok, p);
  if (!path.extname(f)) f += '.html';
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end('yok'); }
  s.writeHead(200, { 'content-type': tur[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
}).listen(4173, () => console.log('hazir'));
