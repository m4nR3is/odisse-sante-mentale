import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Experience from "../app/Experience";
import type { ExperienceData } from "../app/data/experienceTypes";
import "../app/styles/index.css";

function Application() {
  const [data, setData] = useState<ExperienceData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/experience-data.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Data unavailable");
        return response.json() as Promise<ExperienceData>;
      })
      .then((loaded) => {
        if (!controller.signal.aborted) setData(loaded);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);
  if (data) return <Experience initialData={data} />;
  return (
    <main className={`loading-page${failed ? "" : " is-intro-loading"}`}>
      <p className="chapter">ODISSÉ · DATAVIZ 2026</p>
      <h1>
        Quand la souffrance
        <br />
        devient visible.
      </h1>
      <p role="status">
        {failed
          ? "Les données n’ont pas pu être chargées."
          : "Chargement des observations…"}
      </p>
      {failed && (
        <button type="button" onClick={() => window.location.reload()}>
          Réessayer
        </button>
      )}
      <a href="tel:3114">Besoin d’aide ? 3114</a>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Application />
  </StrictMode>,
);
