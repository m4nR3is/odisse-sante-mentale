import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import PortraitDefinitions from "./PortraitDefinitions";
import { PORTRAIT_COUNT } from "./PortraitVariants";

const FRAMES = [
  "M54 36L457 31L465 550L49 557Z",
  "M49 31L461 40L456 558L55 551Z",
  "M55 40L463 34L458 550L48 560Z",
  "M48 34L456 29L467 555L56 560Z",
  "M57 30L466 38L458 560L50 552Z",
  "M51 39L456 32L466 551L55 561Z",
];

function randomIndex(length: number) {
  const values = new Uint32Array(1);
  const limit = Math.floor(4294967296 / length) * length;
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % length;
}

function newPortrait(available: number[]) {
  const face = available.splice(randomIndex(available.length), 1)[0];
  return { face, drawing: 0.54 + randomIndex(15) / 100 };
}

// Whole editorial portraits; the grid does not encode a population or statistic.
export default function ConclusionPortrait() {
  const id = useId().replace(/:/g, "");
  const root = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState({ columns: 2, rows: 3 });
  const [portraits] = useState(() => {
    const available = Array.from(
      { length: PORTRAIT_COUNT },
      (_, index) => index,
    );
    return Array.from({ length: PORTRAIT_COUNT }, () => newPortrait(available));
  });
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const mobile = matchMedia("(max-width: 650px)").matches;
      const columns = Math.max(
        1,
        Math.min(4, Math.floor(width / (mobile ? 100 : 145))),
      );
      const rows = mobile
        ? 2
        : Math.max(1, Math.min(3, Math.floor(height / 160)));
      setLayout((current) =>
        current.columns === columns && current.rows === rows
          ? current
          : { columns, rows },
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  return (
    <figure
      ref={root}
      className="conclusion-portrait"
      aria-hidden="true"
      data-columns={layout.columns}
      data-rows={layout.rows}
      style={{
        gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
      }}
    >
      <svg
        className="conclusion-portrait-definitions"
        width="0"
        height="0"
        focusable="false"
      >
        <defs>
          <PortraitDefinitions
            id={id}
            faces={portraits
              .slice(0, layout.columns * layout.rows)
              .map((portrait) => portrait.face)}
          />
        </defs>
      </svg>
      {portraits
        .slice(0, layout.columns * layout.rows)
        .map((portrait, index) => (
          <svg
            className="conclusion-portrait-cell"
            key={index}
            viewBox="0 0 510 590"
            fill="none"
            focusable="false"
            style={
              {
                "--portrait-progress": `calc(var(--conclusion-portrait-progress, 0) * ${portrait.drawing})`,
              } as CSSProperties
            }
          >
            <defs>
              <clipPath id={`${id}-frame-${index}`}>
                <path d={FRAMES[index % FRAMES.length]} />
              </clipPath>
            </defs>
            <g
              clipPath={`url(#${id}-frame-${index})`}
              data-face={portrait.face}
            >
              <use
                href={`#${id}-portrait${portrait.face === 0 ? "" : `-${portrait.face}`}`}
              />
            </g>
            <path
              className="conclusion-portrait-frame portrait-pen"
              pathLength="1"
              d={FRAMES[index % FRAMES.length]}
            />
          </svg>
        ))}
    </figure>
  );
}
