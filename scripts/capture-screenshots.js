/* Capture real screenshots of the live projects into assets/screenshots/*.webp (1440 x 900).
   Usage (from the project root):
     cd scripts && npm install && cd ..
     node scripts/capture-screenshots.js            # all projects
     node scripts/capture-screenshots.js neighborly # just one
   Screenshots are saved exactly as the page renders: no editing or mock-ups. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets', 'screenshots');
const TARGETS = [
  // Road Issues: tabs, upload panel and damage-class cards only. The sidebar and the header
  // chips show accuracy / F1 figures, which must not appear on the portfolio.
  { name: 'road-issues', url: 'https://road-issues-detection-ml-project-9x3honm3mm9sznunnqxwr7.streamlit.app/', streamlit: true,
    viewport: { width: 1440, height: 1400 }, scale: 2, rect: { x: 336, y: 402, width: 1072, height: 670 } },
  { name: 'neighborly', url: 'https://akshitrohilla-prog.github.io/neighborly/' },
  // Shiv: top of the page, cropped to the header (logo and business name) and the hero text.
  // Left out on purpose: the top strip (phone and WhatsApp numbers), the "Call +91..." button,
  // and the shop photo with its caption (sign with numbers and tax IDs, neighbouring shop sign,
  // street address). The About and Contact sections, which name the owner, are far below.
  { name: 'shiv-enterprises', url: 'https://shiv-enterprises-panipat.netlify.app/',
    viewport: { width: 1440, height: 900 }, scale: 2, rect: { x: 56, y: 42, width: 840, height: 525 } }
  // Student Community Portal is private: add assets/screenshots/student-portal.webp by hand.
];

async function wakeStreamlit(page) {
  // A sleeping Streamlit app shows a "get this app back up" button.
  const wake = page.getByRole('button', { name: /get this app back up/i });
  if (await wake.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('  app is asleep, waking it up...');
    await wake.click();
    await page.waitForTimeout(5000);
  }
  // The app itself renders inside an iframe on *.streamlit.app; wait for real content.
  await page.waitForFunction(() => {
    const doc = (document.querySelector('iframe') || {}).contentDocument || document;
    return !!doc.querySelector('[data-testid="stAppViewContainer"], [data-testid="stApp"]') &&
           !doc.querySelector('[data-testid="stStatusWidget"]');
  }, null, { timeout: 180000 }).catch(() => console.log('  (could not confirm the app finished loading)'));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv[2];
  const browser = await chromium.launch();
  const failed = [];
  for (const t of TARGETS.filter(t => !only || t.name === only)) {
    console.log(`> ${t.name}: ${t.url}`);
    const ctx = await browser.newContext({ viewport: t.viewport || { width: 1440, height: 900 }, deviceScaleFactor: t.scale || 1, colorScheme: 'light' });
    const page = await ctx.newPage();
    try {
      const res = await page.goto(t.url, { waitUntil: 'networkidle', timeout: 90000 });
      if (!res || res.status() >= 400) throw new Error(`HTTP ${res ? res.status() : 'no response'}`);
      if (t.streamlit) await wakeStreamlit(page);
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForTimeout(4000); // let intro animations settle
      let png;
      if (t.rect) {
        png = await page.screenshot({ type: 'png', clip: t.rect });
      } else if (t.clip) {
        const top = await page.$eval(t.clip.selector, el => el.getBoundingClientRect().top + window.scrollY);
        png = await page.screenshot({ type: 'png', fullPage: true, clip: { x: 0, y: top + (t.clip.offsetY || 0), width: 1440, height: 900 } });
      } else {
        png = await page.screenshot({ type: 'png' });
      }
      const file = path.join(OUT, `${t.name}.webp`);
      await sharp(png).resize(1440, 900, { fit: 'cover', position: 'top' }).webp({ quality: 80 }).toFile(file);
      console.log(`  saved ${path.relative(process.cwd(), file)}`);
    } catch (e) {
      console.log(`  FAILED: ${e.message}`);
      failed.push(t.name);
    }
    await ctx.close();
  }
  await browser.close();
  if (failed.length) {
    console.log(`\nNot captured: ${failed.join(', ')}. The existing images in assets/screenshots/ are left unchanged.`);
    process.exitCode = 1;
  }
})();
