// Compile scroll animations only when their geometry changes. Moving transforms
// and opacity stay independent of JavaScript scroll-event delivery.
export function createScrollMotion(root: HTMLElement, name: string, scopeSuffix = "") {
  const supported = CSS.supports("animation-timeline", "scroll(root block)") &&
    CSS.supports("animation-range", "0px 1px");
  const sheet = document.createElement("style");
  sheet.dataset.scrollMotionSheet = name;
  const scope = `[data-scroll-motion="${name}"]${scopeSuffix}`;
  let enabled = false;
  let rules: string[] = [];

  return {
    begin(reduced: boolean) {
      enabled = supported && !reduced;
      rules = [];
      if (enabled) root.dataset.scrollMotion = name;
      else {
        delete root.dataset.scrollMotion;
        sheet.remove();
      }
      return enabled;
    },
    rule(selector: string, declarations: string) {
      rules.push(`${scope} ${selector}{${declarations}}`);
    },
    animate(selector: string, key: string, frames: string, from: number, to: number,
      extra = "", visibilityFrames?: string) {
      const animation = `${name}-${key}`;
      if (visibilityFrames)
        rules.push(`@keyframes ${animation}-visibility{${visibilityFrames}}`);
      rules.push(`@keyframes ${animation}{${frames}}`, `${scope} ${selector}{
        animation:${animation} 1s linear both${visibilityFrames ? `,${animation}-visibility 1s linear both` : ""};
        animation-timeline:scroll(root block);
        animation-range:${from}px ${Math.max(from + 1, to)}px;
        ${extra}
      }`);
    },
    commit() {
      if (!enabled) return;
      sheet.textContent = rules.join("\n");
      if (!sheet.isConnected) document.head.appendChild(sheet);
    },
    get enabled() { return enabled; },
    dispose() {
      sheet.remove();
      delete root.dataset.scrollMotion;
    },
  };
}

export const phase = (position: number, start = 0, duration = 1) => {
  const local = Math.max(0, Math.min(1, (position - start) / duration));
  return local * local * (3 - 2 * local);
};

// Include phase boundaries exactly as well as regular samples. This preserves
// the reading holds and blank intervals without rounding their timing.
export function scrollKeyframes(draw: (position: number) => string, boundaries: number[] = []) {
  const points = new Set([...Array.from({ length: 193 }, (_, i) => i / 192), ...boundaries]);
  const intervals = [...new Set([0, ...boundaries, 1])].sort((a, b) => a - b);
  intervals.slice(1).forEach((end, index) => {
    const start = intervals[index];
    // Brief fades need the same precision as long flights: a uniform grid over
    // the whole slide otherwise undersamples the first 2.5% of a title's entry.
    if (end - start > 0 && end - start < .05)
      for (let sample = 1; sample < 32; sample++) points.add(start + (end - start) * sample / 32);
  });
  return [...points].sort((a, b) => a - b)
    .map(position => `${position * 100}%{${draw(position)}}`).join("");
}
