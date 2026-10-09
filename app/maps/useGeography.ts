import { useEffect, useState } from "react";
import type { Geography } from "./mapModel";

let geographyRequest: Promise<Geography> | undefined;

export function useGeography() {
  const [geography, setGeography] = useState<Geography | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    // All maps share this request. Unmounting one must not cancel the others.
    geographyRequest ??= fetch("./data/geography.json").then((response) => {
      if (!response.ok) throw new Error("Contours indisponibles");
      return response.json();
    });
    geographyRequest
      .then((value) => {
        if (active) setGeography(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return { geography, failed };
}
