// Fallback for engines without scroll timelines: keep sampling through gaps in
// notifications, then sleep when settled. Native consumers only update discrete
// interactive state in response to events, leaving visual motion to CSS.
export function createScrollFrameLoop(
  read: () => number,
  draw: (progress: number) => void,
  immediate: () => boolean,
) {
  let frame = 0;
  let current = -1;
  let previousTime = 0;
  let followUntil = 0;
  const tick = (now: number) => {
    frame = 0;
    const target = read();
    if (immediate() || current < 0 || Math.abs(target - current) > .35) current = target;
    else {
      const elapsed = Math.min(64, Math.max(0, now - previousTime));
      current += (target - current) * (1 - Math.exp(-elapsed / 45));
      if (Math.abs(target - current) < .000001) current = target;
    }
    previousTime = now;
    draw(current);
    if (!immediate() && (now < followUntil || current !== target))
      frame = requestAnimationFrame(tick);
  };
  return {
    synchronize() {
      cancelAnimationFrame(frame);
      frame = 0;
      current = -1;
      tick(performance.now());
    },
    schedule() {
      followUntil = performance.now() + 180;
      if (!frame) {
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    },
    reset() { current = -1; },
    dispose() { cancelAnimationFrame(frame); },
  };
}
