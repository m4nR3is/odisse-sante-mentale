import type { FlightGeometry } from "./introTypography";
import { createScrollMotion, scrollKeyframes, phase } from "../animation/scrollMotion";

export const INTRO_FLIGHT_STARTS = [0, 0.14, 0.28, 0.42, 0.56, 0.7];
export const INTRO_FLIGHT_DURATION = 0.24;

// CSS owns the moving text and progress bar. Unlike scroll-event callbacks,
// scroll timelines can follow asynchronous scrolling on the compositor thread.
// Geometry is compiled only on resize/font changes, never on each scroll frame.
export function createIntroScrollMotion(root: HTMLElement) {
  return createFlightScrollMotion(root, "intro", {
    starts: INTRO_FLIGHT_STARTS, duration: INTRO_FLIGHT_DURATION, lead: 5,
  });
}

export function createFlightScrollMotion(root: HTMLElement, name: string, options: {
  starts: number[];
  duration: number;
  lead: number;
  fromBottom?: (index: number) => boolean;
}) {
  const motion = createScrollMotion(root, name);

  function configure(
    elements: Array<HTMLElement | null>,
    measurements: Array<FlightGeometry | null>,
    largeSizes: number[],
    start: number,
    distance: number,
    reducedMotion: boolean,
  ) {
    const enabled = motion.begin(reducedMotion);
    root.dataset.introMotion = enabled ? "native" : "fallback";
    if (!enabled) return;
    const animate = (
      selector: string,
      name: string,
      frames: string,
      from: number,
      to: number,
      extra = "",
      visibilityFrames?: string,
    ) => {
      motion.animate(selector, name, frames, start + from * distance,
        start + to * distance, extra, visibilityFrames);
    };
    elements.forEach((element, index) => {
      const geometry = measurements[index];
      if (!element || !geometry) return;
      element.dataset.introFlight = String(index);
      const selector = `[data-intro-flight="${index}"]`;
      const from = options.starts[index];
      const to = from + options.duration;
      // Sample the existing smoothstep curve; subpixel trajectory differences
      // stay below one pixel even for the widest oversized labels.
      const frames = (draw: (arrival: number, local: number) => string) =>
        scrollKeyframes(local => draw(phase(local), local));
      if (index === options.lead) {
        motion.rule(selector, "transform:none!important;opacity:1!important");
        geometry.lines.forEach(({ element: line, travel }, lineIndex) => {
          line.dataset.introLine = String(lineIndex);
          const delay = geometry.lines.length > 1
            ? lineIndex / (geometry.lines.length - 1) * 0.4 : 0;
          animate(`${selector} [data-intro-line="${lineIndex}"]`,
            `intro-scroll-lead-${lineIndex}`,
            frames((arrival) => `transform:translate3d(${-travel * (1 - arrival)}px,0,0) scale(${1 + 0.18 * (1 - arrival)});opacity:${arrival}`),
            from + delay * options.duration,
            from + (delay + 0.6) * options.duration);
        });
        return;
      }
      const large = largeSizes[index];
      const dy = options.fromBottom?.(index)
        ? geometry.bottom + geometry.height * large / 2 : geometry.dy;
      const opacity = (local: number) => Math.min(1, local * 10 + (index === 0 ? 1 : 0));
      if (geometry.surface) {
        motion.rule(selector, "transform:none!important");
        animate(selector, `intro-scroll-opacity-${index}`,
          `0%{opacity:${index === 0 ? 1 : 0}}10%,100%{opacity:1}`, from, to);
        animate(`${selector} > .intro-flight-surface`, `intro-scroll-flight-${index}`,
          frames((arrival) => `transform:translate3d(calc(-50% + ${geometry.dx * (1 - arrival)}px),calc(-50% + ${dy * (1 - arrival)}px),0) scale(${(1 + (large - 1) * (1 - arrival)) / large})`),
          // Keep discrete visibility separate from the compositor transform.
          from, to, "display:block;will-change:auto;",
          "0%,99.999%{visibility:visible}100%{visibility:hidden}");
        animate(`${selector} > .intro-flight-placeholder`, `intro-scroll-destination-${index}`,
          "0%,99.999%{visibility:hidden}100%{visibility:visible}", from, to);
      } else {
        animate(selector, `intro-scroll-flight-${index}`,
          frames((arrival, local) => `transform:translate3d(${geometry.dx * (1 - arrival)}px,${dy * (1 - arrival)}px,0) scale(${1 + (large - 1) * (1 - arrival)});opacity:${opacity(local)}`),
          from, to);
      }
    });
    animate(".intro-progress", "intro-scroll-progress",
      "from{transform:scaleX(0)}to{transform:scaleX(1)}", 0, 1);
    if ("registerProperty" in CSS) {
      if (name === "intro") animate(".intro-portrait", "portrait-drawing",
        "from{--portrait-progress:0}to{--portrait-progress:1}", .24, .96);
      if (name === "conclusion") animate(".conclusion-portrait", "portrait-drawing",
        "from{--portrait-progress:0;--conclusion-portrait-progress:0}to{--portrait-progress:1;--conclusion-portrait-progress:1}", .4, .96);
    }
    motion.commit();
  }

  return {
    configure,
    get enabled() { return motion.enabled; },
    get drawingNative() { return motion.enabled && "registerProperty" in CSS; },
    dispose() {
      motion.dispose();
      delete root.dataset.introMotion;
    },
  };
}
