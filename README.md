# Quand la souffrance devient visible

Une proposition pour le défi santé mentale de l’Odissé Dataviz Challenge 2026.

**Question :** que montrent les données de santé mentale selon qu’on regarde les
 enquêtes, les urgences, les hospitalisations ou les décès ? Chaque source éclaire
 une dimension différente, avec sa population et son dénominateur.

## Parcours

Un récit de quatre scènes au scroll ouvre la lecture : taux national de patients
hospitalisés (+4 %), trajectoire des filles de 11–14 ans (+93 %), comparaison aux
garçons du même âge (+7 %), puis gradient financier de dépression déclarée
(×3,1). Une visualisation persiste sur ordinateur ; sur mobile et tablette,
chaque preuve reste dans le flux. Les liens d’étapes permettent aussi de
naviguer au clavier. Le changement de taux standardisé national à taux brut
par âge et sexe, et le changement d’échelle verticale, sont explicités.
Les chiffres sont calculés depuis les données livrées.

L’explorateur propose ensuite quatre regards :

- **Déclaré** : gradient financier du Baromètre 2024 et séries historiques
  régionales 2005–2021, présentées séparément.
- **Urgences** : part des passages pour gestes auto-infligés dans l’activité des
  urgences, par département et avec une référence France, 2020–2024.
- **Hôpital** : séjours départementaux 2019–2024 ; patients hospitalisés selon
  seize profils d’âge et de sexe, avec comparaison à l’autre sexe au même âge.
- **Décès** : taux de décès par suicide 2019–2023 ; variations exprimées en
  points de taux pour 100 000 habitants.

Ces sources ne décrivent pas les étapes d’un parcours individuel. Une association
sociale ne démontre pas une cause des hospitalisations. Les données de recours
aux soins reflètent aussi l’accès, l’offre et le codage.

## Lancer et construire

Node.js >= 20.19.0 et npm (un fichier package-lock.json est fourni).

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

Les liens vers les jeux Odissé figurent dans chaque preuve et dans la section
Méthode. Les taux tous âges des patients, séjours et décès sont standardisés ; les taux
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
python3 scripts/analyze_mental_health_story.py
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

La publication, les URL de remise et le report dans le template officiel restent
à réaliser. Le dépôt local ne possède pas encore de dépôt distant configuré.
