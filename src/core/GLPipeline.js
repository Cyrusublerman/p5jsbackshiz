/**
 * GLPipeline — WebGL2 shader pipeline for GPU-accelerated node processing.
 * Manages a ping-pong framebuffer pair and compiles/caches shader programs.
 */
export class GLPipeline {
  constructor() {
    this._oc = null;
    this._gl = null;
    this._w = 0;
    this._h = 0;
    this._quad = null;
    this._fbos = [null, null];
    this._textures = [null, null];
    this._inputTex = null;
    this._programCache = new Map();
  }

  /** Initialise (or resize) the GL context. */
  init(w, h) {
    if (this._gl && this._w === w && this._h === h) return true;
    this._w = w; this._h = h;

    if (!this._oc) {
      this._oc = new OffscreenCanvas(w, h);
      this._gl = this._oc.getContext('webgl2', {
        alpha: false, depth: false, stencil: false,
        antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true
      });
      if (!this._gl) return false;
      this._initQuad();
    } else {
      this._oc.width = w; this._oc.height = h;
    }

    const gl = this._gl;
    gl.viewport(0, 0, w, h);

    // Create ping-pong FBOs
    for (let i = 0; i < 2; i++) {
      if (this._textures[i]) gl.deleteTexture(this._textures[i]);
      if (this._fbos[i]) gl.deleteFramebuffer(this._fbos[i]);
      this._textures[i] = this._createTex(w, h);
      this._fbos[i] = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbos[i]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._textures[i], 0);
    }
    if (this._inputTex) gl.deleteTexture(this._inputTex);
    this._inputTex = this._createTex(w, h);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return true;
  }

  /** Upload pixel data to input texture. */
  uploadPixels(pixels, w, h) {
    const gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._inputTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  }

  /** Run a chain of GLSL fragment shaders. Returns output texture index (0 or 1). */
  runChain(shaderNodes) {
    const gl = this._gl;
    let readTex = this._inputTex;
    let writeFBO = 0;

    for (const { fragment, uniforms } of shaderNodes) {
      const prog = this._getProgram(fragment);
      gl.useProgram(prog);

      // Bind input texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(gl.getUniformLocation(prog, 'u_tex'), 0);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), this._w, this._h);

      // Set uniforms
      for (const [name, val] of Object.entries(uniforms || {})) {
        const loc = gl.getUniformLocation(prog, name);
        if (loc === null) continue;
        if (typeof val === 'number') gl.uniform1f(loc, val);
        else if (Array.isArray(val) && val.length === 2) gl.uniform2f(loc, val[0], val[1]);
        else if (Array.isArray(val) && val.length === 3) gl.uniform3f(loc, val[0], val[1], val[2]);
        else if (Array.isArray(val) && val.length === 4) gl.uniform4f(loc, val[0], val[1], val[2], val[3]);
      }

      // Render to FBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbos[writeFBO]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Swap: output becomes next input
      readTex = this._textures[writeFBO];
      writeFBO = 1 - writeFBO;
    }

    return readTex;
  }

  /** Read pixels from the last output texture. */
  readPixels(outputTex, dst) {
    const gl = this._gl;
    // Find which FBO has this texture
    const fboIdx = this._textures.indexOf(outputTex);
    if (fboIdx >= 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbos[fboIdx]);
    }
    gl.readPixels(0, 0, this._w, this._h, gl.RGBA, gl.UNSIGNED_BYTE, dst);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ── Internal ──

  _initQuad() {
    const gl = this._gl;
    const verts = new Float32Array([-1,-1, 0,0, 1,-1, 1,0, -1,1, 0,1, 1,1, 1,1]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    this._quad = gl.createVertexArray();
    gl.bindVertexArray(this._quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  }

  _createTex(w, h) {
    const gl = this._gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return tex;
  }

  _getProgram(fragmentSrc) {
    if (this._programCache.has(fragmentSrc)) return this._programCache.get(fragmentSrc);
    const gl = this._gl;

    const vert = `#version 300 es
      layout(location=0) in vec2 a_pos;
      layout(location=1) in vec2 a_uv;
      out vec2 v_uv;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); v_uv = a_uv; }`;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vert); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentSrc); gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.warn('GLSL compile error:', gl.getShaderInfoLog(fs));
      gl.deleteShader(vs); gl.deleteShader(fs);
      return null;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs); gl.deleteShader(fs);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('GLSL link error:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }

    gl.bindVertexArray(this._quad);
    this._programCache.set(fragmentSrc, prog);
    return prog;
  }

  get available() { return !!this._gl; }
}
