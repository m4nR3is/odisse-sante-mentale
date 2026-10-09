import { useRef, useState, useEffect, useLayoutEffect } from "react";

export function usePanelReveal(key: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame);
      setProgress(entered ? 1 : 0);
    };
    if (!entered || motion.matches) {
      finish();
      return;
    }
    setProgress(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1000);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    motion.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
    };
  }, [entered, key]);
  return { ref, progress };
}
