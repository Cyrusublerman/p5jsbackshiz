export class Renderer {
  constructor(p) {
    this.p = p;
  }

  drawBase(image) {
    this.p.background(8);
    this.p.image(image, 0, 0);
  }

  drawStipple(points) {
    if (!points.length) return;
    this.p.noStroke();
    this.p.fill(10, 10, 10, 220);
    for (const point of points) {
      const size = this.p.map(point.tone, 0, 1, 2.4, 0.8);
      this.p.circle(point.x, point.y, size);
    }
  }

  drawPath(pathPoints) {
    if (!pathPoints.length) return;
    this.p.noFill();
    this.p.stroke(80, 200, 255, 160);
    this.p.strokeWeight(1);
    this.p.beginShape();
    pathPoints.forEach((pt) => this.p.vertex(pt.x, pt.y));
    this.p.endShape();
  }

  drawEdges(analysis) {
    if (!analysis) return;
    const { width, height, edgeMask } = analysis;
    this.p.stroke(255, 140);
    this.p.strokeWeight(1);
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (edgeMask[y * width + x]) {
          this.p.point(x, y);
        }
      }
    }
  }

  drawFlowLines(lines) {
    if (!lines.length) return;
    this.p.noFill();
    this.p.stroke(255, 170, 110, 160);
    this.p.strokeWeight(1);
    for (const line of lines) {
      this.p.beginShape();
      for (const pt of line) {
        this.p.vertex(pt.x, pt.y);
      }
      this.p.endShape();
    }
  }

  drawContours(lines) {
    if (!lines.length) return;
    this.p.noFill();
    this.p.stroke(120, 255, 160, 160);
    this.p.strokeWeight(1);
    for (const line of lines) {
      this.p.beginShape();
      for (const pt of line) {
        this.p.vertex(pt.x, pt.y);
      }
      this.p.endShape();
    }
  }
}
