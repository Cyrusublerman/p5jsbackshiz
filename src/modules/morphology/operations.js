function idx(x, y, w) { return y * w + x; }

export function erode(binary, w, h, radius = 1) {
  const out = new Uint8Array(binary.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let keep = 1;
      for (let oy = -radius; oy <= radius && keep; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          const xx = x + ox, yy = y + oy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h || !binary[idx(xx, yy, w)]) { keep = 0; break; }
        }
      }
      out[idx(x, y, w)] = keep;
    }
  }
  return out;
}

export function dilate(binary, w, h, radius = 1) {
  const out = new Uint8Array(binary.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let oy = -radius; oy <= radius && !on; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          const xx = x + ox, yy = y + oy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && binary[idx(xx, yy, w)]) { on = 1; break; }
        }
      }
      out[idx(x, y, w)] = on;
    }
  }
  return out;
}

export function open(binary, w, h, radius = 1) {
  return dilate(erode(binary, w, h, radius), w, h, radius);
}

export function close(binary, w, h, radius = 1) {
  return erode(dilate(binary, w, h, radius), w, h, radius);
}

export function grayscaleErode(channel, w, h, radius = 1) {
  const out = new Uint8Array(channel.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let best = 255;
      for (let oy = -radius; oy <= radius; oy++) {
        const yy = Math.max(0, Math.min(h - 1, y + oy));
        for (let ox = -radius; ox <= radius; ox++) {
          const xx = Math.max(0, Math.min(w - 1, x + ox));
          const v = channel[idx(xx, yy, w)];
          if (v < best) best = v;
        }
      }
      out[idx(x, y, w)] = best;
    }
  }
  return out;
}

export function grayscaleDilate(channel, w, h, radius = 1) {
  const out = new Uint8Array(channel.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let best = 0;
      for (let oy = -radius; oy <= radius; oy++) {
        const yy = Math.max(0, Math.min(h - 1, y + oy));
        for (let ox = -radius; ox <= radius; ox++) {
          const xx = Math.max(0, Math.min(w - 1, x + ox));
          const v = channel[idx(xx, yy, w)];
          if (v > best) best = v;
        }
      }
      out[idx(x, y, w)] = best;
    }
  }
  return out;
}

export function grayscaleOpen(channel, w, h, radius = 1) {
  return grayscaleDilate(grayscaleErode(channel, w, h, radius), w, h, radius);
}

export function grayscaleClose(channel, w, h, radius = 1) {
  return grayscaleErode(grayscaleDilate(channel, w, h, radius), w, h, radius);
}
