import { useState, useRef, useEffect } from "react";
import { type StoryScene } from "./storyTypes";

export function useStoryScroll() {
  const [scene, setScene] = useState<StoryScene>(0);
  const [storyPosition, setStoryPosition] = useState(0);
  const steps = useRef<Array<HTMLElement | null>>([]);
  useEffect(() => {
    let frame = 0;
    // The same viewport position always selects the same scene, in either direction.
    const synchronize = () => {
      frame = 0;
      const readingLine = window.innerHeight / 2;
      let activeScene: StoryScene = 0;
      steps.current.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top <= readingLine) {
          activeScene = index as StoryScene;
        }
      });
      setScene((current) => (current === activeScene ? current : activeScene));
      const bounds = steps.current[activeScene]?.getBoundingClientRect();
      const fraction = bounds
        ? Math.max(
            0,
            Math.min(
              1,
              (readingLine - bounds.top) / Math.max(1, bounds.height),
            ),
          )
        : 0;
      setStoryPosition(activeScene + fraction);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    const container = steps.current[0]?.parentElement;
    if (container) observer.observe(container);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return { scene, storyPosition, steps };
}
