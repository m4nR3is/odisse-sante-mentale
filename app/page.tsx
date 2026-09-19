import type { Metadata } from "next";
import Experience, { type ExperienceData } from "./Experience";
import experienceData from "../public/data/experience-data.json";

export const metadata: Metadata = {
  title: "Ce que la moyenne ne dit pas — Santé mentale en France",
  description:
    "Une exploration des ruptures d’âge, de genre, de situation sociale et de territoire derrière les moyennes de santé mentale.",
};

export default function Home() {
  return <Experience initialData={experienceData as ExperienceData} />;
}
