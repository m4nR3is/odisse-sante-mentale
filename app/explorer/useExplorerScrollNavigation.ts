import { useState, useRef, useEffect } from "react";
import { EXPLORER_STEPS } from "./explorerSteps";

// Les commandes et le scroll utilisent les mêmes repères DOM.
export function useExplorerScrollNavigation() {
  const [stepIndex, setStepIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const step = EXPLORER_STEPS[stepIndex];
  const landmarks = useRef<Array<HTMLLIElement | null>>([]);
  const lab = useRef<HTMLDivElement>(null);
  const navigateStep = (index: number) => {
    const marker = landmarks.current[index];
    if (!marker) return;
    const line =
      (document.querySelector(".topbar")?.getBoundingClientRect().bottom ??
        60) + 16;
    window.scrollTo({
      top: window.scrollY + marker.getBoundingClientRect().top - line,
      behavior: "instant",
    });
  };
  useEffect(() => {
    let frame = 0;
    const synchronize = () => {
      frame = 0;
      const line =
        (document.querySelector(".topbar")?.getBoundingClientRect().bottom ??
          60) + 17;
      let index = 0;
      landmarks.current.forEach((marker, candidate) => {
        if (marker && marker.getBoundingClientRect().top <= line)
          index = candidate;
      });
      setStepIndex((current) => (current === index ? current : index));
      const bounds = landmarks.current[index]?.getBoundingClientRect();
      const fraction = bounds
        ? Math.max(
            0,
            Math.min(1, (line - bounds.top) / Math.max(1, bounds.height)),
          )
        : 0;
      setScrollPosition(index + fraction);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    if (landmarks.current[0]?.parentElement)
      observer.observe(landmarks.current[0].parentElement);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return { stepIndex, scrollPosition, step, landmarks, lab, navigateStep };
}
