# Ce que la moyenne ne dit pas

Expérience éditoriale et interactive conçue pour l’Odissé Dataviz Challenge.
Le projet est une application Vite + React autonome : aucun CMS, compte,
service distant ou backend n’est nécessaire.

## Lancer le projet

Prérequis : Node.js 20.19 ou plus récent.

```bash
pnpm install
pnpm run dev
```

Vite affiche ensuite l’adresse locale, généralement `http://localhost:5173`.

## Vérifier la production

```bash
pnpm run build
pnpm run preview
```

## Structure utile

- `app/Experience.tsx` : narration et visualisations interactives ;
- `app/site.css` : direction visuelle et responsive ;
- `public/data/experience-data.json` : données préparées pour le navigateur ;
- `../scripts/build_web_data.py` : génération reproductible des données.

La vue principale utilise désormais le jeu Odissé « Patients hospitalisés pour
gestes auto-infligés » (2019–2024). La série DREES 2012–2025 apporte la
profondeur historique nécessaire à l'analyse de rupture. Ces deux diffusions
reposent sur des données médico-administratives apparentées et ne sont pas
présentées comme deux validations indépendantes.
