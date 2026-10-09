import { type StoryScene, type StoryDrawing } from "./storyTypes";
import { useState, useRef, useEffect } from "react";

export function useStoryDrawing(scene: StoryScene, entered: boolean) {
  const [drawing, setDrawing] = useState<StoryDrawing>({
    scene,
    main: 0,
    mainStart: 0,
    boys: 0,
    boysStart: 0,
    social: 0,
  });
  const current = useRef(drawing);
  useEffect(() => {
    if (!entered) return;
    let frame = 0;
    const publish = (next: StoryDrawing) => {
      current.current = next;
      setDrawing(next);
    };
    const complete = {
      scene,
      main: 1,
      mainStart: 0,
      boys: scene === 1 || scene === 3 ? 1 : 0,
      boysStart: 0,
      social: scene === 4 ? 1 : 0,
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame);
      publish(complete);
    };
    if (motion.matches) {
      finish();
      return;
    }
    const animate = (
      from: StoryDrawing,
      to: StoryDrawing,
      duration: number,
      done?: () => void,
    ) => {
      if (
        from.main === to.main &&
        from.boys === to.boys &&
        from.social === to.social &&
        from.mainStart === to.mainStart &&
        from.boysStart === to.boysStart
      ) {
        publish(to);
        done?.();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t);
        publish({
          scene: to.scene,
          main: from.main + (to.main - from.main) * eased,
          mainStart: from.mainStart + (to.mainStart - from.mainStart) * eased,
          boys: from.boys + (to.boys - from.boys) * eased,
          boysStart: from.boysStart + (to.boysStart - from.boysStart) * eased,
          social: from.social + (to.social - from.social) * eased,
        });
        if (t < 1) frame = requestAnimationFrame(tick);
        else done?.();
      };
      frame = requestAnimationFrame(tick);
    };
    const from = current.current;
    if (from.scene === scene) {
      animate(from, complete, scene === 4 ? 1600 : 650);
    } else {
      // Keep the girls' curve when adding/removing the same-age comparison.
      const keepGirls =
        (from.scene === 2 || from.scene === 3) && (scene === 2 || scene === 3);
      // Advance the disappearing edge from 2019 towards 2024.
      const erased = {
        ...from,
        mainStart: keepGirls ? from.mainStart : from.main,
        boysStart: from.boys,
        social: 0,
      };
      animate(from, erased, 650, () => {
        const next = {
          scene,
          main: keepGirls ? erased.main : 0,
          mainStart: keepGirls ? erased.mainStart : 0,
          boys: 0,
          boysStart: 0,
          social: 0,
        };
        publish(next);
        animate(next, complete, scene === 4 ? 1600 : 750);
      });
    }
    motion.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
    };
  }, [entered, scene]);
  return drawing;
}
