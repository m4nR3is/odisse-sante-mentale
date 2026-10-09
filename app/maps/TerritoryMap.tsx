import ViewportTooltip from "../components/ViewportTooltip";
import type { CSSProperties } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import {
  mapColorScale,
  formatMapValue,
  preferBottomInsets,
  mapFeatureTransform,
  type MapFeature,
  type MapItem,
} from "./mapModel";
import { useGeography } from "./useGeography";

export default function TerritoryMap({
  level,
  items,
  selected,
  preview,
  legend,
  context,
  signedValues = true,
  onPreview,
  onSelect,
}: {
  level: "departments" | "regions";
  items: MapItem[];
  legend: string;
  context: string;
  signedValues?: boolean;
  selected: string;
  preview: string | null;
  onPreview: (code: string | null) => void;
  onSelect: (code: string) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [bottomInsets, setBottomInsets] = useState(false);
  const mapHeight = bottomInsets ? 355 : 240;
  const patternId = useId().replace(/:/g, "");
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const { low, high, hasValues, color } = mapColorScale(items, patternId);
  const label = (value: number) => formatMapValue(value, signedValues);
  const { geography, failed } = useGeography();
  const [localHover, setLocalHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const layer = geography?.[level];
  const interacting = useRef(false);
  interacting.current = localHover != null || preview != null;
  useLayoutEffect(() => {
    if (interacting.current) return;
    const element = svg.current;
    if (!element) return;
    const resize = () => {
      if (interacting.current) return;
      const { width, height } = element.getBoundingClientRect();
      setBottomInsets(preferBottomInsets(width, height));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, [layer, localHover, preview]);
  useEffect(() => {
    drag.current = null;
  }, [bottomInsets]);
  const transform = (feature: MapFeature) =>
    mapFeatureTransform(feature, layer!, bottomInsets);
  const frontCode = localHover ?? preview;
  const frontFeature = layer?.features.find(
    (feature) => feature.code === frontCode,
  );
  const lookup = new Map(items.map((item) => [item.code, item]));
  const featuredCode = localHover ?? preview ?? selected;
  const featured = lookup.get(featuredCode);
  const missingShapes = layer
    ? items.filter(
        (item) => !layer.features.some((shape) => shape.code === item.code),
      )
    : [];
  const hover = (code: string | null, x?: number, y?: number) => {
    if (x != null && y != null) setAnchor({ x, y });
    setLocalHover(code);
    onPreview(code);
  };
  const selectFrance = () => {
    onSelect("FR");
    hover(null);
  };
  const select = (code: string) => {
    if (!dragged.current) onSelect(code);
  };
  return (
    <div
      className="territory-map"
      data-level={level}
      data-insets={bottomInsets ? "bottom" : "side"}
    >
      {layer ? (
        <svg
          ref={svg}
          viewBox={`0 0 300 ${mapHeight}`}
          role="group"
          tabIndex={0}
          style={{ touchAction: "pan-y" }}
          aria-label={`Carte de sélection des ${level === "regions" ? "régions" : "départements"}. Un clic sur le fond ou la touche Échap sélectionne la France.`}
          onClick={(event) => {
            if (
              !dragged.current &&
              !(event.target as Element).closest("[data-code]")
            )
              selectFrance();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              selectFrance();
            }
          }}
          onPointerDown={(event) => {
            dragged.current = false;
            drag.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => {
            setAnchor({ x: event.clientX, y: event.clientY });
            if (!drag.current) return;
            const origin = drag.current;
            const dx = event.clientX - origin.x,
              dy = event.clientY - origin.y;
            if (Math.hypot(dx, dy) > 4) dragged.current = true;
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onPointerLeave={() => {
            drag.current = null;
            hover(null);
          }}
        >
          <defs>
            <pattern
              id={patternId}
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
            >
              <rect width="4" height="4" fill="#e8e8e4" />
              <path
                d="M-1,1L1,-1M0,4L4,0M3,5L5,3"
                stroke="#b9b9b5"
                strokeWidth=".45"
              />
            </pattern>
          </defs>
          {layer.features.map((feature) => {
            const item = lookup.get(feature.code),
              available = Boolean(item && item.available !== false);
            return (
              <path
                key={feature.code}
                data-code={feature.code}
                d={feature.path}
                transform={transform(feature)}
                style={{ "--territory-fill": color(item) } as CSSProperties}
                data-value={
                  Number.isFinite(item?.value) ? item!.value : undefined
                }
                fillRule="evenodd"
                className={`map-territory${selected === feature.code ? " is-selected" : ""}${(localHover ?? preview) === feature.code ? " is-hovered" : ""}${available ? "" : " is-unavailable"}`}
                role={available ? "button" : "img"}
                tabIndex={available ? 0 : undefined}
                aria-pressed={available ? selected === feature.code : undefined}
                aria-label={`${item?.name ?? feature.name}${available ? `, ${item?.detail ?? "sélectionner"}` : ", données indisponibles pour cette vue"}`}
                onPointerEnter={(event) =>
                  hover(
                    available ? feature.code : null,
                    event.clientX,
                    event.clientY,
                  )
                }
                onPointerLeave={() => hover(null)}
                onFocus={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  hover(
                    feature.code,
                    bounds.x + bounds.width / 2,
                    bounds.y + bounds.height / 2,
                  );
                }}
                onBlur={() => hover(null)}
                onClick={() => {
                  if (available) select(feature.code);
                }}
                onKeyDown={(event) => {
                  if (
                    available &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    onSelect(feature.code);
                  }
                }}
              />
            );
          })}
          {layer.insets.map((inset) => (
            <text
              key={inset.label}
              x={bottomInsets ? 30 + layer.insets.indexOf(inset) * 58 : inset.x}
              y={bottomInsets ? 349 : inset.y}
              textAnchor="middle"
            >
              {inset.label}
            </text>
          ))}
          {frontFeature && (
            <path
              data-front-code={frontFeature.code}
              className={`map-territory map-territory-overlay is-hovered${selected === frontFeature.code ? " is-selected" : ""}`}
              d={frontFeature.path}
              transform={transform(frontFeature)}
              style={
                {
                  "--territory-fill": color(lookup.get(frontFeature.code)),
                } as CSSProperties
              }
              fillRule="evenodd"
              pointerEvents="none"
              aria-hidden="true"
            />
          )}
        </svg>
      ) : (
        <p className="map-loading">
          {failed
            ? "Carte indisponible · le menu reste utilisable"
            : "Chargement des contours…"}
        </p>
      )}
      {missingShapes.length > 0 && (
        <div className="map-missing-shapes">
          {missingShapes.map((item) => (
            <button
              type="button"
              key={item.code}
              aria-label={`${item.name}, contour non fourni ; sélectionner`}
              aria-pressed={selected === item.code}
              onPointerEnter={(event) =>
                hover(item.code, event.clientX, event.clientY)
              }
              onPointerLeave={() => hover(null)}
              onFocus={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                hover(item.code, bounds.x, bounds.y);
              }}
              onBlur={() => hover(null)}
              onClick={() => onSelect(item.code)}
            >
              {item.code}
            </button>
          ))}
          <span>COM · sans contour</span>
        </div>
      )}
      <div className="territory-map-caption">
        <span>{legend}</span>
        <div
          className="map-color-legend"
          role="img"
          title="Échelle de gris propre à la vue et aux filtres actifs · hachures : données indisponibles ou non comparables"
          aria-label={
            hasValues
              ? `Gris clair : ${label(low)} ; gris foncé : ${label(high)}. Hachures : données indisponibles ou non comparables. Échelle propre à cette vue.`
              : "Aucune évolution comparable"
          }
        >
          <span>{hasValues ? label(low) : "—"}</span>
          <i aria-hidden="true" />
          <span>{hasValues ? label(high) : "—"}</span>
          <em aria-hidden="true" />
          <span title="Évolution non comparable ou indisponible">N/C</span>
        </div>
        <a
          href="https://github.com/gregoiredavid/france-geojson#sources--mises-à-jour"
          target="_blank"
          rel="noreferrer"
        >
          IGN / INSEE · 2018 · encarts hors échelle ↗
        </a>
      </div>
      {localHover && featured && (
        <ViewportTooltip x={anchor.x} y={anchor.y} className="map-tooltip">
          <span>{featured.name}</span>
          <small>
            {context} · {legend}
          </small>
          <strong>
            {Number.isFinite(featured.value)
              ? featured.detail?.split(" · ")[0]
              : "N/C"}
          </strong>
          {Number.isFinite(featured.value) &&
            featured.detail?.includes(" · ") && (
              <small>{featured.detail.split(" · ").slice(1).join(" · ")}</small>
            )}
          {!Number.isFinite(featured.value) && (
            <small>
              Évolution non interprétable : données manquantes, périmètre
              modifié ou effectifs insuffisants.
            </small>
          )}
        </ViewportTooltip>
      )}
    </div>
  );
}
