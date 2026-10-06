import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json; charset=utf-8', '.md':'text/plain; charset=utf-8' };
http.createServer((req,res) => {
  try {
    const url = new URL(req.url,'http://127.0.0.1');
    let file = path.resolve(root,'.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
    if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(404).end('Not found');}
}).listen(4174,'127.0.0.1',() => console.log('Tidal Post Week 4: http://127.0.0.1:4174/week4/'));
