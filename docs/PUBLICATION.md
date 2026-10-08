# Publication et remise

## Chemin recommandé

1. Publier le dépôt source sur le compte GitHub personnel, par exemple sous le nom `odisse-sante-mentale`. Le répertoire Git est `web/` : son contenu doit être à la racine du dépôt distant.
2. Importer ce dépôt dans Vercel. Framework : Vite ; Root Directory : `.` ; Node.js : 22.x. `vercel.json` fournit les commandes et le dossier de sortie. Vérifier d’abord l’URL HTTPS fournie par Vercel.
3. Si retenu, ajouter `odisse.m4nu.net` dans les domaines du projet Vercel puis appliquer l’enregistrement DNS indiqué par Vercel. Le sous-domaine est une proposition, pas un domaine déjà configuré. L’URL Vercel suffit pour la remise si le DNS n’est pas prêt.
4. Compléter `DEPOT_GITLAB.md` avec les noms, une adresse de contact, l’URL du site et celle du code public. Régénérer le dossier de remise.
5. Dans le dépôt officiel [Odissé Dataviz Challenge 2026](https://gitlab.com/odisse-dataviz-challenge-2026/dataviz), à l’intérieur du dossier du défi santé mentale, déposer le dossier `defi-1_m4nu/` et son contenu. Le nom de dossier retenu est `defi-1_m4nu`. Si l’écriture directe n’est pas disponible, demander l’accès ou utiliser une branche/fork avec merge request selon les droits proposés par GitLab.
6. Ouvrir le README et ses liens sans connexion, télécharger l’archive de code, et vérifier que la contribution est visible dans le dépôt officiel. Une publication GitHub ou Vercel seule ne constitue pas la remise officielle.

Le README officiel demande une **URL accessible en ligne et le code source** pour une visualisation interactive. Le dossier généré contient donc le code en archive ainsi que le site compilé. La configuration CI du dépôt personnel ne doit pas être installée à la racine du dépôt collectif du challenge.

## Préparer les fichiers

Depuis la racine Git (`web/`) :

```bash
npm ci
npm run build
python3 scripts/prepare_publication.py
```

Le dossier est généré dans `../tmp/publication/defi-1_m4nu/` :

```text
README.md
production/
  code-source.zip
  visualisation.zip
  LIENS.md
```

Le script prend les fichiers suivis et les nouveaux fichiers non ignorés du
dépôt. Il exclut les dépendances, secrets locaux et fichiers ignorés. L’archive
du site compilé doit être extraite et servie par HTTP(S), pas ouverte en `file://`.
Les champs `[À COMPLÉTER …]` restent explicitement visibles jusqu’à leur saisie.

## Alternatives disponibles

- **Dépôt personnel GitLab + Vercel :** Vercel peut importer GitLab ; GitHub n’est pas obligatoire. Garder les mêmes commandes et la racine `.`.
- **GitLab Pages :** la CI construit automatiquement et conserve `dist/`. Le job `deploy-pages` est manuel sur la branche principale ; le lancer après validation. Les chemins relatifs conviennent aussi aux URL contenant un sous-dossier. Vérifier la visibilité publique du site et du dépôt.

## Contrôle avant remise

Vérifier le chargement des données, les dix étapes de l’explorateur dans les deux
sens, le survol régional et une lecture mobile. Vérifier également les liens
sources, les ressources d’aide, les notices de licence et l’accès sans compte.
La clarification Slack fixe 23 h 58 le 8 octobre 2026 ; le README officiel indique
23 h 59. Conserver 23 h 58 comme limite opérationnelle.

Le PDF annonce un pitch de trois minutes pour les projets présélectionnés.
La trame existante se trouve dans `analysis/PROPOSITION_FINALE.md` ; le support
de pitch est optionnel pour le dépôt.
