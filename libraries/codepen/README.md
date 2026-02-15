# CodePen Export Folder

This folder provides separate HTML/CSS/JS files for a CodePen setup that loads
this repo's algorithms library at runtime.

## Usage in CodePen

1. Create a new Pen.
2. Paste `index.html` into the HTML panel.
3. Paste `styles.css` into the CSS panel.
4. Paste `script.js` into the JS panel.
5. Add the p5.js library in **Settings → JavaScript** (`https://cdn.jsdelivr.net/npm/p5@latest/lib/p5.min.js`).
6. Include the `algorithms/` folder from this export inside the same location
   as `script.js`, so the module import can resolve locally.

The default example uses importance sampling, Lloyd relaxation, and a TSP tour
to render a continuous stippling path.

## Notes

- The example is standalone as long as the bundled `algorithms/` folder stays
  next to `script.js`.
- The algorithms are available as `P5JSAlgorithms` within `script.js`.
