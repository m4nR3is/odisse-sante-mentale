type Scene = 0 | 1 | 2 | 3 | 4;

function Oval({ x, y, size = 14 }: { x: number; y: number; size?: number }) {
  return <path className="reading-ink reading-ink-accent" pathLength="1" transform={`translate(${x} ${y}) scale(${size / 14})`} d="M-14-4C-13-13-1-16 9-12C18-9 19 1 14 10C8 17-5 16-12 9C-18 3-18-4-12-9C-5-14 9-16 15-7" />;
}

function RightBracket({ x, top, bottom, size = 14 }: { x: number; top: number; bottom: number; size?: number }) {
  const bend = Math.min(size * .6, (bottom - top) / 4);
  return <path className="reading-ink reading-ink-accent" pathLength="1" d={`M${x} ${top}Q${x + size} ${top - 2} ${x + size} ${top + bend}L${x + size} ${bottom - bend}Q${x + size} ${bottom + 2} ${x} ${bottom}`} />;
}

// Marks follow actual plotted values; they do not alter the data paths or their scales.
export function StoryAnnotations({ scene, mainY, comparisonY, socialEnds }: {
  scene: Scene; mainY: number; comparisonY: number; socialEnds: [number, number];
}) {
  return <g className="story-annotations" aria-hidden="true" key={scene}>
    {scene === 0 || scene === 2 ? <Oval x={534} y={mainY} />
      : scene === 4 ? <><Oval x={socialEnds[0]} y={63} /><Oval x={socialEnds[1]} y={243} /></>
      : <RightBracket x={551} top={Math.min(mainY, comparisonY) - 4} bottom={Math.max(mainY, comparisonY) + 4} />}
  </g>;
}

// A reading aid follows a value or a same-year comparison, never a significance test.
export function ExplorerAnnotation({ x, y, comparisonY, comparisonX, rightX, bracketSize }: { x: number; y: number; comparisonY?: number; comparisonX?: number; rightX?: number; bracketSize?: number }) {
  if (![x, y].every(Number.isFinite)) return null;
  const horizontal = comparisonX != null && Number.isFinite(comparisonX) && Math.abs(x - comparisonX) > 24;
  const left = Math.min(x, comparisonX ?? x), right = Math.max(x, comparisonX ?? x);
  const paired = comparisonY != null && Number.isFinite(comparisonY) && Math.abs(y - comparisonY) > 18;
  const top = paired ? Math.min(y, comparisonY!) : y;
  const bottom = paired ? Math.max(y, comparisonY!) : y;
  return <g className="story-annotations explorer-annotations" aria-hidden="true">
    {horizontal ? <path className="reading-ink reading-ink-accent" pathLength="1" d={`M${left} ${y+12}Q${left-3} ${y+23} ${left+8} ${y+21}L${right-8} ${y+22}Q${right+3} ${y+24} ${right} ${y+12}`} /> : paired ? <RightBracket x={rightX ?? x + 17} top={top} bottom={bottom} size={bracketSize} /> : <Oval x={x} y={y} />}
  </g>;
}

// A selection is encircled; without a regional/department selection, mark the spread rather than an arbitrary point.
export function DistributionAnnotation({ x, y, from, to, height }: { x?: number; y: number; from: number; to: number; height: number }) {
  const size = Math.min(12, height * .18);
  const depth = Math.min(16, height - y - 3);
  return <g className="story-annotations explorer-annotations distribution-annotations" aria-hidden="true">
    {x != null ? <Oval x={x} y={y} size={size} /> : to - from > 24 && <path className="reading-ink reading-ink-accent" pathLength="1" d={`M${from} ${y+depth*.35}Q${from-2} ${y+depth} ${from+8} ${y+depth}L${to-8} ${y+depth}Q${to+2} ${y+depth} ${to} ${y+depth*.35}`} />}
  </g>;
}
