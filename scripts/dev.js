// Aperçu live : http://localhost:4321 (liste des variantes) — recharge automatique
// à chaque modification de data/, variants/, themes/ ou assets/.
//   npm run dev
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT, loadData, loadVariant, resolveCv } from './lib/load.js';
import { renderHtml } from './lib/render.js';
import { toMarkdown } from './lib/markdown.js';

const PORT = Number(process.env.PORT ?? 4321);
const WATCHED = ['data', 'variants', 'themes', 'assets', 'scripts/lib'];

function version() {
  let latest = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else latest = Math.max(latest, fs.statSync(p).mtimeMs);
    }
  };
  WATCHED.forEach((d) => walk(path.join(ROOT, d)));
  return String(latest);
}

const variants = () => fs.readdirSync(path.join(ROOT, 'variants')).filter((f) => f.endsWith('.yml'));

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    try {
      if (url.pathname === '/__version') return res.end(version());
      if (url.pathname === '/') {
        const links = variants()
          .map((f) => {
            const v = f.replace(/\.yml$/, '');
            return `<li><a href="/${v}">${v}</a> · <a href="/${v}.md">md</a></li>`;
          })
          .join('');
        res.setHeader('content-type', 'text/html; charset=utf-8');
        return res.end(`<!doctype html><meta charset=utf-8><title>CV factory</title><body style="font:16px system-ui;padding:40px"><h1>Variantes</h1><ul>${links}</ul>`);
      }
      const md = url.pathname.endsWith('.md');
      const slug = url.pathname.slice(1).replace(/\.md$/, '');
      const cv = resolveCv(loadData(), loadVariant(`variants/${slug}.yml`));
      if (md) {
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        return res.end(toMarkdown(cv));
      }
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(await renderHtml(cv, { liveReload: true }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(`<pre style="color:#b00;padding:24px">${String(err.stack).replace(/</g, '&lt;')}</pre><script>let v;setInterval(async()=>{const r=await fetch('/__version').then(r=>r.text());if(v&&r!==v)location.reload();v=r},700)</script>`);
    }
  })
  .listen(PORT, () => console.log(`CV factory → http://localhost:${PORT}`));
