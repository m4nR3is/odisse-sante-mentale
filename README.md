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

Un récit de cinq scènes au scroll ouvre la lecture : taux national de patients
hospitalisés (+4 %), femmes et hommes tous âges (+10,7 % / −6,2 %), trajectoire des filles de 11–14 ans (+93 %), comparaison aux
garçons du même âge (+7 %), puis gradient financier de dépression déclarée
(×3,1). Une visualisation persiste sur ordinateur ; sur mobile et tablette,
chaque preuve reste dans le flux. Les liens d’étapes permettent aussi de
naviguer au clavier. Le changement de taux standardisé national à taux brut
par âge et sexe, et le changement d’échelle verticale, sont explicités.
Les chiffres sont calculés depuis les données livrées.

L’explorateur propose ensuite quatre regards dans un module persistant. Le
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
sont exclus du fichier web publié. Les taux tous âges des patients, séjours et décès sont standardisés ; les taux
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
python3 scripts/build_web_data.py
```

Les scripts, exports source utilisés et résultats analytiques sont inclus dans
ce dépôt : `scripts/`, `data/raw/` et `analysis/`. Les sources brutes ne sont pas
servies dans le site de production. Les analyses de l’ancien récit sont
conservées comme archives, distinctes de la proposition actuelle.

## Fichiers utiles

- `app/Experience.tsx` : récit, interactions, graphiques et règles de comparaison.
- `app/site.css` : identité graphique, responsive et navigation clavier.
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
GitLab officiel reste à effectuer.
