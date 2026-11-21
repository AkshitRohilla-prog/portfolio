/* Generate the social preview image and PNG favicons.
   Usage (from the project root, after `cd scripts && npm install`):
     node scripts/generate-images.js
   Outputs: assets/og-image.png (1200x630), assets/favicon-32.png, assets/apple-touch-icon.png (180x180). */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

(async () => {
  const browser = await chromium.launch();

  // Social image
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await og.goto('file://' + path.join(__dirname, 'og-image.html'));
  await og.evaluate(() => document.fonts.ready);
  await og.waitForTimeout(300);
  await og.screenshot({ path: path.join(ASSETS, 'og-image.png') });
  console.log('saved assets/og-image.png');

  // Favicons rendered from favicon.svg
  const svg = fs.readFileSync(path.join(ASSETS, 'favicon.svg'), 'utf8');
  for (const [size, file, pad] of [[32, 'favicon-32.png', 0], [180, 'apple-touch-icon.png', 0]]) {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:${size === 32 ? "transparent" : "#050505"}">
      <div style="width:${size}px;height:${size}px;padding:${pad}px;box-sizing:border-box">${svg.replace('<svg ', `<svg width="${size - pad * 2}" height="${size - pad * 2}" `)}</div>
    </body></html>`);
    await p.screenshot({ path: path.join(ASSETS, file), omitBackground: size === 32 });
    console.log(`saved assets/${file}`);
  }

  await browser.close();
})();
