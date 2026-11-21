# Akshit Rohilla · portfolio

A one-page personal site: plain HTML, CSS and JavaScript with no build step. Fonts and GSAP are hosted with the site, so no visitor data goes to Google Fonts or a CDN.

```
index.html            the whole page (all text lives here)
404.html              "page not found", no scripts
css/styles.css        all styling, colour tokens for dark + light at the top
js/main.js            theme toggle, menu, skills, parallax, scroll reveals  (SHOW_CV_BUTTON is here)
js/hero3d.js          the subtle node network behind the photo (desktop only, lazy-loaded)
js/vendor/            gsap.min.js + ScrollTrigger.min.js (GSAP 3.12.5)
assets/               photo, fonts, favicons, og-image.png, screenshots/
scripts/              build-time helpers only (screenshots, social image, favicons)
vercel.json           caching + security headers for Vercel
```

## Run it locally

Double-click `index.html`. Everything works from disk. Chrome may log a harmless warning about font preloads when opened from disk; it disappears once served.

For a setup closer to production, serve the folder:

```bash
npx serve .
```

## Common edits

### Replace the photo
Replace both `assets/photo-cutout.webp` and `assets/photo-cutout.png` with a transparent cutout at **838 × 1200**. Then regenerate the smaller copy and the social image:

```bash
python3 -c "from PIL import Image; im=Image.open('assets/photo-cutout.webp'); im.resize((560, 802), Image.LANCZOS).save('assets/photo-cutout-560.webp', quality=82)"
```

```bash
node scripts/generate-images.js
```

If the new image has a different size, update `width`/`height` on the `<img>` tags in the hero.

### Add a project screenshot
Screenshots are 1440 × 900 WebP files in `assets/screenshots/`. Cards with an image use the `project--wide` (or `project--feature`) class and start with:

```html
<div class="project__media">
  <img src="assets/screenshots/NAME.webp" width="1440" height="900" loading="lazy" decoding="async"
       alt="Short honest description of what the screenshot shows">
</div>
```

Cards without an image (Student Community Portal, N-Queens) use `project--compact`: half width, text only, with a small icon tile in the corner. To give the **Student Community Portal** an image, save it as `assets/screenshots/student-portal.webp`. Then, on that card:
- change the classes to `card project project--wide reveal`
- replace the `<span class="project__icon">…</span>` with the media block above

The comment marked `TODO(screenshot)` points to the spot. Keep the "Private project. Code available on request." line unless you publish the code.

### Add the CV
1. Save the PDF as `assets/Akshit_Rohilla_CV.pdf`.
2. In `js/main.js`, change the first line to `const SHOW_CV_BUTTON = true;`.

A "Download CV (PDF)" button then appears in the Contact section.

### Edit project text
All text is in `index.html`. Each project is one `<article class="card project">`. Edit the description, the "My contribution" box, the `<details>` "Technical detail" block, the tags and the links in place. Rules worth keeping: no accuracy numbers, no project counts, no invented details.

### Colours
The tokens at the top of `css/styles.css` define the dark theme (`:root`) and the light theme (`:root[data-theme="light"]`, repeated once inside the `prefers-color-scheme` block for visitors without JavaScript). Change both light blocks together.

## Regenerate screenshots and the social image

One-time setup:

```bash
cd scripts && npm install && npx playwright install chromium && cd ..
```

Capture all live projects (or pass one name: `road-issues`, `neighborly`, `shiv-enterprises`). Live addresses:

- Road Issues Detection: https://road-issues-detection-ml-project-9x3honm3mm9sznunnqxwr7.streamlit.app/
- Neighborly: https://akshitrohilla-prog.github.io/neighborly/
- Shiv Enterprises: https://shiv-enterprises-panipat.netlify.app/

```bash
node scripts/capture-screenshots.js
```

The script wakes a sleeping Streamlit app, waits for pages to finish loading, and saves the page exactly as rendered, cropped where noted:
- **Road Issues:** only the tabs, upload panel and damage classes. The app's header and sidebar show accuracy figures, which must stay off the portfolio.
- **Shiv Enterprises:** only the products area. The About and Contact sections name the owner, and the shop photo shows tax IDs.

Check each image before using it: no personal data, no figures, no error banners.

Social image (`assets/og-image.png`, from `scripts/og-image.html`) and PNG favicons (from `assets/favicon.svg`):

```bash
node scripts/generate-images.js
```

## Deploy

### Vercel (primary)
1. Push this folder to a GitHub repository.
2. Go to vercel.com → **Add New… → Project** → import the repository.
3. Framework preset: **Other**. Leave Build Command empty. Output Directory: `.` (the root).
4. Click **Deploy**. `404.html` and `vercel.json` are picked up automatically.
5. Optional: **Settings → Domains** to add your own domain.
6. Once the final address is known, finish the `TODO(domain)` in `index.html`:
   - add `<link rel="canonical" href="https://YOUR-DOMAIN/">`
   - make `og:image` and `twitter:image` absolute, e.g. `https://YOUR-DOMAIN/assets/og-image.png`, and add `og:url`.

   LinkedIn and other link previews need the absolute image URL.

Every push to the main branch redeploys automatically.

### GitHub Pages
**Settings → Pages → Deploy from a branch → `main` / root**. The site works as is. `404.html` uses root-relative paths (`/css/…`), so its styling only applies on a user site (`username.github.io`) or a custom domain. On a project site (`username.github.io/portfolio/`), change the three `/…` paths in `404.html` to `/portfolio/…`.

### Netlify
**Add new site → Import from Git**, no build command, publish directory `.`. `404.html` is used automatically. `vercel.json` is ignored; add a `_headers` file if you want the same caching rules.

## Open items (search the code for `TODO`)
- `TODO(cv)`: CV PDF, hidden until `SHOW_CV_BUTTON = true`.
- `TODO(screenshot)`: Student Community Portal image (the card works without it).
- `TODO(domain)`: canonical and absolute Open Graph URLs.
- `TODO(review)`: "What I learned" wording on Road Issues Detection.

## Notes
- Three.js was not needed: the hero network is a small Canvas 2D script (about 5 KB). It loads only when the hero is visible, on screens at least 768 px wide, with reduced motion off. It caps pixel density at 1.5 and pauses when hidden or scrolled away.
- With JavaScript off, every section is still fully readable, and the theme follows the operating system.
- Fonts: Sora, DM Sans and JetBrains Mono under the SIL Open Font License (`assets/fonts/LICENSE-OFL.txt`).
