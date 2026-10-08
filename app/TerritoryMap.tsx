import ViewportTooltip from "./ViewportTooltip";
import type { CSSProperties } from "react";
import { useEffect, useId, useRef, useState } from "react";

type MapFeature = { code: string; name: string; path: string; overseas: boolean };
type Geography = { source: { repository: string }; departments: MapLayer; regions: MapLayer };
type MapLayer = { features: MapFeature[]; insets: { label: string; x: number; y: number }[] };
export type MapItem = { code: string; name: string; detail?: string; value?: number; available?: boolean };
let geographyRequest: Promise<Geography> | undefined;

export default function TerritoryMap({ level, items, selected, preview, legend, context, onPreview, onSelect }: {
  level: "departments" | "regions";
  items: MapItem[];
  legend: string;
  context: string;
  selected: string;
  preview: string | null;
  onPreview: (code: string | null) => void;
  onSelect: (code: string) => void;
}) {
  const patternId = useId().replace(/:/g, "");
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const values = items.flatMap((item) => Number.isFinite(item.value) ? [item.value!] : []);
  const low = values.length ? Math.min(...values) : 0, high = values.length ? Math.max(...values) : 0;
  const color = (item?: MapItem) => {
    if (!Number.isFinite(item?.value)) return `url(#${patternId})`;
    const shade = Math.round(220 - (high === low ? .5 : (item!.value! - low) / (high - low)) * 170);
    return `rgb(${shade}, ${shade}, ${shade})`;
  };
  const label = (value: number) => `${value < 0 ? "−" : "+"}${Math.abs(value).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`;
  const [geography, setGeography] = useState<Geography | null>(null);
  const [failed, setFailed] = useState(false);
  const [localHover, setLocalHover] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number; scale: number } | null>(null);
  const dragged = useRef(false);
  useEffect(() => {
    let active = true;
    geographyRequest ??= fetch("./data/geography.json").then((response) => {
      if (!response.ok) throw new Error("Contours indisponibles");
      return response.json();
    });
    geographyRequest.then((value) => { if (active) setGeography(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  const layer = geography?.[level];
  const lookup = new Map(items.map((item) => [item.code, item]));
  const featuredCode = localHover ?? preview ?? selected;
  const featured = lookup.get(featuredCode);
  const missingShapes = layer ? items.filter((item) => !layer.features.some((shape) => shape.code === item.code)) : [];
  const hover = (code: string | null, x?: number, y?: number) => { if (x != null && y != null) setAnchor({ x, y }); setLocalHover(code); onPreview(code); };
  const select = (code: string) => { if (!dragged.current) onSelect(code); };
  const zoom = (direction: number) => setView((current) => {
    const next = Math.max(1, Math.min(5, current.zoom + direction));
    return next === 1 ? { x: 0, y: 0, zoom: 1 } : { x: current.x + 150 / current.zoom - 150 / next, y: current.y + 120 / current.zoom - 120 / next, zoom: next };
  });
  return <div className="territory-map" data-level={level}>
    <div className="territory-map-toolbar"><span>{level === "regions" ? "RÉGIONS" : "DÉPARTEMENTS"}</span><div>
      <button type="button" aria-label="Dézoomer la carte" disabled={view.zoom === 1} onClick={() => zoom(-1)}>−</button>
      <button type="button" aria-label="Zoomer la carte" disabled={view.zoom === 5} onClick={() => zoom(1)}>+</button>
      <button type="button" className={selected === "FR" ? "is-active" : ""} onClick={() => { onSelect("FR"); hover(null); setView({ x: 0, y: 0, zoom: 1 }); }}>France</button>
    </div></div>
    {layer ? <svg viewBox={`${view.x} ${view.y} ${300 / view.zoom} ${240 / view.zoom}`} role="group" style={{ touchAction: view.zoom > 1 ? "none" : "pan-y" }} aria-label={`Carte de sélection des ${level === "regions" ? "régions" : "départements"}. Zoom avec les boutons, déplacement par glisser.`}
      onPointerDown={(event) => { dragged.current = false; if (view.zoom > 1) drag.current = { x: event.clientX, y: event.clientY, startX: view.x, startY: view.y, scale: 300 / view.zoom / event.currentTarget.getBoundingClientRect().width }; }}
      onPointerMove={(event) => { setAnchor({ x: event.clientX, y: event.clientY }); if (!drag.current) return; const origin = drag.current; const dx = event.clientX - origin.x, dy = event.clientY - origin.y; if (Math.hypot(dx, dy) > 4) dragged.current = true; if (dragged.current) setView((current) => ({ ...current, x: origin.startX - dx * origin.scale, y: origin.startY - dy * origin.scale })); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; hover(null); }}>
      <defs><pattern id={patternId} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#e8e8e4"/><path d="M-1,1L1,-1M0,4L4,0M3,5L5,3" stroke="#b9b9b5" strokeWidth=".45"/></pattern></defs>
      {layer.features.map((feature) => {
        const item = lookup.get(feature.code), available = Boolean(item && item.available !== false);
        return <path key={feature.code} data-code={feature.code} d={feature.path} style={{ "--territory-fill": color(item) } as CSSProperties} data-value={Number.isFinite(item?.value) ? item!.value : undefined} fillRule="evenodd" className={`map-territory${selected === feature.code ? " is-selected" : ""}${(preview ?? localHover) === feature.code ? " is-hovered" : ""}${available ? "" : " is-unavailable"}`} role={available ? "button" : "img"} tabIndex={available ? 0 : undefined} aria-pressed={available ? selected === feature.code : undefined} aria-label={`${item?.name ?? feature.name}${available ? `, ${item?.detail ?? "sélectionner"}` : ", données indisponibles pour cette vue"}`}
          onPointerEnter={(event) => hover(available ? feature.code : null, event.clientX, event.clientY)} onPointerLeave={() => hover(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); hover(feature.code, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); }} onBlur={() => hover(null)} onClick={() => { if (available) select(feature.code); }} onKeyDown={(event) => { if (available && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(feature.code); } }} />;
      })}
      {layer.insets.map((inset) => <text key={inset.label} x={inset.x} y={inset.y} textAnchor="middle">{inset.label}</text>)}
    </svg> : <p className="map-loading">{failed ? "Carte indisponible · le menu reste utilisable" : "Chargement des contours…"}</p>}
    {missingShapes.length > 0 && <div className="map-missing-shapes">{missingShapes.map((item) => <button type="button" key={item.code} aria-label={`${item.name}, contour non fourni ; sélectionner`} aria-pressed={selected === item.code} onPointerEnter={(event) => hover(item.code, event.clientX, event.clientY)} onPointerLeave={() => hover(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); hover(item.code, bounds.x, bounds.y); }} onBlur={() => hover(null)} onClick={() => onSelect(item.code)}>{item.code}</button>)}<span>COM · sans contour</span></div>}
    <div className="territory-map-caption"><span>{legend}</span><div className="map-color-legend" role="img" title="Échelle de gris propre à la vue et aux filtres actifs · hachures : évolution non interprétable" aria-label={values.length ? `Gris clair : ${label(low)} ; gris foncé : ${label(high)}. Hachures : évolution non interprétable. Échelle propre à cette vue.` : "Aucune évolution comparable"}><span>{values.length ? label(low) : "—"}</span><i aria-hidden="true"/><span>{values.length ? label(high) : "—"}</span><em aria-hidden="true"/><span title="Évolution non comparable ou indisponible">N/C</span></div><a href="https://github.com/gregoiredavid/france-geojson#sources--mises-à-jour" target="_blank" rel="noreferrer">IGN / INSEE · 2018 · encarts hors échelle ↗</a></div>
    {localHover && featured && <ViewportTooltip x={anchor.x} y={anchor.y} className="map-tooltip"><span>{featured.name}</span><small>{context} · {legend}</small><strong>{Number.isFinite(featured.value) ? featured.detail?.split(" · ")[0] : "N/C"}</strong>{!Number.isFinite(featured.value) && <small>Évolution non interprétable : données manquantes, périmètre modifié ou effectifs insuffisants.</small>}</ViewportTooltip>}
  </div>;
}
