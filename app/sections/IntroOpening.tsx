import IntroPortrait from "../portraits/IntroPortrait";
import {
  slidingLead,
  centeredFlight,
  measureFlight,
  prepareFlightSurface,
  FlightLabel,
  type FlightGeometry,
  IntroLeadLines,
} from "./introTypography";
import { useRef, useLayoutEffect, useEffect } from "react";
import {
  createIntroScrollMotion,
  INTRO_FLIGHT_STARTS,
  INTRO_FLIGHT_DURATION,
} from "./introScrollMotion";

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
    const nativeMotion = createIntroScrollMotion(root);
    const starts = INTRO_FLIGHT_STARTS;
    const flightDuration = INTRO_FLIGHT_DURATION;
    let inkSize = "";
    let measurements: Array<FlightGeometry | null> = [];
    let largeSizes: number[] = [];
    let geometryDirty = true;
    let previousProgress = -1;
    let previouslyVisible = false;
    let scrollStart = 0;
    let scrollDistance = 1;
    let stageHeight = 1;
    let renderedProgress = -1;
    let lastFrameTime = 0;
    let followUntil = 0;
    const portrait = viewport.querySelector<HTMLElement>(".intro-portrait");
    const dividers = viewport.querySelectorAll<HTMLElement>(".intro-topic-divider");
    const synchronize = (now = performance.now()) => {
      frame = 0;
      if (geometryDirty) {
        const bounds = root.getBoundingClientRect();
        const inset = parseFloat(getComputedStyle(root).paddingTop) || 0;
        scrollStart = window.scrollY + bounds.top;
        stageHeight = viewport.offsetHeight;
        scrollDistance = Math.max(1, root.offsetHeight - stageHeight - inset);
      }
      const targetProgress = motion.matches ? 1 :
        Math.max(0, Math.min(1, (window.scrollY - scrollStart) / scrollDistance));
      // Older engines receive irregular scroll samples. Fill the intervals using
      // a short, time-based follow rather than holding until the next event.
      if (nativeMotion.enabled || motion.matches || geometryDirty ||
          renderedProgress < 0 || Math.abs(targetProgress - renderedProgress) > 0.35) {
        renderedProgress = targetProgress;
      } else {
        const elapsed = Math.min(64, Math.max(0, now - lastFrameTime));
        renderedProgress += (targetProgress - renderedProgress) * (1 - Math.exp(-elapsed / 45));
        if (Math.abs(targetProgress - renderedProgress) < 0.000001)
          renderedProgress = targetProgress;
      }
      lastFrameTime = now;
      const progress = renderedProgress;
      if (!nativeMotion.enabled && !motion.matches &&
          (now < followUntil || progress !== targetProgress))
        frame = requestAnimationFrame(synchronize);
      // A settled/offscreen section needs no DOM writes on subsequent scrolls.
      const viewportVisible = window.scrollY < scrollStart + scrollDistance + stageHeight &&
        window.scrollY + innerHeight > scrollStart;
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
        largeSizes = measurements.map((geometry, index) => {
          if (!geometry) return 1;
          return index === 0 || index === 3 || index === 4
            ? Math.max(
                1,
                Math.min(
                  (stageBounds.width * 0.9) / Math.max(1, geometry.targetWidth),
                  (stageBounds.height * 0.7) / Math.max(1, geometry.targetHeight),
                ),
              )
            : Math.max(
                2.5,
                Math.min(
                  28,
                  (stageBounds.width / Math.max(1, geometry.targetWidth)) * 2.2,
                ),
              );
        });
        nativeMotion.configure(flights.current, measurements, largeSizes,
          scrollStart, scrollDistance, motion.matches);
        measurements.forEach((geometry, index) => {
          if (geometry) prepareFlightSurface(geometry, largeSizes[index]);
        });
        const element = flights.current[0];
        const geometry = measurements[0];
        if (element && geometry && ink.current) {
          const style = getComputedStyle(element);
          const signature = `${geometry.targetWidth}/${geometry.targetHeight}/${style.fontSize}/${style.letterSpacing}`;
          if (signature !== inkSize) {
            inkSize = signature;
            const text = ink.current.querySelector("text")!;
            // offsetTop reads the unscaled baseline without temporarily removing
            // the animated transform (which forced another synchronous layout).
            const baselineY = element.querySelector<HTMLElement>(
              ".intro-baseline",
            )!.offsetTop;
            ink.current.setAttribute(
              "viewBox",
              `0 0 ${geometry.targetWidth} ${geometry.targetHeight}`,
            );
            text.setAttribute("y", String(baselineY));
            text.style.fontFamily = style.fontFamily;
            text.style.fontSize = style.fontSize;
            text.style.fontWeight = style.fontWeight;
            text.style.letterSpacing = style.letterSpacing;
            text.style.setProperty(
              "--ink-length",
              String(parseFloat(style.fontSize) * 4),
            );
          }
        }
        geometryDirty = false;
      }
      viewport.dataset.introProgress = progress.toFixed(3);
      viewport.dataset.portraitReady = String(progress >= 0.82);
      if (portrait) {
        portrait.inert = progress < 0.82;
        if (!nativeMotion.drawingNative) portrait.style.setProperty(
          "--portrait-progress",
          String(Math.max(0, Math.min(1, (progress - 0.24) / 0.72))),
        );
      }
      flights.current.forEach((element, index) => {
        if (nativeMotion.enabled) return;
        const geometry = measurements[index];
        if (!element || !geometry) return;
        const local = Math.max(
          0,
          Math.min(1, (progress - starts[index]) / flightDuration),
        );
        const arrival = local * local * (3 - 2 * local);
        if (index === 5) {
          element.dataset.arrival = arrival.toFixed(3);
          slidingLead(element, local, geometry);
          return;
        }
        const large = largeSizes[index];
        centeredFlight(
          element, geometry, arrival, large, false,
          viewportVisible && progress >= starts[index],
        );
        element.style.opacity =
          progress >= starts[index]
            ? String(Math.min(1, local * 10 + (index === 0 ? 1 : 0)))
            : "0";
        element.dataset.arrival = arrival.toFixed(3);
      });
      dividers.forEach((divider, index) => {
        divider.style.opacity =
          progress >= starts[index + 1] + flightDuration ? ".6" : "0";
      });
      const captionText =
        progress < starts[1]
          ? "Ce que l’on ressent."
          : progress < starts[2]
            ? "Ce que les soins rendent visible."
            : progress < starts[3]
              ? "Ce qui diffère selon les vies."
              : "Une mesure éclaire. Elle laisse aussi une part hors champ.";
      if (caption.current && caption.current.textContent !== captionText)
        caption.current.textContent = captionText;
      if (progressLine.current && !nativeMotion.enabled)
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
      // Continue polling through gaps in scroll-event delivery, then sleep.
      followUntil = performance.now() + 180;
      if (!frame) {
        lastFrameTime = performance.now();
        frame = requestAnimationFrame(synchronize);
      }
    };
    const invalidate = () => {
      geometryDirty = true;
      schedule();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate);
    motion.addEventListener("change", invalidate);
    const observer = new ResizeObserver(invalidate);
    observer.observe(viewport);
    observer.observe(root);
    flights.current.forEach((element) => {
      if (element) observer.observe(element);
    });
    document.fonts.addEventListener("loadingdone", invalidate);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidate);
      motion.removeEventListener("change", invalidate);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", invalidate);
      cancelAnimationFrame(frame);
      nativeMotion.dispose();
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
        {index < 3 ? (
          <FlightLabel text={text}>
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
            ) : text}
          </FlightLabel>
        ) : text}
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
