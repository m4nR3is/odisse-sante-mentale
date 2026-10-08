import { useEffect, type RefObject } from "react";

/** Value points disclose information; selection points keep their own data actions. */
export default function useChartInteractions(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const valuePoint = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const point = target.closest<SVGGElement>('g[data-chart-point="value"]');
      return point && root.current?.contains(point) && point.getAttribute("tabindex") !== "-1" ? point : null;
    };
    const focused = () => valuePoint(document.activeElement);
    const onClick = (event: MouseEvent) => valuePoint(event.target)?.focus({ preventScroll: true });
    const onPointerDown = (event: PointerEvent) => {
      const current = focused();
      if (current && current !== valuePoint(event.target)) current.blur();
    };
    const onPointerOver = (event: PointerEvent) => {
      const next = valuePoint(event.target), current = focused();
      if (next && current && next !== current) current.blur();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const point = valuePoint(event.target);
      if (!point) return;
      if (event.key === "Escape") { event.preventDefault(); point.blur(); }
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); point.blur(); point.focus({ preventScroll: true });
      }
    };
    const dismiss = () => focused()?.blur();
    document.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerover", onPointerOver, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, [root]);
}
