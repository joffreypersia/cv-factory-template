// Assemble un document HTML autonome (CSS, polices et photo inlinés) à partir d'un thème.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './load.js';
import * as helpers from './format.js';

// Deux formes acceptées :
//   { pkg: 'inter', family: 'Inter', weights: [400, 600] }           -> paquet @fontsource
//   { file: 'assets/fonts/X.woff2', family: 'X', weight: '100 900' } -> fichier local (variable ou statique)
function fontFaces(fonts = []) {
  return fonts
    .flatMap(({ pkg, file, family, weight = 400, style = 'normal', weights = [], italic = [] }) => {
      if (file) {
        const b64 = fs.readFileSync(path.resolve(ROOT, file)).toString('base64');
        return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
      }
      const faces = [
        ...weights.map((w) => [w, 'normal']),
        ...italic.map((w) => [w, 'italic']),
      ];
      return faces.map(([w, style]) => {
        const file = path.join(ROOT, 'node_modules/@fontsource', pkg, 'files', `${pkg}-latin-${w}-${style}.woff2`);
        const b64 = fs.readFileSync(file).toString('base64');
        return `@font-face{font-family:'${family}';font-style:${style};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
      });
    })
    .join('\n');
}

function dataUri(file) {
  const abs = path.resolve(ROOT, file);
  const ext = path.extname(abs).slice(1).replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(abs).toString('base64')}`;
}

export async function renderHtml(cv, { liveReload = false } = {}) {
  const dir = path.join(ROOT, 'themes', cv.variant.theme);
  if (!fs.existsSync(dir)) throw new Error(`Thème introuvable : themes/${cv.variant.theme}`);
  // Import frais à chaque rendu pour que le mode dev prenne les modifications en compte.
  const theme = await import(`${path.join(dir, 'theme.js')}?t=${Date.now()}`);
  const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
  const photo = cv.photo ? dataUri(cv.photo) : null;
  // Variables CSS surchargeables depuis la variante : `style: { accent: '#c0392b' }`
  const vars = Object.entries(cv.variant.style ?? {}).map(([k, v]) => `--${k}:${v};`).join('');
  // @page n'accepte pas les variables CSS : la marge d'impression est injectée telle quelle.
  const margin = cv.variant.page_margin;
  const pageCss = margin ? `@page{margin:${margin}}:root{--page-margin:${margin}}` : '';

  const body = theme.render({ ...cv, photo }, helpers);
  const reload = liveReload
    ? `<script>let v;setInterval(async()=>{const r=await fetch('/__version').then(r=>r.text()).catch(()=>v);if(v&&r!==v)location.reload();v=r},700)</script>`
    : '';

  return `<!doctype html>
<html lang="${cv.lang}">
<head>
<meta charset="utf-8">
<title>${helpers.esc(cv.name)} — CV</title>
<style>${fontFaces([...(theme.fonts ?? []), ...(cv.variant.fonts ?? [])])}</style>
<style>${css}</style>
${vars ? `<style>:root{${vars}}</style>` : ''}
${pageCss ? `<style>${pageCss}</style>` : ''}
</head>
<body>
${body}
${reload}
</body>
</html>`;
}
