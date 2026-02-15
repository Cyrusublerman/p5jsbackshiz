import { EffectNode } from '../EffectNode.js';
import { SeededRNG } from '../../core/SeededRNG.js';

export class DelaunayMeshNode extends EffectNode {
  constructor() {
    super('delaunaymesh', 'DELAUNAY MESH', {
      pointCount: { value: 200, min: 10, max: 2000, step: 10, label: 'POINTS' },
      wireWeight: { value: 0.5, min: 0, max: 3, step: 0.25, label: 'WIRE W' },
      wireLevel:  { value: 40, min: 0, max: 255, step: 1, label: 'WIRE LVL' },
      colorMode:  { value: 'flat', options: ['flat', 'wire'], label: 'MODE', type: 'select' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { pointCount, wireWeight, wireLevel, colorMode } = this.params;
    const rng = new SeededRNG(ctx ? ctx.nodeSeed : 42);
    const count = ctx && ctx.quality === 'preview' ? Math.min(pointCount, 100) : pointCount;

    // Generate random points
    const pts = [];
    for (let i = 0; i < count; i++) pts.push({ x: rng.next() * w, y: rng.next() * h });
    // Add corners
    pts.push({x:0,y:0},{x:w,y:0},{x:0,y:h},{x:w,y:h});

    // Simple Delaunay via Bowyer-Watson
    const tris = this._triangulate(pts);

    // Render (cached canvas)
    if (!this._oc || this._ocW !== w || this._ocH !== h) {
      this._oc = new OffscreenCanvas(w, h);
      this._ocCtx = this._oc.getContext('2d');
      this._ocW = w; this._ocH = h;
    }
    const oc = this._oc;
    const c = this._ocCtx;
    c.clearRect(0, 0, w, h);

    if (colorMode === 'flat') {
      for (const tri of tris) {
        const p0 = pts[tri[0]], p1 = pts[tri[1]], p2 = pts[tri[2]];
        const cx = (p0.x+p1.x+p2.x)/3, cy = (p0.y+p1.y+p2.y)/3;
        const si = (Math.max(0,Math.min(h-1,Math.round(cy)))*w + Math.max(0,Math.min(w-1,Math.round(cx)))) * 4;
        c.fillStyle = `rgb(${s[si]},${s[si+1]},${s[si+2]})`;
        c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.closePath(); c.fill();
      }
    }

    if (wireWeight > 0) {
      c.strokeStyle = `rgb(${wireLevel},${wireLevel},${wireLevel})`;
      c.lineWidth = wireWeight;
      for (const tri of tris) {
        const p0=pts[tri[0]], p1=pts[tri[1]], p2=pts[tri[2]];
        c.beginPath(); c.moveTo(p0.x,p0.y); c.lineTo(p1.x,p1.y); c.lineTo(p2.x,p2.y); c.closePath(); c.stroke();
      }
    }

    const id = c.getImageData(0, 0, w, h);
    dst_set: {
      if (colorMode === 'wire') {
        // Wire only: blend over source
        for (let i = 0, n = w*h*4; i < n; i += 4) {
          const a = id.data[i+3] / 255;
          d[i]=Math.round(s[i]*(1-a)+id.data[i]*a);
          d[i+1]=Math.round(s[i+1]*(1-a)+id.data[i+1]*a);
          d[i+2]=Math.round(s[i+2]*(1-a)+id.data[i+2]*a);
          d[i+3]=s[i+3];
        }
      } else {
        d.set(id.data);
      }
    }
  }

  _triangulate(pts) {
    if (pts.length < 3) return [];
    // Super-triangle
    const minX = pts.reduce((m,p) => Math.min(m,p.x), Infinity);
    const minY = pts.reduce((m,p) => Math.min(m,p.y), Infinity);
    const maxX = pts.reduce((m,p) => Math.max(m,p.x), -Infinity);
    const maxY = pts.reduce((m,p) => Math.max(m,p.y), -Infinity);
    const dx = maxX-minX, dy = maxY-minY, dmax = Math.max(dx,dy)*2;
    const si = pts.length;
    pts.push({x:minX-dmax,y:minY-1},{x:minX+dmax*2,y:minY-1},{x:minX+dx/2,y:maxY+dmax});
    let tris = [[si,si+1,si+2]];

    for (let i = 0; i < si; i++) {
      const p = pts[i], bad = [], poly = [];
      for (const t of tris) {
        if (this._inCircum(pts, t, p)) bad.push(t);
      }
      for (const t of bad) {
        for (let j = 0; j < 3; j++) {
          const e = [t[j], t[(j+1)%3]];
          let shared = false;
          for (const b of bad) {
            if (b === t) continue;
            for (let k = 0; k < 3; k++) {
              if ((b[k]===e[0]&&b[(k+1)%3]===e[1])||(b[k]===e[1]&&b[(k+1)%3]===e[0])) { shared=true; break; }
            }
            if (shared) break;
          }
          if (!shared) poly.push(e);
        }
      }
      tris = tris.filter(t => !bad.includes(t));
      for (const e of poly) tris.push([e[0], e[1], i]);
    }
    return tris.filter(t => t[0] < si && t[1] < si && t[2] < si);
  }

  _inCircum(pts, tri, p) {
    const a=pts[tri[0]], b=pts[tri[1]], c=pts[tri[2]];
    const ax=a.x-p.x, ay=a.y-p.y, bx=b.x-p.x, by=b.y-p.y, cx=c.x-p.x, cy=c.y-p.y;
    const det = ax*(by*( cx*cx+cy*cy)-cy*(bx*bx+by*by)) - ay*(bx*(cx*cx+cy*cy)-cx*(bx*bx+by*by)) + (ax*ax+ay*ay)*(bx*cy-by*cx);
    return det > 0;
  }
}
