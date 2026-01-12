# CodePen Export Folder

This folder provides separate HTML/CSS/JS files for a CodePen setup that loads
this repo's algorithms library at runtime.

## Usage in CodePen

1. Create a new Pen.
2. Paste `index.html` into the HTML panel.
3. Paste `styles.css` into the CSS panel.
4. Paste `script.js` into the JS panel.
5. Add the p5.js library in **Settings → JavaScript** (`https://cdn.jsdelivr.net/npm/p5@latest/lib/p5.min.js`).
6. Update `DEFAULT_ALGO_URL` in `script.js` to point at your hosted
   `algorithms/index.js` (GitHub + jsDelivr, or any CDN you control).

The default example uses importance sampling, Lloyd relaxation, and a TSP tour
to render a continuous stippling path.

## Notes

- The loader uses dynamic `import()` so it expects an ES module URL.
- After loading, the library is available as `window.P5JSAlgorithms`.
