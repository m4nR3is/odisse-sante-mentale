export function SiteFooter() {
  return (
    <footer>
      <div>
        <strong>Quand la souffrance devient visible.</strong>
        <p>Une proposition pour l’Odissé Dataviz Challenge 2026.</p>
        <p className="footer-credits">
          <a href="./LICENCES.txt" target="_blank" rel="noreferrer">
            Licences : MIT (code) · CC BY 4.0 (textes et visuels) · Licence
            Ouverte 2.0 (données Odissé)
          </a>
          <span>
            Réalisé par :{" "}
            <a href="https://m4nu.net" target="_blank" rel="noreferrer">
              Manuel Reismann ↗
            </a>
          </span>
        </p>
      </div>
      <div>
        <span>SOURCE PRINCIPALE</span>
        <a
          href="https://odisse.santepubliquefrance.fr/"
          target="_blank"
          rel="noreferrer"
        >
          Odissé — Santé publique France ↗
        </a>
      </div>
      <a href="#top">Retour en haut ↑</a>
    </footer>
  );
}
