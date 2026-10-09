export function HelpSection() {
  return (
    <section className="help">
      <div>
        <p className="chapter">DERRIÈRE LES DONNÉES, DES PERSONNES</p>
        <h2>
          Besoin d’aide pour vous
          <br />
          ou pour un proche&nbsp;?
        </h2>
      </div>
      <div className="help-links">
        <a href="tel:3114">
          <span>Numéro national de prévention du suicide</span>
          <strong>31 14</strong>
          <small>Gratuit · 24 h / 24 · 7 j / 7</small>
        </a>
        <a
          href="https://www.santementale-info-service.fr/"
          target="_blank"
          rel="noreferrer"
        >
          <span>Informer, prévenir, orienter</span>
          <b>
            Santé mentale
            <br />
            Info Service ↗
          </b>
        </a>
      </div>
    </section>
  );
}
