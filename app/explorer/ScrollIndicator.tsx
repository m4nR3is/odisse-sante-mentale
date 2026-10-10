import { useId, useLayoutEffect, useRef } from "react";
import { createScrollMotion } from "../animation/scrollMotion";

type ScrollRange = { group: "story" | "explorer"; start: number; count?: number };

export function ScrollIndicator({ progress, range }: { progress: number; range?: ScrollRange }) {
  const ref = useRef<HTMLSpanElement>(null);
  const name = `indicator-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const group = range?.group;
  const start = range?.start;
  const count = range?.count ?? 1;
  useLayoutEffect(() => {
    const bar = ref.current;
    if (!bar || group === undefined || start === undefined) return;
    const native = createScrollMotion(bar, name);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      if (!native.begin(motion.matches)) return;
      const prefix = group === "story" ? "scene" : "explorer-step";
      const first = document.getElementById(`${prefix}-${start + 1}`);
      const last = document.getElementById(`${prefix}-${start + count}`);
      if (!first || !last) return;
      const line = group === "story" ? innerHeight / 2 :
        (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 17;
      const from = scrollY + first.getBoundingClientRect().top - line;
      const to = scrollY + last.getBoundingClientRect().bottom - line;
      native.animate("", "progress", "from{transform:scaleX(0)}to{transform:scaleX(1)}", from, to);
      native.commit();
    };
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); }); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    document.fonts.addEventListener("loadingdone", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      native.dispose();
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      document.fonts.removeEventListener("loadingdone", schedule);
    };
  }, [group, start, count, name]);
  return (
    <span
      ref={ref}
      className="control-scroll-progress"
      aria-hidden="true"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}
