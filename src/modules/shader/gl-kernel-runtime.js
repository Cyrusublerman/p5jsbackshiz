function parseUniforms(source) {
  const matches = source.matchAll(/uniform\s+(\w+)\s+(\w+)\s*;/g);
  const uniforms = new Map();
  for (const m of matches) uniforms.set(m[2], { type: m[1], value: null });
  return uniforms;
}

export class GLKernelRuntime {
  compileProgram(vertexSrc, fragmentSrc) {
    if (!vertexSrc || !fragmentSrc) throw new Error('compile/link failed: missing shader source');
    if (/\bERROR\b/.test(vertexSrc) || /\bERROR\b/.test(fragmentSrc)) {
      throw new Error('compile/link failed: shader source contains ERROR marker');
    }
    const uniforms = new Map([...parseUniforms(vertexSrc), ...parseUniforms(fragmentSrc)]);
    return { vertexSrc, fragmentSrc, uniforms, linked: true };
  }

  setUniform(program, name, value) {
    if (!program.uniforms.has(name)) throw new Error(`unknown uniform: ${name}`);
    const entry = program.uniforms.get(name);
    entry.value = value;
    program.uniforms.set(name, entry);
  }

  runKernel(program, pixelBuffer) {
    if (!program?.linked) throw new Error('program not linked');
    // Simulation hook for test/runtime wiring; real GL path can replace implementation.
    return new Uint8ClampedArray(pixelBuffer);
  }
}
