// Usage :
//   npm run build                         -> toutes les variantes
//   npm run build -- variants/dev.yml     -> une variante
//   npm run build -- --no-pdf             -> HTML + Markdown seulement
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { ROOT, loadData, loadVariant, resolveCv } from './lib/load.js';
import { renderHtml } from './lib/render.js';
import { toMarkdown } from './lib/markdown.js';

const args = process.argv.slice(2);
const noPdf = args.includes('--no-pdf');
let files = args.filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  files = fs.readdirSync(path.join(ROOT, 'variants')).filter((f) => f.endsWith('.yml')).map((f) => `variants/${f}`);
}

const outDir = path.join(ROOT, 'export');
fs.mkdirSync(outDir, { recursive: true });

const data = loadData();
const browser = noPdf ? null : await chromium.launch({ channel: 'chrome' });

for (const file of files) {
  const variant = loadVariant(file);
  const cv = resolveCv(data, variant);
  if (cv.lang !== 'fr' && cv.missing.length) {
    console.warn(`⚠️  ${file} : ${cv.missing.length} texte(s) sans traduction "${cv.lang}" (affichés en français) — voir npm run check`);
  }
  const base = path.join(outDir, variant.output ?? variant.slug);

  const html = await renderHtml(cv);
  fs.writeFileSync(`${base}.html`, html);
  fs.writeFileSync(`${base}.md`, toMarkdown(cv));

  let report = '';
  if (browser) {
    const page = await browser.newPage();
    await page.goto(`file://${base}.html`);
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ path: `${base}.pdf`, preferCSSPageSize: true, printBackground: true });
    await page.close();

    // Nombre de pages réel, lu dans le PDF généré.
    const pages = pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
    report = ` · ${pages} page${pages > 1 ? 's' : ''}`;
  }
  console.log(`✓ ${file} → export/${path.basename(base)}.{html,md${browser ? ',pdf' : ''}}${report}`);
}

await browser?.close();
