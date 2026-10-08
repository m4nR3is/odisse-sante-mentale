import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export default function ViewportTooltip({ x, y, className = "", children }: { x: number; y: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y, vertical: "above", horizontal: "right" });
  useLayoutEffect(() => {
    const tooltip = ref.current;
    if (!tooltip) return;
    const margin = 12, gap = 14;
    const bounds = tooltip.getBoundingClientRect();
    const horizontal = x + gap + bounds.width <= window.innerWidth - margin ? "right" : "left";
    const vertical = y - gap - bounds.height >= margin ? "above" : "below";
    const preferredLeft = horizontal === "right" ? x + gap : x - gap - bounds.width;
    const preferredTop = vertical === "above" ? y - gap - bounds.height : y + gap;
    setPosition({ left: Math.max(margin, Math.min(preferredLeft, window.innerWidth - bounds.width - margin)), top: Math.max(margin, Math.min(preferredTop, window.innerHeight - bounds.height - margin)), vertical, horizontal });
  }, [x, y, children]);
  return createPortal(<div ref={ref} className={`distribution-tooltip${className ? ` ${className}` : ""}`} data-placement={position.vertical} data-anchor-side={position.horizontal} style={{ left: position.left, top: position.top }} aria-hidden="true">{children}</div>, document.body);
}

