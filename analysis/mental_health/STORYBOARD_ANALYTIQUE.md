# Storyboard analytique — version 1

## Thèse

La moyenne nationale ne décrit pas une dégradation uniforme. Autour de
2020–2021, les trajectoires hospitalières des adolescentes et jeunes femmes
bifurquent nettement. Cette rupture est plus forte que celle des garçons du
même âge, concerne bien davantage de patientes et s’inscrit dans un paysage où
les indicateurs déclarés suivent par ailleurs un gradient social très marqué.

Le récit ne doit pas chercher une cause unique. Il montre trois formes
d’inégalité qui ne sont pas mesurées dans les mêmes populations : âge et genre,
situation financière, territoire de prise en charge.

## Séquence 0 — La moyenne

**Question :** comment une hausse nationale modérée peut-elle masquer une
rupture majeure ?

**Visuel :** une ligne nationale unique. Au scroll, elle se décompose en fils
d’âge et de sexe. La ligne des 11–14 ans femmes quitte brutalement le faisceau.

**Chiffre affiché :** entre 2019 et 2024, le taux tous âges augmente de 9,6 %,
alors que celui des femmes de 11–14 ans augmente de 104,9 % dans Odissé.

**Interaction :** survol ou focus d’un fil pour isoler un groupe ; comparaison
femmes/hommes activable sans changer d’échelle.

**À ne pas faire :** commencer par « ×2 » sans montrer le dénominateur, l’unité
et la trajectoire masculine correspondante.

## Séquence 1 — La bifurcation

**Question :** 2021 est-elle seulement une date choisie pour le récit ?

**Visuel :** série DREES 2012–2025. Une droite discrète matérialise la tendance
2012–2019 ; le tracé réel s’en écarte ensuite. La zone 2020–2021 doit être
nommée « bifurcation détectée », pas « effet Covid ».

**Preuves :** pour les trois groupes féminins 11–14, 15–17 et 18–24 ans, 2021
est le meilleur point de rupture parmi 2017–2023. En retirant successivement
chaque année, 2021 reste sélectionnée dans 13 essais sur 14.

**Annotations :**

- 11–14 ans : 428,0 observé en 2025 contre 249,3 selon la prolongation de la
  tendance antérieure ;
- 15–17 ans : 725,1 contre 447,8 ;
- 18–24 ans : 359,7 contre 221,8.

Ces projections sont des repères descriptifs, pas des scénarios causaux.

## Séquence 2 — Une rupture genrée

**Question :** s’agit-il seulement d’un phénomène touchant tous les jeunes ?

**Visuel :** trois paires de fils, femmes et hommes, partageant la même origine
indexée à 100 en 2019. L’échelle indexée sert uniquement à comparer les
évolutions ; un interrupteur permet de revenir aux taux absolus.

**Preuves 2019–2025 :**

- 11–14 ans : femmes +98,8 %, hommes +26,9 % ;
- 15–17 ans : femmes +73,1 %, hommes +17,6 % ;
- 18–24 ans : femmes +53,4 %, hommes +14,8 %.

**Conclusion intermédiaire :** la hausse existe aussi chez les jeunes hommes,
mais son ampleur est très différente. Il faut parler de concentration du signal,
pas d’exclusivité féminine.

## Séquence 3 — Plus de séjours, mais surtout plus de patientes

**Question :** la hausse peut-elle être un artefact de réhospitalisations plus
fréquentes ?

**Visuel :** deux composantes synchronisées : nombre de patientes et nombre
moyen de séjours par patiente. Éviter deux axes verticaux superposés ; utiliser
deux bandes partageant le même temps.

**Résultat :** les séjours par patiente augmentent d’environ 8 à 11 % selon le
groupe entre les périodes 2012–2019 et 2021–2025. Cette évolution existe, mais
elle est très inférieure à la hausse du taux de patientes.

**Conclusion :** les réhospitalisations participent au phénomène sans pouvoir
l’expliquer seules.

## Séquence 4 — Le gradient social

**Question :** la souffrance psychique déclarée est-elle distribuée de manière
uniforme ?

**Visuel :** trois lignes ou dot plots alignés. Les quatre catégories financières
doivent toutes rester visibles, avec leurs intervalles de confiance.

**Résultats Baromètre 2024 :**

- dépression : 9,0 % à 28,3 %, rapport ×3,14 ;
- anxiété : 3,6 % à 12,9 %, rapport ×3,58 ;
- pensées suicidaires : 3,4 % à 10,7 %, rapport ×3,15.

Les trois gradients sont monotones et les intervalles des catégories extrêmes
ne se chevauchent pas.

**Transition narrative :** ce résultat documente une autre dimension des
inégalités de santé mentale. Il ne constitue pas l’explication statistique de
la rupture observée chez les adolescentes.

## Séquence 5 — Le territoire comme incertitude

**Question :** une carte des hospitalisations est-elle une carte directe de la
souffrance psychique ?

**Visuel principal :** petites multiples ordonnées par forme de trajectoire,
pas choroplèthe spectaculaire. Le visiteur peut rechercher son département et
le comparer à la France.

**Résultat :** 77,2 % des 101 départements comparables augmentent entre les
moyennes 2019–2020 et 2023–2024, mais seulement 23,8 % augmentent lors d’au
moins quatre des cinq transitions annuelles.

**Lecture :** la hausse est spatialement répandue, mais les trajectoires
annuelles sont irrégulières. Offre de soins, recours, codage et petits effectifs
interdisent un palmarès moral des territoires.

## Séquence 6 — Ce que nous savons

La conclusion prend la forme de trois phrases, suivies de leurs limites :

1. **La bifurcation est réelle dans les données hospitalières.** Elle ne décrit
   toutefois pas toute la santé mentale.
2. **Elle est fortement concentrée chez les adolescentes et jeunes femmes.**
   Les données disponibles ici n’en isolent pas les causes.
3. **Les inégalités sociales apparaissent dans les déclarations de santé
   mentale.** Leur articulation individuelle avec les hospitalisations n’est
   pas mesurée dans ces jeux de données.

Terminer par les sources, la méthode reproductible et le 3114.

## Décisions de design statistique

- Toujours afficher l’unité et distinguer patientes, séjours, passages et décès.
- Garder la même échelle lors d’une comparaison femmes/hommes en valeurs
  absolues.
- Signaler explicitement les vues indexées à 100.
- Ne pas animer les données d’une façon qui modifie la perception de la pente.
- Rendre les valeurs accessibles au clavier et dans un tableau alternatif.
- Ne pas encoder la gravité par une couleur alarmiste ; utiliser surtout poids,
  opacité et position.
- Toute estimation contrefactuelle doit porter le mot « projection ».

## Travail restant avant intégration web

1. Vérifier les définitions exactes et ruptures de séries dans les métadonnées
   DREES et Odissé.
2. Ajouter les intervalles ou avertissements de petits effectifs lorsque les
   données les fournissent.
3. Préparer les tables web dédiées aux trois premières séquences.
4. Faire relire les formulations sensibles par une personne familière des
   enjeux de prévention du suicide.
