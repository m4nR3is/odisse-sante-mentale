# Quand la souffrance devient visible

**Équipe :** Manuel Reismann
**Mail(s) de contact:** ecrire@m4nu.net
**Défi :** Défi 1 — Santé mentale

## Notre question

Que voit-on de la santé mentale selon qu’on regarde les enquêtes, les urgences, les hospitalisations ou les décès ? Et que masque un chiffre national quand on change d’âge, de sexe ou de territoire ?

## Notre visualisation

**Visualisation interactive :** https://odisse-sante-mentale.vercel.app

**Code source public :** https://github.com/m4nR3is/odisse-sante-mentale

Un récit au scroll révèle successivement le taux national de patients hospitalisés en MCO pour gestes auto-infligés, les évolutions opposées des femmes et des hommes tous âges confondus, les trajectoires des filles et des garçons de 11–14 ans, puis les écarts d’épisodes dépressifs caractérisés déclarés selon la situation financière perçue. Entre 2019 et 2024, le taux national standardisé augmente d’environ 4 % ; celui des femmes augmente de 10,7 % et celui des hommes diminue de 6,2 %. Le taux brut des filles de 11–14 ans augmente d’environ 93 % et celui des garçons du même âge de 7 %. Dans le Baromètre 2024, la prévalence déclarée va de 9,0 % chez les personnes se disant à l’aise financièrement à 28,3 % chez celles en difficulté.

L’explorateur prolonge cette lecture avec quatre regards : déclaré, urgences, hôpital et décès. Il permet de comparer les trajectoires à une référence France et de situer les territoires dans leur distribution. Les vues territoriales démarrent sur la référence nationale, sans département présélectionné. Une carte permanente partage la colonne des filtres et du chiffre ; la frise prend la largeur du graphique. Le survol de la carte ou de la distribution révèle un territoire ; un clic ou le menu le sélectionne. Aux urgences, la vue nationale présente le niveau de 2024, sans calculer une évolution sur le périmètre variable. Les séries historiques déclarées démarrent sur la France hexagonale ; le survol d’une région révèle sa courbe. Les infobulles donnent les valeurs, unités et intervalles de confiance disponibles. Un bouton « ? » près de chaque graphique précise la mesure, la population, le calcul, les limites et les sources de la vue active. Les accès directs aux rubriques et étapes arrivent immédiatement à destination, puis le contenu s’anime.

Les enquêtes 2024 concernent les adultes de 18–79 ans en France hors Mayotte ; les séries historiques les 18–75 ans en France hexagonale. Chaque source garde son dénominateur : prévalence déclarée, part de l’activité des urgences avec diagnostic renseigné ou taux pour 100 000 habitants. Ces regards ne décrivent pas un parcours individuel. Le Baromètre 2024 n’est pas raccordé aux séries 2005–2021 ; les associations sociales ne sont pas présentées comme des causes. Les intervalles de confiance incohérents dans la source sont signalés et ne sont pas dessinés. Pour les décès, les comparaisons excluent les départements comptant moins de 10 décès à l’une des deux dates, sans assimiler ce seuil à un test de significativité. Les urgences présentent une rupture de codage en PACA et Corse depuis 2022 et une extension de couverture à la Martinique en 2023 : les départements touchés ne sont pas comparés sur 2020–2024, et aucune évolution nationale n’est calculée sur ce périmètre variable. La référence nationale des décès chez les 0–17 ans n’est pas reconstruite à partir des taux proches de zéro des 0–10 ans ; les autres références regroupées restent des approximations à partir de valeurs arrondies. Les hospitalisations psychiatriques sont hors du champ MCO.

Le site est statique, adapté aux ordinateurs et mobiles, utilisable au clavier et respectueux de la préférence de réduction des mouvements. Les ressources d’aide sont accessibles dans l’expérience. Les données sont servies localement, sans outil de suivi ni service de cartographie externe.

Le site compilé est fourni directement dans `production/` (`index.html`, `assets/`, `data/` et notices de licence). Le code source complet, les exports et les scripts sont disponibles dans le dépôt GitHub public indiqué ci-dessus. La proposition est indépendante et n’a pas été produite ou validée par Santé publique France.

## Les données utilisées

| Source | Jeu de données | Lien |
|---|---|---|
| Santé publique France · Odissé | Épisodes dépressifs · Baromètre 2024 | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/episodes-depressif-indicateurs-du-barometre-2024/) |
| Santé publique France · Odissé | Trouble anxieux généralisé · Baromètre 2024 | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/trouble-anxieux-generalise-indicateurs-du-barometre-2024/) |
| Santé publique France · Odissé | Pensées suicidaires · Baromètre 2024 | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/conduites-sucidaires-indicateurs-du-barometre-2024/) |
| Santé publique France · Odissé | Épisodes dépressifs · régions · 2005–2021 | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_reg/) |
| Santé publique France · Odissé | Épisodes dépressifs · France hexagonale · 2005–2021 | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_fra/) |
| Santé publique France · Odissé | Pensées et tentatives · régions · 2005–2021 | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_reg/) |
| Santé publique France · Odissé | Pensées et tentatives · France hexagonale · 2005–2021 | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_fra/) |
| Santé publique France · Odissé | Séjours hospitaliers · départements | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-departement/) |
| Santé publique France · Odissé | Séjours hospitaliers · France | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-france/) |
| Santé publique France · Odissé | Patients hospitalisés · France | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-patients-hospitalises-france/) |
| Santé publique France · Odissé | Passages aux urgences · départements | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-departement/) |
| Santé publique France · Odissé | Passages aux urgences · France | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-france/) |
| Santé publique France · Odissé | Décès par suicide · départements | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-departement/) |
| Santé publique France · Odissé | Décès par suicide · France | [Jeu de données](https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-france/) |

Le registre `production/data/sources.json` relie les 14 jeux aux exports sources, à leurs empreintes SHA-256 et au script de transformation. Les séries nationales des Baromètres historiques complètent les séries régionales : exports `depression-historique-france.json` et `conduites-suicidaires-historique-france.json`, conservés dans `data/raw/odisse/` du code source. Les périodes utilisées sont 2005–2021 pour les enquêtes historiques, 2024 pour les gradients financiers, 2020–2024 pour les urgences, 2019–2024 pour les hospitalisations et 2019–2023 pour les décès. Les exports sources et scripts de transformation sont inclus dans le dépôt ; les explorations antérieures DREES sont identifiées comme archives et ne contribuent pas au récit publié.

Les contours de la carte permanente proviennent de [France GeoJSON / Grégoire David](https://github.com/gregoiredavid/france-geojson) : IGN / Admin Express COG et codes INSEE 2018, Licence Ouverte. Les deux exports, leur version source et leurs empreintes sont conservés dans le dépôt GitHub ; la transformation en tracés SVG est reproductible. La carte sert à choisir les territoires et représente en gris leur évolution comparable, avec la même période et le même calcul que la frise. Une légende précise l’unité et les bornes de l’échelle, recalculées pour chaque vue ; les valeurs non interprétables sont hachurées. Les encarts ultramarins sont hors échelle et placés en bas lorsque cette disposition agrandit la carte, sinon sur le côté ; les collectivités sans contour sont proposées par boutons. Les territoires sans données pour la vue active sont désactivés.

## Les outils employés

React 19, TypeScript, SVG et CSS pour l’interface et les visualisations ; Vite 8 pour la compilation ; Python pour préparer les données et reproduire les analyses ; Git pour le suivi du code. Chrome et Playwright ont servi aux contrôles des interactions, du responsive et de la version compilée. Codex a été utilisé comme assistant d’analyse, de développement et de rédaction ; les résultats ont été contrôlés à partir des sources et dans le navigateur.

Le dépôt contient les commandes de construction, les transformations, les règles méthodologiques et les rapports de validation.

## Licence

Code original : **MIT**. Textes et visuels originaux : **CC-BY 4.0**. Données Odissé : **Licence Ouverte 2.0**, avec attribution à Santé publique France et conservation des liens sources. Les dépendances et archives tierces conservent leurs licences propres. Les textes et notices figurent dans `LICENSE`, `LICENSES.md` et `public/LICENCES.txt` du dépôt source.
