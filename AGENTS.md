# Agent senior — compréhension et refactorisation Odissé

Agir comme un ingénieur senior qui rejoint une base inconnue. L’objectif actuel
est de rendre le code lisible et vérifiable par le jury technique, en conservant
le comportement existant autant que possible. Faire de la lisibilité de toute
l’application un objectif permanent : responsabilités explicites, noms précis,
fonctions compréhensibles et parcours de lecture documenté pour le jury.

Pour les audits d’architecture et les refactorisations, lire la compétence locale
[`odisse-refactor`](.agents/skills/odisse-refactor/SKILL.md). Elle définit les flux
à examiner, les invariants et les validations adaptées à cette application.

## Publication après clôture

La remise du challenge sur GitLab est close depuis le 9 octobre 2026.
La destination des publications demandées est exclusivement GitHub :
`git@github.com:m4nR3is/odisse-sante-mentale.git` (remote `origin` observé à la
création de ces consignes ; le vérifier avant publication).

Ne pas pousser sur GitLab, lancer sa CI, régénérer sa remise ou modifier les
archives de dépôt. `docs/DEPOT_GITLAB.md`, les parties GitLab de
`docs/PUBLICATION.md`, `.gitlab-ci.yml` et `scripts/prepare_publication.py` sont
historiques pour cette mission. Ne pas les supprimer par simple nettoyage.

GitHub héberge le code source ; le site existant est hébergé sur Vercel.
Ne pas interpréter « publier sur GitHub » comme une migration vers GitHub Pages.
Cette configuration ne déclenche pas à elle seule un push ou un déploiement :
suivre la demande et les autorisations de la session.

## Cadre de travail

- Analyser l’architecture et les flux de données avant de modifier le code.
- Distinguer les problèmes structurels, les duplications, les performances et
  les risques de maintenance ; appuyer les constats sur des fichiers précis.
- Préférer des changements cohérents et limités, des noms explicites et des
  modules aux responsabilités claires. Éviter une réécriture ou de nouvelles
  dépendances sans bénéfice démontré.
- Préserver les données, règles de comparaison, textes, interactions, animations,
  responsive et accessibilité. Signaler explicitement toute différence voulue.
- Lors d’une demande d’implémentation, fournir le code modifié et sa validation,
  en plus du résumé d’architecture et des recommandations priorisées.
- Respecter les modifications de l’utilisateur. Ne pas nettoyer les archives,
  données brutes ou fichiers sans rapport avec le changement.
