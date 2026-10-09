import { useRef, useState, useLayoutEffect } from "react";

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

// Both opening and closing fly along a straight line from the viewport centre.
export function centeredFlight(
  element: HTMLElement,
  stageBounds: DOMRect,
  arrival: number,
  large: number,
  fromBottom = false,
) {
  const target = element.parentElement!.getBoundingClientRect();
  const dx =
    stageBounds.left +
    stageBounds.width / 2 -
    (target.left + element.offsetLeft + element.offsetWidth / 2);
  const originY = fromBottom
    ? stageBounds.bottom + (element.offsetHeight * large) / 2 + 24
    : stageBounds.top + stageBounds.height / 2;
  const dy =
    originY - (target.top + element.offsetTop + element.offsetHeight / 2);
  element.style.transform =
    arrival === 1
      ? "none"
      : `translate(${dx * (1 - arrival)}px, ${dy * (1 - arrival)}px) scale(${1 + (large - 1) * (1 - arrival)})`;
}

export function slidingLead(element: HTMLElement, local: number) {
  const target = element.parentElement!.getBoundingClientRect();
  element.style.transform = "none";
  element.style.opacity = "1";
  const lines = element.querySelectorAll<HTMLElement>(".intro-lead-line");
  lines.forEach((line, index) => {
    const delay = lines.length > 1 ? (index / (lines.length - 1)) * 0.4 : 0;
    const phase = Math.max(0, Math.min(1, (local - delay) / 0.6));
    const arrival = phase * phase * (3 - 2 * phase);
    const travel = target.left + line.offsetLeft + line.offsetWidth * 1.09 + 32;
    line.style.transform =
      arrival === 1
        ? "none"
        : `translateX(${-travel * (1 - arrival)}px) scale(${1 + 0.18 * (1 - arrival)})`;
    line.style.opacity = String(arrival);
  });
}
