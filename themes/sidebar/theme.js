// Thème "sidebar" : colonne latérale claire
// avec photo ronde, bio, interventions et contact ; expériences dans la colonne principale.

export const fonts = [{ pkg: 'montserrat', family: 'Montserrat', weights: [300, 400, 500, 600, 800] }];

// Sections placées dans la colonne latérale ; tout le reste va dans la colonne principale.
const SIDE = ['bio', 'talks', 'skills', 'languages', 'interests', 'contact'];

export function render(cv, { esc, paragraphs, period, label }) {
  const L = (k) => esc(label(cv.lang, k));
  const show = cv.variant.show ?? {};
  const c = cv.contact;

  const side = {
    bio: () => paragraphs(cv.bio),
    talks: () =>
      cv.talks.map((t) => `<div class="talk"><strong>${esc(t.title)} – ${esc(t.year)}</strong><span>${esc(t.subtitle)}</span></div>`).join(''),
    skills: () =>
      cv.skills.map((s) => `<div class="skill"><strong>${esc(s.label)}</strong><span>${s.items.map(esc).join(' · ')}</span></div>`).join(''),
    languages: () =>
      cv.languages.map((l) => `<div class="talk"><strong>${esc(l.name)}</strong><span>${esc(l.level)}</span></div>`).join(''),
    interests: () => `<p>${cv.interests.map(esc).join('<br>')}</p>`,
    contact: () =>
      [c.phone, c.address, [c.website, c.email].filter(Boolean).join('<br>')]
        .filter(Boolean).map((l) => `<p>${l.includes('<br>') ? l : esc(l)}</p>`).join(''),
  };

  const entry = ({ title, meta, summary, highlights, stack }) => `
    <article class="entry">
      <h3>${esc(title)}</h3>
      <div class="meta">${esc(meta)}</div>
      ${summary ? `<p>${esc(summary)}</p>` : ''}
      ${highlights?.length ? `<ul>${highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
      ${show.stack && stack?.length ? `<div class="stack">${stack.map(esc).join(' · ')}</div>` : ''}
    </article>`;

  const main = {
    experiences: () =>
      cv.experiences.map((e) =>
        entry({
          title: [e.role, e.org].filter(Boolean).join(' — '),
          meta: [e.location, period(e, cv.lang, { withMonth: show.months })].filter(Boolean).join(' · '),
          summary: e.summary,
          highlights: show.highlights === false ? [] : e.highlights,
          stack: e.stack,
        }),
      ).join(''),
    projects: () =>
      cv.projects.map((p) => entry({ title: p.title, meta: [p.org, p.year].filter(Boolean).join(' · '), summary: p.summary, highlights: p.highlights, stack: p.stack })).join(''),
    education: () =>
      cv.education.map((e) => entry({ title: [e.org, e.degree].filter(Boolean).join(' — '), meta: period(e, cv.lang, { withMonth: show.months }), summary: e.summary })).join(''),
  };

  const sideHtml = cv.order.filter((k) => SIDE.includes(k)).map((k) => `
      <section class="side-section side-${k}">
        <h2>${L(k)}</h2>
        ${side[k]()}
      </section>`).join('');

  const mainHtml = cv.order.filter((k) => main[k] && cv[k]?.length).map((k) => `
      <section class="main-section main-${k}">
        <h2><span>${L(k)}</span></h2>
        ${main[k]()}
      </section>`).join('');

  return `
  <div class="sheet">
    <div class="side-bg"></div>
    <aside>
      ${cv.photo ? `<img class="photo" src="${cv.photo}" alt="">` : ''}
      <h1>${esc(cv.name)}</h1>
      <div class="headline">${cv.headline.map(esc).join('<br>')}</div>
      ${sideHtml}
    </aside>
    <main>${mainHtml}</main>
  </div>`;
}
