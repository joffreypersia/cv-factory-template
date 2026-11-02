// Vérifie la cohérence des données et des variantes, et liste les TODO restants.
//   npm run check
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadData, loadVariant, resolveCv } from './lib/load.js';

const data = loadData();
const errors = [];
const warnings = [];

// Ids uniques sur toutes les collections (les overrides de variantes s'appuient dessus).
const seen = new Map();
for (const c of ['experiences', 'education', 'skills', 'talks', 'projects']) {
  for (const item of data[c]) {
    if (!item.id) errors.push(`${c} : un item n'a pas d'id`);
    else if (seen.has(item.id)) errors.push(`id "${item.id}" en double (${seen.get(item.id)} et ${c})`);
    else seen.set(item.id, c);
  }
}

for (const f of fs.readdirSync(path.join(ROOT, 'variants')).filter((f) => f.endsWith('.yml'))) {
  try {
    const variant = loadVariant(`variants/${f}`);
    for (const id of Object.keys(variant.overrides ?? {})) {
      if (!seen.has(id)) errors.push(`variants/${f} : override sur un id inconnu "${id}"`);
    }
    if (!fs.existsSync(path.join(ROOT, 'themes', variant.theme))) errors.push(`variants/${f} : thème "${variant.theme}" introuvable`);
    const known = new Set([
      ...Object.keys(data.profile.bios), ...Object.keys(data.profile.headlines),
      ...['experiences', 'education', 'skills', 'talks', 'projects'].flatMap((c) => data[c].flatMap((i) => Object.keys(i.angles ?? {}))),
    ]);
    for (const a of variant.angles ?? []) {
      if (!known.has(a)) errors.push(`variants/${f} : angle "${a}" défini nulle part dans data/`);
    }
    for (const k of variant.hide_contact ?? []) {
      if (!(k in data.profile.contact)) errors.push(`variants/${f} : hide_contact sur un champ inconnu "${k}"`);
    }
    const cv = resolveCv(data, variant);
    if (cv.lang !== 'fr' && cv.missing.length) {
      warnings.push(`variants/${f} (${cv.lang}) : ${cv.missing.length} texte(s) sans traduction\n    ${cv.missing.map((m) => `${m.at} — « ${m.text.slice(0, 70)} »`).join('\n    ')}`);
    }
  } catch (e) {
    errors.push(`variants/${f} : ${e.message}`);
  }
}

const todos = fs
  .readdirSync(path.join(ROOT, 'data'))
  .flatMap((f) =>
    fs.readFileSync(path.join(ROOT, 'data', f), 'utf8').split('\n')
      .map((line, i) => [line, i + 1])
      .filter(([line]) => line.includes('TODO'))
      .map(([line, n]) => `data/${f}:${n}  ${line.slice(line.indexOf('TODO'))}`),
  );

if (warnings.length) console.log(`Traductions manquantes :\n  ${warnings.join('\n  ')}\n`);
if (todos.length) console.log(`TODO à compléter (${todos.length}) :\n  ${todos.join('\n  ')}\n`);
if (errors.length) {
  console.error(`✗ ${errors.length} erreur(s) :\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ Données et variantes cohérentes');
