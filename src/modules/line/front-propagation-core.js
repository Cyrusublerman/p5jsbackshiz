export function propagateFront(start, {
  steps = 64,
  stepFn,
  terminateFn = null
} = {}) {
  const points = [start];
  let cur = start;

  for (let i = 0; i < steps; i++) {
    const next = stepFn(cur, i, points);
    if (!next) break;
    if (terminateFn?.(next, i, points)) break;
    points.push(next);
    cur = next;
  }

  return points;
}
