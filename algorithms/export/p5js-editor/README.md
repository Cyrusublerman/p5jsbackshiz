# p5.js Editor Export Folder

This folder is ready to be copied into the p5.js editor **as-is**. It contains a
small loader that fetches the algorithms library from a URL and exposes it as a
browser global.

## Files

- `p5js-algorithms.js`: loader for the algorithms library.

## Usage in the p5.js editor

1. Add `p5js-algorithms.js` as a new file in the editor.
2. Update the `DEFAULT_ALGO_URL` constant in that file to point at your hosted
   `algorithms/index.js` (GitHub + jsDelivr, or any CDN you control).
3. In `sketch.js`, load the library before using it:

```js
async function setup() {
  createCanvas(520, 520);
  await loadP5JSAlgorithms();

  const { Sampling, TSP } = P5JSAlgorithms;
  const points = Sampling.importanceSampling(
    300,
    width,
    height,
    (x, y) => 1 - dist(x, y, width / 2, height / 2) / (width / 2)
  );

  const relaxed = Sampling.lloydRelaxation(points, width, height, 2, 8);
  const nn = TSP.nearestNeighbor(relaxed);
  const optimized = TSP.twoOpt(relaxed, nn.path, 200);

  background(248);
  noFill();
  beginShape();
  optimized.path.forEach((idx) => vertex(relaxed[idx].x, relaxed[idx].y));
  endShape();
}
```

## Notes

- The loader uses dynamic `import()` so it works with ES modules.
- You can also pass a URL directly: `loadP5JSAlgorithms('https://...')`.
