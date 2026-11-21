# Akshit Rohilla · portfolio

A one-page personal site: plain HTML, CSS and JavaScript with no build step. Fonts and GSAP are hosted with the site, so no visitor data goes to Google Fonts or a CDN.

```
index.html            the whole page (all text lives here)
404.html              "page not found", no scripts
css/styles.css        all styling, colour tokens for dark + light at the top
js/main.js            theme toggle, menu, skills, parallax, scroll reveals
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
Screenshots are 1440 × 900 WebP files in `assets/screenshots/`.

**Student Community Portal and N-Queens:** just save the image as `assets/screenshots/student-portal.webp` or `assets/screenshots/n-queens.webp`. `js/main.js` checks for these files and turns the compact card into an image card automatically. No HTML edit is needed. Use only real screenshots.

On Vercel, missing files in that folder are routed to `assets/screenshots/missing.txt` (see `vercel.json`), so the check never logs a 404. On other hosts a missing image logs one harmless 404 in the console.

**Other cards** have the image written into the HTML:

```html
<div class="project__media">
  <img src="assets/screenshots/NAME.webp" width="1440" height="900" loading="lazy" decoding="async"
       alt="Short honest description of what the screenshot shows">
</div>
```

### Project card layout
Every card follows the same order:
1. image (optional)
2. label and context
3. title
4. one-sentence description
5. **My contribution**
6. tags
7. **Technical detail**: expandable, for anything longer
8. buttons: **Live demo** (`pbtn pbtn--demo`) and **GitHub** (`pbtn pbtn--code`). The Shiv Enterprises card says **Visit site**, because it is a real business website

Keep the visible text short and put extra detail inside the `<details>` block.

### N-Queens diagram
The N-Queens card shows an inline SVG board of one valid 8-queens placement (columns 0, 4, 7, 5, 2, 6, 1, 3 for rows 1 to 8), captioned "Illustration of one valid solution". It uses theme colours, so it works in both themes. If `assets/screenshots/n-queens.webp` is added, that real image replaces the diagram automatically.

### Edit project text
All text is in `index.html`. Each project is one `<article class="card project …">`. Edit the description, the "My contribution" box, the `<details>` "Technical detail" block, the tags and the buttons in place. Rules worth keeping: no accuracy numbers, no project counts, no invented details.

### Edit skills
Each skill has two parts in the Skills section of `index.html`, joined by the same key:

```html
<button class="chip" type="button" aria-pressed="false" data-skill="pytorch">
  <span class="chip__name">PyTorch</span><span class="chip__src"><span class="sr-only">, from </span>Project</span>
</button>
...
<ul class="skill-notes" role="list">
  <li data-note-for="pytorch"><span class="skill-notes__name">PyTorch:</span> Road Issues Detection.</li>
</ul>
```

- **Legend:** the three labels are explained in the `.skills-legend` list above the chips.
- **Every note must be unique.** No two chips share the same wording.
- **`chip__src`** is the source label: `Project`, `Coursework`, `Self-study`, or a combination. Leave it out entirely if you don't want a label (Windows and VS Code have none). The chip then keeps even padding.
- **Notes:** each chip's note is the matching `<li data-note-for="…">` in that group's `skill-notes` list. Without JavaScript the full list is shown. With JavaScript the list is hidden, and selecting a chip shows its note in `skill-group__note`. Keep notes to a few words.
- **Group summary:** the text in `skill-group__note` is shown before anything is selected.
- Don't repeat the "Currently learning" line in the notes.

### Edit the journey
The Journey section has four groups (`.jgroup`):
- **Education:** the degree card with modules and languages.
- **University projects** and **Personal projects:** plain `<li>` items in a `.jlist`.
- **Currently learning:** one short line.

Only March 2025 and the degree dates are real dates. Keep project items undated, and don't repeat the Skills section here.

### Edit contact links
The three Contact links are `.contact-link` items: "Email me" (the cyan main action), "Connect on LinkedIn" and "Explore my GitHub". The email address appears as text inside the email link.

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
- **Shiv Enterprises:** only the header (logo and business name) and the hero text. The crop leaves out the top strip with phone and WhatsApp numbers, the "Call" button, and the shop photo and caption (sign with numbers and tax IDs, a neighbouring shop sign, the street address). The owner's name and email are only in the About and Contact sections, far below the crop.

Check each image before using it: no personal data, no figures, no error banners.

Social image (`assets/og-image.png`, 1200 × 630, from `scripts/og-image.html`) and PNG favicons (from `assets/favicon.svg`). Keep the photo, name and tagline inside the central 630 × 630 square (x 285 to 915), because WhatsApp crops link previews to that square:

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
6. Live address: **https://akshit-rohilla.vercel.app**. It is set in `index.html` (canonical, `og:url`, `og:image`, `twitter:image`). If you add a custom domain, replace that address in those four tags.

Every push to the main branch redeploys automatically.

### GitHub Pages
**Settings → Pages → Deploy from a branch → `main` / root**. The site works as is. `404.html` uses root-relative paths (`/css/…`), so its styling only applies on a user site (`username.github.io`) or a custom domain. On a project site (`username.github.io/portfolio/`), change the three `/…` paths in `404.html` to `/portfolio/…`.

### Netlify
**Add new site → Import from Git**, no build command, publish directory `.`. `404.html` is used automatically. `vercel.json` is ignored; add a `_headers` file if you want the same caching rules.

## Open items (search the code for `TODO`)
- Optional: real screenshots at `assets/screenshots/student-portal.webp` or `n-queens.webp` (picked up automatically).

## Notes
- Three.js was not needed: the hero network is a small Canvas 2D script (about 5 KB). It loads only when the hero is visible, on screens at least 768 px wide, with reduced motion off. It caps pixel density at 1.5 and pauses when hidden or scrolled away.
- With JavaScript off, every section is still fully readable, and the theme follows the operating system.
- Scroll reveals only fade opacity, never `visibility`. Content that hasn't been revealed yet stays reachable by keyboard, and anything that receives focus is revealed at once.
- Link previews use the description "Software Engineering student in Berlin. Building software, learning to secure it." (81 characters), set in the `description`, `og:description` and `twitter:description` tags.
- Fonts: Sora, DM Sans and JetBrains Mono under the SIL Open Font License (`assets/fonts/LICENSE-OFL.txt`).
