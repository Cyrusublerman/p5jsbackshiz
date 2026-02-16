# Vector Raster Adapter

Adapter interface:

```js
vectorToRaster({ basePixels, width, height, lines, strokeRGBA, opacity, mask }) => Uint8ClampedArray
```

Semantics:

- Blend mode: normal alpha-over, `out = base*(1-a) + stroke*a`.
- Effective alpha: `opacity * (mask[x,y] / 255)` when mask exists.
- Ordering: vector outputs are composited in stack order exactly where node executes.
- Adapter never edits `basePixels` in place.
