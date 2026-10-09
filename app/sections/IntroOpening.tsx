import IntroPortrait from "../portraits/IntroPortrait";
import { slidingLead, centeredFlight, IntroLeadLines } from "./introTypography";
import { useRef, useLayoutEffect, useEffect } from "react";

export function IntroOpening() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const flights = useRef<Array<HTMLSpanElement | null>>([]);
  const caption = useRef<HTMLParagraphElement>(null);
  const progressLine = useRef<HTMLSpanElement>(null);
  const action = useRef<HTMLAnchorElement>(null);
  const ink = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const root = track.current;
    const viewport = stage.current;
    if (!root || !viewport) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const starts = [0, 0.14, 0.28, 0.42, 0.56, 0.7];
    const flightDuration = 0.24;
    let inkSize = "";
    const synchronize = () => {
      frame = 0;
      const bounds = root.getBoundingClientRect();
      const stageBounds = viewport.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(root).paddingTop) || 0;
      const distance = Math.max(
        1,
        root.offsetHeight - viewport.offsetHeight - inset,
      );
      const progress = motion.matches
        ? 1
        : Math.max(0, Math.min(1, -bounds.top / distance));
      viewport.dataset.introProgress = progress.toFixed(3);
      viewport.dataset.portraitReady = String(progress >= 0.82);
      const portrait = viewport.querySelector<HTMLElement>(".intro-portrait");
      if (portrait) portrait.inert = progress < 0.82;
      viewport.style.setProperty(
        "--portrait-progress",
        String(Math.max(0, Math.min(1, (progress - 0.24) / 0.72))),
      );
      flights.current.forEach((element, index) => {
        if (!element) return;
        // Measure the untransformed wrapper: animation cannot alter its destination.
        const target = element.parentElement!.getBoundingClientRect();
        if (index === 0 && ink.current) {
          const style = getComputedStyle(element);
          const signature = `${target.width}/${target.height}/${style.fontSize}/${style.letterSpacing}`;
          if (signature !== inkSize) {
            inkSize = signature;
            const text = ink.current.querySelector("text")!;
            const fontSize = parseFloat(style.fontSize);
            const previousTransform = element.style.transform;
            element.style.transform = "none";
            const baseline =
              element.querySelector<HTMLElement>(".intro-baseline")!;
            const baselineY =
              baseline.getBoundingClientRect().top -
              element.getBoundingClientRect().top;
            element.style.transform = previousTransform;
            ink.current.setAttribute(
              "viewBox",
              `0 0 ${target.width} ${target.height}`,
            );
            text.setAttribute("y", String(baselineY));
            text.style.fontFamily = style.fontFamily;
            text.style.fontSize = style.fontSize;
            text.style.fontWeight = style.fontWeight;
            text.style.letterSpacing = style.letterSpacing;
            text.style.setProperty("--ink-length", String(fontSize * 4));
          }
        }
        const local = Math.max(
          0,
          Math.min(1, (progress - starts[index]) / flightDuration),
        );
        const arrival = local * local * (3 - 2 * local);
        if (index === 5) {
          element.dataset.arrival = arrival.toFixed(3);
          slidingLead(element, local);
          return;
        }
        const large =
          index === 0 || index === 3 || index === 4
            ? Math.max(
                1,
                Math.min(
                  (stageBounds.width * 0.9) / Math.max(1, target.width),
                  (stageBounds.height * 0.7) / Math.max(1, target.height),
                ),
              )
            : Math.max(
                2.5,
                Math.min(
                  28,
                  (stageBounds.width / Math.max(1, target.width)) * 2.2,
                ),
              );
        centeredFlight(element, stageBounds, arrival, large);
        element.style.opacity =
          progress >= starts[index]
            ? String(Math.min(1, local * 10 + (index === 0 ? 1 : 0)))
            : "0";
        element.dataset.arrival = arrival.toFixed(3);
      });
      viewport
        .querySelectorAll<HTMLElement>(".intro-topic-divider")
        .forEach((divider, index) => {
          divider.style.opacity =
            progress >= starts[index + 1] + flightDuration ? ".6" : "0";
        });
      if (caption.current)
        caption.current.textContent =
          progress < starts[1]
            ? "Ce que l’on ressent."
            : progress < starts[2]
              ? "Ce que les soins rendent visible."
              : progress < starts[3]
                ? "Ce qui diffère selon les vies."
                : "Une mesure éclaire. Elle laisse aussi une part hors champ.";
      if (progressLine.current)
        progressLine.current.style.transform = `scaleX(${progress})`;
      if (action.current) {
        const visible = progress >= 0.9;
        action.current.style.opacity = String(
          Math.max(0, Math.min(1, (progress - 0.9) / 0.08)),
        );
        action.current.style.visibility = visible ? "visible" : "hidden";
        action.current.tabIndex = visible ? 0 : -1;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(root);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const root = track.current;
    const viewport = stage.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      !root ||
      !viewport ||
      motion.matches ||
      window.scrollY > 4 ||
      (location.hash && location.hash !== "#top")
    )
      return;
    let frame = 0;
    let stopped = false;
    let running = false;
    let lastScroll = window.scrollY;
    const stop = () => {
      stopped = true;
      running = false;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    const timer = window.setTimeout(() => {
      if (stopped || document.hidden || motion.matches || window.scrollY > 4)
        return;
      running = true;
      const from = window.scrollY;
      const inset = parseFloat(getComputedStyle(root).paddingTop) || 0;
      const destination =
        from +
        root.getBoundingClientRect().top +
        root.offsetHeight -
        viewport.offsetHeight -
        inset;
      const started = performance.now();
      const advance = (now: number) => {
        if (stopped) return;
        const progress = Math.min(1, (now - started) / 6000);
        const eased = progress * progress;
        lastScroll = from + (destination - from) * eased;
        window.scrollTo({ top: lastScroll, behavior: "instant" });
        if (progress < 1) frame = requestAnimationFrame(advance);
        else stop();
      };
      frame = requestAnimationFrame(advance);
    }, 3000);
    const onScroll = () => {
      if (!running || Math.abs(window.scrollY - lastScroll) > 2) stop();
    };
    const interactions = [
      "wheel",
      "touchstart",
      "pointerdown",
      "pointermove",
      "keydown",
      "focusin",
      "resize",
    ] as const;
    interactions.forEach((event) =>
      window.addEventListener(event, stop, { passive: true }),
    );
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", stop);
    motion.addEventListener("change", stop);
    return () => {
      stop();
      interactions.forEach((event) => window.removeEventListener(event, stop));
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", stop);
      motion.removeEventListener("change", stop);
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
        {index === 0 ? (
          <>
            <span className="intro-word-fill">
              {text}
              <span className="intro-baseline" aria-hidden="true" />
            </span>
            <svg
              className="intro-ink"
              ref={ink}
              aria-hidden="true"
              focusable="false"
            >
              <text x="0">SANTÉ MENTALE</text>
            </svg>
          </>
        ) : (
          text
        )}
      </span>
    </span>
  );
  return (
    <section
      className="intro-scroll-track"
      id="top"
      ref={track}
      aria-labelledby="intro-title"
    >
      <div className="hero meta-hero intro-stage" ref={stage}>
        <div className="hero-copy">
          <p className="overline intro-topics">
            {flight("Santé mentale", 0)}
            <span className="intro-topic-divider" aria-hidden="true">
              ·
            </span>
            {flight("Recours aux soins", 1)}
            <span className="intro-topic-divider" aria-hidden="true">
              ·
            </span>
            {flight("Inégalités", 2)}
          </p>
          <h1 id="intro-title">
            {flight("Quand la souffrance", 3)}
            {flight("devient visible.", 4)}
          </h1>
          <div className="intro-lead-target">
            <IntroLeadLines
              register={(element) => {
                flights.current[5] = element;
              }}
            />
          </div>
          <a href="#constats" className="read-data" ref={action}>
            Comprendre ce que les données révèlent <span>↓</span>
          </a>
        </div>
        <IntroPortrait />
        <div className="intro-footer">
          <p ref={caption}>Ce que l’on ressent.</p>
          <a href="#constats">Passer l’introduction ↓</a>
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
