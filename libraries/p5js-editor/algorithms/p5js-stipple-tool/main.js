import { AnalysisEngine } from './analysis.js';
import { StippleEngine } from './stipple.js';
import { PathSolver } from './path.js';
import { FlowFieldEngine } from './flow.js';
import { ContourEngine } from './contours.js';
import { Renderer } from './renderer.js';
import { UIController } from './ui.js';

const sketch = (p) => {
  let sourceImage;
  let analysis = null;
  let stipplePoints = [];
  let pathPoints = [];
  let flowLines = [];
  let contourLines = [];

  const params = {
    seedStipple: 42,
    seedPath: 7,
    seedFlow: 1337,
    smoothRadius: 2,
    edgeLow: 0.08,
    edgeHigh: 0.22,
    minDistance: 8,
    gamma: 1.2,
    densityScale: 1.0,
    edgeWeight: 0.3,
    edgeBlurRadius: 3,
    edgeExponent: 1.4,
    flowSpacing: 24,
    flowStep: 2,
    flowMaxSteps: 80,
    flowNoise: 0.0,
    contourInterval: 0.12,
    pathMode: 'monotone-y'
  };

  const toggles = {
    showStipple: true,
    showPath: true,
    showEdges: false,
    showFlow: false,
    showContours: false
  };

  const analysisEngine = new AnalysisEngine();
  const stippleEngine = new StippleEngine();
  const pathSolver = new PathSolver();
  const flowEngine = new FlowFieldEngine();
  const contourEngine = new ContourEngine();
  const renderer = new Renderer(p);
  const ui = new UIController(params, toggles);

  let needsAnalysis = true;
  let needsStipple = true;
  let needsPath = true;
  let needsFlow = true;
  let needsContours = true;

  p.setup = () => {
    sourceImage = createDefaultImage();
    p.pixelDensity(1);
    p.createCanvas(sourceImage.width, sourceImage.height);
    p.canvas.parent('canvas-container');
    ui.bind(markDirty, resetImage, rebuildAll, handleFileLoad);
    rebuildAll();
  };

  p.draw = () => {
    if (needsAnalysis) {
      analysis = analysisEngine.update(sourceImage, params);
      needsAnalysis = false;
      needsStipple = true;
      needsPath = true;
      needsFlow = true;
      needsContours = true;
      ui.setStatus('Analysis updated');
    }

    if (needsStipple) {
      stipplePoints = stippleEngine.generate(analysis, params);
      needsStipple = false;
      needsPath = true;
      ui.setStatus(`Stipple points: ${stipplePoints.length}`);
    }

    if (needsPath) {
      pathPoints = pathSolver.build(stipplePoints, params);
      needsPath = false;
      ui.setStatus(`Path length: ${pathPoints.length} points`);
    }

    if (needsFlow) {
      flowLines = flowEngine.generate(analysis, params);
      needsFlow = false;
      ui.setStatus(`Flow lines: ${flowLines.length}`);
    }

    if (needsContours) {
      contourLines = contourEngine.generate(analysis, params);
      needsContours = false;
      ui.setStatus(`Contours: ${contourLines.length}`);
    }

    renderer.drawBase(sourceImage);

    if (toggles.showEdges) {
      renderer.drawEdges(analysis);
    }

    if (toggles.showContours) {
      renderer.drawContours(contourLines);
    }

    if (toggles.showFlow) {
      renderer.drawFlowLines(flowLines);
    }

    if (toggles.showStipple) {
      renderer.drawStipple(stipplePoints);
    }

    if (toggles.showPath) {
      renderer.drawPath(pathPoints);
    }
  };

  function markDirty(key) {
    if (['smoothRadius', 'edgeLow', 'edgeHigh', 'edgeBlurRadius'].includes(key)) {
      needsAnalysis = true;
      return;
    }

    if (['minDistance', 'gamma', 'densityScale', 'edgeWeight', 'edgeExponent', 'seedStipple'].includes(key)) {
      needsStipple = true;
      needsPath = true;
      return;
    }

    if (['seedPath', 'pathMode'].includes(key)) {
      needsPath = true;
      return;
    }

    if (['flowSpacing', 'flowStep', 'flowMaxSteps', 'flowNoise', 'seedFlow'].includes(key)) {
      needsFlow = true;
      return;
    }

    if (['contourInterval'].includes(key)) {
      needsContours = true;
    }
  }

  function resetImage() {
    sourceImage = createDefaultImage();
    resizeForImage();
    rebuildAll();
  }

  function rebuildAll() {
    needsAnalysis = true;
    needsStipple = true;
    needsPath = true;
    needsFlow = true;
    needsContours = true;
  }

  function handleFileLoad(dataUrl) {
    p.loadImage(dataUrl, (img) => {
      sourceImage = img;
      resizeForImage();
      rebuildAll();
    });
  }

  function resizeForImage() {
    p.resizeCanvas(sourceImage.width, sourceImage.height);
  }

  function createDefaultImage() {
    const g = p.createGraphics(520, 520);
    g.background(245);
    g.noStroke();

    const grad = g.drawingContext.createLinearGradient(0, 0, g.width, g.height);
    grad.addColorStop(0, '#fefefe');
    grad.addColorStop(1, '#101010');
    g.drawingContext.fillStyle = grad;
    g.rect(0, 0, g.width, g.height);

    g.fill(40, 60, 180, 200);
    g.ellipse(160, 170, 180, 180);
    g.fill(220, 50, 60, 200);
    g.rect(260, 240, 180, 200, 24);
    g.fill(30);
    g.ellipse(380, 120, 120, 120);

    return g.get();
  }
};

new p5(sketch);
