// Charge data/*.yml + une variante, et produit un objet "cv" résolu
// (langue choisie, angles et overrides appliqués, items filtrés/ordonnés) prêt pour un thème.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const ROOT = path.resolve(import.meta.dirname, '../..');
const COLLECTIONS = ['experiences', 'education', 'skills', 'talks', 'projects'];

const readYaml = (file) => YAML.parse(fs.readFileSync(file, 'utf8')) ?? null;

export function loadData() {
  const data = { profile: readYaml(path.join(ROOT, 'data/profile.yml')) };
  for (const c of COLLECTIONS) data[c] = readYaml(path.join(ROOT, `data/${c}.yml`)) ?? [];
  return data;
}

// `extends: complet` reprend une autre variante (design, typo…) ; les clés locales gagnent,
// `style` et `show` sont fusionnés clé par clé. `output` et `title` ne sont jamais hérités.
export function loadVariant(file) {
  const own = readYaml(path.resolve(ROOT, file));
  let variant = own;
  if (own.extends) {
    const { output, title, slug, ...parent } = loadVariant(`variants/${own.extends}.yml`);
    variant = {
      ...parent,
      ...own,
      style: { ...parent.style, ...own.style },
      show: { ...parent.show, ...own.show },
    };
  }
  variant.slug = path.basename(file, path.extname(file));
  variant.lang ??= 'fr';
  variant.theme ??= 'sidebar';
  return variant;
}

// { fr: 'x', en: 'y' } -> 'x' selon la langue, récursivement. Repli sur fr puis sur la première valeur.
// Chaque repli est noté dans `missing` (chemin + texte d'origine) pour signaler les traductions manquantes.
function localize(value, lang, missing = [], at = '') {
  if (Array.isArray(value)) return value.map((v, i) => localize(v, lang, missing, `${at}[${i}]`));
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length && keys.every((k) => /^[a-z]{2}$/.test(k))) {
      if (value[lang] == null) missing.push({ at, text: String(value.fr ?? value[keys[0]]).trim().split('\n')[0] });
      return localize(value[lang] ?? value.fr ?? value[keys[0]], lang, missing, at);
    }
    return Object.fromEntries(keys.map((k) => [k, localize(value[k], lang, missing, at ? `${at}.${k}` : k)]));
  }
  return value;
}

// Sélection d'une collection selon la config de section de la variante :
//   ids: [a, b]     -> ces items, dans cet ordre
//   tags: [dev]     -> items ayant au moins un de ces tags (ordre du fichier)
//   exclude: [c]    -> retire ces ids
//   (rien)          -> tous les items
function select(items, conf = {}) {
  let out;
  if (conf.ids) {
    out = conf.ids.map((id) => {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error(`Id inconnu dans la variante : "${id}"`);
      return item;
    });
  } else if (conf.tags) {
    out = items.filter((i) => i.tags?.some((t) => conf.tags.includes(t)));
  } else {
    out = [...items];
  }
  if (conf.exclude) out = out.filter((i) => !conf.exclude.includes(i.id));
  if (conf.max_highlights != null) {
    out = out.map((i) => ({ ...i, highlights: i.highlights?.slice(0, conf.max_highlights) }));
  }
  if (conf.limit != null) out = out.slice(0, conf.limit);
  return out;
}

// Angles : chaque item peut porter des formulations alternatives par angle,
//   angles: { ux-ia: { summary: …, highlights: [...] }, teaching: { … } }
// La variante liste ses angles par priorité ; pour chaque champ, le premier angle qui le définit gagne,
// sinon la formulation de base. Les overrides de la variante passent en dernier.
function applyAngles(item, angles) {
  const { angles: variants = {}, ...base } = item;
  return [...angles].reverse().reduce((acc, a) => (variants[a] ? { ...acc, ...variants[a] } : acc), base);
}

export function resolveCv(data, variant) {
  const { lang } = variant;
  const angles = variant.angles ?? [];
  const overrides = variant.overrides ?? {};
  const applyOverride = (item) => (overrides[item.id] ? { ...item, ...overrides[item.id] } : item);

  const sections = {};
  for (const c of COLLECTIONS) {
    sections[c] = select(data[c].map((i) => applyAngles(i, angles)), variant[c]).map(applyOverride);
  }

  const p = data.profile;
  // Bio et titres : clé explicite, sinon le premier angle qui en a une, sinon "default".
  const pick = (dict, key) => key ?? angles.find((a) => dict[a]) ?? 'default';
  const headlineKey = pick(p.headlines, variant.headline);
  const bioKey = pick(p.bios, variant.bio);
  const cv = {
    variant,
    lang,
    name: p.name,
    photo: variant.photo === false ? null : p.photo,
    // `hide_contact: [phone]` retire des coordonnées, pour une version diffusée publiquement.
    contact: Object.fromEntries(Object.entries(p.contact).filter(([k]) => !(variant.hide_contact ?? []).includes(k))),
    headline: variant.headline_text ?? p.headlines[headlineKey],
    bio: variant.bio_text ?? p.bios[bioKey],
    languages: p.languages,
    interests: p.interests,
    // Ordre d'affichage des sections ; chaque thème décide où il place chacune.
    order: variant.sections ?? ['experiences', 'education'],
    ...sections,
  };
  if (cv.headline == null) throw new Error(`headline "${headlineKey}" absent de data/profile.yml`);
  if (cv.bio == null) throw new Error(`bio "${bioKey}" absente de data/profile.yml`);
  const { variant: v, ...content } = cv;
  const missing = [];
  const out = { variant: v, ...localize(content, lang, missing) };
  // Chemin lisible : experiences[2].summary -> experiences › <id> › summary
  out.missing = missing.map(({ at, text }) => ({
    at: at.replace(/^(\w+)\[(\d+)\]/, (_, c, i) => `${c} › ${cv[c]?.[i]?.id ?? i}`),
    text,
  }));
  return out;
}
