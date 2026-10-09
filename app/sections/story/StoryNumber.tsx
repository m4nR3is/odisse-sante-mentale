import { useRef, useState, useEffect } from "react";
import { formatNumber, formatSignedPercent } from "../../charts/format";

export function StoryNumber({
  value,
  ratio = false,
  digits = 0,
}: {
  value: number;
  ratio?: boolean;
  digits?: number;
}) {
  const element = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const format = (number: number) =>
    ratio ? `× ${formatNumber(number)}` : formatSignedPercent(number, digits);
  useEffect(() => {
    if (!element.current) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { threshold: 0.6 },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame);
      setDisplayed(visible ? value : 0);
    };
    if (!visible || motion.matches) {
      finish();
      return;
    }
    setDisplayed(0);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1000);
      setDisplayed(value * progress * progress * (3 - 2 * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    motion.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
    };
  }, [value, visible]);
  return (
    <strong ref={element} aria-label={format(value)} data-value={displayed}>
      <span aria-hidden="true">{format(displayed)}</span>
    </strong>
  );
}
