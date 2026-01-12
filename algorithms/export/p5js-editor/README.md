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
  createCanvas(400, 400);
  await loadP5JSAlgorithms();

  // Example: use a noise function from the library
  const value = P5JSAlgorithms.Noise.simplex2D(0.1, 0.2);
  console.log(value);
}
```

## Notes

- The loader uses dynamic `import()` so it works with ES modules.
- You can also pass a URL directly: `loadP5JSAlgorithms('https://...')`.
