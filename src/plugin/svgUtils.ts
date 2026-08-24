// Figma authors coordinates at 72 DPI, but Easel (and similar importers) ignore
// unit suffixes and read the viewBox as pixels at 96 DPI — making parts import at
// 75% size. We keep real mm width/height for unit-aware tools (Illustrator,
// Inkscape, LightBurn) AND rescale the viewBox + geometry by 96/72 so a 96-DPI
// importer resolves to the exact same physical size.
const SOURCE_DPI = 72;
const TARGET_DPI = 96;
const MM_PER_INCH = 25.4;

interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

function parseViewBox(svg: string): ViewBox | null {
  const match = svg.match(
    /viewBox="\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*"/
  );
  if (!match) return null;
  return {
    minX: parseFloat(match[1]),
    minY: parseFloat(match[2]),
    width: parseFloat(match[3]),
    height: parseFloat(match[4]),
  };
}

/**
 * Rewrites a Figma-exported SVG so it imports at the correct physical size in
 * both unit-aware tools and 96-DPI importers like Easel.
 * `scale` multiplies the final physical size (default 1 = true Figma dimensions).
 */
export function toLaserSafeSvg(svg: string, scale = 1): string {
  const vb = parseViewBox(svg);
  if (!vb) return svg;

  const geometryScale = (TARGET_DPI / SOURCE_DPI) * scale;
  const widthMm = (vb.width / SOURCE_DPI) * MM_PER_INCH * scale;
  const heightMm = (vb.height / SOURCE_DPI) * MM_PER_INCH * scale;

  const newViewBox = [
    vb.minX * geometryScale,
    vb.minY * geometryScale,
    vb.width * geometryScale,
    vb.height * geometryScale,
  ]
    .map((n) => +n.toFixed(4))
    .join(" ");

  let out = svg
    .replace(/viewBox="[^"]*"/, `viewBox="${newViewBox}"`)
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/, `$1 width="${widthMm.toFixed(4)}mm"`)
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/, `$1 height="${heightMm.toFixed(4)}mm"`);

  // wrap all content so the transform rescales geometry into the enlarged viewBox
  const openTagEnd = out.indexOf(">", out.indexOf("<svg")) + 1;
  const closeTagStart = out.lastIndexOf("</svg>");
  const inner = out.slice(openTagEnd, closeTagStart);

  out =
    out.slice(0, openTagEnd) +
    `<g transform="scale(${geometryScale.toFixed(6)})">` +
    inner +
    "</g>" +
    out.slice(closeTagStart);

  return out;
}
