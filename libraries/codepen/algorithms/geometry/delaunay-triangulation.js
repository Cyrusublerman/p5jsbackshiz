/**
 * @fileoverview Delaunay Triangulation (Bowyer-Watson)
 *
 * Produces a triangulation where no point lies inside the circumcircle
 * of any triangle. Used for planar neighbor graphs.
 */

const EPSILON = 1e-12;

/**
 * Compute Delaunay triangulation for a set of points.
 *
 * @param {Array<{x: number, y: number}>} points
 * @returns {Array<[number, number, number]>} Triangle indices
 */
export function delaunayTriangulate(points) {
    if (points.length < 3) return [];

    const { superPoints, triangles } = initSuperTriangle(points);
    const allPoints = [...points, ...superPoints];

    let activeTriangles = triangles;

    for (let i = 0; i < points.length; i++) {
        const point = allPoints[i];
        const badTriangles = [];

        for (const tri of activeTriangles) {
            if (circumcircleContains(allPoints, tri, point)) {
                badTriangles.push(tri);
            }
        }

        const boundary = extractBoundaryEdges(badTriangles);
        activeTriangles = activeTriangles.filter((tri) => !badTriangles.includes(tri));

        for (const [a, b] of boundary) {
            activeTriangles.push([a, b, i]);
        }
    }

    const superStart = points.length;
    return activeTriangles.filter((tri) => tri.every((idx) => idx < superStart));
}

function initSuperTriangle(points) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }

    const dx = maxX - minX;
    const dy = maxY - minY;
    const deltaMax = Math.max(dx, dy) || 1;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const p1 = { x: midX - 20 * deltaMax, y: midY - deltaMax };
    const p2 = { x: midX, y: midY + 20 * deltaMax };
    const p3 = { x: midX + 20 * deltaMax, y: midY - deltaMax };

    return {
        superPoints: [p1, p2, p3],
        triangles: [[points.length, points.length + 1, points.length + 2]]
    };
}

function circumcircleContains(points, tri, point) {
    const [ia, ib, ic] = tri;
    const a = points[ia];
    const b = points[ib];
    const c = points[ic];

    const ax = a.x - point.x;
    const ay = a.y - point.y;
    const bx = b.x - point.x;
    const by = b.y - point.y;
    const cx = c.x - point.x;
    const cy = c.y - point.y;

    const det = (ax * ax + ay * ay) * (bx * cy - by * cx) -
        (bx * bx + by * by) * (ax * cy - ay * cx) +
        (cx * cx + cy * cy) * (ax * by - ay * bx);

    return det > EPSILON;
}

function extractBoundaryEdges(triangles) {
    const edgeCount = new Map();

    const addEdge = (a, b) => {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
    };

    for (const [a, b, c] of triangles) {
        addEdge(a, b);
        addEdge(b, c);
        addEdge(c, a);
    }

    const boundary = [];
    for (const [key, count] of edgeCount.entries()) {
        if (count === 1) {
            const [a, b] = key.split(',').map(Number);
            boundary.push([a, b]);
        }
    }

    return boundary;
}
