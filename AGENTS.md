# CV factory — instructions pour les agents (Claude, ChatGPT/Codex, Gemini…)

Ce dépôt produit les CV d'une personne à partir d'une **source de données unique**.
On ne modifie jamais un PDF à la main : on modifie les données ou une variante, puis on régénère.

## Architecture

```
data/          SOURCE DE VÉRITÉ — tout le contenu, le plus riche possible
  profile.yml      identité, contact, jeux de titres (headlines), bios par angle, langues
  experiences.yml  toutes les expériences (id, role, org, start/end, summary, highlights, stack, tags)
  education.yml    diplômes et certifications
  skills.yml       groupes de compétences
  talks.yml        conférences, interviews
  projects.yml     projets marquants
variants/      UNE VERSION CIBLÉE = un fichier YAML (quoi afficher, dans quel ordre, avec quel thème)
themes/        MISE EN PAGE — theme.js (HTML) + style.css, un dossier par thème
assets/        photo, logos
scripts/       build (HTML + PDF + Markdown), dev (aperçu live), check (cohérence)
export/        fichiers générés (non versionnés)
```

## Règles

1. **Le contenu va dans `data/`, la sélection dans `variants/`, le style dans `themes/`.** Ne jamais écrire de contenu en dur dans un thème.
2. **Ne rien inventer.** Chiffres, dates, clients, technos : uniquement ce qui est dans `data/` ou fourni par l'utilisateur. Si une info manque, ajoute un commentaire `# TODO …` et signale-le.
3. **Adapter sans perdre : les angles.** Une candidature ne se fait pas en masquant des expériences, mais en relisant les mêmes faits sous un angle (UX & IA, pédagogie, dev…). Les formulations par angle vivent dans `data/`, sur chaque item (`angles:`), et sont réutilisables par toutes les variantes. `overrides:` dans une variante est réservé aux retouches ponctuelles propres à une seule candidature. Une info nouvelle et vraie va dans la formulation de base de `data/`.
4. Les ids sont stables et uniques sur toutes les collections : ne pas les renommer (les variantes s'appuient dessus).
5. Textes multilingues : `champ: { fr: …, en: … }`. Une chaîne simple vaut pour toutes les langues. Repli sur `fr` si la langue manque.
6. Après toute modification : `npm run check` puis `npm run build -- variants/<fichier>.yml`. Le build indique le nombre de pages de chaque PDF ; aucune limite n'est imposée. Si une variante doit tenir sur un nombre de pages donné, c'est une consigne de l'utilisateur : raccourcir alors par le contenu (moins d'items, `max_highlights`, `overrides` plus courts) — ne pas réduire la taille de police sans le dire.
7. Pour vérifier visuellement un rendu, lire le PDF généré dans `export/`.

## Angles

Un angle est une manière de raconter le parcours pour un type de besoin. Angles existants :

| Angle | Pour | Bio / titres |
|---|---|---|
| `lead` | architecture, encadrement d'équipe, mentorat | `bios.lead`, `headlines.lead` |
| `teaching` | pédagogie, formation d'adultes | `bios.teaching`, `headlines.teaching` |

Sur un item de `data/` :

```yaml
- id: atelier-numerique
  summary: …                 # formulation de base (complète, neutre)
  highlights: [...]
  angles:
    lead:                    # ne redéfinit que ce qui change
      highlights: ["Encadrement de cinq développeurs : revue de code, binômage…"]
    teaching:
      summary: …
```

Dans une variante : `angles: [lead, teaching]`. Pour chaque champ de chaque item, le premier angle qui le définit gagne, sinon la base. Bio et titres suivent la même règle (sauf `bio:` / `headline:` explicites).

Règles de rédaction d'un angle :
- **Mêmes faits, autre éclairage.** On change l'ordre, le vocabulaire, ce qu'on met en avant ; jamais les dates, les chiffres ni la réalité de ce qui a été fait.
- Une formulation plausible mais non confirmée par l'utilisateur porte un `# TODO confirmer`.
- Nouvel angle : l'ajouter au tableau ci-dessus, écrire la bio et les titres correspondants dans `profile.yml`.

## Format d'une variante

```yaml
extends: complet                    # optionnel : reprend une autre variante (design, typo, sections…)
title: Lead développeuse            # libellé humain
lang: fr                            # fr | en
theme: editorial                    # dossier dans themes/ : sidebar | editorial
output: CV-Camille-Martin-Lead     # nom des fichiers générés

angles: [lead, teaching]            # formulations à utiliser, par priorité (voir « Angles »)
headline: lead                      # clé de profile.headlines  (ou headline_text: [..] en dur)
bio: lead                           # clé de profile.bios        (ou bio_text: "…" en dur)
photo: true                         # false pour masquer
hide_contact: [phone]               # champs de profile.contact à retirer (version publique)

sections: [bio, experiences, skills, education]   # ordre ; valeurs possibles :
          # bio, experiences, projects, skills, talks, education, languages, interests, contact

experiences:                        # pour chaque collection, au choix :
  ids: [atelier-numerique, freelance] #  liste explicite et ordonnée
  # tags: [dev, ai]                 #   ou filtre par tags (ordre du fichier data)
  # exclude: [agence-pixel]         #   retirer des ids
  max_highlights: 2                 #   tronquer les puces
  # limit: 4                        #   nombre max d'items
skills:
  tags: [dev]

overrides:                          # remplace des champs d'un item, pour cette variante seulement
  ecole-code:
    summary: Cours de PHP et Laravel pour adultes en reconversion.
    highlights: []

show:                               # options d'affichage lues par les thèmes
  stack: true
  highlights: true
  months: false                     # "juillet 2019" plutôt que "2019"

style:                              # variables CSS du thème (voir :root dans style.css)
  accent: "#2563eb"
```

## Recettes

- **« Fais-moi un CV pour cette offre »** → lire l'offre ; identifier l'angle (ou en créer un dans `data/` si le besoin est récurrent) ; créer `variants/<cible>.yml` avec `extends: complet`, `angles`, l'ordre des expériences ; `overrides` seulement pour le vocabulaire propre à cette offre ; build ; lister à l'utilisateur les TODO à confirmer. Exemple : `variants/lead-dev.yml`.
- **« Version anglaise »** → créer `variants/<variante>.en.yml` avec `extends: <variante>`, `lang: en` et un `output` propre ; lancer `npm run check`, qui liste chaque texte sans traduction (sinon affiché en français) ; ajouter les `en:` dans `data/` (traduction fidèle, y compris dans les `angles`) ; les textes sans langue (items de compétences, stack) valent pour toutes les langues : les passer en `{ fr: …, en: … }` s'ils sont en français. Exemple : `variants/complet.en.yml`.
- **« Ajoute mon nouveau projet / poste »** → nouvel item dans `data/experiences.yml` ou `data/projects.yml` avec id, dates, tags ; puis l'ajouter aux variantes concernées.
- **« Supprime tout ce qui concerne WordPress »** → dans la/les variante(s) : `exclude`, `overrides` (stack, highlights) ; ne supprimer de `data/` que si l'utilisateur le demande explicitement.
- **Version publique (site, lien partagé)** → variante `extends: <variante>` avec `hide_contact: [phone]` et un `output` suffixé `-public`. Exemple : `variants/complet.public.yml`.
- **Texte pour Malt / LinkedIn** → partir de `export/CV-complet-FR.md` (généré par `variants/complet.yml`).
- **Nouveau thème** → copier `themes/editorial/`, garder la signature `export function render(cv, helpers)` et `export const fonts`. Polices via paquets `@fontsource/*` (inlinées au build).

## Commandes

```bash
npm install
npm run dev                      # http://localhost:4321 — aperçu live de chaque variante
npm run check                    # cohérence ids/variantes + liste des TODO
npm run build                    # toutes les variantes → export/*.{pdf,html,md}
npm run build -- variants/x.yml  # une seule
npm run build -- --no-pdf        # sans Chrome
```

Le PDF est rendu par Google Chrome installé localement (playwright-core, `channel: 'chrome'`).
