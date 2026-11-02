// Thème "editorial" : une colonne, typographie éditoriale (Lora + Inter + JetBrains Mono),
// titres de section en marge, dates alignées à droite du titre de chaque item.
// Pensé pour les CV tech / produit, dense mais aéré, sur 1 ou 2 pages.

export const fonts = [
  { pkg: 'lora', family: 'Lora', weights: [400, 600] },
  { pkg: 'inter', family: 'Inter', weights: [400, 500, 600] },
  { pkg: 'jetbrains-mono', family: 'JetBrains Mono', weights: [400, 500] },
];

export function render(cv, { esc, paragraphs, period, label }) {
  const L = (k) => esc(label(cv.lang, k));
  const show = cv.variant.show ?? {};
  const c = cv.contact;

  // Un item : marge de gauche (accueille le titre de section sur le premier item),
  // puis ligne de tête (titre + date alignée à droite) et contenu.
  const ASIDE = '<div class="aside"></div>';
  const row = (when, title, rest = '') =>
    `<div class="row">${ASIDE}<div class="main">${title || when ? `<div class="head">${title}${when ? `<div class="when">${when}</div>` : ''}</div>` : ''}${rest}</div></div>`;
  const h3 = (title, org) => `<h3>${esc(title)}${org ? ` <span class="org">${esc(org)}</span>` : ''}</h3>`;
  const list = (items) => (items?.length ? `<ul>${items.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '');
  const stack = (items) => (show.stack !== false && items?.length ? `<div class="stack">${items.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '');

  const sections = {
    bio: () => row('', '', `<div class="bio">${paragraphs(cv.bio)}</div>`),
    experiences: () =>
      cv.experiences.map((e) =>
        row(
          esc(period(e, cv.lang)),
          h3(e.role, e.org),
          `${e.summary ? `<p class="summary">${esc(e.summary)}</p>` : ''}
           ${show.highlights === false ? '' : list(e.highlights)}
           ${stack(e.stack)}`,
        ),
      ).join(''),
    projects: () =>
      cv.projects.map((p) => row(esc(p.year ?? ''), h3(p.title, p.org), `${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}${list(p.highlights)}${stack(p.stack)}`)).join(''),
    education: () =>
      cv.education.map((e) => row(esc(period(e, cv.lang)), h3(e.degree, e.org), `${e.summary ? `<p class="summary">${esc(e.summary)}</p>` : ''}`)).join(''),
    skills: () =>
      row('', '', `<div class="grid">${cv.skills.map((s) => `<div><div class="k">${esc(s.label)}</div><div class="v">${s.items.map(esc).join(', ')}</div></div>`).join('')}</div>`),
    talks: () => cv.talks.map((t) => row(esc(t.year), h3(t.title, t.kind), t.subtitle ? `<p class="summary">${esc(t.subtitle)}</p>` : '')).join(''),
    languages: () =>
      row('', '', `<div class="grid">${cv.languages.map((l) => `<div><div class="k">${esc(l.name)}</div><div class="v">${esc(l.level)}</div></div>`).join('')}</div>`),
    interests: () => row('', '', `<p class="summary">${cv.interests.map(esc).join(' · ')}</p>`),
  };

  const body = cv.order
    .filter((k) => sections[k] && k !== 'contact')
    .filter((k) => !Array.isArray(cv[k]) || cv[k].length)
    // Le titre va dans la marge du premier item : il reste sur la même ligne et la même page que lui.
    .map((k) => `<section class="s-${k}">${sections[k]().replace(ASIDE, `<div class="aside"><h2>${L(k)}</h2></div>`)}</section>`)
    .join('');

  const contacts = [
    c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`,
    c.phone && esc(c.phone),
    c.website && `<a href="https://${esc(c.website.replace(/^https?:\/\//, ''))}">${esc(c.website)}</a>`,
    c.city && esc(c.city),
  ].filter(Boolean);

  return `
  <div class="sheet">
    <header>
      <div class="id">
        <h1>${esc(cv.name)}</h1>
        <div class="headline">${cv.headline.map(esc).join('<i>/</i>')}</div>
      </div>
      ${cv.photo ? `<img class="photo" src="${cv.photo}" alt="">` : ''}
      <div class="contact">${contacts.join('')}</div>
    </header>
    ${body}
  </div>`;
}
