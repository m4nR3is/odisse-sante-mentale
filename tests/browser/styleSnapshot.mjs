export async function computedStyleSnapshot(page) {
  return page.evaluate(() => {
    const rows = [];
    const excluded = new Set([
      "transition",
      "transition-property",
      "transition-duration",
      "transition-delay",
      "transition-timing-function",
      "animation",
      "animation-name",
      "animation-duration",
      "animation-delay",
      "animation-timing-function",
      "animation-fill-mode",
      "animation-iteration-count",
      "animation-play-state",
      "animation-direction",
      "transform",
      "perspective-origin",
      "transform-origin",
      "-webkit-transform-origin",
      "x",
      "y",
      "cx",
      "cy",
      "r",
      "d",
    ]);
    // Capture visible elements, including SVG text and portal dialog content. Dynamic transition values are verified by the dedicated motion test.
    for (const element of document.querySelectorAll("body *")) {
      const bounds = element.getBoundingClientRect();
      if (
        bounds.width <= 0 ||
        bounds.height <= 0 ||
        bounds.bottom < 0 ||
        bounds.top > innerHeight
      )
        continue;
      const computed = getComputedStyle(element);
      const styles = {};
      for (const property of computed) {
        if (excluded.has(property) || property.startsWith("--")) continue;
        styles[property] = computed.getPropertyValue(property);
      }
      rows.push({
        tag: element.tagName,
        id: element.id.replace(/_r_\w+_/g, "ID"),
        class: element.getAttribute("class"),
        styles,
      });
    }
    return rows;
  });
}
