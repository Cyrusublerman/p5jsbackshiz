export function bisection(f, lo, hi, eps = 1e-6, maxIter = 100) {
  let a = lo, b = hi, fa = f(a), fb = f(b);
  if (fa * fb > 0) throw new Error('bisection requires sign change interval');
  for (let i = 0; i < maxIter; i++) {
    const m = (a + b) * 0.5;
    const fm = f(m);
    if (Math.abs(fm) < eps || (b - a) < eps) return m;
    if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) * 0.5;
}

export function gradientDescent(f, grad, x0, { lr = 0.1, maxIter = 100, eps = 1e-6 } = {}) {
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const g = grad(x);
    if (Math.abs(g) < eps) break;
    x = x - lr * g;
  }
  return x;
}

export function newtonRaphson(f, df, x0, { eps = 1e-6, maxIter = 30 } = {}) {
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const y = f(x), d = df(x);
    if (Math.abs(y) < eps) return x;
    if (Math.abs(d) < eps) break;
    x = x - y / d;
  }
  return x;
}
