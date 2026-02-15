// ---------- Drop-in single-pen engine (Worker built from Blob URL) ----------

// Globals (kept for compatibility with your codebase)

const images = new Map();

let processedImages = Object.create(null);

let processedImageDatas = Object.create(null);

let allCombinations = [];

let currentFrame = 0;

let animationInterval = null;        // not used (we use rAF)

let playing = false;

let animationSpeed = 1000 / 24;

let isGeneratingGIF = false;         // disabled on CodePen

let gifPreviewBlobUrl = null;

let equationEngine = null;

let equationValidator = null;

let currentEquation = null;

let mainCanvas = null;

let mainCtx = null;                  // unused; we render in worker

let offscreenCanvas = null;

let offscreenCtx = null;

const IMAGE_SETTINGS = {

  maxShortSide: 768,

  autoResize: true

};

let zoomState = {

  scale: 1,

  panX: 0,

  panY: 0,

  isPanning: false,

  startX: 0,

  startY: 0

};

const performanceMetrics = {

  lastFrameTime: 0,

  frameCount: 0,

  fps: 0

};

// Internal state

let _worker = null;

let _offscreen = null;

let _bitmaps = [];

let _lastT = 0;

let _targetFps = 24;

let _rAF = 0;

let _ready = false;

let _canvasPixelWidth = 1;

let _canvasPixelHeight = 1;

// Build worker source as a string (no imports; compatible with Blob URL)

function buildWorkerSource() {

  // GLSL strings

  const VERT = `#version 300 es

  precision highp float;

  layout(location=0) in vec2 a_pos;

  layout(location=1) in vec2 a_uv;

  out vec2 v_uv;

  uniform vec2 u_canvasSize;

  uniform vec3 u_zoom; // scale, panX, panY (px)

  void main(){

    vec2 halfSize = u_canvasSize * 0.5;

    vec2 px = a_pos * halfSize;

    px = (px * u_zoom.x) + u_zoom.yz;

    vec2 ndc = px / halfSize;

    gl_Position = vec4(ndc, 0.0, 1.0);

    v_uv = a_uv;

  }`;

  const FRAG = `#version 300 es

  precision highp float;

  in vec2 v_uv;

  out vec4 fragColor;

  uniform sampler2D u_tex0;

  uniform sampler2D u_tex1;

  uniform float u_mix;

  uniform int   u_mode;

  uniform float u_exposure;

  uniform float u_invGamma;

  vec3 toneMap(vec3 c, float exposure, float invGamma){

    float k = exp2(exposure);

    vec3 v = max(vec3(0.0), c * k);

    return pow(v, vec3(invGamma));

  }

  void main(){

    vec4 a = texture(u_tex0, v_uv);

    vec4 b = texture(u_tex1, v_uv);

    vec3 outRGB;

    if (u_mode == 0) {

      outRGB = a.rgb;

    } else if (u_mode == 1) {

      outRGB = mix(a.rgb, b.rgb, clamp(u_mix, 0.0, 1.0));

    } else if (u_mode == 2) {

      outRGB = a.rgb * b.rgb;

    } else {

      outRGB = abs(a.rgb - b.rgb);

    }

    outRGB = toneMap(outRGB, u_exposure, u_invGamma);

    fragColor = vec4(outRGB, 1.0);

  }`;

  return `

  let canvas = null;

  let width = 1, height = 1, fps = 24;

  let gl = null, ctx2d = null;

  let program = null, vao = null, uniforms = {};

  let textures = [];

  let imagesMeta = [];

  let effect = 'passthrough';

  let exposure = 0.0;

  let gamma = 1.0;

  let zoom = { scale: 1, panX: 0, panY: 0 };

  let frameCounter = 0;

  const VERT = \`${VERT}\`;

  const FRAG = \`${FRAG}\`;

  function compile(gl, type, src){

    const sh = gl.createShader(type);

    gl.shaderSource(sh, src);

    gl.compileShader(sh);

    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){

      const log = gl.getShaderInfoLog(sh);

      gl.deleteShader(sh);

      throw new Error('Shader compile error: ' + log);

    }

    return sh;

  }

  function createProgram(gl, vsSrc, fsSrc){

    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);

    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);

    const prog = gl.createProgram();

    gl.attachShader(prog, vs);

    gl.attachShader(prog, fs);

    gl.linkProgram(prog);

    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){

      const log = gl.getProgramInfoLog(prog);

      gl.deleteProgram(prog);

      throw new Error('Program link error: ' + log);

    }

    gl.deleteShader(vs);

    gl.deleteShader(fs);

    return prog;

  }

  function getUniformLocations(gl, prog, names){

    const out = {};

    for(const n of names) out[n] = gl.getUniformLocation(prog, n);

    return out;

  }

  function initGL(){

    gl = canvas.getContext('webgl2', {

      alpha:false, depth:false, stencil:false,

      antialias:false, desynchronized:true,

      premultipliedAlpha:false, preserveDrawingBuffer:false

    });

    if(!gl) return false;

    program = createProgram(gl, VERT, FRAG);

    gl.useProgram(program);

    uniforms = getUniformLocations(gl, program, [

      'u_canvasSize', 'u_zoom','u_tex0','u_tex1','u_mix',

      'u_mode','u_exposure','u_invGamma'

    ]);

    // fullscreen quad

    const quad = new Float32Array([

      -1,-1, 0,0,

       1,-1, 1,0,

      -1, 1, 0,1,

       1, 1, 1,1

    ]);

    vao = gl.createVertexArray();

    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(1);

    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    gl.uniform1i(uniforms.u_tex0, 0);

    gl.uniform1i(uniforms.u_tex1, 1);

    setViewport(width,height);

    return true;

  }

  function init2D(){

    ctx2d = canvas.getContext('2d', { desynchronized:true });

    return !!ctx2d;

  }

  function setViewport(w,h){

    if(gl){

      gl.viewport(0,0,w,h);

      gl.useProgram(program);

      gl.uniform2f(uniforms.u_canvasSize, w, h);

    }

  }

  function createTextureFromSource(src){

    const tex = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);

    return tex;

  }

  function resampleBitmap(bitmap, maxShortSide){

    if(!maxShortSide || maxShortSide<=0) return bitmap;

    const sw = bitmap.width, sh = bitmap.height;

    const shortSide = Math.min(sw, sh);

    if(shortSide <= maxShortSide) return bitmap;

    const scale = maxShortSide/shortSide;

    const tw = Math.max(1, Math.round(sw*scale));

    const th = Math.max(1, Math.round(sh*scale));

    const oc = new OffscreenCanvas(tw, th);

    const c2d = oc.getContext('2d', { desynchronized:true });

    c2d.drawImage(bitmap, 0, 0, tw, th);

    return oc;

  }

  function render(frame){

    if(gl){

      gl.useProgram(program);

      gl.bindVertexArray(vao);

      const N = Math.max(1, textures.length);

      const i0 = frame % N;

      const i1 = (i0 + 1) % N;

      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(gl.TEXTURE_2D, textures[i0]);

      gl.activeTexture(gl.TEXTURE1);

      gl.bindTexture(gl.TEXTURE_2D, textures[i1]);

      const mode = (effect==='passthrough')?0:(effect==='crossfade')?1:(effect==='multiply')?2:3;

      gl.uniform1i(uniforms.u_mode, mode);

      gl.uniform1f(uniforms.u_mix, (effect==='crossfade')?0.5:0.0);

      gl.uniform1f(uniforms.u_exposure, exposure);

      gl.uniform1f(uniforms.u_invGamma, 1.0/Math.max(0.01,gamma));

      gl.uniform3f(uniforms.u_zoom, zoom.scale, zoom.panX, zoom.panY);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    } else if (ctx2d){

      const N = Math.max(1, imagesMeta.length);

      const i0 = frame % N;

      const img = imagesMeta[i0];

      ctx2d.clearRect(0,0,width,height);

      ctx2d.save();

      ctx2d.translate(width*0.5 + zoom.panX, height*0.5 + zoom.panY);

      ctx2d.scale(zoom.scale, zoom.scale);

      ctx2d.drawImage(img, -img.width*0.5, -img.height*0.5);

      ctx2d.restore();

    }

  }

  self.onmessage = async (e)=>{

    const msg = e.data || {};

    try{

      switch(msg.type){

        case 'init': {

          canvas = msg.canvas || new OffscreenCanvas(msg.width||1, msg.height||1);

          width = msg.width||1; height = msg.height||1; fps = msg.fps||24;

          if(!initGL()){

            if(!init2D()) throw new Error('No WebGL2 or 2D context available.');

          }

          canvas.width = width; canvas.height = height;

          setViewport(width, height);

          self.postMessage({ type:'ready' });

          break;

        }

        case 'resize': {

          width = Math.max(1, msg.width|0);

          height = Math.max(1, msg.height|0);

          canvas.width = width; canvas.height = height;

          if(gl) setViewport(width, height);

          break;

        }

        case 'load-images': {

          const ims = msg.bitmaps || [];

          imagesMeta = [];

          if(gl){

            for(const t of textures) gl.deleteTexture(t);

            textures = [];

          }

          const targetShort = 2048;

          for(const bm of ims){

            const src = (Math.min(bm.width, bm.height) > targetShort)

              ? resampleBitmap(bm, targetShort)

              : bm;

            imagesMeta.push(src);

            if(gl) textures.push(createTextureFromSource(src));

          }

          break;

        }

        case 'advance': {

          frameCounter = msg.frame|0;

          render(frameCounter);

          break;

        }

        case 'seek': {

          frameCounter = msg.frame|0;

          render(frameCounter);

          break;

        }

        case 'fps': {

          fps = Math.max(1, Math.min(120, msg.fps|0));

          break;

        }

        case 'params': {

          const p = msg.params||{};

          if(typeof p.effect==='string') effect = p.effect;

          if(typeof p.exposure==='number') exposure = p.exposure;

          if(typeof p.gamma==='number' && isFinite(p.gamma) && p.gamma>0) gamma = p.gamma;

          break;

        }

        case 'zoom': {

          const z = msg.zoom||{};

          if(typeof z.scale==='number') zoom.scale = z.scale;

          if(typeof z.panX==='number') zoom.panX = z.panX;

          if(typeof z.panY==='number') zoom.panY = z.panY;

          break;

        }

        default: break;

      }

    } catch(err){

      self.postMessage({ type:'error', data:{ message: err?.message || String(err) }});

    }

  };

  `;

}

// Create worker from Blob URL

function createWorker() {

  const src = buildWorkerSource();

  const blob = new Blob([src], { type: 'application/javascript' });

  const url = URL.createObjectURL(blob);

  const w = new Worker(url, { type: 'module' });

  // Revoke later when destroyed

  w._blobUrl = url;

  return w;

}

// Init engine on CodePen

async function initAnimationEngine(canvasEl, opts = {}) {

  mainCanvas = canvasEl;

  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));

  const rect = mainCanvas.getBoundingClientRect();

  _canvasPixelWidth = Math.max(1, Math.floor(rect.width * dpr));

  _canvasPixelHeight = Math.max(1, Math.floor(rect.height * dpr));

  if ('transferControlToOffscreen' in mainCanvas) {

    _offscreen = mainCanvas.transferControlToOffscreen();

  }

  _worker = createWorker();

  _worker.onmessage = (e) => {

    const { type, data } = e.data || {};

    if (type === 'ready') _ready = true;

    else if (type === 'error') console.error('[worker]', data?.message || data);

  };

  // Observe canvas size changes

  const ro = new ResizeObserver(() => {

    const r = mainCanvas.getBoundingClientRect();

    const d = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));

    const w = Math.max(1, Math.floor(r.width * d));

    const h = Math.max(1, Math.floor(r.height * d));

    if (w !== _canvasPixelWidth || h !== _canvasPixelHeight) {

      _canvasPixelWidth = w; _canvasPixelHeight = h;

      _worker?.postMessage({ type: 'resize', width: w, height: h });

    }

  });

  ro.observe(mainCanvas);

  // Send init to worker

  _worker.postMessage({

    type: 'init',

    canvas: _offscreen ?? null,

    width: _canvasPixelWidth,

    height: _canvasPixelHeight,

    fps: _targetFps

  }, _offscreen ? [_offscreen] : []);

}

async function _toBitmap(src) {

  const res = await fetch(src, { mode: 'cors', cache: 'force-cache' });

  const blob = await res.blob();

  return await createImageBitmap(blob, { colorSpaceConversion: 'none' });

}

async function loadImagesFromUrls(urls) {

  if (!_ready) await new Promise(r => {

    const id = setInterval(() => { if (_ready) { clearInterval(id); r(); } }, 10);

  });

  const bitmaps = [];

  for (const url of urls) bitmaps.push(await _toBitmap(url));

  _bitmaps = bitmaps;

  _worker.postMessage({ type: 'load-images', bitmaps }, bitmaps);

  images.clear();

  urls.forEach((u, i) => images.set(`img_${i}`, u));

}

function _tick(ts) {

  if (!playing) return;

  const step = 1000 / _targetFps;

  if (ts - _lastT >= step) {

    _lastT = ts;

    currentFrame++;

    _worker.postMessage({ type: 'advance', frame: currentFrame, timestamp: ts });

  }

  _rAF = requestAnimationFrame(_tick);

}

function play() {

  if (!_ready || playing) return;

  playing = true;

  _lastT = performance.now();

  _rAF = requestAnimationFrame(_tick);

}

function pause() {

  playing = false;

  if (_rAF) cancelAnimationFrame(_rAF);

}

function setFps(fps) {

  const f = Math.max(1, Math.min(120, Math.floor(fps)));

  _targetFps = f;

  animationSpeed = 1000 / f;

  _worker.postMessage({ type: 'fps', fps: f });

}

function setParams(params) {

  _worker.postMessage({ type: 'params', params: { ...params } });

}

function setZoom({ scale = 1, panX = 0, panY = 0 } = {}) {

  zoomState.scale = +scale || 1;

  zoomState.panX = +panX || 0;

  zoomState.panY = +panY || 0;

  _worker.postMessage({ type: 'zoom', zoom: { ...zoomState } });

}

// ---------- Wire up demo controls ----------

(async function main(){

  const canvas = document.getElementById('main');

  await initAnimationEngine(canvas, { fps: 24 });

  // Replace with your own CORS-allowed images

  const demoImgs = [

    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1024&q=80&auto=format',

    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1024&q=80&auto=format',

    'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1024&q=80&auto=format'

  ];

  await loadImagesFromUrls(demoImgs);

  // Controls

  document.getElementById('btnPlay').onclick = play;

  document.getElementById('btnPause').onclick = pause;

  const fpsInput = document.getElementById('fps');

  fpsInput.oninput = () => setFps(+fpsInput.value || 24);

  const effectSel = document.getElementById('effect');

  const gammaInput = document.getElementById('gamma');

  const exposureInput = document.getElementById('exposure');

  const scaleInput = document.getElementById('scale');

  const panXInput = document.getElementById('panX');

  const panYInput = document.getElementById('panY');

  function pushParams(){

    setParams({

      effect: effectSel.value,

      gamma: parseFloat(gammaInput.value) || 1.0,

      exposure: parseFloat(exposureInput.value) || 0

    });

  }

  function pushZoom(){

    setZoom({

      scale: parseFloat(scaleInput.value) || 1,

      panX: parseFloat(panXInput.value) || 0,

      panY: parseFloat(panYInput.value) || 0

    });

  }

  effectSel.oninput = pushParams;

  gammaInput.oninput = pushParams;

  exposureInput.oninput = pushParams;

  scaleInput.oninput = pushZoom;

  panXInput.oninput = pushZoom;

  panYInput.oninput = pushZoom;

  pushParams();

  play();

})();