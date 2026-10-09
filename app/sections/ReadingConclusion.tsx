import ConclusionPortrait from "../ConclusionPortrait";
import { slidingLead, centeredFlight, IntroLeadLines } from "./introTypography";
import { useRef, useLayoutEffect } from "react";

export function ReadingConclusion() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const flights = useRef<Array<HTMLSpanElement | null>>([]);
  const links = useRef<HTMLElement>(null);
  const progressLine = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const root = track.current;
    const viewport = stage.current;
    if (!root || !viewport) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const starts = [0, 0.16, 0.3, 0.46, 0.6, 0.72];
    const synchronize = () => {
      frame = 0;
      const bounds = root.getBoundingClientRect();
      const stageBounds = viewport.getBoundingClientRect();
      const headerHeight = parseFloat(getComputedStyle(viewport).top) || 60;
      const distance = Math.max(1, root.offsetHeight - viewport.offsetHeight);
      const progress = motion.matches
        ? 1
        : Math.max(0, Math.min(1, (headerHeight - bounds.top) / distance));
      viewport.dataset.conclusionProgress = progress.toFixed(3);
      viewport.style.setProperty(
        "--portrait-progress",
        String(Math.max(0, Math.min(1, (progress - 0.4) / 0.56))),
      );
      viewport.style.setProperty(
        "--conclusion-portrait-progress",
        String(Math.max(0, Math.min(1, (progress - 0.4) / 0.56))),
      );
      flights.current.forEach((element, index) => {
        if (!element) return;
        const local = Math.max(
          0,
          Math.min(1, (progress - starts[index]) / 0.26),
        );
        const arrival = local * local * (3 - 2 * local);
        element.dataset.arrival = arrival.toFixed(3);
        if (index === 3) {
          slidingLead(element, local);
          return;
        }
        const large = Math.max(
          1,
          Math.min(
            28,
            (stageBounds.width * 0.88) / Math.max(1, element.offsetWidth),
            (stageBounds.height * 0.6) / Math.max(1, element.offsetHeight),
          ),
        );
        centeredFlight(element, stageBounds, arrival, large, index >= 4);
        element.style.opacity =
          progress >= starts[index]
            ? String(Math.min(1, local * 10 + (index === 0 ? 1 : 0)))
            : "0";
      });
      if (links.current) {
        const arrival = Math.max(0, Math.min(1, (progress - 0.9) / 0.08));
        links.current.style.opacity = String(arrival);
        links.current.style.visibility = arrival > 0 ? "visible" : "hidden";
        links.current.inert = arrival < 1;
      }
      if (progressLine.current)
        progressLine.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(viewport);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    synchronize();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);
  const flight = (text: string, index: number) => (
    <span className="intro-flight-target">
      <span
        className="intro-flight"
        ref={(element) => {
          flights.current[index] = element;
        }}
      >
        {text}
      </span>
    </span>
  );
  return (
    <section
      className="reading-conclusion"
      id="conclusion"
      ref={track}
      aria-labelledby="conclusion-heading"
    >
      <div className="conclusion-stage" ref={stage}>
        <div className="conclusion-composition">
          <p className="chapter">{flight("CE QUE L’ON RETIENT", 0)}</p>
          <h2 id="conclusion-heading">
            {flight("Un chiffre national", 1)}
            {flight("Des réalités différentes", 2)}
          </h2>
          <p className="conclusion-copy">
            <IntroLeadLines
              text="Les évolutions diffèrent selon les populations et les territoires. Ces données montrent une souffrance déclarée, un recours aux soins ou une mortalité enregistrée : elles ne mesurent pas la même réalité."
              register={(element) => {
                flights.current[3] = element;
              }}
            />
          </p>
          <p className="conclusion-takeaway">
            {flight("Rendre visible, c’est aussi montrer", 4)}
            {flight("ce qu’un chiffre laisse hors champ", 5)}
          </p>
          <nav
            className="conclusion-links"
            ref={links}
            aria-label="Poursuivre après la conclusion"
          >
            <a href="#territoires">
              Revenir aux données <span aria-hidden="true">↑</span>
            </a>
            <a href="#sources">
              Consulter les sources <span aria-hidden="true">↓</span>
            </a>
          </nav>
        </div>
        <ConclusionPortrait />
        <div className="intro-footer">
          <p>Une mesure éclaire. Elle laisse aussi une part hors champ.</p>
          <a href="#sources">Passer aux sources ↓</a>
        </div>
        <span
          className="intro-progress"
          aria-hidden="true"
          ref={progressLine}
        />
      </div>
    </section>
  );
}
