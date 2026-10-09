import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ChartExplanation } from "./chartExplanations";

export default function ChartHelp({
  explanation,
}: {
  explanation: ChartExplanation;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);
  return (
    <>
      <span className="chart-help-placement">
        <button
          className="chart-help-button"
          type="button"
          aria-label={`Comprendre les chiffres : ${explanation.title}`}
          aria-haspopup="dialog"
          aria-controls={id}
          onClick={() => setOpen(true)}
        >
          ?
        </button>
      </span>
      {createPortal(
        <dialog
          className="chart-help-dialog"
          ref={dialog}
          id={id}
          aria-labelledby={`${id}-title`}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              event.currentTarget.close();
          }}
        >
          <header>
            <p>COMPRENDRE LES CHIFFRES</p>
            <button
              type="button"
              className="chart-help-close"
              autoFocus
              onClick={() => dialog.current?.close()}
              aria-label="Fermer les précisions"
            >
              Fermer ×
            </button>
            <h2 id={`${id}-title`}>{explanation.title}</h2>
          </header>
          <dl>
            {[
              ["Ce qui est mesuré", explanation.measure],
              ["Qui, où, quand", explanation.population],
              ["Lire le graphique et les chiffres", explanation.reading],
              ["Les limites", explanation.limits],
            ].map(([label, copy]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{copy}</dd>
              </div>
            ))}
          </dl>
          <footer>
            <p>Sources · Santé publique France / Odissé</p>
            {explanation.sources.map((source) => (
              <a
                key={source.url ?? source.dataset}
                href={
                  source.url ??
                  `https://odisse.santepubliquefrance.fr/explore/dataset/${source.dataset}/`
                }
                target="_blank"
                rel="noreferrer"
              >
                {source.label} ↗
              </a>
            ))}
          </footer>
        </dialog>,
        document.body,
      )}
    </>
  );
}
