# Lire et maintenir l’application

Le projet est un site statique React / TypeScript construit par Vite. Les
visualisations sont dessinées en SVG. Le pipeline Python prépare les données
avant publication ; aucun backend n’est nécessaire à la lecture du site.

## Parcours de lecture

1. `src/main.tsx` : chargement du JSON, annulation au démontage, attente et reprise
   après échec. Le contrat chargé est défini dans `app/data/experienceTypes.ts`.
2. `app/Experience.tsx` : assemblage du parcours et communication entre le récit
   et l’explorateur. `animation/useExperienceEntrance.ts` pilote la séquence
   d’entrée ; `HelpSection` et `SiteFooter` rendent l’aide et les crédits.
3. `app/sections/` : introduction, récit guidé, méthode et conclusion.
4. `app/explorer/explorerSteps.ts` : les dix étapes nommées, leurs destinations
   et plages de progression communes au scroll et aux commandes ; `TerritoryExplorer.tsx` assemble les panneaux et
   `DeclaredExplorer.tsx` choisit entre les deux familles d’enquêtes déclarées.
   Le pilotage des états est dans leurs hooks dédiés, décrits ci-dessous.
5. `app/data/territoryMetrics.ts` : sélection des séries et calcul des évolutions
   départementales, nationales et par profil. Ces fonctions sont indépendantes
   de React ; les unités et conditions de comparaison sont visibles ici.
6. `app/charts/` : formatage français, tracés avec interruptions temporelles,
   placement des distributions et interpolation des valeurs affichées.

La racine d’`app/` contient uniquement `Experience.tsx`, qui assemble le parcours.
Les portraits sont dans `portraits/`, les cartes dans `maps/`, l’infobulle
commune dans `components/` et les annotations/hooks dans `charts/`.
`charts/help/` sépare le dialogue React des explications méthodologiques pures. `app/navigation/ReadingNavigation.tsx`
synchronise les ancres avec le scroll. `app/sections/introTypography.tsx`
partage la composition des lignes et les trajectoires entre l’ouverture et la
conclusion. `app/animation/progress.ts` exprime une progression bornée.

Les anciennes vues éditoriales et leurs contrats DREES sont conservés dans
`app/archive/`, sans import dans le parcours actif. Ce dossier n’est pas un
second point d’entrée de l’application. Leur feuille `archivedStyles.css` reste
avec ces vues et n’est pas importée par le site publié.

## Lire l’explorateur

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

## Lire le récit et les calculs

`GuidedStory.tsx` assemble les cinq articles et la figure persistante. Il passe
une seule préparation à toutes les figures, sur ordinateur et mobile : les
textes, chiffres et courbes viennent des mêmes populations triées.

| Responsabilité | Module |
| --- | --- |
| Préparer les séries, chiffres et textes des cinq scènes | `sections/story/buildStoryScenes.ts` — fonction pure |
| Choisir la scène et sa progression au scroll, dans les deux sens | `sections/story/useStoryScroll.ts` |
| Effacer et révéler les courbes et le gradient | `sections/story/useStoryDrawing.ts` |
| Mesurer la figure et piloter ses infobulles | `sections/story/useStoryFigure.ts` |
| Assembler SVG, masques, légende, annotations, source et aide | `sections/story/StoryFigure.tsx` |
| Dessiner les courbes hospitalières | `sections/story/StoryHospitalChart.tsx` |
| Dessiner le gradient financier et ses intervalles | `sections/story/StorySocialChart.tsx` |
| Révéler le chiffre d’un article | `sections/story/StoryNumber.tsx` |

La scène affichée est celle de l’animation, qui peut être différente de la scène
cible durant l’effacement. Les scènes 2 et 3 gardent la courbe des filles : seule
la comparaison des garçons est ajoutée ou retirée. Les plafonds 150 et 500 sont
conservés, ainsi que les durées, masques, seuils d’entrée et réduction des
mouvements. Les composants SVG extraits ne rajoutent pas de conteneurs DOM.

Les fonctions de `data/comparisons.ts` distinguent trois résultats :
`available`, `insufficient-count` et `unavailable` avec sa raison. Le seuil de
dix décès conserve la différence observée et la série tout en excluant la
comparaison. Le périmètre national variable des urgences produit une évolution
indisponible. Les propriétés `change` et `comparable` des panneaux sont dérivées
de ce résultat, pour préserver leurs contrats et leurs affichages.

`data/territorySelection.ts` choisit la référence (nationale ou sexe opposé au
même âge), les séries en niveau/base 100 et les observations aux deux dates.
L’écart de niveau est distinct de l’évolution temporelle : les urgences peuvent
montrer un niveau national de référence sans évolution nationale comparable.
Une absence reste `null` dans les calculs ; le zéro de repli n’intervient qu’à
l’entrée des animations et ne rend pas une comparaison disponible. Les entrées
non finies ou les profils sans base valide sont explicitement indisponibles ;
la totalité des résultats sur les données publiées est inchangée.

`charts/geometry.ts` calcule les positions sans React ni DOM. Chaque vue garde
ses dimensions : courbe territoriale à 260 unités, historique à 270, récit à
320 et gradient en pixels écran. La distribution partage seulement la projection
horizontale ; ses seuils minimaux restent explicitement 0,001 et 0,01 selon la
vue. `useTerritoryChartSize` conserve les mesures DOM et leur nettoyage ;
`useTerritoryExplorer` conserve les sélections, interactions et animations.

## Assemblage, navigation et cartes

`Experience.tsx` contient le parcours dans son ordre de lecture et conserve
l’état de navigation guidée. L’effet de la séquence d’entrée est dans
`animation/useExperienceEntrance.ts`, avec ses mêmes conditions de sortie,
durée et nettoyage. `HelpSection` et `SiteFooter` gardent leurs liens, textes et
balises ; leur extraction n’ajoute pas de conteneur DOM.

Les identifiants des dix étapes sont définis dans `explorerSteps.ts`. Les
commandes résolvent leur destination par identifiant, et les progressions
utilisent les plages des familles de mesure et des vues déclarées. Il ne faut
plus recopier des indices numériques dans un bouton ou un contrôleur. Les
familles restent groupées dans l’ordre de scroll ; les ancres publiques
`explorer-step-1` à `explorer-step-10` sont conservées. Les tests caractérisent
les destinations et plages de la version publiée.

La carte est organisée en trois responsabilités :

| Responsabilité | Module |
| --- | --- |
| Contrats des contours, échelle de gris, formatage et disposition des encarts | `maps/mapModel.ts` — fonctions pures |
| Chargement partagé des contours, attente et échec | `maps/useGeography.ts` |
| Rendu SVG, sélection, survol, clavier et mesure du viewport | `maps/TerritoryMap.tsx` |

Le chargement garde une seule promesse partagée, y compris en cas d’échec. Le
démontage d’une carte ignore son résultat sans annuler la requête des autres.
Il n’ajoute pas de nouvelle tentative ; les menus restent utilisables en cas
d’échec, comme dans la version publiée. Les transformations des encarts sont
comparées à une empreinte extraite du commit `51ce211` dans
`tests/fixtures/refactor-pass5-map.json`. L’échelle de gris reste propre aux
valeurs finies de la vue, avec hachures pour les absences et gris moyen pour
un domaine constant. La marge de 4 % du choix de disposition est conservée.

## Organisation des styles

`src/main.tsx` importe uniquement `app/styles/index.css`. Ce fichier rend
l’ordre des feuilles visible. Vite produit toujours une seule feuille CSS pour
le site, sans chargement de styles au moment des interactions.

| Groupe | Fichiers dans `app/styles/` |
| --- | --- |
| Valeurs partagées et fondations | `tokens.css`, `base.css` |
| Navigation et ouverture | `navigation.css`, `intro.css`, `portraits.css` |
| Récit et exploration | `story.css`, `explorer.css`, `declared.css`, `maps.css` |
| Méthode et conclusion | `method.css`, `conclusion.css` |
| Éléments communs | `annotations.css`, `chart-help.css`, `tooltips.css`, `shared-controls.css` |
| Focus clavier et grammaire visuelle finale | `accessibility.css`, `visual-system.css` |

Les media queries restent avec les règles de leur responsabilité, plutôt que
dans un fichier responsive séparé. Les tokens de base précèdent leurs variantes
responsive. Neuf déclarations de tokens qui étaient systématiquement masquées
par des définitions ultérieures ont été retirées ; les valeurs effectives sont
conservées. Les règles identiques adjacentes peuvent être réunies sans déplacer
leurs déclarations à travers d’autres règles.

La grammaire visuelle est chargée après les dispositions : elle fixe les rôles
typographiques et couleurs communs, puis les conventions SVG corrigées par
`useChartTypography`. Les règles globales du focus doivent garder leur relation
avec les conventions des points de données et les dialogues rendus par portail.
La séparation ne crée ni CSS Modules ni couches `@layer`, qui modifieraient les
contrats de classes ou la priorité de la cascade.

Pour modifier un style, partir de la vue concernée, puis vérifier les valeurs
partagées et conventions finales si une déclaration paraît sans effet. Les
styles des anciennes vues sont conservés dans `app/archive/archivedStyles.css`
et exclus du chargement courant. Les sélecteurs ont été contrôlés dans les
parcours ordinateur/mobile ; aucun ne correspond aux vues actives.

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
`maps/useGeography.ts`. `scripts/source_registry.py` documente les sources dans
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
| Traité | `TerritoryExplorer` et `DeclaredExplorer` concentraient plusieurs graphiques et la logique d’interaction. | Les commandes, cartes, chiffres, courbes et distributions sont séparés ; les hooks pilotent les états communs à une vue. |
| Traité | `useTerritoryExplorer` mélangeait comparaisons, références, géométrie et effets. | Les calculs purs, règles typées, géométries et mesures SVG sont séparés ; le hook conserve les états et animations. |
| Traité | `GuidedStory` regroupait cinq scènes, préparation dupliquée, scroll, animations et deux rendus SVG. | Préparation commune et modules dédiés dans `sections/story/`, avec conservation de la courbe des filles. |
| Traité | Les contrôles navigateur étaient des scripts temporaires. | Suite Playwright dans `tests/browser/`, avec comparaison optionnelle entre deux builds. |
| Conservation justifiée | Plusieurs sections mesurent des repères au scroll et des tailles SVG. | Garder leurs contrats distincts : les seuils, dimensions et délais diffèrent. Le récit et l’explorateur ont leurs hooks propres. |
| Traité | Les modules partagés et le CSS accumulé étaient à la racine d’`app`. | Racine limitée à l’assemblage ; dossiers explicites et styles par responsabilité, avec contrôles de cascade. |
| Mesure initiale | La distribution résout les collisions par 340 passes sur les paires de points. | Coût médian local de 4,5–5,6 ms pour 94–101 territoires et 0,13–0,14 ms pour les seize profils ; profiler le rendu complet sur appareil cible avant une optimisation. |
| Traité | Les indices de navigation et plages de progression étaient recopiés dans les commandes. | Destinations nommées et plages dérivées des étapes dans `explorerSteps.ts`. |
| Traité | `TerritoryMap` mélangeait chargement, calculs de présentation et interactions. | Contrats et calculs purs dans `mapModel`, requête partagée dans `useGeography`, interactions dans le composant. |
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

Les tests de caractérisation comparent les 54 combinaisons publiées, les
références et les seize profils à une empreinte calculée depuis le commit
`cc7517e`. La fixture `tests/fixtures/refactor-pass3.json` contient aussi
l’empreinte des données et des cinq textes/chiffres du récit. Un changement des
données impose de revalider cette référence avant de mettre la fixture à jour.

Les tests navigateur utilisent Playwright et le runner natif de Node :

```bash
npx playwright install chromium
npm run test:browser
```

Le script reconstruit `dist/`, ouvre un serveur local sur un port libre et le
ferme après les tests. Il contrôle dix étapes dans les deux sens, 11 états
éditoriaux et 14 scénarios d’interaction sur ordinateur et mobile, les filtres,
le clavier et les infobulles. Le récit animé est échantillonné à chaque frame
pour vérifier que la courbe des filles reste dessinée pendant les transitions
2 ↔ 3 ; les cinq scènes, la réduction des mouvements en cours d’animation, la
navigation guidée et la reprise après échec sont aussi contrôlées.

La suite des styles ajoute six formats : 1440×1000, 1024×768, 1280×560,
768×1024, 390×844 et 390×600. Elle vérifie l’absence de débordement horizontal,
le dialogue d’aide, son focus clavier et la restauration du scroll après
fermeture. Avec `TEST_BASELINE_DIR`, elle compare les styles calculés de tous
les éléments visibles dans 21 états par format : cinq scènes, dix étapes,
quatre gestes méthodologiques, conclusion et dialogue.

Les portraits décoratifs sont déterministes dans les tests, y compris ceux
choisis avec `crypto.getRandomValues`. Les valeurs de transformation et de
progression interpolées sont exclues de la comparaison des styles ; les
animations restent couvertes séparément. Cette suite ne compare pas les
pseudo-éléments et ne remplace pas une vérification visuelle ponctuelle.

Les tests de carte ajoutent le retour à France par Échap et clic sur le fond,
les destinations des boutons, la requête géographique partagée et le maintien
des menus lorsque les contours échouent.

Options facultatives :

- `BROWSER_EXECUTABLE_PATH` : chemin du Chrome/Chromium déjà installé, pour
  éviter le téléchargement du navigateur Playwright.
- `TEST_BASELINE_DIR` : dossier `dist/` d’une version de référence. La suite
  rejoue les mêmes scénarios et compare textes, positions SVG, sélections et
  infobulles. Préparer ce build séparément avant de lancer les tests.
- `BROWSER_ARTIFACT_DIR` : dossier où sauvegarder six captures par largeur et
  par build, pour une inspection visuelle. La suite ne compare pas les pixels.

Exemple avec une référence déjà construite :

```bash
TEST_BASELINE_DIR=/tmp/odisse-reference/dist npm run test:browser
```

Les contrôles de la version finale du challenge sont historiques, pas une
validation des changements ultérieurs.

La remise GitLab est close. Les futures publications du code vont sur GitHub ;
le site conserve son hébergement Vercel tant qu’aucune migration n’est demandée.

La version `a1210ef` a été vérifiée avec 21 tests unitaires, 12 tests navigateur
et le build TypeScript/Vite. La comparaison à la version précédente couvre les
calculs, textes, tracés, sélections et styles sur six formats de fenêtre. Les
rapports datés sont conservés dans `analysis/validation-refactorisation*.json` ;
ils documentent les versions contrôlées et ne valident pas les changements
ultérieurs.

Le placement des distributions reste inchangé. Une mesure locale de sa fonction
pure donne un coût médian de 4,5–5,6 ms pour 94–101 territoires et de 0,13–0,14 ms
pour les seize profils, après chauffe et sur 30 échantillons par configuration.
Ces mesures sous Node ne couvrent ni les FPS ni le rendu React/SVG. Avant toute
optimisation, profiler le parcours complet sur l’appareil cible.
