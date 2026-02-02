/**
 * Generates platform-specific app icon PNGs from rr-logo.svg.
 * Run: npm run generate:icons
 *
 * icon.png is kept as-is (do not overwrite). Use it as the default icon in app.json.
 * Outputs go to assets/icons/.
 *
 * - ios-icon.png (iOS only): Logo scaled to fill 1024×1024 (height 1024, pad to square),
 *   dark #1a1a1a background. Linked via app.json ios.icon.
 * - android-icon.png (Android only): Logo at 50% of canvas, transparent padding,
 *   so it fits inside the circular launcher mask. Linked via app.json android.adaptiveIcon.
 */

const { promises: fs } = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const ICONS_DIR = path.join(ROOT, "assets", "icons");
const SVG_PATH = path.join(ROOT, "assets/logos/retro-ranker/rr-logo.svg");
const ICON_SIZE = 1024;
/** Android: scale logo to 50% so it fits inside the circular mask */
const ANDROID_ICON_HEIGHT = Math.round(ICON_SIZE * 0.5);
const DARK_BG = { r: 26, g: 26, b: 26 }; // #1a1a1a

async function renderSvgAtHeight(height) {
  const svg = await fs.readFile(SVG_PATH);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "height", value: height },
  });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

/** Pad to size×size with background, or crop center size×size if larger */
function toSquare(buffer, size, background) {
  return sharp(buffer)
    .metadata()
    .then((meta) => {
      const { width, height } = meta;
      if (width === size && height === size) {
        return sharp(buffer);
      }
      if (width <= size && height <= size) {
        const left = Math.floor((size - width) / 2);
        const top = Math.floor((size - height) / 2);
        return sharp(buffer).extend({
          left,
          top,
          right: size - width - left,
          bottom: size - height - top,
          background,
        });
      }
      const x = Math.floor((width - size) / 2);
      const y = Math.floor((height - size) / 2);
      return sharp(buffer).extract({ left: x, top: y, width: size, height: size });
    })
    .then((p) => p.png().toBuffer());
}

async function main() {
  await fs.mkdir(ICONS_DIR, { recursive: true });

  // --- iOS only: ios-icon.png — logo fills icon (height 1024, pad to square with dark bg)
  const iosPng = await renderSvgAtHeight(ICON_SIZE);
  const iosIconPath = path.join(ICONS_DIR, "ios-icon.png");
  const iosIconBuffer = await toSquare(iosPng, ICON_SIZE, {
    ...DARK_BG,
    alpha: 1,
  });
  await fs.writeFile(iosIconPath, iosIconBuffer);
  console.log("Wrote", path.relative(ROOT, iosIconPath), "(iOS only, full height, dark bg)");

  // --- Android only: android-icon.png — 50% scale, transparent, for circular mask
  const androidPng = await renderSvgAtHeight(ANDROID_ICON_HEIGHT);
  const androidPath = path.join(ICONS_DIR, "android-icon.png");
  const androidBuffer = await toSquare(androidPng, ICON_SIZE, {
    r: 0,
    g: 0,
    b: 0,
    alpha: 0,
  });
  await fs.writeFile(androidPath, androidBuffer);
  console.log(
    "Wrote",
    path.relative(ROOT, androidPath),
    "(Android only, 50% scale, transparent)",
  );

  console.log("Done. icon.png unchanged. iOS uses ios-icon.png, Android uses android-icon.png.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
