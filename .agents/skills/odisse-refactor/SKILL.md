---
name: odisse-refactor
description: Analyser l’architecture et refactoriser l’application Odissé santé mentale pour le jury technique, en préservant les données, le récit et les interactions. Utiliser pour les audits structurels et refactorisations de ce projet après la clôture GitLab.
---

# Comprendre et refactoriser Odissé

Faire de la lisibilité de l’application un objectif permanent : responsabilités
explicites, noms précis et fonctions compréhensibles pour le jury technique.
Livrer une architecture expliquée, des recommandations justifiées et, lorsque
l’implémentation est demandée, du code amélioré et vérifié. La priorité est la
lecture du code par un ingénieur découvrant le projet. La demande de création
de cet agent ne déclenche pas à elle seule une refactorisation de l’application.

## Comprendre le système avant de le changer

Travailler depuis la racine Git `web/`. Lire `AGENTS.md`, `README.md`,
`package.json`, `tsconfig.json` et l’état Git. Examiner les points d’entrée et les
appels réels ; les chemins ci-dessous sont des repères initiaux, pas une
architecture cible obligatoire.

Le système observé lors de la création de l’agent utilise React 19, TypeScript
strict et Vite 8, avec Node 22. Il s’agit d’un site statique, sans backend requis.

Suivre ces flux dans le code :

- `data/raw/` → `scripts/build_geography.py`, `scripts/build_web_data.py` et
  `scripts/source_registry.py` → `public/data/experience-data.json` et registre
  `public/data/sources.json`. Identifier les contours géographiques réellement
  consommés plutôt que supposer leur chemin.
- `src/main.tsx` charge le JSON avec `fetch` et annulation, gère l’attente et
  l’échec avec reprise, puis transmet `initialData` à `app/Experience.tsx`.
- `app/Experience.tsx` assemble le parcours. Lire `docs/ARCHITECTURE.md`, puis
  `app/data/`, `app/explorer/`, `app/sections/` et `app/charts/` pour les contrats,
  les calculs et les rendus. Tracer sélection, filtres, survol, valeurs dérivées
  et rendu SVG avant de modifier leurs responsabilités.
- Examiner les responsabilités déjà séparées : `TerritoryMap`, `ChartHelp`,
  `ViewportTooltip`, `useChartInteractions`, `useChartTypography`, portraits et
  illustrations. Lire `site.css` et `visual-system.css` pour leurs dépendances
  aux classes, aux dimensions et aux états d’animation.

Distinguer le parcours monté des anciennes explorations dans `app/archive/`
et des archives analytiques. Vérifier les appels avant de
qualifier du code d’inutilisé. Vérifier les inclusions TypeScript après une
extraction : des fichiers importés sont vérifiés transitivement, mais un module
isolé peut échapper à la configuration actuelle.

## Produire un diagnostic exploitable

Décrire les responsabilités, la source de vérité des états et les principaux
flux avant de proposer des extractions. Pour chaque problème, indiquer le
fichier ou symbole, la conséquence, la priorité, le changement envisagé et son
risque de régression.

Examiner notamment le mélange calcul/rendu/animation, les types répétés, les
règles de comparaison dispersées, les dépendances implicites des hooks et les
répétitions de graphiques. Deux rendus ressemblants ne justifient une abstraction
commune que si leurs règles et interactions sont réellement compatibles.

Pour les performances, examiner les recalculs de séries, tris et géométries,
les rendus lors du survol et du scroll, les lectures DOM et les boucles
`requestAnimationFrame`. Distinguer un risque supposé d’un goulot mesuré.
Mesurer avant d’ajouter une optimisation ; ne pas ajouter systématiquement
`useMemo`, un store global, un worker ou une bibliothèque de graphiques.

## Refactoriser sans dégrader le projet

Favoriser l’extraction de types et fonctions pures, puis de composants et hooks
aux responsabilités explicites lorsque le diagnostic la justifie. Conserver des
contrats simples ; commenter les raisons méthodologiques ou temporelles utiles,
plutôt que paraphraser le code. Mettre à jour la carte des fichiers du README si
les points d’entrée changent.

Préserver les invariants actuels :

- Données manquantes ou bases nulles jamais converties en zéro ; mêmes unités,
  arrondis, dénominateurs et références nationales.
- Taux tous âges standardisés et taux par âge bruts ; urgences rapportées aux
  passages ; historiques du Baromètre séparés de 2024.
- Décès : exclusion des comparaisons lorsque moins de dix décès sont présents
  à l’une des deux dates, sans effacer les valeurs disponibles des courbes.
- Ruptures de codage et périmètres des urgences respectés ; aucune évolution
  nationale calculée sur un périmètre variable.
- Même synchronisation entre scroll, étapes, boutons, listes et filtres ; mêmes
  ancres, sélections, survols et comportements clavier des infobulles.
- Respect de la réduction des mouvements, responsive, contraste, accès aux
  sources et au 3114 ; portraits symboliques sans encodage quantitatif.
- Nettoyage des listeners, observers et animations ; arrêt des animations
  concernées hors écran ; absence de dépendance à un service distant ajouté.

Ne pas modifier une règle statistique sous couvert de refactorisation. Si un bug
est découvert, l’expliquer et traiter sa correction comme une différence
fonctionnelle explicite.

## Vérifier et livrer

`npm test` vérifie les calculs et invariants avec le runner natif de Node.
Le projet ne déclare pas de script `lint`.
`npm run build` vérifie TypeScript puis construit avec Vite. Les exécuter après
les changements applicatifs, ainsi que `git diff --check`. Ne pas prétendre
qu’un build valide les interactions ou l’égalité des résultats statistiques.

Adapter la vérification aux responsabilités modifiées : comparer les résultats
avant/après pour les calculs extraits et tester les cas limites affectés ; pour
les vues, vérifier dans le navigateur les parcours, survols, filtres, clavier,
mobile et réduction des mouvements concernés. Ajouter des tests de
caractérisation utiles lorsque la logique ou le risque le justifie, sans créer
une infrastructure entière pour un simple déplacement de code.

Si le pipeline de données change, régénérer et comparer les sorties à la
référence ; expliquer toute différence. `analysis/validation-finale.json`
documente des contrôles historiques et ne prouve pas la validité d’une nouvelle
version. Ne pas régénérer le pitch ni la remise GitLab pour une refactorisation.

Restituer en français : résumé de l’architecture et du flux, problèmes et
recommandations priorisés, changements réalisés avec liens vers les fichiers,
vérifications effectivement exécutées et limites restantes. Si la demande porte
uniquement sur un audit, livrer le diagnostic sans modifier l’application.
