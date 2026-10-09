import { type ExperienceData } from "./data/experienceTypes";
import { type GuidedView } from "./explorer/explorerSteps";
import { TerritoryExplorer } from "./explorer/TerritoryExplorer";
import { ReadingNavigation } from "./navigation/ReadingNavigation";
import { GuidedStory } from "./sections/GuidedStory";
import { IntroOpening } from "./sections/IntroOpening";
import { MethodSection } from "./sections/MethodSection";
import useChartInteractions from "./charts/useChartInteractions";
import useChartTypography from "./charts/useChartTypography";
import { useRef, useLayoutEffect, useState } from "react";

export default function Experience({
  initialData: data,
}: {
  initialData: ExperienceData;
}) {
  const entrance = useRef<HTMLElement>(null);
  useChartTypography(entrance);
  useChartInteractions(entrance);
  useLayoutEffect(() => {
    const root = entrance.current;
    if (!root) return;
    root.classList.add("entrance-pending");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => root.classList.remove("entrance-pending");
    const startScroll = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startScroll) > 4) finish();
    };
    const onMotion = () => {
      if (motion.matches) finish();
    };
    if (
      motion.matches ||
      window.scrollY > 4 ||
      (window.location.hash && window.location.hash !== "#top")
    )
      finish();
    const timer = window.setTimeout(finish, 1700);
    window.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("focusin", finish);
    motion.addEventListener("change", onMotion);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("focusin", finish);
      motion.removeEventListener("change", onMotion);
    };
  }, []);
  const [guidedView, setGuidedView] = useState<GuidedView | null>(null);
  const explore = (view: "declared" | "profiles") => {
    setGuidedView((previous) => ({
      view,
      revision: (previous?.revision ?? 0) + 1,
    }));
  };
  return (
    <main ref={entrance} className="experience entrance-pending">
      <a className="skip-link" href="#constats">
        Aller aux observations
      </a>
      <ReadingNavigation />
      <IntroOpening />
      <GuidedStory data={data} onExplore={explore} />
      <TerritoryExplorer data={data} guidedView={guidedView} />
      <MethodSection data={data} />
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
    </main>
  );
}
