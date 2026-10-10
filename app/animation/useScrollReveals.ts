import { useLayoutEffect, type RefObject } from "react";
import { createScrollMotion } from "./scrollMotion";

// Source ledger / method heading: these wipes are linked to viewport crossing,
// not to a slide. Cache their document positions and let CSS follow the scroll.
export function useScrollReveals(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const native = createScrollMotion(root, "source-reveals");
    let dirty = true;
    let frame = 0;
    let reveals: Array<{ element: HTMLElement; start: number; distance: number }> = [];
    const synchronize = () => {
      frame = 0;
      if (dirty) {
        reveals = Array.from(root.querySelectorAll<HTMLElement>(".method-reveal"), element => ({
          element, start: scrollY + element.getBoundingClientRect().top - innerHeight * .9,
          distance: innerHeight * .25,
        }));
        if (native.begin(motion.matches)) {
          reveals.forEach(({ element, start, distance }, index) => {
            element.dataset.scrollReveal = String(index);
            native.animate(`[data-scroll-reveal="${index}"]`, `wipe-${index}`,
              "from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0% 0 0)}", start, start + distance);
          });
          native.commit();
        }
        dirty = false;
      }
      if (native.enabled) return;
      reveals.forEach(({ element, start, distance }) => {
        const progress = motion.matches ? 1 : Math.max(0, Math.min(1, (scrollY - start) / distance));
        const value = `inset(0 ${(1 - progress) * 100}% 0 0)`;
        if (element.style.clipPath !== value) element.style.clipPath = value;
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(synchronize); };
    const invalidate = () => { dirty = true; schedule(); };
    const observer = new ResizeObserver(invalidate);
    observer.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate);
    motion.addEventListener("change", invalidate);
    document.fonts.addEventListener("loadingdone", invalidate);
    synchronize();
    return () => {
      cancelAnimationFrame(frame);
      native.dispose();
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidate);
      motion.removeEventListener("change", invalidate);
      document.fonts.removeEventListener("loadingdone", invalidate);
    };
  }, [ref]);
}
