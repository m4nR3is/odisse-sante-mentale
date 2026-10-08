import FacialFeatures from "./FacialFeatures";
import PortraitVariants, { PORTRAIT_COUNT } from "./PortraitVariants";
import { useId, useEffect, useState, type CSSProperties, type PointerEvent, type MouseEvent } from "react";

// Editorial drawing: independent crops, no individual care pathway or quantitative encoding.
export default function IntroPortrait() {
  const id = useId().replace(/:/g, "");
  const [faces, setFaces] = useState(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * PORTRAIT_COUNT)));
  const [hovered, setHovered] = useState<number | null>(null);
  useEffect(() => {
    if (hovered === null || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cycle = window.setInterval(() => {
      if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector(".intro-stage")?.getAttribute("data-portrait-ready") !== "true") return;
      setFaces((current) => current.map((face, index) => index === hovered ? (face + 1) % PORTRAIT_COUNT : face));
    }, 140);
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
        <PortraitVariants id={id} />
        {windows.map((window, i) => <clipPath id={`${id}-window-${i}`} key={i}><rect x={window.x} y={window.y} width={window.w} height={window.h} /></clipPath>)}
        <g id={`${id}-portrait`}>
          {/* Broad, cut-paper masses sit behind the dry pen contours. */}
          <path className="portrait-wash" d="M139 193C119 156 138 105 180 92C228 60 303 80 334 125C351 145 352 177 344 203L321 185L312 150L280 141L256 112L231 143L198 137L170 174Z" />
          <path className="portrait-wash portrait-wash-soft" d="M150 346L169 363L192 376L197 415L128 441L72 507L118 534L213 450L263 423L301 443L371 531L431 504L358 427L303 409L305 352L278 375L223 382Z" />
          <path className="portrait-pen portrait-heavy" pathLength="1" d="M142 194C128 182 125 165 131 149C123 131 139 107 162 105C166 85 192 82 209 86C229 67 257 76 268 83C289 77 312 92 317 106C340 109 352 135 345 151C358 167 351 189 339 201" />
          <path className="portrait-pen" pathLength="1" d="M151 185C140 231 145 272 159 306C164 332 175 351 195 366L224 384C242 393 270 377 289 363C311 345 325 318 331 285L343 218" />
          <path className="portrait-pen portrait-light" pathLength="1" d="M146 190C137 221 138 249 144 273M153 311C162 335 174 354 197 371M301 350C318 331 327 306 333 279" />
          <path className="portrait-pen" pathLength="1" d="M151 226C137 208 125 219 131 240C134 254 142 268 151 266M333 224C348 210 358 221 351 242C345 256 338 263 330 260" />
          <path className="portrait-pen portrait-light" pathLength="1" d="M138 231L143 246L146 239M342 230L337 246" />
          <FacialFeatures variant={0} />
          <path className="portrait-pen portrait-light" pathLength="1" d="M231 351L253 352M173 271L180 283M308 270L300 285" />
          <path className="portrait-pen portrait-heavy" pathLength="1" d="M193 367L193 409C168 417 145 423 125 438L86 486M302 357L303 411C330 416 353 424 370 443L411 492" />
          <path className="portrait-pen" pathLength="1" d="M193 409C209 435 257 443 303 411M174 419C193 460 270 469 321 419M125 439L137 454M370 443L354 459" />
          {/* Unequal hatch spacing and crossed marks give the drawing its hand. */}
          <path className="portrait-pen portrait-hatch" pathLength="1" d="M143 160L170 138M147 172L191 135M152 182L204 138M169 179L217 141M181 172L228 130M214 128L239 104M226 128L247 107M252 106L272 126M268 113L291 136M280 111L309 142M297 118L321 148M312 128L337 160M319 149L341 174M325 170L341 185" />
          <path className="portrait-pen portrait-hatch" pathLength="1" d="M155 281L169 300M158 296L173 318M164 313L182 336M174 334L193 352M285 348L298 329M294 347L309 321M300 330L318 299M190 381L208 405M190 391L218 420M283 388L276 416M295 378L287 415M116 461L150 444M112 474L163 449M355 455L386 476M355 465L397 492" />
          <path className="portrait-pen portrait-accent portrait-brush" pathLength="1" d="M164 202C184 191 204 188 223 190" />
          <path className="portrait-pen portrait-accent" pathLength="1" d="M282 317L303 312M285 323L309 318M291 329L313 325" />
        </g>
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
