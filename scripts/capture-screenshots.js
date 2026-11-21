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
  { name: 'road-issues', url: 'https://road-issues-detection-ml-project-9x3honm3mm9sznunnqxwr7.streamlit.app/', streamlit: true },
  { name: 'neighborly', url: 'https://akshitrohilla-prog.github.io/neighborly/' },
  { name: 'shiv-enterprises', url: 'https://flourishing-lolly-73c3e4.netlify.app/' }
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
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' });
    const page = await ctx.newPage();
    try {
      const res = await page.goto(t.url, { waitUntil: 'networkidle', timeout: 90000 });
      if (!res || res.status() >= 400) throw new Error(`HTTP ${res ? res.status() : 'no response'}`);
      if (t.streamlit) await wakeStreamlit(page);
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.waitForTimeout(4000); // let intro animations settle
      const png = await page.screenshot({ type: 'png' });
      const file = path.join(OUT, `${t.name}.webp`);
      await sharp(png).webp({ quality: 80 }).toFile(file);
      console.log(`  saved ${path.relative(process.cwd(), file)}`);
    } catch (e) {
      console.log(`  FAILED: ${e.message}`);
      failed.push(t.name);
    }
    await ctx.close();
  }
  await browser.close();
  if (failed.length) {
    console.log(`\nNot captured: ${failed.join(', ')}. Their cards keep the built-in placeholder panel.`);
    process.exitCode = 1;
  }
})();
