// Render the site's actual SVG portrait, including its offset irregular windows.
// Run: node --import tsx scripts/render-social-preview.tsx
// Then export the SVG to PNG at its native 1734x907 size for social networks.
import { writeFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import IntroPortrait from "../app/portraits/IntroPortrait";

// Support a standalone TSX runner using the classic JSX transform.
Object.assign(globalThis, { React });

const random = Math.random;
const faces = [0, 0.24, 0.52, 0.78];
let index = 0;
let markup: string;
try {
  Math.random = () => faces[index++ % faces.length];
  markup = renderToStaticMarkup(<IntroPortrait />);
} finally {
  Math.random = random;
}
const portrait = markup.match(/<svg[\s\S]*<\/svg>/)?.[0];
if (!portrait) throw new Error("The original portrait SVG was not rendered");
const positioned = portrait.replace('<svg ', '<svg x="1025" y="125" width="470" height="590" ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1734" height="907" viewBox="0 0 1734 907">
<style>
  text { fill:#f8f7f1; font-family:Helvetica,Arial,sans-serif; }
  .mono { font-family:Menlo,monospace; }
  .portrait-pen {stroke:#f8f7f1;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;fill:none}
  .portrait-heavy {stroke-width:3.1}
  .portrait-light {stroke-width:.8;opacity:.5}
  .portrait-hatch {stroke-width:1;opacity:.65}
  .portrait-brush {stroke-width:7;opacity:.9}
  .portrait-accent {stroke:#ed5d43}
  .portrait-wash {fill:#f8f7f1;opacity:.17}
  .portrait-wash-soft {opacity:.06}
  .portrait-construction {opacity:.28}
  .portrait-frame {stroke-width:.85;opacity:.5}
  .portrait-label,.portrait-caption {fill:#f8f7f1;font-family:Menlo,monospace;font-size:10px;letter-spacing:1.2px}
  .portrait-caption-muted {opacity:.55}
  .portrait-hit {fill:none;stroke:none}
  .portrait-feature-ink,.portrait-iris {fill:#f8f7f1;stroke:none}
  .portrait-accessory {stroke-width:2.4}
  .portrait-lower-lid {stroke-width:1.25;opacity:.75}
</style>
<rect width="1734" height="907" fill="#151816"/>
<text class="mono" x="280" y="222" font-size="29" letter-spacing="3">ODISSÉ DATAVIZ 2026</text>
<text x="275" y="365" font-size="65" font-weight="700" letter-spacing="-2">Quand la souffrance</text>
<text x="275" y="450" font-size="65" font-weight="700" letter-spacing="-2">devient visible</text>
<text class="mono" x="280" y="537" font-size="24">Quatre regards sur la santé mentale</text>
<text class="mono" x="280" y="659" font-size="24">Déclaré · Urgences · Hôpital · Décès</text>
${positioned}
</svg>`;
writeFileSync("public/og-odisse-2026.svg", svg);
console.log("Generated public/og-odisse-2026.svg from the actual IntroPortrait component.");
