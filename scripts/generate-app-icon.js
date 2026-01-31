/**
 * Generates app icon PNGs from rr-logo.svg (Expo requires PNG for iOS/Android).
 * Run: npm run generate:icons
 *
 * Output: assets/icon.png and assets/adaptive-icon.png (1024×1024)
 */

const { promises: fs } = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SVG_PATH = path.join(ROOT, "assets/logos/retro-ranker/rr-logo.svg");
const ICON_SIZE = 1024;
const OUTPUTS = [
  path.join(ROOT, "assets/icon.png"),
  path.join(ROOT, "assets/adaptive-icon.png"),
];

async function main() {
  const svg = await fs.readFile(SVG_PATH);

  // SVG viewBox is ~646×784. Scale to height 1024 so logo fills vertically;
  // then pad left/right to get 1024×1024 (Expo requirement).
  const resvg = new Resvg(svg, {
    fitTo: { mode: "height", value: ICON_SIZE },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const meta = await sharp(pngBuffer).metadata();
  const { width, height } = meta;
  if (width === ICON_SIZE && height === ICON_SIZE) {
    // Already square
    for (const outPath of OUTPUTS) {
      await fs.writeFile(outPath, pngBuffer);
      console.log("Wrote", path.relative(ROOT, outPath));
    }
    return;
  }

  // Pad or crop to 1024×1024
  let pipeline = sharp(pngBuffer);
  if (width < ICON_SIZE || height < ICON_SIZE) {
    const left = Math.floor((ICON_SIZE - width) / 2);
    const top = Math.floor((ICON_SIZE - height) / 2);
    pipeline = pipeline.extend({
      left,
      top,
      right: ICON_SIZE - width - left,
      bottom: ICON_SIZE - height - top,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  } else {
    pipeline = pipeline.resize(ICON_SIZE, ICON_SIZE, {
      fit: "cover",
      position: "center",
    });
  }

  const finalBuffer = await pipeline.png().toBuffer();

  for (const outPath of OUTPUTS) {
    await fs.writeFile(outPath, finalBuffer);
    console.log("Wrote", path.relative(ROOT, outPath));
  }
  console.log("Done. Icon source: assets/logos/retro-ranker/rr-logo.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
