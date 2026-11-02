# CV factory

Votre CV traité comme du code : **une source de données riche**, des **variantes ciblées** pour chaque candidature, des **thèmes** interchangeables, et des exports **PDF / HTML / Markdown** régénérés en une commande.

Le projet est pensé pour être piloté par un assistant IA (Claude Code, Codex, Gemini…) : « fais-moi un CV pour cette offre », « version anglaise », « une version d'une page » — sans jamais toucher à la mise en page ni réécrire un PDF à la main.

```
data/*.yml  ──►  variants/*.yml  ──►  themes/<thème>  ──►  export/*.pdf · *.html · *.md
 (contenu)       (sélection)          (design)
```

> Le dépôt contient un profil **fictif** (Camille Martin) pour montrer toutes les possibilités. Remplacez le contenu de `data/` par le vôtre.

## Pourquoi

Un CV « à la main » finit en dizaines de fichiers presque identiques, chacun avec ses propres corrections. Ici :

- **Tout le contenu vit à un seul endroit** (`data/`), le plus complet possible : chaque expérience, chaque chiffre, chaque techno.
- **Une candidature = un petit fichier YAML** (`variants/`) qui choisit quoi montrer, dans quel ordre, avec quel thème.
- **Les angles** permettent de raconter les mêmes faits autrement selon la cible (encadrement, pédagogie…), sans dupliquer ni inventer.
- **Le design est séparé du contenu** : changer de thème ou de police ne touche pas au texte.

## Démarrer

Prérequis : Node ≥ 20 et Google Chrome (utilisé pour le rendu PDF).

```bash
npm install
npm run dev      # aperçu live sur http://localhost:4321, recharge à chaque sauvegarde
npm run build    # génère toutes les variantes dans export/
npm run check    # vérifie la cohérence des ids et liste les TODO à compléter
```

Une seule variante, ou sans PDF :

```bash
npm run build -- variants/lead-dev.yml
npm run build -- --no-pdf
```

## Structure

| Dossier | Rôle |
|---|---|
| `data/` | **Source de vérité** : profil, expériences, formations, compétences, conférences, projets |
| `variants/` | Une version ciblée du CV par fichier |
| `themes/` | Mise en page : `theme.js` (HTML) + `style.css`, un dossier par thème |
| `assets/` | Photo, logos |
| `scripts/` | Build HTML + PDF + Markdown, aperçu live, vérifications |
| `export/` | Fichiers générés (non versionnés) |

## Variantes d'exemple

| Fichier | Thème | Montre |
|---|---|---|
| `variants/complet.yml` | editorial | Tout le contenu, sans filtre ; typo personnalisée via `fonts` et `style` |
| `variants/complet.en.yml` | editorial | Version anglaise par héritage (`extends`) |
| `variants/complet.public.yml` | editorial | Version publique sans téléphone (`hide_contact`) |
| `variants/lead-dev.yml` | editorial | Candidature ciblée : angle `lead`, sélection et ordre des expériences, `overrides` |
| `variants/formation.yml` | sidebar | Angle `teaching`, thème à colonne latérale |

## Mettre votre CV

1. Remplacez le contenu de `data/` par le vôtre — ou donnez votre CV actuel (PDF, texte, profil LinkedIn) à votre assistant IA en lui demandant de remplir `data/`.
2. Ajoutez votre photo dans `assets/` et décommentez `photo:` dans `data/profile.yml`.
3. Adaptez ou supprimez les variantes d'exemple, puis `npm run check` et `npm run build`.

Conseil : mettez **plus** d'informations que nécessaire dans `data/`. Ce sont les variantes qui trient.

## Travailler avec une IA

Les règles et le format complet sont dans [`AGENTS.md`](AGENTS.md), lu automatiquement par Claude Code (via `CLAUDE.md`) et par Codex. Exemples de demandes :

- « Crée une variante pour cette offre : <coller l'offre> »
- « Ajoute mon nouveau poste avec ces infos : … »
- « Génère la version anglaise du CV lead »
- « Il faut que ça tienne sur une page »
- « Refais le thème sidebar avec une couleur d'accent et sans photo »

La règle principale donnée à l'IA : **ne rien inventer**. Ce qui n'est pas dans `data/` ou confirmé par vous est marqué `# TODO`, et `npm run check` les liste.

## Thèmes

- **editorial** : titres de section dans la marge de gauche, dates alignées à droite de chaque poste, stack en étiquettes. Dense et lisible, adapté aux CV tech / produit.
- **sidebar** : colonne latérale (bio, conférences, contact), photo ronde, titres espacés.

Chaque variante peut ajuster un thème sans le modifier, via `style:` (variables CSS) et `fonts:` (paquets `@fontsource/*`, inlinés dans le HTML et le PDF). Pour un nouveau thème, copiez `themes/editorial/` en gardant la signature `export function render(cv, helpers)`.
