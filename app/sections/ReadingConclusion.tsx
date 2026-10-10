import ConclusionPortrait from "../portraits/ConclusionPortrait";
import {
  slidingLead,
  centeredFlight,
  measureFlight,
  prepareFlightSurface,
  FlightLabel,
  type FlightGeometry,
  IntroLeadLines,
} from "./introTypography";
import { useRef, useLayoutEffect } from "react";
import { createFlightScrollMotion } from "./introScrollMotion";
import { createScrollFrameLoop } from "../animation/scrollFrameLoop";

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
    const starts = [0, 0.16, 0.3, 0.46, 0.6, 0.72];
    const nativeMotion = createFlightScrollMotion(root, "conclusion", {
      starts, duration: .26, lead: 3, fromBottom: index => index >= 4,
    });
    let measurements: Array<FlightGeometry | null> = [];
    let largeSizes: number[] = [];
    let geometryDirty = true;
    let previousProgress = -1;
    let previouslyVisible = false;
    const portrait = viewport.querySelector<HTMLElement>(".conclusion-portrait");
    let scrollStart = 0;
    let distance = 1;
    let headerHeight = 60;
    let stageHeight = 1;
    const synchronize = (progress: number) => {
      const viewportVisible = window.scrollY < scrollStart + distance + stageHeight + headerHeight &&
        window.scrollY + innerHeight > scrollStart + headerHeight;
      if (
        !geometryDirty && progress === previousProgress &&
        viewportVisible === previouslyVisible
      ) return;
      previousProgress = progress;
      previouslyVisible = viewportVisible;
      if (geometryDirty) {
        const stageBounds = viewport.getBoundingClientRect();
        measurements = flights.current.map((element) =>
          element ? measureFlight(element, stageBounds) : null,
        );
        largeSizes = measurements.map(geometry => geometry
          ? Math.max(1, Math.min(28,
            stageBounds.width * 0.88 / Math.max(1, geometry.width),
            stageBounds.height * 0.6 / Math.max(1, geometry.height))) : 1);
        measurements.forEach((geometry, index) => {
          if (geometry) prepareFlightSurface(geometry, largeSizes[index]);
        });
        nativeMotion.configure(flights.current, measurements, largeSizes,
          scrollStart, distance, motion.matches);
        geometryDirty = false;
      }
      viewport.dataset.conclusionProgress = progress.toFixed(3);
      const drawing = String(Math.max(0, Math.min(1, (progress - 0.4) / 0.56)));
      // Keep inherited drawing properties inside the illustration, not the text stage.
      if (portrait && !nativeMotion.drawingNative) {
        portrait.style.setProperty("--portrait-progress", drawing);
        portrait.style.setProperty("--conclusion-portrait-progress", drawing);
      }
      flights.current.forEach((element, index) => {
        if (nativeMotion.enabled) return;
        const geometry = measurements[index];
        if (!element || !geometry) return;
        const local = Math.max(
          0,
          Math.min(1, (progress - starts[index]) / 0.26),
        );
        const arrival = local * local * (3 - 2 * local);
        element.dataset.arrival = arrival.toFixed(3);
        if (index === 3) {
          slidingLead(element, local, geometry);
          return;
        }
        const large = largeSizes[index];
        centeredFlight(
          element, geometry, arrival, large, index >= 4,
          viewportVisible && progress >= starts[index],
        );
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
      if (progressLine.current && !nativeMotion.enabled)
        progressLine.current.style.transform = `scaleX(${progress})`;
    };
    const driver = createScrollFrameLoop(() => {
      if (geometryDirty) {
        headerHeight = parseFloat(getComputedStyle(viewport).top) || 60;
        scrollStart = window.scrollY + root.getBoundingClientRect().top - headerHeight;
        stageHeight = viewport.offsetHeight;
        distance = Math.max(1, root.offsetHeight - stageHeight);
      }
      return motion.matches ? 1 : Math.max(0, Math.min(1, (window.scrollY - scrollStart) / distance));
    }, synchronize, () => nativeMotion.enabled || motion.matches);
    const schedule = driver.schedule;
    const invalidate = () => {
      geometryDirty = true;
      driver.reset();
      schedule();
    };
    const observer = new ResizeObserver(invalidate);
    observer.observe(root);
    observer.observe(viewport);
    flights.current.forEach((element) => {
      if (element) observer.observe(element);
    });
    document.fonts.addEventListener("loadingdone", invalidate);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate);
    motion.addEventListener("change", invalidate);
    driver.synchronize();
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", invalidate);
      driver.dispose();
      nativeMotion.dispose();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidate);
      motion.removeEventListener("change", invalidate);
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
        {index === 0 ? <FlightLabel text={text}>{text}</FlightLabel> : text}
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
