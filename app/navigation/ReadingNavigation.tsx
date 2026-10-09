import { useRef, useState, useEffect, type CSSProperties } from "react";

const READING_SECTIONS = [
  { id: "constats", label: "Comprendre" },
  { id: "territoires", label: "Explorer" },
  { id: "methode", label: "Méthode" },
];

export function ReadingNavigation() {
  const header = useRef<HTMLElement>(null);
  const [reading, setReading] = useState({ active: -1, progress: 0 });
  useEffect(() => {
    let frame = 0;
    let previousScroll = window.scrollY;
    const synchronize = () => {
      frame = 0;
      const readingLine =
        (header.current?.getBoundingClientRect().bottom ?? 60) + 17;
      const scrolled = window.scrollY !== previousScroll;
      previousScroll = window.scrollY;
      const observations = document.getElementById("constats");
      let active = -1;
      let progress = 0;
      READING_SECTIONS.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const next = document.getElementById(
          READING_SECTIONS[index + 1]?.id ?? "",
        );
        const end = next?.getBoundingClientRect().top ?? bounds.bottom;
        if (bounds.top <= readingLine && end > readingLine) {
          active = index;
          progress =
            Math.round(
              Math.max(
                0,
                Math.min(
                  1,
                  (readingLine - bounds.top) / Math.max(1, end - bounds.top),
                ),
              ) * 1000,
            ) / 1000;
        }
      });
      if (scrolled && observations) {
        const inIntro = observations.getBoundingClientRect().top > readingLine;
        // These closing sections have their own URLs without adding menu entries.
        const closingSection = ["sources", "conclusion"].find((id) => {
          const element = document.getElementById(id);
          return element && element.getBoundingClientRect().top <= readingLine;
        });
        const hash = inIntro
          ? ""
          : `#${closingSection ?? READING_SECTIONS[active >= 0 ? active : READING_SECTIONS.length - 1].id}`;
        if (window.location.hash !== hash) {
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search + hash,
          );
        }
      }
      setReading((current) =>
        current.active === active && current.progress === progress
          ? current
          : { active, progress },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    if (header.current) observer.observe(header.current);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <header className="topbar" ref={header}>
      <a href="#top" className="brand">
        ODISSÉ <span>DATAVIZ 2026</span>
      </a>
      <nav aria-label="Rubriques et progression de lecture">
        {READING_SECTIONS.map((section, index) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={reading.active === index ? "location" : undefined}
            data-progress={reading.active === index ? reading.progress : 0}
            style={
              {
                "--section-progress":
                  reading.active === index ? reading.progress : 0,
              } as CSSProperties
            }
          >
            <span className="nav-chapter" aria-hidden="true">
              0{index + 1}
            </span>
            {section.label}
            <span className="nav-reading-progress" aria-hidden="true" />
          </a>
        ))}
      </nav>
      <a href="tel:3114" className="top-help">
        Besoin d’aide ? 3114
      </a>
    </header>
  );
}
