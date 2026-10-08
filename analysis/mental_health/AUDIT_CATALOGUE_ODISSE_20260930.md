# Audit du catalogue Odissé — santé mentale

## État au 30 septembre 2026

L'API du catalogue Odissé expose **373 jeux de données**, contre 362 lors de la
première vérification du 19 septembre. Les métadonnées de ces 373 jeux ont été
parcourues. Une recherche large sur les titres associés à la santé mentale,
aux gestes auto-infligés, au suicide, à la dépression, à l'anxiété, au
bien-être, au sommeil, à la périnatalité et aux affections psychiques a retenu
**38 jeux**, dont plusieurs déclinaisons géographiques d'une même famille.

Cet audit répond à deux objectifs distincts :

1. ne pas manquer un jeu récemment publié qui renforcerait la démonstration ;
2. documenter pourquoi certains jeux ne sont pas intégrés à la dataviz.

Fouiller tout le catalogue ne signifie pas accumuler toutes les mesures dans le
récit final.

## Découverte déterminante

Odissé publie depuis le 9 septembre 2026 une nouvelle famille
**« Gestes auto-infligés : Patients hospitalisés »** aux niveaux France,
région, département et infradépartemental.

Le jeu France couvre 2019–2024 et distingue :

- 00–10 ans ;
- 11–14 ans ;
- 15–17 ans ;
- 18–24 ans ;
- 25–44 ans ;
- 45–64 ans ;
- 65–84 ans ;
- 85 ans et plus ;
- femmes, hommes et ensemble.

Il contient le nombre de patients uniques et le taux brut par âge et sexe. Il
permet donc de placer Odissé au cœur de la visualisation principale, alors que
la première version dépendait de la DREES pour distinguer patients et séjours.

La série DREES 2012–2025 reste nécessaire pour analyser la tendance longue. Les
deux publications utilisent des données médico-administratives apparentées :
leur concordance ne doit pas être présentée comme une réplication indépendante.

## Familles directement mobilisées

| Famille | Jeux utilisés | Rôle dans le récit |
|---|---:|---|
| Patients hospitalisés pour gestes auto-infligés | Odissé France | Matrice principale âge × sexe, 2019–2024 |
| Séjours hospitaliers pour gestes auto-infligés | Odissé France et département | Décomposition patients/séjours et annexe territoriale |
| Épisodes dépressifs 2024 | Baromètre Odissé | Gradient financier avec IC 95 % |
| Trouble anxieux généralisé 2024 | Baromètre Odissé | Gradient financier avec IC 95 % |
| Conduites suicidaires 2024 | Baromètre Odissé | Pensées suicidaires et gradient financier |
| Patients hospitalisés, série longue | DREES, source externe | Rupture 2012–2025 et test de stabilité |

Cela représente six jeux Odissé et un jeu externe dans l'expérience web.

## Familles examinées mais non placées dans le récit principal

### Passages aux urgences pour gestes auto-infligés

Disponibles pour la France, les régions et les départements de 2020 à 2024.
Le dénominateur est l'activité totale des urgences, et non la population. La
série ajoute une mesure du recours aigu, mais sa fenêtre commence précisément
pendant la période de rupture. Elle est conservée comme contexte méthodologique.

### Décès par suicide

Disponibles de 2019 à 2023 à plusieurs mailles. Les décès ne constituent pas
l'étape finale d'un entonnoir reliant pensées, urgences, hospitalisations et
suicides. Les populations, définitions et dynamiques d'âge-sexe diffèrent. Une
comparaison complète ouvrirait un second récit.

### Moyens utilisés

Des jeux sur les moyens ayant conduit à une hospitalisation et les moyens de
suicide ont été ajoutés en septembre 2026. Ils sont sensibles, peu nécessaires
à la question retenue et exposeraient le projet à une description détaillée
sans gain analytique suffisant. Ils sont écartés du rendu public.

### Baromètres historiques 2005–2021

Les épisodes dépressifs, pensées suicidaires et tentatives de suicide sont
disponibles aux niveaux France et région pour certaines années. Ils ne doivent
pas être raccordés naïvement aux estimations 2024, dont le protocole de collecte
a changé. Ils ne prolongent donc pas la série principale.

### Enabee 2022

Le jeu porte sur les troubles probables de santé mentale des enfants du CP au
CM2, selon le sexe et le niveau scolaire. Cette population ne correspond pas
aux 11–24 ans étudiés et la mesure ne porte pas sur les gestes auto-infligés.
Son intégration créerait une fausse continuité entre enfance et adolescence.

### Bien-être et sommeil — Baromètre 2024

Ces jeux documentent d'autres dimensions déclarées de la santé mentale. Ils
pourraient enrichir un portrait général, mais diminueraient la spécificité de la
question actuelle sans permettre d'expliquer la rupture hospitalière.

### Santé mentale périnatale

Les indicateurs post-partum couvrent une population et un protocole spécifiques.
Ils constituent un sujet autonome et ne doivent pas être agrégés au groupe
18–24 ans.

### Affections psychiques liées au travail

Les maladies à caractère professionnel sont disponibles au niveau régional sur
une couverture dépendant des régions participantes. Elles portent principalement
sur la population active et ne répondent pas à la question générationnelle.

## Décision éditoriale

La nouvelle version mobilise davantage de données sans devenir un catalogue :

- Odissé fournit la première preuve visuelle avec seize trajectoires âge × sexe ;
- la DREES apporte la profondeur historique ;
- les séjours testent l'hypothèse des réhospitalisations ;
- trois jeux du Baromètre montrent simultanément le gradient financier ;
- les départements restent une annexe exploratoire prudente.

Les autres familles restent documentées ici pour rendre la sélection traçable.

## Source technique

Catalogue consulté via l'API publique Odissé :
<https://odisse.santepubliquefrance.fr/api/explore/v2.1/catalog/datasets>.
