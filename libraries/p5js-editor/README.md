# p5.js Editor Export Folder

This folder is ready to be copied into the p5.js editor **as-is**. It contains a
loader that imports the full algorithms library from the local `algorithms/`
folder and exposes it as a browser global.

## Files

- `p5js-algorithms.js`: loader for the algorithms library.

## Usage in the p5.js editor

1. Add the entire `algorithms/` folder from this export into the p5.js editor
   (alongside `p5js-algorithms.js`).
2. Add `p5js-algorithms.js` as a new file in the editor.
3. In `sketch.js`, use the global `P5JSAlgorithms` created by the loader:

```js
async function setup() {
  createCanvas(520, 520);
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

- The loader stays within this folder and does not require external URLs.
