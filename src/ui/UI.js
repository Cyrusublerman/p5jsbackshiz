import { REGISTRY, PRESETS } from '../nodes/registry.js';
import { Pipeline } from '../core/Pipeline.js';
import { Recipe } from '../core/Recipe.js';
import { StatusPanel } from './StatusPanel.js';
import { Reticle } from './Reticle.js';

export class UI {
  constructor(state, onRender) {
    this.state = state;
    this.onRender = onRender;
    this.statusPanel = new StatusPanel(document.getElementById('statpanel'));
    this.reticle = new Reticle(document.getElementById('reticle'));
    this._menu();
    this._top();
    this._fnKeys();
    this._dragDrop();
    this._clock();
    this._keyboard();
  }

  /* ── Clock ── */
  _clock() {
    const el = document.getElementById('h-clock');
    const u = () => {
      const d = new Date();
      el.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(v => String(v).padStart(2, '0')).join(':');
    };
    u();
    setInterval(u, 1000);
  }

  /* ── Add-node menu ── */
  _menu() {
    const menu = document.getElementById('amenu');
    menu.innerHTML = '';

    for (const [group, items] of Object.entries(REGISTRY)) {
      const g = document.createElement('div');
      g.className = 'mg';
      g.textContent = group;
      menu.appendChild(g);

      for (const item of items) {
        const mi = document.createElement('div');
        mi.className = 'mi';
        mi.innerHTML = `<span class="md">&#9656;</span>${item.label}`;
        mi.addEventListener('click', () => {
          this.state.stack.push(item.factory());
          this.state.needsRender = true;
          menu.classList.remove('show');
          this.refreshStack();
          this.onRender();
        });
        menu.appendChild(mi);
      }
    }

    document.getElementById('add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const r = e.target.getBoundingClientRect();
      menu.style.top = r.bottom + 2 + 'px';
      menu.style.left = Math.max(0, r.right - 210) + 'px';
      menu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target.id !== 'add-btn') {
        menu.classList.remove('show');
      }
    });
  }

  /* ── Top bar controls ── */
  _top() {
    document.getElementById('seed-input').addEventListener('change', (e) => {
      this.state.globalSeed = parseInt(e.target.value) || 0;
      this.state.needsRender = true;
      this.onRender();
    });

    document.getElementById('btn-rseed').addEventListener('click', () => {
      this.state.globalSeed = Math.floor(Math.random() * 999999);
      document.getElementById('seed-input').value = this.state.globalSeed;
      this.state.needsRender = true;
      this.onRender();
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
      this._loadImg(e.target.files[0]);
    });

    document.getElementById('recipe-input').addEventListener('change', (e) => {
      this._loadRecipe(e.target.files[0]);
    });
  }

  /* ── Function key bar ── */
  _fnKeys() {
    const fk = (id, fn) => document.getElementById(id).addEventListener('click', fn);

    fk('fk1', () => document.getElementById('file-input').click());

    fk('fk2', () => {
      this.state.quality = 'preview';
      document.getElementById('fk2').classList.add('act');
      document.getElementById('fk3').classList.remove('act');
      document.getElementById('h-mode').textContent = 'PREV';
      this.state.needsRender = true;
      this.onRender();
      this.statusPanel.update(this.state);
    });

    fk('fk3', () => {
      this.state.quality = 'final';
      document.getElementById('fk3').classList.add('act');
      document.getElementById('fk2').classList.remove('act');
      document.getElementById('h-mode').textContent = 'FINAL';
      this.state.needsRender = true;
      this.onRender();
      this.statusPanel.update(this.state);
    });

    fk('fk4', () => {
      this.state.zoom = 'fit';
      this.state.panX = 0;
      this.state.panY = 0;
      document.getElementById('h-zoom').textContent = 'FIT';
    });

    fk('fk5', () => {
      this.state.zoom = '1:1';
      this.state.zoomLevel = 1;
      this.state.panX = 0;
      this.state.panY = 0;
      document.getElementById('h-zoom').textContent = '1:1';
    });

    fk('fk6', () => this._exportPNG());
    fk('fk7', () => this._exportJSON());
    fk('fk8', () => document.getElementById('recipe-input').click());
    fk('fk9', () => this._preset('SCAN'));
    fk('fk10', () => this._preset('LIQUID'));
    fk('fk11', () => this._preset('DROWNED'));
    fk('fk12', () => this._preset('DATAMOSH'));
    fk('fk13', () => this._preset('ENGRAVE'));
    fk('fk14', () => this._preset('WAVEFORM'));
    fk('fk15', () => this._preset('SIGNAL'));
  }

  /* ── Keyboard shortcuts ── */
  _keyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const key = e.key;
      if (key === '1') document.getElementById('fk1').click();
      else if (key === '2') document.getElementById('fk2').click();
      else if (key === '3') document.getElementById('fk3').click();
      else if (key === '4') document.getElementById('fk4').click();
      else if (key === '5') document.getElementById('fk5').click();
      else if (key === '6') document.getElementById('fk6').click();
      else if (key === '7') document.getElementById('fk7').click();
      else if (key === '8') document.getElementById('fk8').click();
    });
  }

  /* ── Drag / drop / pan / zoom ── */
  _dragDrop() {
    const vp = document.getElementById('vp');
    const dz = document.getElementById('dropzone');

    vp.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('on');
    });
    vp.addEventListener('dragleave', () => dz.classList.remove('on'));
    vp.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('on');
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) this._loadImg(f);
    });

    let pan = false, lx = 0, ly = 0;
    vp.addEventListener('mousedown', (e) => {
      if (e.button === 0) { pan = true; lx = e.clientX; ly = e.clientY; }
    });
    window.addEventListener('mousemove', (e) => {
      if (pan) {
        this.state.panX += e.clientX - lx;
        this.state.panY += e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;
      }
      const r = vp.getBoundingClientRect();
      document.getElementById('t-px').textContent = ((e.clientX - r.left) / r.width).toFixed(2);
      document.getElementById('t-py').textContent = ((e.clientY - r.top) / r.height).toFixed(2);
    });
    window.addEventListener('mouseup', () => { pan = false; });

    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.state.zoom === 'fit') {
        this.state.zoom = 'custom';
        this.state.zoomLevel = 1;
      }
      this.state.zoomLevel *= e.deltaY > 0 ? 0.9 : 1.1;
      this.state.zoomLevel = Math.max(0.1, Math.min(10, this.state.zoomLevel));
      document.getElementById('h-zoom').textContent = (this.state.zoomLevel * 100).toFixed(0) + '%';
    });
  }

  /* ── Image loading ── */
  _loadImg(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, img.width, img.height);
        this.state.sourceImage = img;
        this.state.sourcePixels = new Uint8ClampedArray(id.data);
        this.state.sourceW = img.width;
        this.state.sourceH = img.height;
        this.state.needsRender = true;
        document.getElementById('empty').style.display = 'none';
        document.getElementById('h-img').textContent = img.width + '\u00d7' + img.height;
        document.getElementById('t-vx').textContent = img.width.toString().padStart(5, '0');
        document.getElementById('t-vy').textContent = img.height.toString().padStart(5, '0');
        document.getElementById('t-stat').textContent = 'LOADED';
        this.statusPanel.update(this.state);
        this.onRender();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ── Export PNG ── */
  _exportPNG() {
    if (!this.state.sourcePixels) return;
    const p = new Pipeline(this.state);
    const r = p.renderFinal();
    if (!r) return;
    const c = document.createElement('canvas');
    c.width = r.width; c.height = r.height;
    const ctx = c.getContext('2d');
    const id = ctx.createImageData(r.width, r.height);
    id.data.set(r.pixels);
    ctx.putImageData(id, 0, 0);
    const a = document.createElement('a');
    a.download = `distort_${this.state.globalSeed}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }

  /* ── Export / load recipe ── */
  _exportJSON() {
    const json = Recipe.exp(this.state, REGISTRY);
    const b = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.download = `recipe_${this.state.globalSeed}.json`;
    a.href = URL.createObjectURL(b);
    a.click();
  }

  _loadRecipe(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
      Recipe.imp(this.state, e.target.result, REGISTRY);
      document.getElementById('seed-input').value = this.state.globalSeed;
      this.refreshStack();
      this.onRender();
    };
    r.readAsText(file);
  }

  _preset(name) {
    Recipe.imp(this.state, JSON.stringify(PRESETS[name]), REGISTRY);
    document.getElementById('seed-input').value = this.state.globalSeed;
    this.refreshStack();
    this.onRender();
  }

  /* ── Stack rebuild ── */
  refreshStack() {
    const el = document.getElementById('stack');
    el.innerHTML = '';
    document.getElementById('h-nodes').textContent = this.state.stack.length;
    this.statusPanel.update(this.state);

    this.state.stack.forEach((node, idx) => {
      const card = document.createElement('div');
      card.className = 'nc' +
        (node.enabled ? '' : ' off') +
        (node.id === this.state.soloNodeId ? ' solo' : '');
      card.draggable = true;
      card.dataset.idx = idx;

      // Drag reorder
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', idx);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('dragover');
      });
      card.addEventListener('dragleave', () => card.classList.remove('dragover'));
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('dragover');
        const from = parseInt(e.dataTransfer.getData('text/plain'));
        if (from !== idx) {
          const [m] = this.state.stack.splice(from, 1);
          this.state.stack.splice(idx, 0, m);
          this.state.needsRender = true;
          this.refreshStack();
          this.onRender();
        }
      });

      // Header row
      const hdr = document.createElement('div');
      hdr.className = 'nh';

      const nidx = document.createElement('span');
      nidx.className = 'nidx';
      nidx.textContent = String(idx + 1).padStart(2, '0');

      const sq = document.createElement('span');
      sq.className = 'sq' + (node.enabled ? ' on' : '');
      sq.style.cursor = 'pointer';
      sq.addEventListener('click', (e) => {
        e.stopPropagation();
        node.enabled = !node.enabled;
        this.state.needsRender = true;
        this.refreshStack();
        this.onRender();
      });

      const hb = document.createElement('span');
      hb.className = 'hbar' + (node.enabled ? '' : ' off');

      const nm = document.createElement('span');
      nm.className = 'nn';
      nm.textContent = node.name;

      const soloBtn = document.createElement('button');
      soloBtn.className = 'nb' + (node.id === this.state.soloNodeId ? ' son' : '');
      soloBtn.textContent = 'S';
      soloBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.state.soloNodeId = this.state.soloNodeId === node.id ? null : node.id;
        this.state.needsRender = true;
        this.refreshStack();
        this.onRender();
      });

      const expBtn = document.createElement('button');
      expBtn.className = 'nb';
      expBtn.textContent = node.expanded ? '\u25be' : '\u25b8';
      expBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        node.expanded = !node.expanded;
        this.refreshStack();
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'nb del';
      delBtn.textContent = '\u00d7';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.state.stack.splice(idx, 1);
        if (this.state.soloNodeId === node.id) this.state.soloNodeId = null;
        this.state.needsRender = true;
        this.refreshStack();
        this.onRender();
      });

      hdr.append(nidx, sq, hb, nm, soloBtn, expBtn, delBtn);
      card.appendChild(hdr);

      // Parameters panel
      const params = document.createElement('div');
      params.className = 'np' + (node.expanded ? '' : ' hide');

      // Opacity (universal)
      this._p(params, node, 'opacity',
        { value: node.opacity, min: 0, max: 1, step: 0.01, label: 'OPACITY' },
        (v) => { node.opacity = v; });

      // Node-specific params
      for (const [k, def] of Object.entries(node.paramDefs)) {
        this._p(params, node, k, def, (v) => { node.params[k] = v; });
      }

      card.appendChild(params);
      el.appendChild(card);
    });
  }

  /* ── Parameter row factory ── */
  _p(container, node, key, def, setter) {
    const row = document.createElement('div');
    row.className = 'pr';

    const lbl = document.createElement('span');
    lbl.className = 'pl';
    lbl.textContent = def.label || key;

    if (def.type === 'select') {
      const sel = document.createElement('select');
      sel.className = 'psel';
      for (const o of def.options) {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        if (node.params[key] === o) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener('change', () => {
        setter(sel.value);
        this.state.needsRender = true;
        this.onRender();
      });
      row.append(lbl, sel);
    } else {
      const val = key === 'opacity' ? node.opacity : node.params[key];
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.className = 'ps';
      sl.min = def.min;
      sl.max = def.max;
      sl.step = def.step;
      sl.value = val;

      const num = document.createElement('input');
      num.type = 'number';
      num.className = 'pv';
      num.min = def.min;
      num.max = def.max;
      num.step = def.step;
      num.value = Number(val).toFixed(def.step < 1 ? 2 : 0);

      sl.addEventListener('input', () => {
        const v = parseFloat(sl.value);
        setter(v);
        num.value = v.toFixed(def.step < 1 ? 2 : 0);
        this.state.needsRender = true;
        this.onRender();
      });

      num.addEventListener('change', () => {
        let v = Math.max(def.min, Math.min(def.max, parseFloat(num.value)));
        setter(v);
        sl.value = v;
        num.value = v.toFixed(def.step < 1 ? 2 : 0);
        this.state.needsRender = true;
        this.onRender();
      });

      row.append(lbl, sl, num);
    }

    container.appendChild(row);
  }
}
