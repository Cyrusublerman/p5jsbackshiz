function cloneRasterFrame(frame) {
  return {
    width: frame.width,
    height: frame.height,
    pixels: new Uint8ClampedArray(frame.pixels)
  };
}

export function collectFramesFromTimeline(recorder, {
  mapPayloadToFrame = (payload) => payload?.frame,
  maxFrames = Infinity
} = {}) {
  const frames = [];
  for (const entry of recorder.frames) {
    if (frames.length >= maxFrames) break;
    const frame = mapPayloadToFrame(entry.payload);
    if (frame?.pixels && frame.width > 0 && frame.height > 0) {
      frames.push(cloneRasterFrame(frame));
    }
  }
  return frames;
}

export function encodeAnimation(frames, {
  format = 'gif',
  fps = 30,
  loop = true
} = {}) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error('encodeAnimation requires at least one frame');
  }
  if (!['gif', 'webm'].includes(format)) {
    throw new Error(`Unsupported animation format: ${format}`);
  }

  // Metadata-first encoder contract (real codec adapters can replace this output).
  return {
    format,
    fps,
    loop,
    frameCount: frames.length,
    width: frames[0].width,
    height: frames[0].height,
    durationMs: (frames.length / fps) * 1000,
    frames: frames.map(cloneRasterFrame)
  };
}

export function buildRecordingSummary(encoded) {
  return {
    format: encoded.format,
    frameCount: encoded.frameCount,
    size: `${encoded.width}x${encoded.height}`,
    fps: encoded.fps,
    durationMs: encoded.durationMs
  };
}
