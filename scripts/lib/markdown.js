// Export Markdown d'un cv résolu : lisible par un humain, collable dans un LLM, Malt, LinkedIn…
import { label, period } from './format.js';

export function toMarkdown(cv) {
  const L = (k) => label(cv.lang, k);
  const colon = cv.lang === 'fr' ? ' :' : ':'; // espace avant les deux-points en français seulement
  const out = [];
  const c = cv.contact;

  out.push(`# ${cv.name}`, '', `**${cv.headline.join(' · ')}**`, '');
  out.push([c.email, c.phone, c.website, c.city].filter(Boolean).join(' · '), '');
  out.push(`## ${L('bio')}`, '', cv.bio.trim(), '');

  const sections = {
    experiences: () =>
      cv.experiences.flatMap((e) => [
        `### ${e.role}${e.org ? ` — ${e.org}` : ''}`,
        ...[[period(e, cv.lang, { withMonth: true }), e.location].filter(Boolean).join(' · ')].filter(Boolean).map((m) => `*${m}*`),
        '',
        ...(e.summary ? [e.summary, ''] : []),
        ...(e.highlights ?? []).map((h) => `- ${h}`),
        ...(e.stack?.length ? ['', `${L('stack')}${colon} ${e.stack.join(', ')}`] : []),
        '',
      ]),
    education: () =>
      cv.education.flatMap((e) => [
        `### ${e.degree}${e.org ? ` — ${e.org}` : ''}`,
        `*${period(e, cv.lang)}*`,
        '',
        ...(e.summary ? [e.summary, ''] : []),
      ]),
    skills: () => cv.skills.map((s) => `- **${s.label}**${colon} ${s.items.join(', ')}`).concat(''),
    talks: () => cv.talks.map((t) => `- **${t.title}** (${t.year}) — ${t.kind}${colon} ${t.subtitle}`).concat(''),
    projects: () =>
      cv.projects.flatMap((p) => [`### ${p.title}${p.year ? ` (${p.year})` : ''}`, '', p.summary ?? '', '']),
    languages: () => cv.languages.map((l) => `- **${l.name}**${colon} ${l.level}`).concat(''),
    interests: () => cv.interests.map((i) => `- ${i}`).concat(''),
  };

  for (const key of cv.order) {
    if (!sections[key]) continue;
    const lines = sections[key]();
    if (lines.filter(Boolean).length === 0) continue;
    out.push(`## ${L(key)}`, '', ...lines);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
