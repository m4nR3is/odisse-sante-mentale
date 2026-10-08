import PortraitDefinitions from "./PortraitDefinitions";
import { PORTRAIT_COUNT } from "./PortraitVariants";
import { useId, useEffect, useState, type CSSProperties, type PointerEvent, type MouseEvent } from "react";

// Editorial drawing: independent crops, no individual care pathway or quantitative encoding.
export default function IntroPortrait() {
  const id = useId().replace(/:/g, "");
  const [faces, setFaces] = useState(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * PORTRAIT_COUNT)));
  const [hovered, setHovered] = useState<number | null>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cycle = window.setInterval(() => {
      if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector(".intro-stage")?.getAttribute("data-portrait-ready") !== "true") return;
      const portrait = document.querySelector<HTMLElement>(".intro-portrait");
      const bounds = portrait?.getBoundingClientRect();
      if (!bounds || !bounds.height || bounds.bottom <= 0 || bounds.top >= innerHeight) return;
      const quarter = hovered ?? Math.floor(Math.random() * 4);
      setFaces((current) => current.map((face, index) => index === quarter
        ? (face + (hovered === null ? 1 + Math.floor(Math.random() * (PORTRAIT_COUNT - 1)) : 1)) % PORTRAIT_COUNT
        : face));
    }, hovered === null ? 500 : 140);
    return () => window.clearInterval(cycle);
  }, [hovered]);
  const windows = [
    { name: "Déclaré", x: 75, y: 85, w: 183, h: 178, labelX: 75, labelY: 72, frame: "M74 87 L256 83 L260 259 L77 265 Z", start: 0 },
    { name: "Urgences", x: 279, y: 139, w: 159, h: 174, labelX: 282, labelY: 127, frame: "M278 141 L435 136 L440 312 L281 314 Z", start: .12 },
    { name: "Hôpital", x: 57, y: 293, w: 202, h: 177, labelX: 57, labelY: 489, frame: "M57 294 L257 290 L261 468 L60 472 Z", start: .22 },
    { name: "Décès", x: 281, y: 336, w: 156, h: 152, labelX: 283, labelY: 507, frame: "M283 335 L440 338 L435 491 L280 487 Z", start: .32 },
  ];
  const attract = (event: PointerEvent<HTMLAnchorElement>, window: typeof windows[number]) => {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const svg = event.currentTarget.closest("svg");
    const matrix = svg?.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    event.currentTarget.style.setProperty("--magnet-x", `${Math.max(-9, Math.min(9, (point.x - window.x - window.w / 2) * .1))}px`);
    event.currentTarget.style.setProperty("--magnet-y", `${Math.max(-9, Math.min(9, (point.y - window.y - window.h / 2) * .1))}px`);
  };
  const release = (element: HTMLAnchorElement) => {
    element.style.setProperty("--magnet-x", "0px");
    element.style.setProperty("--magnet-y", "0px");
  };
  const open = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const marker = document.getElementById(`explorer-step-${[1, 7, 8, 10][index]}`);
    if (!marker) return;
    event.preventDefault();
    release(event.currentTarget);
    const line = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 16;
    window.scrollTo({ top: scrollY + marker.getBoundingClientRect().top - line, behavior: "instant" });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll<HTMLButtonElement>(".explorer-mode.data-types button")[index]?.focus({ preventScroll: true });
    }));
  };
  return <figure className="intro-portrait" inert aria-label="Explorer les quatre regards sur la santé mentale">
    <svg viewBox="0 0 510 590" fill="none" focusable="false">
      <defs>
        <PortraitDefinitions id={id} />
        {windows.map((window, i) => <clipPath id={`${id}-window-${i}`} key={i}><rect x={window.x} y={window.y} width={window.w} height={window.h} /></clipPath>)}

      </defs>
      {/* A few abandoned pencil marks remain outside the four windows. */}
      <g className="portrait-construction" aria-hidden="true">
        <path className="portrait-pen" pathLength="1" d="M61 108L61 64L113 64M460 299L460 323L444 323M35 435L35 485L73 485M264 43L268 59M264 535L284 535M50 284L67 284" />
        <path className="portrait-pen portrait-light" pathLength="1" d="M101 98C148 38 258 25 326 72M197 392L207 430M313 495L335 514" />
      </g>
      {windows.map((window, i) => <a className="portrait-link" href={`#explorer-step-${[1, 7, 8, 10][i]}`} key={window.name} aria-label={`Explorer : ${window.name}`} onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(i); }} onFocus={() => setHovered(i)} onPointerMove={(event) => attract(event, window)} onPointerLeave={(event) => { release(event.currentTarget); setHovered(null); }} onBlur={(event) => { release(event.currentTarget); setHovered(null); }} onClick={(event) => open(event, i)}>
        <rect className="portrait-hit" x={window.x - 6} y={window.y - 20} width={window.w + 12} height={window.h + 44} />
        <g className="portrait-magnet"><g className="portrait-window" style={{ "--window-start": window.start } as CSSProperties} aria-hidden="true">
        <path className="portrait-frame portrait-pen" pathLength="1" d={window.frame} />
        <g clipPath={`url(#${id}-window-${i})`} data-face={faces[i]}>{Array.from({ length: PORTRAIT_COUNT }, (_, face) => face).map((face) => <use key={face} className="portrait-face" data-visible={faces[i] === face} href={`#${id}-portrait${face === 0 ? "" : `-${face}`}`} />)}</g>
        <text className="portrait-label" x={window.labelX} y={window.labelY}>{window.name.toUpperCase()}</text>
      </g></g></a>)}
      <path aria-hidden="true" className="portrait-pen portrait-accent portrait-signature" pathLength="1" d="M87 531C141 526 189 529 233 527M91 537L156 534" />
      <text aria-hidden="true" className="portrait-caption" x="87" y="559">QUATRE REGARDS</text>
      <text aria-hidden="true" className="portrait-caption portrait-caption-muted" x="87" y="574">UN PORTRAIT INCOMPLET</text>
    </svg>
  </figure>;
}
