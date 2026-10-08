# Quand la souffrance devient visible

Une proposition de **Manuel Reismann** pour le défi santé mentale de l’Odissé Dataviz Challenge 2026.

Contact : ecrire@m4nu.net · [Visualisation en ligne](https://odisse-sante-mentale.vercel.app) · [Code source public](https://github.com/m4nR3is/odisse-sante-mentale)

**Question :** que montrent les données de santé mentale selon qu’on regarde les
 enquêtes, les urgences, les hospitalisations ou les décès ? Chaque source éclaire
 une dimension différente, avec sa population et son dénominateur.

## Parcours

Une ouverture automatique de 1,7 seconde part du noir : le contour de Santé
mentale se trace puis se remplit, pendant que la navigation, les liens et le
trait horizontal se révèlent en parallèle. Elle cède immédiatement la place
au scroll ou au clavier et respecte la réduction des mouvements.

L’accueil se construit ensuite au scroll : Santé mentale, Recours aux soins et Inégalités
arrivent depuis le centre, à très grande taille, puis rejoignent leur place.
Le titre et la question apparaissent à leur tour. La séquence est réversible,
peut être passée et affiche immédiatement sa composition finale avec la
préférence de réduction des mouvements.

À droite du titre, un portrait original dessiné en SVG se construit au scroll
à travers quatre cadres indépendants : Déclaré, Urgences, Hôpital et Décès.
Cinquante portraits aux coiffures, contours et traits variés composent une
combinaison aléatoire à chaque chargement. Leurs yeux et leurs bouches ont des
formes différentes mais des repères fixes. Au survol, seul le quart concerné
change toutes les 140 ms, avec un fondu de 60 ms et une légère attraction vers
le pointeur. Sans survol, un quart choisi au hasard reçoit un nouveau visage
toutes les 500 ms, uniquement lorsque l’illustration est visible. Le clic ou la touche
Entrée rejoint directement la vue correspondante d’Explorer. La réduction des
mouvements désactive le défilement et l’attraction. Cette illustration est
symbolique : elle n’encode pas de données et ne représente pas un parcours
individuel de soins. Elle utilise uniquement les tons d’encre, de papier et
les touches rouges du site, sans image, police ou service externe.

Un récit de cinq scènes au scroll ouvre la lecture : taux national de patients
hospitalisés (+4 %), femmes et hommes tous âges (+10,7 % / −6,2 %), trajectoire des filles de 11–14 ans (+93 %), comparaison aux
garçons du même âge (+7 %), puis gradient financier de dépression déclarée
(×3,1). Une visualisation persiste sur ordinateur ; sur mobile et tablette,
chaque preuve reste dans le flux. Les liens d’étapes permettent aussi de
naviguer au clavier. Le changement de taux standardisé national à taux brut
par âge et sexe, et le changement d’échelle verticale, sont explicités.
Les chiffres sont calculés depuis les données livrées.

Des annotations dessinées soulignent les valeurs du récit et
sont visibles par défaut sur les graphiques principaux d’Explorer. Dans les distributions,
la sélection est indiquée par la couleur et la taille du point, sans contour ni annotation.
Leurs points d’ancrage restent fixes au survol ; ils s’adaptent à la sélection
et aux filtres. Les liaisons portent
sur des valeurs de la même année et de la même mesure ; elles ne constituent
pas un test de significativité. Les comparaisons exclues restent sans liaison.

L’explorateur propose ensuite quatre regards dans un module persistant.
La carte d’Explorer représente en gris les évolutions comparables de la frise. Les bornes, la période et l’unité figurent sous la carte ; l’échelle est recalculée à chaque vue ou filtre. Les évolutions indisponibles ou non interprétables sont hachurées. La sélection orange et le contour noir au survol suivent le code graphique des autres visualisations. Le territoire survolé est dessiné au premier plan. Les encarts ultramarins passent en bas lorsque cela permet d’agrandir la France hexagonale ; leur disposition reste stable pendant le survol.

Les vues territoriales démarrent sur la référence nationale, sans département présélectionné. Une carte permanente partage la colonne des filtres et du chiffre ; la frise prend la largeur du graphique. Le survol de la carte ou de la distribution révèle un territoire ; un clic ou le menu le sélectionne. Aux urgences, la vue nationale présente le niveau de 2024, sans calculer une évolution sur le périmètre variable. Le
scroll traverse dix étapes : les trois indicateurs de 2024, les trois
indicateurs historiques, les urgences, les séjours hospitaliers, les profils
âge × sexe puis les décès. Les boutons et les listes d’indicateurs rejoignent
les mêmes étapes. Les filtres restent utilisables dans chaque vue. Les
changements se synchronisent dans les deux sens, sur ordinateur et mobile.

Les quatre regards :

- **Déclaré** : gradient financier du Baromètre 2024 et séries historiques
  nationales et régionales 2005–2021, présentées séparément. La référence France apparaît par défaut ; le survol d’une région révèle sa courbe.
- **Urgences** : part des passages pour gestes auto-infligés dans l’activité des
  urgences, par département et avec une référence France, 2020–2024.
- **Hôpital** : séjours départementaux 2019–2024 ; patients hospitalisés selon
  seize profils d’âge et de sexe, avec comparaison à l’autre sexe au même âge.
- **Décès** : taux de décès par suicide 2019–2023 ; variations exprimées en
  points de taux pour 100 000 habitants.

Une conclusion après « Interpréter » referme le récit : « Un chiffre national / Des réalités différentes ». Deux phrases rappellent les différences entre populations, territoires et sources, puis les liens permettent de revenir aux données ou de consulter les sources. Les ancres `#conclusion` et `#sources` suivent le scroll sans ajouter d’entrée au menu.

La rubrique Méthode devient un parcours au scroll en quatre gestes :
Distinguer, Rapporter, Comparer et Interpréter. Un panneau persistant révèle
les règles, avec des liens d’étapes utilisables au clavier ; les sources
restent directement consultables à la suite.

Ces sources ne décrivent pas les étapes d’un parcours individuel. Une association
sociale ne démontre pas une cause des hospitalisations. Les données de recours
aux soins reflètent aussi l’accès, l’offre et le codage.

## Lancer et construire

Node.js 22.x (22.23.2 dans `.nvmrc` et `.node-version`) et npm (un fichier package-lock.json est fourni).

```bash
npm ci
npm run dev
npm run build
npm run preview
```

`dist/` est un site statique déployable sur un hébergement avec HTTPS. Aucun
compte, CMS, backend, service de cartographie, police distante ou outil de suivi
n’est nécessaire. Les données sont chargées depuis un fichier JSON local au site, séparé du code
de l’interface. Un état de chargement et un bouton de reprise traitent un échec
de lecture. Les visualisations utilisent React et SVG ; les animations
respectent la préférence de réduction des mouvements.

## Données et méthode

Les 14 jeux Odissé sont reliés dans la section Méthode et les fiches « ? ».
Le registre `public/data/sources.json` relie chaque jeu aux exports utilisés,
avec leurs empreintes SHA-256 et le script de transformation. Les données
DREES des anciennes explorations et les contours géographiques non utilisés
sont exclus du fichier web publié. Les nouveaux contours IGN / INSEE 2018, via France GeoJSON, sont documentés dans le registre et utilisés pour la sélection géographique et la représentation des évolutions comparables. Les taux tous âges des patients, séjours et décès sont standardisés ; les taux
par âge sont bruts. Les urgences sont rapportées aux passages, pas à la population.
Les références nationales par classes d’âge regroupées sont recalculées à partir
des effectifs et populations reconstituées depuis les taux diffusés : elles sont
approximatives lorsque les sources arrondissent les effectifs et les taux.

Pour les décès, notre règle de prudence exclut des comparaisons les départements
avec moins de 10 décès à l’une des deux dates. Ce seuil de conception ne constitue
pas un test de significativité. Les valeurs disponibles restent visibles dans la
courbe. Les données absentes et les bases nulles ne sont pas transformées en zéro.
Les graphiques historiques du Baromètre ne sont pas raccordés à 2024.

La chronologie des urgences numérisée depuis des bulletins a été retirée du rendu
final, faute de traçabilité suffisante. L’ancien récit DREES de rupture temporelle
reste dans les archives analytiques ; il ne constitue pas le parcours publié.

Depuis ce dossier, la préparation complète est reproductible avec :

```bash
python3 scripts/build_geography.py
python3 scripts/build_web_data.py
```

Les scripts, exports source utilisés et résultats analytiques sont inclus dans
ce dépôt : `scripts/`, `data/raw/` et `analysis/`. Les sources brutes ne sont pas
servies dans le site de production. Les analyses de l’ancien récit sont
conservées comme archives, distinctes de la proposition actuelle.

## Fichiers utiles

- `app/Experience.tsx` : récit, interactions, graphiques et règles de comparaison.
- `app/site.css` : mises en page, animations, responsive et navigation clavier.
- `app/visual-system.css` : hiérarchie typographique et couleurs communes aux rubriques, graphiques, légendes et infobulles.
- `app/useChartTypography.ts` : tailles des textes, points et zones de survol en pixels écran, indépendantes de l’échelle des SVG.
- `app/useChartInteractions.ts` : réponse commune au survol et au focus clavier ; clic ou Entrée/Espace sur un point de valeur conserve sa précision, Échap ou clic ailleurs la ferme. Les clics sur la carte et les distributions conservent leur fonction de sélection. Les annotations ne suivent pas le survol.
- `app/IntroPortrait.tsx`, `app/PortraitVariants.tsx`, `app/PortraitStyles.ts`,
  `app/FacialFeatures.tsx` : illustration SVG, 50 portraits et interactions.
- `public/data/experience-data.json` : données préparées et livrées localement.
- `src/main.tsx` : entrée React.
- `analysis/PROPOSITION_FINALE.md` : proposition et trame du pitch.

## Point de sauvegarde

Commit **9f80cda** : état de l’application avant la passe finale du 8 octobre.
Les analyses, scripts et données de cet état sont aussi conservés dans
`../tmp/odisse-analysis-checkpoint-20261008.tar.gz`.

## Validation de la version finale

Build TypeScript/Vite réussi. La version compilée a été servie comme un site
statique et contrôlée avec Chrome : 54 combinaisons de mesure/âge/sexe, cas de
faible effectif, sélection de DOM et petits départements, actions guidées,
interactions clavier, reprise après échec de chargement et transitions animées.
Captures relues sur ordinateur et mobile (390 px), sans débordement horizontal
dans les vues testées. La régénération du fichier de données est identique
octet par octet. Résultats : `analysis/validation-finale.json`.

L’explorateur adapte sa hauteur à l’espace disponible sous la navigation,
sur ordinateur et mobile. Les filtres et les graphiques changent de disposition
sur les fenêtres basses. Sur mobile, les gradients déclarés prennent la forme
de lignes de valeurs animées ; les séries temporelles conservent leurs courbes.

Le récit conserve le même SVG sur ordinateur : le tracé précédent se retire
avant le dessin du suivant. À âge égal, la courbe des filles reste en place
pendant l’ajout ou le retrait de celle des garçons. Les animations sont
interruptibles et respectent la préférence de réduction des mouvements.

La navigation reste visible pendant la lecture. La rubrique active porte un
trait de progression lié au scroll, dans les deux sens, comme sur le portfolio.
Les ancres, le graphique persistant et l’explorateur tiennent compte de sa
hauteur, sur ordinateur et mobile.

## Publication et licences

`docs/DEPOT_GITLAB.md` suit le template officiel de remise. `docs/PUBLICATION.md`
décrit le dépôt et l’hébergement. `vercel.json` prépare Vercel ; `.gitlab-ci.yml`
permet une construction dans un dépôt GitLab personnel et une publication Pages
manuelle. Les chemins relatifs permettent l’hébergement à la racine ou dans un
sous-dossier. Le dépôt officiel du challenge reçoit le dossier de remise ; il
n’a pas besoin de ces configurations à sa racine.

Code : MIT (`LICENSE`). Textes et visuels originaux : CC-BY 4.0. Données Odissé :
Licence Ouverte 2.0. Voir `LICENSES.md` et les notices distribuées avec le site.

Le code source est publié sur GitHub et la visualisation sur Vercel :
https://odisse-sante-mentale.vercel.app. L’accès sans connexion et le chargement
des données ont été vérifiés sur ordinateur et mobile. La remise sur le dépôt
GitLab officiel est publiée dans `Défi 1 - Santé mentale/defi-1_Manuel_Reismann/`.


La vue « Inégalités sociales · 2024 » conserve la France par défaut. Une carte permanente permet de comparer les quatre situations financières dans une région avec la référence nationale : survol pour l’aperçu, clic pour conserver la région, clic sur le fond ou touche Échap pour revenir à France. Les gris représentent la prévalence régionale tous profils confondus, issue des trois jeux Odissé 2024. Les gradients régionaux proviennent des tableaux Ensemble des 17 rapports officiels de Santé publique France, avec leurs IC à 95 %, numéros de page et liens PDF. Le registre `production/data/sources.json` (ou `public/data/sources.json` dans le code source) documente ces rapports et les empreintes des PDF.

Une cellule d’anxiété « à l’aise » en Guadeloupe n’est pas diffusée : elle n’est ni remplacée par zéro ni utilisée pour calculer le rapport financier. Pour l’Occitanie, la dépression « en difficulté » utilise le tableau 1, page 56, à 28,5 %, et non le résumé contradictoire à 28,8 %. Les écarts ne démontrent ni causalité ni significativité statistique.

Reproduction des tableaux régionaux : `python3 scripts/fetch_regional_reports.py`, puis (avec PyMuPDF installé) `python scripts/extract_regional_social.py`, puis `python3 scripts/build_web_data.py`. Les PDF restent dans `../tmp/pdfs/barometre-regional/` ; le fichier brut extrait conserve les lignes sources, les pages et les empreintes.

La grammaire visuelle est commune à tout le parcours : titres et chiffres en sans serif, légendes et métadonnées en monospace, palette limitée au papier, à l’encre, aux gris et à l’orange. France est un repère gris, la sélection territoriale est orange et l’aperçu noir. Les courbes de comparaison utilisent des pointillés ; les intervalles de confiance restent des segments. Les petits boutons de précisions se trouvent sous les modules. La carte n’a plus de barre d’outils : clic sur le fond ou touche Échap pour retrouver France.

Les contrôles de l’illustration couvrent six tailles de fenêtre, le cycle des
50 variantes, le survol isolé, les quatre destinations, le clavier et la
réduction des mouvements. Les contours bleus natifs ont été remplacés par
les repères de la palette du site. Voir `analysis/validation-intro-portraits.json`.
