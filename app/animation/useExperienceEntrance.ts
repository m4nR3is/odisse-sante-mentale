import { useLayoutEffect, type RefObject } from "react";

// Release the opening sequence on interaction or after its original duration.
export function useExperienceEntrance(entrance: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = entrance.current;
    if (!root) return;
    root.classList.add("entrance-pending");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => root.classList.remove("entrance-pending");
    const startScroll = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startScroll) > 4) finish();
    };
    const onMotion = () => {
      if (motion.matches) finish();
    };
    if (
      motion.matches ||
      window.scrollY > 4 ||
      (window.location.hash && window.location.hash !== "#top")
    )
      finish();
    const timer = window.setTimeout(finish, 1700);
    window.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("focusin", finish);
    motion.addEventListener("change", onMotion);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("focusin", finish);
      motion.removeEventListener("change", onMotion);
    };
  }, []);
}
