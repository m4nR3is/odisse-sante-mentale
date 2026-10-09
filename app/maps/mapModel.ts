export type MapFeature = {
  code: string;
  name: string;
  path: string;
  overseas: boolean;
};
export type MapLayer = {
  features: MapFeature[];
  insets: { label: string; x: number; y: number }[];
};
export type Geography = {
  source: { repository: string };
  departments: MapLayer;
  regions: MapLayer;
};
export type MapItem = {
  code: string;
  name: string;
  detail?: string;
  value?: number;
  available?: boolean;
};

// The grayscale domain belongs to the current view and filters, not all datasets.
export function mapColorScale(items: MapItem[], patternId: string) {
  const values = items.flatMap((item) =>
    Number.isFinite(item.value) ? [item.value!] : [],
  );
  const low = values.length ? Math.min(...values) : 0;
  const high = values.length ? Math.max(...values) : 0;
  const color = (item?: MapItem) => {
    if (!Number.isFinite(item?.value)) return `url(#${patternId})`;
    const shade = Math.round(
      220 - (high === low ? 0.5 : (item!.value! - low) / (high - low)) * 170,
    );
    return `rgb(${shade}, ${shade}, ${shade})`;
  };
  return { low, high, hasValues: values.length > 0, color };
}

export function formatMapValue(value: number, signedValues: boolean) {
  return `${value < 0 ? "−" : signedValues ? "+" : ""}${Math.abs(value).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`;
}

export function preferBottomInsets(width: number, height: number) {
  // Keep the original 4% margin to avoid switching for a negligible gain.
  const sideScale = Math.min(width / 300, height / 240);
  const bottomScale = Math.min(width / 300, height / 355) * (290 / 229);
  return bottomScale > sideScale * 1.04;
}

export function mapFeatureTransform(
  feature: MapFeature,
  layer: MapLayer,
  bottomInsets: boolean,
) {
  if (!bottomInsets) return undefined;
  if (!feature.overseas)
    return "translate(5 4) scale(1.26637554585) translate(-5 -4)";
  const insetIndex = layer.features
    .filter((item) => item.overseas)
    .findIndex((item) => item.code === feature.code);
  return `translate(${8 + insetIndex * 58 - 248} ${305 - (5 + insetIndex * 45)})`;
}
