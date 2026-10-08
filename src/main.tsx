import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Experience from "../app/Experience";
import experienceData from "../public/data/experience-data.json";
import "../app/site.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Experience initialData={experienceData} />
  </StrictMode>,
);
