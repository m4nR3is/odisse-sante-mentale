import { useLayoutEffect, useRef, useState } from "react";
import { createScrollMotion, phase, scrollKeyframes } from "../animation/scrollMotion";
import { createScrollFrameLoop } from "../animation/scrollFrameLoop";
import { ScrollIndicator } from "../explorer/ScrollIndicator";
import { FlightLabel, centeredFlight, measureFlight, prepareFlightSurface } from "./introTypography";

export type MethodScene = {
  word: string;
  label: string;
  title: string;
  copy: string;
  takeaway: string;
  rows: string[][];
};

export function MethodStage({ scenes }: { scenes: MethodScene[] }) {
  const landmarks = useRef<Array<HTMLLIElement | null>>([]);
  const stage = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  const lastClick = useRef(0);
  const [reading, setReading] = useState({ scene: 0, reduced: false, click: 0 });
  const step = scenes[reading.scene];

  useLayoutEffect(() => {
    const viewport = stage.current!;
    const element = title.current!;
    const body = viewport.querySelector<HTMLElement>(".method-stage-body")!;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const native = createScrollMotion(viewport, "method", ':not([data-method-click="true"])');
    const keepLast = reading.scene === scenes.length - 1;
    let dirty = true;
    let ranges: Array<{ start: number; height: number }> = [];
    let geometry: ReturnType<typeof measureFlight>;
    let large = 1;
    let baseWidth = 1;
    let largeWidth = 1;
    let clickFrame = 0;
    let clicking = false;
    let previousPosition = -1;
    let previousReduced = motion.matches;
    const content = [
      { element: body.querySelector<HTMLElement>(".chapter")!, start: .17, exit: .77 },
      { element: body.querySelector<HTMLElement>("h4")!, start: .2, exit: .77 },
      { element: body.querySelector<HTMLElement>(".method-reading > p:last-child")!, start: .23, exit: .77 },
      ...Array.from(body.querySelectorAll<HTMLElement>("article"), (element, index) =>
        ({ element, start: .24 + index * .035, exit: .75 + index * .012 })),
      { element: viewport.querySelector<HTMLElement>(".method-takeaway")!, start: .34, exit: .76 },
    ];
    const departure = (p: number, start: number) => keepLast ? 0 : phase(p, start, .16);
    const contentFrame = (p: number, start: number, exit: number) => {
      const enter = phase(p, start, .2);
      const leave = departure(p, exit);
      return { opacity: enter * (1 - leave), y: (1 - enter) * 24 - leave * 38 };
    };
    const titleTransform = (arrival: number) => {
      const width = baseWidth + (largeWidth - baseWidth) * (1 - arrival);
      const scaleY = (1 + (large - 1) * (1 - arrival)) / large;
      return `translate3d(calc(-50% + ${geometry.dx * (1 - arrival)}px),calc(-50% + ${geometry.dy * (1 - arrival)}px),0) scale(${width / largeWidth},${scaleY})`;
    };
    const measure = () => {
      const line = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 18;
      ranges = landmarks.current.map(marker => {
        const bounds = marker!.getBoundingClientRect();
        return { start: scrollY + bounds.top - line, height: bounds.height };
      });
      // The small destination owns layout; the oversized glyphs are prepared
      // once, so neither scroll nor click playback changes font-size/layout.
      const target = element.parentElement!;
      target.style.width = `${element.offsetWidth}px`;
      target.style.height = `${element.offsetHeight}px`;
      const bounds = body.getBoundingClientRect();
      geometry = measureFlight(element, bounds);
      large = Math.max(1, Math.min(5, bounds.width * .88 / geometry.width,
        bounds.height * .55 / geometry.height));
      prepareFlightSurface(geometry, large);
      // The original zoom kept letter-spacing fixed while increasing font-size.
      // Measure that widest word once and compensate its width with transforms,
      // preserving the framing without laying out glyphs during the animation.
      const surface = geometry.surface!;
      surface.style.letterSpacing = geometry.letterSpacing;
      surface.style.width = "max-content";
      surface.style.height = "auto";
      const probe = surface.cloneNode(true) as HTMLElement;
      probe.style.setProperty("animation", "none", "important");
      probe.style.setProperty("transform", "none", "important");
      probe.style.setProperty("visibility", "hidden", "important");
      probe.style.display = "block";
      element.appendChild(probe);
      largeWidth = probe.getBoundingClientRect().width;
      baseWidth = element.getBoundingClientRect().width;
      probe.remove();
      if (native.begin(motion.matches)) {
        const { start, height } = ranges[reading.scene];
        const arrivalEnd = start + .28 * height;
        native.rule(".method-title-flight", "transform:none!important");
        native.animate(".method-title-target", "title-exit", scrollKeyframes(p =>
          `transform:translate3d(0,${-departure(p, .78) * 60}px,0);opacity:${(reading.scene === 0 ? 1 : phase(p, 0, .025)) * (1 - departure(p, .78))}`,
          [0, .025, .78, .94]), start, start + height);
        native.animate(".method-title-flight > .intro-flight-surface", "title-arrival",
          scrollKeyframes(p => {
            const arrival = phase(p, .02 / .28, .26 / .28);
            return `transform:${titleTransform(arrival)}`;
          }, [.02 / .28]), start, arrivalEnd, "display:block;will-change:auto;",
          "0%,99.999%{visibility:visible}100%{visibility:hidden}");
        native.animate(".method-title-flight > .intro-flight-placeholder", "title-destination",
          "0%,99.999%{visibility:hidden}100%{visibility:visible}", start, arrivalEnd);
        content.forEach(({ element, start: enter, exit }, index) => {
          element.dataset.methodContent = String(index);
          native.animate(`[data-method-content="${index}"]`, `content-${index}`,
            scrollKeyframes(p => {
              const frame = contentFrame(p, enter, exit);
              return `opacity:${frame.opacity};transform:translate3d(0,${frame.y}px,0)`;
            }, [enter, enter + .2, exit, exit + .16]), start, start + height);
        });
        body.querySelectorAll<HTMLElement>("article").forEach((article, index) => {
          const selector = `[data-method-content="${index + 3}"]`;
          const from = start + (.24 + index * .035) * height;
          const to = from + .18 * height;
          native.animate(`${selector} .method-rule-line`, `rule-line-${index}`,
            scrollKeyframes(p => `transform:scaleX(${phase(p)})`), from, to);
          native.animate(`${selector} > *:not(.method-rule-line)`, `rule-copy-${index}`,
            scrollKeyframes(p => `clip-path:inset(0 ${(1 - phase(p)) * 100}% 0 0)`), from, to);
        });
        ranges.forEach(({ start, height }, index) => native.animate(
          `[href="#method-step-${index + 1}"][aria-current="step"] .control-scroll-progress`, `progress-${index}`,
          "from{transform:scaleX(0)}to{transform:scaleX(1)}", start, start + height));
        native.commit();
      }
      dirty = false;
      previousPosition = -1;
    };
    const drawScene = (p: number) => {
      const arrival = motion.matches ? 1 : phase(p, .02, .26);
      const leave = motion.matches ? 0 : departure(p, .78);
      centeredFlight(element, geometry, arrival, large);
      geometry.surface!.style.transform = titleTransform(arrival);
      const target = element.parentElement!;
      target.style.transform = `translate3d(0,${-leave * 60}px,0)`;
      target.style.opacity = String(motion.matches ? 1 :
        (reading.scene === 0 ? 1 : phase(p, 0, .025)) * (1 - leave));
      content.forEach(({ element, start, exit }) => {
        const frame = motion.matches ? { opacity: 1, y: 0 } : contentFrame(p, start, exit);
        element.style.opacity = String(frame.opacity);
        element.style.transform = `translate3d(0,${frame.y}px,0)`;
      });
      body.querySelectorAll<HTMLElement>("article").forEach((article, index) => {
        const reveal = motion.matches ? 1 : phase(p, .24 + index * .035, .18);
        article.style.setProperty("--rule-reveal", String(reveal));
      });
    };
    const driver = createScrollFrameLoop(() => {
      if (dirty) measure();
      let scene = 0;
      ranges.forEach((range, index) => { if (scrollY >= range.start) scene = index; });
      const range = ranges[scene];
      return scene + Math.max(0, Math.min(1, (scrollY - range.start) / range.height));
    }, position => {
      if (position === previousPosition && motion.matches === previousReduced) return;
      previousPosition = position;
      previousReduced = motion.matches;
      const scene = Math.min(scenes.length - 1, Math.floor(position));
      const fraction = Math.min(1, position - scene);
      setReading(current => current.scene === scene && current.reduced === motion.matches
        ? current : { ...current, scene, reduced: motion.matches });
      viewport.dataset.methodScene = String(scene);
      viewport.dataset.methodProgress = fraction.toFixed(3);
      viewport.dataset.methodReveal = (motion.matches ? 1 : phase(fraction, .18, .23)).toFixed(3);
      if (scene === reading.scene && !clicking && !native.enabled) drawScene(fraction);
      if (!native.enabled) viewport.querySelectorAll<HTMLElement>(".control-scroll-progress")
        .forEach((bar, index) => { bar.style.transform = `scaleX(${scene === index ? fraction : 0})`; });
    }, () => native.enabled || motion.matches);
    const invalidate = () => { dirty = true; driver.reset(); driver.schedule(); };
    driver.synchronize();
    const cancelClick = () => {
      if (!clicking) return;
      cancelAnimationFrame(clickFrame);
      clicking = false;
      delete viewport.dataset.methodClick;
      previousPosition = -1;
      driver.synchronize();
    };
    if (reading.click !== lastClick.current && !motion.matches) {
      lastClick.current = reading.click;
      clicking = true;
      viewport.dataset.methodClick = "true";
      drawScene(0);
      const started = performance.now();
      const advance = (now: number) => {
        const elapsed = Math.min(1, (now - started) / 1050);
        drawScene(elapsed * .55);
        if (elapsed < 1) clickFrame = requestAnimationFrame(advance);
        else cancelClick();
      };
      clickFrame = requestAnimationFrame(advance);
    }
    const cancelEvents = ["wheel", "touchstart", "keydown"] as const;
    cancelEvents.forEach(event => window.addEventListener(event, cancelClick, { passive: true }));
    window.addEventListener("scroll", driver.schedule, { passive: true });
    window.addEventListener("resize", invalidate);
    motion.addEventListener("change", invalidate);
    document.fonts.addEventListener("loadingdone", invalidate);
    const observer = new ResizeObserver(invalidate);
    observer.observe(body);
    observer.observe(landmarks.current[0]!.parentElement!);
    return () => {
      cancelAnimationFrame(clickFrame);
      delete viewport.dataset.methodClick;
      driver.dispose();
      native.dispose();
      observer.disconnect();
      cancelEvents.forEach(event => window.removeEventListener(event, cancelClick));
      window.removeEventListener("scroll", driver.schedule);
      window.removeEventListener("resize", invalidate);
      motion.removeEventListener("change", invalidate);
      document.fonts.removeEventListener("loadingdone", invalidate);
    };
  }, [reading.scene, reading.reduced, reading.click, scenes]);

  return (
    <div className="method-scroll-track">
      <ol className="method-landmarks" aria-label="Étapes de la méthode">
        {scenes.map((scene, index) => <li key={scene.word} id={`method-step-${index + 1}`}
          ref={element => { landmarks.current[index] = element; }}>
          <span className="sr-only">{scene.word} {scene.title}</span>
        </li>)}
      </ol>
      <div className="method-stage" ref={stage}>
        <nav className="method-steps" aria-label="Parcourir la méthode">
          {scenes.map((scene, index) => <a key={scene.word} href={`#method-step-${index + 1}`}
            aria-current={reading.scene === index ? "step" : undefined}
            onClick={event => {
              event.preventDefault();
              const marker = landmarks.current[index]!;
              const bounds = marker.getBoundingClientRect();
              const line = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 18;
              scrollTo({ top: scrollY + bounds.top - line + bounds.height * .55, behavior: "instant" });
              setReading(current => ({ ...current, scene: index, click: current.click + 1 }));
            }}>
            <span>0{index + 1}</span>{scene.word}<ScrollIndicator progress={0} />
          </a>)}
        </nav>
        <div className="method-stage-body" key={`method-${reading.scene}`}>
          <div className="method-reading">
            <p className="chapter">{step.label}</p>
            <h3><span className="method-title-target"><span className="method-title-flight intro-flight" ref={title}>
              <FlightLabel text={step.word}>{step.word}</FlightLabel>
            </span></span></h3>
            <h4>{step.title}</h4><p>{step.copy}</p>
          </div>
          <div className="method-rules">
            {step.rows.map(([label, title, copy]) => <article key={label}>
              <small>{label}</small><strong>{title}</strong><p>{copy}</p>
              <span className="method-rule-line" aria-hidden="true" />
            </article>)}
          </div>
        </div>
        <p className="method-takeaway">{step.takeaway}</p>
      </div>
    </div>
  );
}
