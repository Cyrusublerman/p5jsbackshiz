/**
 * GENERATIVE PAINTER - BRUTALIST EDITION
 */

const config = {
  brushMinSize: 10,
  brushMaxSize: 50,
  minOpacity: 10,
  maxOpacity: 50,
  iterationsPerFrame: 20,
  maxAverageLayers: 15,
  maxPixelLayers: 20,
  palette: [] 
};

let painter;
let ui;
let sourceImg = null;
let weightMapImg = null;

function setup() {
  let canvas = createCanvas(600, 600);
  canvas.parent('canvas-container');
  canvas.drop(handleFileDrop);
  
  pixelDensity(1);
  background(0); // Black canvas to match theme
  
  painter = new Painter();
  ui = new UIManager();
  
  ui.updatePaletteFromInput();
}

function draw() {
  if (painter && painter.isActive && sourceImg) {
    painter.update();
  }
}

function handleFileDrop(file) {
  if (file.type === 'image') {
    ui.loadSourceImage(file.data);
  }
}

// --- PAINTER ENGINE ---
class Painter {
  constructor() {
    this.isActive = false;
    this.layerTracker = null;
    this.brush = new GradientBrush();
    this.frameCount = 0;
  }

  init(img) {
    resizeCanvas(img.width, img.height);
    sourceImg = img;
    sourceImg.loadPixels();
    
    if(weightMapImg) {
      weightMapImg.resize(img.width, img.height);
      weightMapImg.loadPixels();
    }
    
    this.layerTracker = new LayerTracker(width, height);
    
    // Start with black background for that screen feel
    background(0);
    this.isActive = true;
    this.frameCount = 0;
    
    ui.updateStatus("PROCESSING...");
    select('.placeholder').style('display', 'none');
  }

  update() {
    let avgLayers = this.layerTracker.getAverageLayers();
    ui.updateStats(avgLayers);

    if (avgLayers >= config.maxAverageLayers) {
      this.isActive = false;
      ui.updateStatus("COMPLETE");
      return;
    }

    for (let i = 0; i < config.iterationsPerFrame; i++) {
      this.paintStep();
    }
  }

  paintStep() {
    let x = floor(random(width));
    let y = floor(random(height));

    if (weightMapImg) {
      let idx = (x + y * weightMapImg.width) * 4;
      if (random(255) > weightMapImg.pixels[idx]) return; 
    }

    if (this.layerTracker.getPixelLayers(x, y) > config.maxPixelLayers) return;

    let targetColor = this.getSourcePixel(x, y);
    let currentColor = get(x, y); 

    let bestColor = this.findBestColor(currentColor, targetColor);

    if (bestColor) {
      let op = random(config.minOpacity, config.maxOpacity);
      let sz = random(config.brushMinSize, config.brushMaxSize);
      
      this.brush.draw(x, y, sz, bestColor, op);
      this.layerTracker.addLayer(x, y, sz);
    }
  }

  getSourcePixel(x, y) {
    let loc = (x + y * sourceImg.width) * 4;
    return [sourceImg.pixels[loc], sourceImg.pixels[loc + 1], sourceImg.pixels[loc + 2]];
  }

  findBestColor(current, target) {
    let bestHex = null;
    let minDiff = Infinity;

    for (let hex of config.palette) {
      let pCol = color(hex);
      let alphaNorm = ((config.minOpacity + config.maxOpacity) / 2) / 255;
      
      let simR = lerp(current[0], red(pCol), alphaNorm);
      let simG = lerp(current[1], green(pCol), alphaNorm);
      let simB = lerp(current[2], blue(pCol), alphaNorm);

      let d = (simR - target[0])**2 + (simG - target[1])**2 + (simB - target[2])**2;

      if (d < minDiff) {
        minDiff = d;
        bestHex = hex;
      }
    }
    return bestHex;
  }
}

// --- BRUSH ---
class GradientBrush {
  draw(x, y, size, hexColor, opacity) {
    let ctx = drawingContext;
    let radius = size / 2;
    let grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    let c = color(hexColor);
    
    grad.addColorStop(0, `rgba(${red(c)}, ${green(c)}, ${blue(c)}, ${opacity/255})`);
    grad.addColorStop(1, `rgba(${red(c)}, ${green(c)}, ${blue(c)}, 0)`);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TWO_PI);
    ctx.fill();
  }
}

// --- TRACKER ---
class LayerTracker {
  constructor(w, h) {
    this.width = w;
    this.length = w * h;
    this.grid = new Float32Array(this.length).fill(0); 
    this.totalPaintStrokes = 0;
  }

  addLayer(x, y, size) {
    let r = Math.floor(size / 4); 
    let startX = constrain(x - r, 0, this.width);
    let endX = constrain(x + r, 0, this.width);
    let startY = constrain(y - r, 0, height);
    let endY = constrain(y + r, 0, height);

    for (let i = startX; i < endX; i++) {
      for (let j = startY; j < endY; j++) {
        this.grid[i + j * this.width] += 1;
      }
    }
    this.totalPaintStrokes++;
  }

  getPixelLayers(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= height) return 999;
    return this.grid[x + y * this.width];
  }

  getAverageLayers() {
    let avgBrushR = (config.brushMinSize + config.brushMaxSize) / 4;
    let avgBrushArea = PI * (avgBrushR * avgBrushR);
    return (this.totalPaintStrokes * avgBrushArea) / (this.length);
  }
}

// --- UI MANAGER ---
class UIManager {
  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    select('#img-upload').elt.onchange = (e) => this.handleUpload(e, 'source');
    select('#map-upload').elt.onchange = (e) => this.handleUpload(e, 'map');
    
    select('#btn-update-palette').mousePressed(() => this.updatePaletteFromInput());
    
    this.bindSlider('min-size', 'val-min-size', (v) => config.brushMinSize = int(v));
    this.bindSlider('max-size', 'val-max-size', (v) => config.brushMaxSize = int(v));
    this.bindSlider('speed', 'val-speed', (v) => config.iterationsPerFrame = int(v));
    this.bindSlider('layer-limit', 'val-limit', (v) => config.maxAverageLayers = int(v));
    
    select('#min-opacity').input(() => {
       config.minOpacity = int(select('#min-opacity').value());
       this.updateOpacityLabel();
    });
    select('#max-opacity').input(() => {
       config.maxOpacity = int(select('#max-opacity').value());
       this.updateOpacityLabel();
    });

    select('#btn-reset').mousePressed(() => {
       if(sourceImg) painter.init(sourceImg);
    });
    
    select('#btn-pause').mousePressed(() => {
       if(painter) {
         painter.isActive = !painter.isActive;
         this.updateStatus(painter.isActive ? "PROCESSING..." : "PAUSED");
       }
    });

    select('#btn-save').mousePressed(() => {
       saveCanvas('GENERATED_ART', 'jpg');
    });
  }

  bindSlider(id, labelId, callback) {
    let el = select('#' + id);
    el.input(() => {
      let val = el.value();
      select('#' + labelId).html(val);
      callback(val);
    });
  }

  updateOpacityLabel() {
    select('#val-opacity').html(`${config.minOpacity}-${config.maxOpacity}`);
  }

  handleUpload(e, type) {
    let file = e.target.files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = (event) => {
        let url = event.target.result;
        loadImage(url, (img) => {
          if (type === 'source') this.loadSourceImage(img);
          if (type === 'map') {
            weightMapImg = img;
            console.log("MAP LOADED");
          }
        });
      };
      reader.readAsDataURL(file);
    }
  }

  loadSourceImage(img) {
    if(painter) painter.init(img);
    select('#img-upload').elt.value = '';
  }
  
  updatePaletteFromInput() {
    let txt = select('#palette-input').value();
    let colors = txt.split(',').map(s => s.trim());
    config.palette = colors;
  }
  
  updateStats(avg) {
    select('#stat-avg-layers').html(nf(avg, 1, 2));
  }
  
  updateStatus(msg) {
    select('#status-text').html(msg);
  }
}
