# Quand la souffrance devient visible

Version de travail finalisée le 8 octobre 2026. Défi principal : santé mentale.
Ce document décrit l’expérience actuelle ; le storyboard analytique antérieur
reste une archive de la piste centrée sur la rupture temporelle.

## Problématique et proposition

Que montrent les données de santé mentale selon qu’on regarde les enquêtes,
les urgences, les hospitalisations ou les décès ?

Chaque source éclaire une dimension différente. Aucune ne suffit à dresser un
portrait exhaustif. L’expérience associe deux observations guidées à un
explorateur permettant de changer de mesure tout en conservant les définitions,
unités, périodes et limites propres à chaque source.

Le public visé est celui des citoyens, médiateurs et acteurs de santé publique
qui souhaitent lire ces indicateurs sans confondre prévalence, activité des
urgences, prises en charge hospitalières et mortalité.

## Les deux preuves d’ouverture

1. **Un gradient financier dans l’enquête.** En 2024, la prévalence déclarée
   d’un épisode dépressif caractérisé au cours des douze derniers mois est de
   9,0 % chez les personnes se disant à l’aise financièrement (IC 95 % :
   8,1–10,0 %) et de 28,3 % chez celles en difficulté (26,7–29,9 %).
   Le rapport des estimations est 3,14, affiché ×3,1. Les quatre situations et
   leurs intervalles sont montrés simultanément. Il s’agit d’une association
   avec une situation financière perçue, sans conclusion causale.
2. **Des trajectoires hospitalières divergentes.** Chez les filles de 11–14 ans,
   le taux de patients hospitalisés pour gestes auto-infligés passe de 208,3 à
   401,9 pour 100 000 entre 2019 et 2024 (+92,9 %). Chez les garçons du même âge,
   il passe de 39,5 à 42,4 (+7,3 %). Les deux courbes partagent la même échelle.
   Ces taux bruts concernent les personnes du même âge et sexe ; ils ne
   mesurent pas toute la souffrance psychique.

Les chiffres d’ouverture sont calculés dans l’interface depuis le fichier de
 données livré, et non copiés dans des composants indépendants.

## Ce que l’exploration apporte

- Déclaré : trois indicateurs selon la situation financière, puis un mode
  historique régional 2005–2021 séparé de 2024.
- Urgences : comparaison territoriale de la part des gestes auto-infligés dans
  l’activité des urgences, 2020–2024.
- Hôpital : séjours par département ; patients par âge et sexe, 2019–2024.
- Décès : taux de décès par suicide et écarts absolus, 2019–2023.

La distribution de points situe une sélection parmi les évolutions disponibles.
La France est un repère, pas un département de la distribution. Pour les profils
hospitaliers, la courbe de comparaison correspond à l’autre sexe au même âge.

## Méthode et limites

Les familles Odissé mobilisées : épisodes dépressifs 2024, trouble anxieux
 généralisé 2024, conduites suicidaires 2024, historiques des épisodes dépressifs
 et conduites suicidaires France/région, hospitalisations France/département,
 patients hospitalisés France, urgences France/département et décès par suicide
 France/département. Les liens exacts sont dans la section Méthode de l’application.

Les sources ne suivent pas les mêmes personnes et ne constituent pas un
entonnoir individuel. Les gestes auto-infligés incluent les tentatives de suicide
et les automutilations non suicidaires. Les données hospitalières dépendent
également du recours, de l’accès, de l’offre et du codage.

Les taux tous âges des séjours et décès sont standardisés ; les taux par âge sont
bruts. Les urgences sont rapportées aux passages. Les références nationales
pour les classes d’âge regroupées sont approchées à partir des effectifs et taux
arrondis. Le Baromètre 2024 n’est pas raccordé aux vagues historiques.

Pour les décès, la règle de conception exclut une variation de la distribution
si moins de 10 décès sont diffusés à l’une des deux dates. Ce n’est pas un seuil
de significativité ; des effectifs plus grands ne garantissent pas une évolution
statistiquement significative. Les valeurs disponibles restent descriptives.
Les données manquantes et bases nulles ne sont pas converties en zéro.

La chronologie hebdomadaire/mensuelle numérisée depuis des bulletins a été
écartée du rendu final faute de traçabilité suffisante. La série longue DREES et
les analyses de rupture restent conservées, mais ne constituent pas le récit
actuellement présenté.

## Design, accessibilité et frugalité

Palette crème, noir et orange, avec tracés pointillés et légendes pour ne pas
faire reposer les comparaisons sur la couleur seule. Les preuves sont lisibles
sans interaction ; les filtres et points interactifs sont accessibles au clavier.
Les animations respectent la réduction des mouvements. Le site utilise React
et SVG, sans backend, compte, service cartographique, police distante ou suivi.
Les ressources 3114 et Santé mentale Info Service restent visibles.

## Trame de pitch — 3 minutes

**0:00–0:30 — Question.** Quand on parle de santé mentale, parle-t-on de ce que
les personnes déclarent, des urgences, des hospitalisations ou des décès ? Nous
avons construit une expérience qui montre ce que ces regards révèlent, et
pourquoi on ne peut pas les confondre.

**0:30–1:10 — Première preuve.** L’enquête 2024 montre un gradient financier :
9 % à 28,3 % de dépression déclarée. Montrer les quatre situations et les
intervalles. Une association observée, pas une explication causale.

**1:10–1:50 — Deuxième preuve.** À l’hôpital, une autre observation : chez les
11–14 ans, le taux des filles augmente de 93 %, celui des garçons de 7 % entre
2019 et 2024. Montrer les deux trajectoires sur une même échelle.

**1:50–2:35 — Exploration.** Ouvrir le profil depuis sa preuve, puis un autre
regard. Montrer que l’unité et le dénominateur changent. Expliquer les limites de
comparaison territoriale et l’état de faible effectif.

**2:35–3:00 — Apport.** Notre contribution est une lecture accompagnée de données
publiques : des observations, leurs limites et la possibilité d’explorer sans
fusionner les mesures. Terminer sur les personnes derrière les données et les
ressources d’aide.

## À compléter pour la remise

- URL diffusée et vérifiée de la visualisation.
- URL du dépôt public complet, incluant scripts et exports nécessaires.
- Identité de l’équipe et coordonnées demandées par le template officiel.
- Reporter ces contenus dans le template officiel de dépôt, absent du dossier.

Le présent document est une base de contenu, pas le template officiel rempli.
