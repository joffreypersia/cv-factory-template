// Helpers partagés par les thèmes et l'export Markdown.

const MONTHS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const WORDS = {
  fr: { since: 'Depuis', present: "aujourd'hui" },
  en: { since: 'Since', present: 'present' },
};

export const LABELS = {
  fr: { experiences: 'Expériences', education: 'Formation', skills: 'Compétences', talks: 'Interventions', projects: 'Projets', languages: 'Langues', interests: 'Passions', bio: 'Bio', contact: 'Contact', stack: 'Stack' },
  en: { experiences: 'Experience', education: 'Education', skills: 'Skills', talks: 'Talks', projects: 'Projects', languages: 'Languages', interests: 'Passions', bio: 'About', contact: 'Contact', stack: 'Stack' },
};

// Échappement HTML + typographie : apostrophes courbes, espaces insécables français (« x », x : y, x ?).
export const esc = (s) =>
  String(s ?? '')
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    .replace(/(\w)'(\w)/g, '$1’$2')
    .replace(/« /g, '« ')
    .replace(/ ([»:;?!])/g, ' $1');

// Paragraphes séparés par une ligne vide -> <p>
export const paragraphs = (text) =>
  String(text ?? '').trim().split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join('');

function fmtDate(value, lang, { withMonth }) {
  const [y, m] = String(value).split('-');
  return withMonth && m ? `${MONTHS[lang][Number(m) - 1]} ${y}` : y;
}

// start/end -> "2021 – 2026", "Depuis juillet 2019", "2015"
export function period(item, lang = 'fr', { withMonth = false } = {}) {
  if (item.period) return item.period;
  const { start, end } = item;
  const w = WORDS[lang] ?? WORDS.fr;
  if (start == null) return end == null ? '' : fmtDate(end, lang, { withMonth });
  if (end === 'present') return `${w.since} ${fmtDate(start, lang, { withMonth })}`;
  if (end == null) return fmtDate(start, lang, { withMonth });
  return `${fmtDate(start, lang, { withMonth })} – ${fmtDate(end, lang, { withMonth })}`;
}

export const label = (lang, key) => (LABELS[lang] ?? LABELS.fr)[key] ?? key;
