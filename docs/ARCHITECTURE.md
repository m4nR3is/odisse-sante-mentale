# Lire et maintenir l’application

Le projet est un site statique React / TypeScript construit par Vite. Les
visualisations sont dessinées en SVG. Le pipeline Python prépare les données
avant publication ; aucun backend n’est nécessaire à la lecture du site.

## Parcours de lecture

1. `src/main.tsx` : chargement du JSON, annulation au démontage, attente et reprise
   après échec. Le contrat chargé est défini dans `app/data/experienceTypes.ts`.
2. `app/Experience.tsx` : assemblage du parcours, introduction automatique et
   communication entre le récit et l’explorateur.
3. `app/sections/` : introduction, récit guidé, méthode et conclusion.
4. `app/explorer/explorerSteps.ts` : les dix étapes communes au scroll et aux
   commandes ; `TerritoryExplorer.tsx` assemble les panneaux et
   `DeclaredExplorer.tsx` choisit entre les deux familles d’enquêtes déclarées.
   Le pilotage des états est dans leurs hooks dédiés, décrits ci-dessous.
5. `app/data/territoryMetrics.ts` : sélection des séries et calcul des évolutions
   départementales, nationales et par profil. Ces fonctions sont indépendantes
   de React ; les unités et conditions de comparaison sont visibles ici.
6. `app/charts/` : formatage français, tracés avec interruptions temporelles,
   placement des distributions et interpolation des valeurs affichées.

Les portraits, aides, cartes, annotations et infobulles restent dans leurs
modules dédiés à la racine d’`app/`. `app/navigation/ReadingNavigation.tsx`
synchronise les ancres avec le scroll. `app/sections/introTypography.tsx`
partage la composition des lignes et les trajectoires entre l’ouverture et la
conclusion. `app/animation/progress.ts` exprime une progression bornée.

Les anciennes vues éditoriales et leurs contrats DREES sont conservés dans
`app/archive/`, sans import dans le parcours actif. Ce dossier n’est pas un
second point d’entrée de l’application.

## Lire l’explorateur après la deuxième passe

Les composants d’assemblage décrivent le parcours visuel ; les hooks conservent
les états et produisent les contrats de chaque panneau. Un contrat ne transmet
que les valeurs, références DOM et actions nécessaires au panneau concerné.
Les types des sorties sont inférés depuis le hook, sans recopier la définition
des séries ni utiliser `any`. Les entrées communes sont explicites dans
`app/explorer/explorerTypes.ts`.

| Responsabilité | Pilotage | Rendu |
| --- | --- | --- |
| Navigation des dix étapes | `useExplorerScrollNavigation` | `ExplorerNavigation` et les repères de `TerritoryExplorer` |
| Territoires et profils hospitaliers | `useTerritoryExplorer` | `TerritorySelectionPanel`, `TerritoryTimeSeriesChart`, `TerritoryDistributionChart` |
| Filtres, carte et chiffre territorial | Contrats `selection.filters`, `selection.map`, `selection.metric` | `TerritoryFilters`, `TerritorySelectionMap`, `TerritoryMetric` |
| Gradient financier de 2024 | `useSocialDeclaredView` | `SocialDeclaredControls`, `SocialGradientChart`, assemblés par `SocialDeclaredView` |
| Séries déclarées 2005–2021 | `useHistoricalDeclaredView` | `HistoricalDeclaredControls`, `HistoricalDeclaredChart`, `HistoricalDeclaredDistribution`, assemblés par `HistoricalDeclaredView` |

Les hooks restent appelés par les mêmes vues qu’avant la séparation : une
extraction du rendu ne déplace pas la source de vérité des sélections dans un
graphique. Les courbes et distributions reçoivent les mêmes actions de survol
et de sélection. Les références SVG restent détenues par le hook et sont
attachées au SVG rendu par le composant enfant ; les mesures s’effectuent
toujours après le montage, avec le même nettoyage des observers.

Les trois mesures conservent leurs rendus propres. Les intervalles de confiance
du Baromètre, les ruptures temporelles des historiques et les changements de
périmètre des urgences ne passent pas par un composant générique qui masquerait
leurs différences. Les règles de dimensions SVG restent spécifiques à chaque
vue : unités écran, unités du viewBox et seuils de mise à jour diffèrent.

## Flux des données et des interactions

```text
data/raw/ → scripts Python → public/data/experience-data.json
                                       ↓ fetch
                                  src/main.tsx
                                       ↓ initialData
                                app/Experience.tsx
                                  ↙           ↘
                              récit       explorateur
                                ↓              ↓
                       navigation guidée   filtres / sélection
                                               ↓
                                  fonctions de app/data/
                                               ↓
                                  animations et rendu SVG
```

`scripts/build_geography.py` produit `public/data/geography.json`, chargé par
`TerritoryMap`. `scripts/source_registry.py` documente les sources dans
`public/data/sources.json`. Les données brutes ne sont pas servies au navigateur.

La sélection d’une étape au scroll pilote la famille de mesure et remet les
états transitoires du graphique à leur valeur prévue. Les boutons et listes
rejoignent les mêmes repères de scroll. Les filtres âge/sexe et la sélection
territoriale restent locaux à l’explorateur. Un survol est un aperçu distinct
de la sélection. Le récit demande une navigation via `GuidedView`, avec une
révision pour répéter une action vers la même destination.

Les calculs produisent les valeurs cibles ; les hooks des graphiques produisent
des valeurs intermédiaires pour l’animation. Ne pas utiliser ces valeurs
intermédiaires comme nouvelles observations ou références statistiques.

## Règles à préserver

Les décès évoluent en points de taux ; les hospitalisations et urgences en
pourcentage relatif lorsque la comparaison est possible. Les décès
départementaux nécessitent au moins dix décès à chacune des deux dates pour
comparer une évolution : la courbe disponible demeure visible.

Les départements concernés par une rupture de codage des urgences excluent les
années à partir de 2022. La référence nationale des urgences conserve son
niveau, sans évolution sur un périmètre variable. Les historiques déclarés
2005–2021 ne sont pas raccordés au Baromètre 2024.

Le repli historique d’`indexSeries` pour une base non positive est conservé et
caractérisé dans les tests. Le changer serait une correction fonctionnelle,
à traiter explicitement, et non une extraction de code.

## Diagnostic et suites recommandées

| Priorité | Constat | Suite recommandée |
| --- | --- | --- |
| Traité | Types, calculs, rendu, animations et archives étaient réunis dans `Experience.tsx`. | Maintenir les responsabilités désormais séparées. |
| Traité | Les règles territoriales étaient difficiles à vérifier sans lire le JSX. | Tester les fonctions de `territoryMetrics.ts` et conserver leurs invariants. |
| Traité | Le JSX compact et des noms comme `fmt` compliquaient la lecture. | Conserver une mise en forme régulière et des noms explicites. |
| Traité en deuxième passe | `TerritoryExplorer` et `DeclaredExplorer` concentraient plusieurs graphiques et la logique d’interaction. | Les commandes, cartes, chiffres, courbes et distributions sont séparés ; les hooks pilotent les états communs à une vue. |
| Prochaine passe | `useTerritoryExplorer` réunit encore les filtres, la géométrie et les animations de plusieurs panneaux. | Identifier des sous-ensembles cohérents avant d’extraire davantage de calculs ou de hooks, sans déplacer les sélections. |
| Prochaine passe | Plusieurs sections mesurent des repères au scroll et des tailles SVG. | Comparer leurs contrats avant d’extraire un hook partagé ; les seuils et délais actuels diffèrent. |
| À mesurer | La distribution résout les collisions par plusieurs centaines de passes sur les paires de points. | Profiler ses déclenchements et son coût avant d’optimiser le placement. |
| À mesurer | Le survol et le scroll peuvent entraîner des recalculs et des rendus de grandes vues. | Mesurer les composants concernés avant de mémoriser ou déplacer leurs états. |

La séparation de modules améliore la lecture et la vérification. Elle ne
constitue pas à elle seule une optimisation de performance.

## Vérifications reproductibles

```bash
npm test
npm run build
git diff --check
```

Les tests utilisent le runner natif de Node et le compilateur TypeScript déjà
présent ; ils couvrent les règles de comparaison, les filtres, l’absence de
mutation, les formats, les ruptures des tracés, l’indexation et les collisions.
Le build vérifie tous les modules de l’application, y compris les archives.

Pour les changements d’interface, compléter avec des contrôles dans le
navigateur : dix étapes dans les deux sens, filtres, survol, clavier, mobile,
réduction des mouvements et reprise après un échec de chargement. Les contrôles
de la version finale du challenge sont historiques, pas une validation des
changements ultérieurs.

La remise GitLab est close. Les futures publications du code vont sur GitHub ;
le site conserve son hébergement Vercel tant qu’aucune migration n’est demandée.

Le compte rendu de cette première passe, datée du 9 octobre 2026, est conservé
dans `analysis/validation-refactorisation.json` : 11 tests réussis, égalité des
calculs avec la référence et contrôles navigateur avant/après sur ordinateur et
mobile. Ces résultats décrivent cette passe, pas les modifications futures.

La deuxième passe est documentée dans
`analysis/validation-refactorisation-passe-2.json`, avec le commit `27f1f74`
comme référence : 11 tests réussis, comparaison des dix étapes dans les deux
sens et de 14 scénarios d’interaction sur ordinateur et mobile. Les captures
mobiles sont identiques ; les captures ordinateur ne présentent que de légères
variations d’anticrénelage. Le rapport inclut les tailles du JavaScript avant et
après ; cette séparation vise la lisibilité, sans gain de performance revendiqué.
