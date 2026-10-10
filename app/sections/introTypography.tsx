import { useRef, useState, useLayoutEffect, type ReactNode } from "react";

// Keep the destination in normal flow, but rasterize the animated label at its
// largest size once. Shrinking that layer avoids repeatedly painting/upscaling
// tiny glyphs during scroll on mobile WebKit.
export function FlightLabel({ text, children }: {
  text: string;
  children: ReactNode;
}) {
  return (
    <>
      <span className="intro-flight-placeholder" aria-hidden="true">
        {text}<span className="intro-baseline" />
      </span>
      <span className="sr-only">{text}</span>
      <span className="intro-flight-surface" aria-hidden="true">{children}</span>
    </>
  );
}

const INTRO_LEAD =
  "Enquêtes sur les troubles déclarés, urgences et hospitalisations pour gestes auto-infligés, décès par suicide : quatre regards sur certaines manifestations de la souffrance psychique. Chaque source éclaire une dimension différente. Aucune ne suffit à décrire toute la santé mentale.";

export function IntroLeadLines({
  register,
  text = INTRO_LEAD,
}: {
  register: (element: HTMLSpanElement | null) => void;
  text?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState([text]);
  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    let signature = "";
    const measure = () => {
      const style = getComputedStyle(parent);
      const next = `${parent.clientWidth}/${style.fontSize}/${style.lineHeight}`;
      if (next === signature) return;
      signature = next;
      const probe = document.createElement("span");
      probe.style.cssText =
        "position:absolute;display:block;visibility:hidden;pointer-events:none;white-space:normal;";
      probe.style.width = `${parent.clientWidth}px`;
      probe.textContent = text;
      parent.appendChild(probe);
      const node = probe.firstChild!;
      const range = document.createRange();
      const wrapped: string[] = [];
      let previousTop = -Infinity;
      for (const word of text.matchAll(/\S+/g)) {
        range.setStart(node, word.index!);
        range.setEnd(node, word.index! + word[0].length);
        const top = range.getBoundingClientRect().top;
        if (Math.abs(top - previousTop) > 1) wrapped.push(word[0]);
        else wrapped[wrapped.length - 1] += ` ${word[0]}`;
        previousTop = top;
      }
      probe.remove();
      setLines(wrapped);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [text]);
  return (
    <span
      className="intro-flight intro-lead-flight"
      ref={(element) => {
        ref.current = element;
        register(element);
      }}
    >
      <span className="sr-only">{text}</span>
      {lines.map((line, index) => (
        <span
          className="intro-lead-line"
          key={`${index}-${line}`}
          aria-hidden="true"
        >
          {line}
          {index < lines.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

// Read all destinations before applying any styles. These dimensions are stable
// during sticky scrolling; only a resize, font load or rewrapped lead invalidates them.
export function measureFlight(element: HTMLElement, stageBounds: DOMRect) {
  const target = element.parentElement!.getBoundingClientRect();
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const style = getComputedStyle(element);
  return {
    width,
    height,
    targetWidth: target.width,
    targetHeight: target.height,
    surface: element.querySelector<HTMLElement>(".intro-flight-surface"),
    fontSize: parseFloat(style.fontSize),
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    dx: stageBounds.left + stageBounds.width / 2 -
      (target.left + element.offsetLeft + width / 2),
    dy: stageBounds.top + stageBounds.height / 2 -
      (target.top + element.offsetTop + height / 2),
    bottom: stageBounds.bottom + 24 -
      (target.top + element.offsetTop + height / 2),
    lines: Array.from(
      element.querySelectorAll<HTMLElement>(".intro-lead-line"),
      (line) => ({
        element: line,
        travel: target.left + line.offsetLeft + line.offsetWidth * 1.09 + 32,
      }),
    ),
  };
}

export type FlightGeometry = ReturnType<typeof measureFlight>;

export function prepareFlightSurface(geometry: FlightGeometry, large: number) {
  const surface = geometry.surface;
  if (!surface) return;
  surface.style.width = `${geometry.targetWidth * large}px`;
  surface.style.height = `${geometry.targetHeight * large}px`;
  surface.style.fontSize = `${geometry.fontSize * large}px`;
  surface.style.lineHeight = geometry.lineHeight === "normal"
    ? "normal" : `${parseFloat(geometry.lineHeight) * large}px`;
  surface.style.letterSpacing = geometry.letterSpacing === "normal"
    ? "normal" : `${parseFloat(geometry.letterSpacing) * large}px`;
}

// Both opening and closing fly along a straight line from the viewport centre.
export function centeredFlight(
  element: HTMLElement,
  geometry: FlightGeometry,
  arrival: number,
  large: number,
  fromBottom = false,
  visible = true,
) {
  const { dx } = geometry;
  const dy = fromBottom
    ? geometry.bottom + geometry.height * large / 2
    : geometry.dy;
  if (geometry.surface) {
    const animated = visible && arrival < 1;
    const surface = geometry.surface;
    element.style.transform = "none";
    element.dataset.composited = String(animated);
    surface.style.willChange = animated ? "transform, opacity" : "auto";
    surface.style.transform = `translate3d(calc(-50% + ${dx * (1 - arrival)}px), calc(-50% + ${dy * (1 - arrival)}px), 0) scale(${(1 + (large - 1) * (1 - arrival)) / large})`;
    return;
  }
  element.style.transform =
    arrival === 1
      ? "none"
      : `translate(${dx * (1 - arrival)}px, ${dy * (1 - arrival)}px) scale(${1 + (large - 1) * (1 - arrival)})`;
}

export function slidingLead(
  element: HTMLElement,
  local: number,
  geometry: FlightGeometry,
) {
  element.style.transform = "none";
  element.style.opacity = "1";
  const lines = geometry.lines;
  lines.forEach(({ element: line, travel }, index) => {
    const delay = lines.length > 1 ? (index / (lines.length - 1)) * 0.4 : 0;
    const phase = Math.max(0, Math.min(1, (local - delay) / 0.6));
    const arrival = phase * phase * (3 - 2 * phase);
    line.style.transform =
      arrival === 1
        ? "none"
        : `translateX(${-travel * (1 - arrival)}px) scale(${1 + 0.18 * (1 - arrival)})`;
    line.style.opacity = String(arrival);
  });
}
