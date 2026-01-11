export class UIController {
  constructor(params, toggles) {
    this.params = params;
    this.toggles = toggles;
    this.statusEl = null;
  }

  bind(onDirty, onResetImage, onRegenerate, onFileLoad) {
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const bindRange = (id, key, labelId, formatter = (v) => v) => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => {
        this.params[key] = parseFloat(el.value);
        setValue(labelId, formatter(this.params[key]));
        onDirty(key);
      });
      setValue(labelId, formatter(this.params[key]));
    };

    bindRange('smooth-radius', 'smoothRadius', 'smooth-value');
    bindRange('edge-low', 'edgeLow', 'edge-low-value', (v) => v.toFixed(2));
    bindRange('edge-high', 'edgeHigh', 'edge-high-value', (v) => v.toFixed(2));
    bindRange('min-distance', 'minDistance', 'min-distance-value');
    bindRange('gamma', 'gamma', 'gamma-value', (v) => v.toFixed(1));
    bindRange('density-scale', 'densityScale', 'density-value', (v) => v.toFixed(2));
    bindRange('edge-weight', 'edgeWeight', 'edge-weight-value', (v) => v.toFixed(2));
    bindRange('edge-blur', 'edgeBlurRadius', 'edge-blur-value');
    bindRange('edge-exp', 'edgeExponent', 'edge-exp-value', (v) => v.toFixed(1));
    bindRange('flow-spacing', 'flowSpacing', 'flow-spacing-value');
    bindRange('flow-step', 'flowStep', 'flow-step-value');
    bindRange('flow-max', 'flowMaxSteps', 'flow-max-value');
    bindRange('flow-noise', 'flowNoise', 'flow-noise-value', (v) => v.toFixed(1));
    bindRange('contour-interval', 'contourInterval', 'contour-interval-value', (v) => v.toFixed(2));

    const seedStipple = document.getElementById('seed-stipple');
    seedStipple.value = this.params.seedStipple;
    seedStipple.addEventListener('change', () => {
      this.params.seedStipple = parseInt(seedStipple.value, 10) || 0;
      onDirty('seedStipple');
    });

    const seedPath = document.getElementById('seed-path');
    seedPath.value = this.params.seedPath;
    seedPath.addEventListener('change', () => {
      this.params.seedPath = parseInt(seedPath.value, 10) || 0;
      onDirty('seedPath');
    });

    const seedFlow = document.getElementById('seed-flow');
    seedFlow.value = this.params.seedFlow;
    seedFlow.addEventListener('change', () => {
      this.params.seedFlow = parseInt(seedFlow.value, 10) || 0;
      onDirty('seedFlow');
    });

    const pathMode = document.getElementById('path-mode');
    pathMode.value = this.params.pathMode;
    pathMode.addEventListener('change', () => {
      this.params.pathMode = pathMode.value;
      onDirty('pathMode');
    });

    const showStipple = document.getElementById('show-stipple');
    showStipple.addEventListener('change', () => {
      this.toggles.showStipple = showStipple.checked;
    });

    const showPath = document.getElementById('show-path');
    showPath.addEventListener('change', () => {
      this.toggles.showPath = showPath.checked;
    });

    const showEdges = document.getElementById('show-edges');
    showEdges.addEventListener('change', () => {
      this.toggles.showEdges = showEdges.checked;
    });

    const showFlow = document.getElementById('show-flow');
    showFlow.addEventListener('change', () => {
      this.toggles.showFlow = showFlow.checked;
    });

    const showContours = document.getElementById('show-contours');
    showContours.addEventListener('change', () => {
      this.toggles.showContours = showContours.checked;
    });

    document.getElementById('regenerate').addEventListener('click', () => {
      onRegenerate();
    });

    document.getElementById('reset').addEventListener('click', () => {
      onResetImage();
    });

    document.getElementById('file-input').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileLoad(e.target.result);
      };
      reader.readAsDataURL(file);
    });

    this.statusEl = document.getElementById('status');
  }

  setStatus(message) {
    if (this.statusEl) this.statusEl.textContent = message;
  }
}
