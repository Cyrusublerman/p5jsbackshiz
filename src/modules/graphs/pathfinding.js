function keyOf(n) { return `${n.x},${n.y}`; }

export function bfs(start, isGoal, neighbors) {
  const q = [start];
  const parent = new Map([[keyOf(start), null]]);
  while (q.length) {
    const cur = q.shift();
    if (isGoal(cur)) return reconstruct(cur, parent);
    for (const nxt of neighbors(cur)) {
      const k = keyOf(nxt);
      if (!parent.has(k)) {
        parent.set(k, cur);
        q.push(nxt);
      }
    }
  }
  return null;
}

export function dfs(start, isGoal, neighbors) {
  const st = [start];
  const parent = new Map([[keyOf(start), null]]);
  while (st.length) {
    const cur = st.pop();
    if (isGoal(cur)) return reconstruct(cur, parent);
    for (const nxt of neighbors(cur)) {
      const k = keyOf(nxt);
      if (!parent.has(k)) {
        parent.set(k, cur);
        st.push(nxt);
      }
    }
  }
  return null;
}

export function dijkstra(start, isGoal, neighbors, cost = () => 1) {
  const dist = new Map([[keyOf(start), 0]]);
  const parent = new Map([[keyOf(start), null]]);
  const open = [start];
  while (open.length) {
    open.sort((a, b) => (dist.get(keyOf(a)) ?? Infinity) - (dist.get(keyOf(b)) ?? Infinity));
    const cur = open.shift();
    if (isGoal(cur)) return reconstruct(cur, parent);
    const cd = dist.get(keyOf(cur));
    for (const nxt of neighbors(cur)) {
      const nk = keyOf(nxt);
      const nd = cd + cost(cur, nxt);
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        parent.set(nk, cur);
        if (!open.some((n) => keyOf(n) === nk)) open.push(nxt);
      }
    }
  }
  return null;
}

export function aStar(start, isGoal, neighbors, heuristic, cost = () => 1) {
  const g = new Map([[keyOf(start), 0]]);
  const f = new Map([[keyOf(start), heuristic(start)]]);
  const parent = new Map([[keyOf(start), null]]);
  const open = [start];
  while (open.length) {
    open.sort((a, b) => (f.get(keyOf(a)) ?? Infinity) - (f.get(keyOf(b)) ?? Infinity));
    const cur = open.shift();
    if (isGoal(cur)) return reconstruct(cur, parent);
    const cg = g.get(keyOf(cur));
    for (const nxt of neighbors(cur)) {
      const nk = keyOf(nxt);
      const ng = cg + cost(cur, nxt);
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        f.set(nk, ng + heuristic(nxt));
        parent.set(nk, cur);
        if (!open.some((n) => keyOf(n) === nk)) open.push(nxt);
      }
    }
  }
  return null;
}

function reconstruct(end, parent) {
  const out = [];
  let cur = end;
  while (cur) {
    out.push(cur);
    cur = parent.get(keyOf(cur));
  }
  out.reverse();
  return out;
}
