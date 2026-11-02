// Thème "editorial" : une colonne, typographie éditoriale (Lora + Inter + JetBrains Mono),
// dates en marge. Pensé pour les CV tech / produit, dense mais aéré, sur 1 ou 2 pages.

export const fonts = [
  { pkg: 'lora', family: 'Lora', weights: [400, 600] },
  { pkg: 'inter', family: 'Inter', weights: [400, 500, 600] },
  { pkg: 'jetbrains-mono', family: 'JetBrains Mono', weights: [400, 500] },
];

export function render(cv, { esc, paragraphs, period, label }) {
  const L = (k) => esc(label(cv.lang, k));
  const show = cv.variant.show ?? {};
  const c = cv.contact;

  const row = (aside, body) => `<div class="row"><div class="when">${aside}</div><div class="what">${body}</div></div>`;
  const list = (items) => (items?.length ? `<ul>${items.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '');
  const stack = (items) => (show.stack !== false && items?.length ? `<div class="stack">${items.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '');

  const sections = {
    bio: () => row('', `<div class="bio">${paragraphs(cv.bio)}</div>`),
    experiences: () =>
      cv.experiences.map((e) =>
        row(
          esc(period(e, cv.lang)),
          `<h3>${esc(e.role)}${e.org ? ` <span class="org">${esc(e.org)}</span>` : ''}</h3>
           ${e.summary ? `<p class="summary">${esc(e.summary)}</p>` : ''}
           ${show.highlights === false ? '' : list(e.highlights)}
           ${stack(e.stack)}`,
        ),
      ).join(''),
    projects: () =>
      cv.projects.map((p) => row(esc(p.year ?? ''), `<h3>${esc(p.title)}${p.org ? ` <span class="org">${esc(p.org)}</span>` : ''}</h3>${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ''}${list(p.highlights)}${stack(p.stack)}`)).join(''),
    education: () =>
      cv.education.map((e) => row(esc(period(e, cv.lang)), `<h3>${esc(e.degree)} <span class="org">${esc(e.org)}</span></h3>${e.summary ? `<p class="summary">${esc(e.summary)}</p>` : ''}`)).join(''),
    skills: () =>
      `<div class="grid">${cv.skills.map((s) => `<div><div class="k">${esc(s.label)}</div><div class="v">${s.items.map(esc).join(', ')}</div></div>`).join('')}</div>`,
    talks: () => cv.talks.map((t) => row(esc(t.year), `<h3>${esc(t.title)} <span class="org">${esc(t.kind)}</span></h3><p class="summary">${esc(t.subtitle)}</p>`)).join(''),
    languages: () =>
      `<div class="grid">${cv.languages.map((l) => `<div><div class="k">${esc(l.name)}</div><div class="v">${esc(l.level)}</div></div>`).join('')}</div>`,
    interests: () => row('', `<p class="summary">${cv.interests.map(esc).join(' · ')}</p>`),
  };

  const body = cv.order
    .filter((k) => sections[k] && k !== 'contact')
    .filter((k) => !Array.isArray(cv[k]) || cv[k].length)
    .map((k) => `<section class="s-${k}"><h2>${L(k)}</h2>${sections[k]()}</section>`)
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
