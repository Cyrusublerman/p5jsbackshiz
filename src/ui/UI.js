import { REGISTRY, PRESETS } from '../nodes/registry.js';
import { Pipeline } from '../core/Pipeline.js';
import { Recipe } from '../core/Recipe.js';
import { History } from '../core/History.js';
import { StatusPanel } from './StatusPanel.js';

export class UI {
  constructor(state, onRender) {
    this.state = state;
    this.onRender = onRender;
    this._maskTargetNode = null;
    this._savedScale = null;
    this.history = new History(30);
    this.statusPanel = new StatusPanel(document.getElementById('statpanel'));
    // No reticle — removed per user request
    this._menu();
    this._top();
    this._fnKeys();
    this._dragDrop();
    this._clock();
    this._keyboard();
    this._modMapUpload();
    this._panelResize();
    this._transport();
    this._progressInterval();
    this._variationGrid();
    this._presetMenu();
    this._zoomCycle();
    this._versionDisplay();
    this.history.push(state, REGISTRY);
  }

  _snap() { this.history.push(this.state, REGISTRY); }

  /* ── Version display (commit date as numeric) ── */
  _versionDisplay() {
    // BUILD_DATE is injected; fallback to current date
    const dateStr = typeof BUILD_DATE !== 'undefined' ? BUILD_DATE : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const titleEl = document.querySelector('#hdr1 .hc.inv');
    if (titleEl) titleEl.textContent = `DISTORT ${dateStr}`;
  }

  /* ── Clock ── */
  _clock() {
    const el = document.getElementById('h-clock');
    const u = () => { const d = new Date(); el.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':'); };
    u(); setInterval(u, 1000);
  }

  /* ── Progress bar ── */
  _progressInterval() {
    const bar = document.getElementById('render-progress');
    setInterval(() => { bar.style.width = this.state.rendering ? (this.state.renderProgress * 100) + '%' : '0%'; }, 50);
  }

  /* ── Zoom cycle: click to cycle fit→fill→1:1 ── */
  _zoomCycle() {
    const zoomEl = document.getElementById('h-zoom');
    if (!zoomEl) return;
    zoomEl.style.cursor = 'pointer';
    zoomEl.addEventListener('click', () => {
      const s = this.state;
      if (s.zoom === 'fit') { s.zoom = 'fill'; s.panX = s.panY = 0; zoomEl.textContent = 'FILL'; }
      else if (s.zoom === 'fill') { s.zoom = '1:1'; s.zoomLevel = 1; s.panX = s.panY = 0; zoomEl.textContent = '1:1'; }
      else { s.zoom = 'fit'; s.panX = s.panY = 0; zoomEl.textContent = 'FIT'; }
    });
  }

  /* ── Add-node menu with search ── */
  _menu() {
    const menu = document.getElementById('amenu');
    menu.innerHTML = '';
    const search = document.createElement('input');
    search.id = 'amenu-search'; search.type = 'text'; search.placeholder = 'SEARCH NODES...';
    menu.appendChild(search);
    const allItems = [];

    for (const [group, items] of Object.entries(REGISTRY)) {
      const g = document.createElement('div'); g.className = 'mg'; g.textContent = group;
      menu.appendChild(g);
      for (const item of items) {
        const mi = document.createElement('div'); mi.className = 'mi';
        mi.dataset.label = item.label.toLowerCase(); mi.dataset.group = group.toLowerCase();
        mi.innerHTML = `<span class="md">&#9656;</span>${item.label}`;
        mi.addEventListener('click', () => {
          this._snap(); this.state.stack.push(item.factory()); this.state.needsRender = true;
          menu.classList.remove('show'); search.value = ''; this.refreshStack(); this.onRender();
        });
        menu.appendChild(mi);
        allItems.push({ el: mi, groupEl: g, label: item.label.toLowerCase(), group: group.toLowerCase() });
      }
    }

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim(); const groups = new Set();
      for (const item of allItems) {
        const match = !q || item.label.includes(q) || item.group.includes(q);
        item.el.style.display = match ? '' : 'none'; if (match) groups.add(item.groupEl);
      }
      menu.querySelectorAll('.mg').forEach(g => { g.style.display = groups.has(g) || !q ? '' : 'none'; });
    });

    document.getElementById('add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const r = e.target.getBoundingClientRect();
      const menuW = 230;
      const x = Math.max(8, Math.min(window.innerWidth - menuW - 8, r.right - 210));
      menu.style.left = x + 'px';
      menu.style.top = (r.bottom + 2) + 'px';
      menu.classList.toggle('show');
      if (menu.classList.contains('show')) {
        search.value = '';
        search.dispatchEvent(new Event('input'));
        menu.scrollTop = 0;
        const maxH = Math.min(window.innerHeight * 0.7, 520);
        menu.style.maxHeight = maxH + 'px';
        const rect = menu.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 8) {
          menu.style.top = Math.max(8, window.innerHeight - rect.height - 8) + 'px';
        }
        setTimeout(() => search.focus(), 10);
      }
    });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target) && e.target.id !== 'add-btn') menu.classList.remove('show'); });
  }

  /* ── Top bar ── */
  _top() {
    document.getElementById('seed-input').addEventListener('change', (e) => { this._snap(); this.state.globalSeed = parseInt(e.target.value) || 0; this.state.needsRender = true; this.onRender(); });
    document.getElementById('btn-rseed').addEventListener('click', () => { this._snap(); this.state.globalSeed = Math.floor(Math.random() * 999999); document.getElementById('seed-input').value = this.state.globalSeed; this.state.needsRender = true; this.onRender(); });
    document.getElementById('file-input').addEventListener('change', (e) => this._loadImg(e.target.files[0]));
    document.getElementById('recipe-input').addEventListener('change', (e) => this._loadRecipe(e.target.files[0]));
  }

  /* ── Function key bar ── */
  _fnKeys() {
    const fk = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    fk('fk1', () => document.getElementById('file-input').click());
    fk('fk2', () => { this.state.quality = 'preview'; document.getElementById('fk2')?.classList.add('act'); document.getElementById('fk3')?.classList.remove('act'); document.getElementById('h-mode').textContent = 'PREV'; this.state.needsRender = true; this.onRender(); this.statusPanel.update(this.state); });
    fk('fk3', () => { this.state.quality = 'final'; document.getElementById('fk3')?.classList.add('act'); document.getElementById('fk2')?.classList.remove('act'); document.getElementById('h-mode').textContent = 'FINAL'; this.state.needsRender = true; this.onRender(); this.statusPanel.update(this.state); });
    fk('fk4', () => { this.state.zoom = 'fit'; this.state.panX = this.state.panY = 0; document.getElementById('h-zoom').textContent = 'FIT'; });
    fk('fk5', () => { this.state.zoom = '1:1'; this.state.zoomLevel = 1; this.state.panX = this.state.panY = 0; document.getElementById('h-zoom').textContent = '1:1'; });
    fk('fk6', () => this._exportPNG());
    fk('fk7', () => this._exportJSON());
    fk('fk8', () => document.getElementById('recipe-input').click());
    fk('fk-modmap', () => document.getElementById('modmap-input').click());
  }

  /* ── Preset submenu ── */
  _presetMenu() {
    const menu = document.getElementById('preset-menu');
    for (const name of Object.keys(PRESETS)) {
      const mi = document.createElement('div'); mi.className = 'mi'; mi.textContent = name;
      mi.addEventListener('click', () => { this._snap(); this._preset(name); menu.classList.remove('show'); });
      menu.appendChild(mi);
    }
    const btn = document.getElementById('fk-presets');
    if (btn) btn.addEventListener('click', (e) => {
      e.stopPropagation(); const r = btn.getBoundingClientRect();
      menu.style.bottom = (window.innerHeight - r.top + 2) + 'px'; menu.style.left = r.left + 'px';
      menu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target) && e.target?.id !== 'fk-presets') menu.classList.remove('show'); });
  }

  /* ── Variation grid ── */
  _variationGrid() {
    const modal = document.getElementById('var-grid');
    const grid = document.getElementById('vg-grid');
    const closeBtn = document.getElementById('vg-close');
    const btn = document.getElementById('fk-vargrid');
    if (btn) btn.addEventListener('click', () => { if (!this.state.sourcePixels) return; this._renderVariations(grid); modal.classList.add('show'); });
    closeBtn?.addEventListener('click', () => modal.classList.remove('show'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
  }

  _renderVariations(grid) {
    grid.innerHTML = '';
    const baseSeed = this.state.globalSeed;
    const pipe = new Pipeline(this.state);
    const origQuality = this.state.quality; const origScale = this.state.previewScale;
    this.state.quality = 'preview'; this.state.previewScale = 0.2;
    for (let i = 0; i < 9; i++) {
      const seed = baseSeed + i * 7919;
      this.state.globalSeed = seed; this.state.needsRender = true;
      for (const n of this.state.stack) { n._cacheValid = false; n._cache = null; }
      const r = pipe.render();
      const cell = document.createElement('div'); cell.className = 'vg-cell';
      if (r) { const c = document.createElement('canvas'); c.width = r.width; c.height = r.height; const ctx = c.getContext('2d'); const id = ctx.createImageData(r.width, r.height); id.data.set(r.pixels); ctx.putImageData(id, 0, 0); cell.appendChild(c); }
      const seedLbl = document.createElement('span'); seedLbl.className = 'vg-seed'; seedLbl.textContent = seed; cell.appendChild(seedLbl);
      cell.addEventListener('click', () => {
        this._snap(); this.state.globalSeed = seed; document.getElementById('seed-input').value = seed;
        this.state.needsRender = true; for (const n of this.state.stack) { n._cacheValid = false; n._cache = null; }
        document.getElementById('var-grid').classList.remove('show');
        this.state.quality = origQuality; this.state.previewScale = origScale; this.onRender();
      });
      grid.appendChild(cell);
    }
    this.state.globalSeed = baseSeed; this.state.quality = origQuality; this.state.previewScale = origScale;
  }

  /* ── Keyboard shortcuts ── */
  _keyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const key = e.key.toLowerCase();
      if (key >= '1' && key <= '8') { const el = document.getElementById('fk' + key); if (el) el.click(); return; }
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) { if (this.history.redo(this.state, REGISTRY)) { this.refreshStack(); this.state.needsRender = true; this.onRender(); } }
        else { if (this.history.undo(this.state, REGISTRY)) { this.refreshStack(); this.state.needsRender = true; this.onRender(); } }
        return;
      }
      const s = this.state; const idx = s.selectedNodeIdx;
      if (key === 'a') { document.getElementById('add-btn').click(); return; }
      if (key === 'v') { document.getElementById('fk-vargrid')?.click(); return; }
      if (key === 'tab') { e.preventDefault(); if (s.stack.length === 0) return; if (e.shiftKey) s.selectedNodeIdx = Math.max(0, idx - 1); else s.selectedNodeIdx = Math.min(s.stack.length - 1, idx + 1); this.refreshStack(); return; }
      if (idx >= 0 && idx < s.stack.length) {
        const node = s.stack[idx];
        if (key === 'e') { this._snap(); node.enabled = !node.enabled; s.needsRender = true; this.refreshStack(); this.onRender(); }
        else if (key === 'd') { this._snap(); s.stack.splice(idx, 1); if (s.soloNodeId === node.id) s.soloNodeId = null; s.selectedNodeIdx = Math.min(idx, s.stack.length - 1); s.needsRender = true; this.refreshStack(); this.onRender(); }
        else if (key === '[' && idx > 0) { this._snap(); [s.stack[idx], s.stack[idx-1]] = [s.stack[idx-1], s.stack[idx]]; s.selectedNodeIdx = idx - 1; s.needsRender = true; this.refreshStack(); this.onRender(); }
        else if (key === ']' && idx < s.stack.length - 1) { this._snap(); [s.stack[idx], s.stack[idx+1]] = [s.stack[idx+1], s.stack[idx]]; s.selectedNodeIdx = idx + 1; s.needsRender = true; this.refreshStack(); this.onRender(); }
      }
      if (key === ' ' && s.frameCount > 1) { e.preventDefault(); document.getElementById('t-play')?.click(); }
    });
  }

  /* ── Modulation map + mask upload ── */
  _modMapUpload() {
    document.getElementById('modmap-input').addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const name = file.name.replace(/\.[^.]+$/, '').substring(0, 16);
      const reader = new FileReader();
      reader.onload = (ev) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); const id = ctx.getImageData(0, 0, img.width, img.height); this.state.addModulationMap(name, new Uint8ClampedArray(id.data), img.width, img.height); this.refreshStack(); }; img.src = ev.target.result; };
      reader.readAsDataURL(file); e.target.value = null;
    });
    document.getElementById('mask-input').addEventListener('change', (e) => {
      const file = e.target.files[0]; const node = this._maskTargetNode; if (!file || !node) return;
      const reader = new FileReader();
      reader.onload = (ev) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); const id = ctx.getImageData(0, 0, img.width, img.height); node.mask._sourcePixels = new Uint8ClampedArray(id.data); node.mask._sourceW = img.width; node.mask._sourceH = img.height; node.mask.source = 'upload'; node.mask.enabled = true; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); }; img.src = ev.target.result; };
      reader.readAsDataURL(file); e.target.value = null; this._maskTargetNode = null;
    });
  }

  /* ── Panel resize ── */
  _panelResize() {
    const handle = document.getElementById('panel-resize');
    const app = document.getElementById('app');
    if (!handle) return;
    let dragging = false;
    handle.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', (e) => { if (!dragging) return; const w = Math.max(200, Math.min(600, e.clientX)); app.style.gridTemplateColumns = w + 'px 1fr'; });
    window.addEventListener('mouseup', () => { dragging = false; });
  }

  /* ── Transport controls ── */
  _transport() {
    const transport = document.getElementById('transport');
    const scrub = document.getElementById('t-scrub');
    const infoFrame = document.getElementById('t-info-frame');
    const playBtn = document.getElementById('t-play');
    let animInterval = null;
    const updateTransport = () => { const s = this.state; if (s.frameCount > 1) { transport.classList.add('show'); scrub.max = s.frameCount - 1; scrub.value = s.currentFrame; infoFrame.textContent = `${s.currentFrame + 1}/${s.frameCount}`; } else transport.classList.remove('show'); };
    this._updateTransport = updateTransport;
    scrub?.addEventListener('input', () => { this.state.seekFrame(parseInt(scrub.value)); this.onRender(); updateTransport(); });
    playBtn?.addEventListener('click', () => { const s = this.state; if (s.isPlaying) { s.isPlaying = false; if (animInterval) { clearInterval(animInterval); animInterval = null; } playBtn.textContent = '\u25b6'; } else { s.isPlaying = true; playBtn.textContent = '\u25a0'; animInterval = setInterval(() => { s.seekFrame((s.currentFrame + 1) % s.frameCount); this.onRender(); updateTransport(); }, 1000 / s.fps); } });
    document.getElementById('t-step-fwd')?.addEventListener('click', () => { this.state.seekFrame(this.state.currentFrame + 1); this.onRender(); updateTransport(); });
    document.getElementById('t-step-back')?.addEventListener('click', () => { this.state.seekFrame(this.state.currentFrame - 1); this.onRender(); updateTransport(); });
    document.getElementById('t-prev')?.addEventListener('click', () => { this.state.seekFrame(0); this.onRender(); updateTransport(); });
    document.getElementById('t-next')?.addEventListener('click', () => { this.state.seekFrame(this.state.frameCount - 1); this.onRender(); updateTransport(); });
  }

  /* ── Drag / drop / pan / zoom ── */
  _dragDrop() {
    const vp = document.getElementById('vp'); const dz = document.getElementById('dropzone');
    vp.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('on'); });
    vp.addEventListener('dragleave', () => dz.classList.remove('on'));
    vp.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('on'); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) this._loadImg(f); });
    let pan = false, lx = 0, ly = 0;
    vp.addEventListener('mousedown', (e) => { if (e.button === 0) { pan = true; lx = e.clientX; ly = e.clientY; } });
    window.addEventListener('mousemove', (e) => { if (pan) { this.state.panX += e.clientX - lx; this.state.panY += e.clientY - ly; lx = e.clientX; ly = e.clientY; } });
    window.addEventListener('mouseup', () => { pan = false; });
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.state.zoom === 'fit' || this.state.zoom === 'fill') { this.state.zoom = 'custom'; this.state.zoomLevel = 1; }
      this.state.zoomLevel *= e.deltaY > 0 ? 0.9 : 1.1;
      this.state.zoomLevel = Math.max(0.1, Math.min(10, this.state.zoomLevel));
      document.getElementById('h-zoom').textContent = (this.state.zoomLevel * 100).toFixed(0) + '%';
    });
  }

  _loadImg(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, img.width, img.height);
      this.state.setSource(new Uint8ClampedArray(id.data), img.width, img.height);
      this.state.sourceImage = img; this.state.needsRender = true;
      document.getElementById('empty').style.display = 'none';
      document.getElementById('h-img').textContent = img.width + '\u00d7' + img.height;
      this.statusPanel.update(this.state);
      if (this._updateTransport) this._updateTransport();
      this.onRender();
    }; img.src = e.target.result; };
    reader.readAsDataURL(file);
  }

  _exportPNG() {
    if (!this.state.sourcePixels) return;
    const p = new Pipeline(this.state); const r = p.renderFinal(); if (!r) return;
    const c = document.createElement('canvas'); c.width = r.width; c.height = r.height;
    const ctx = c.getContext('2d'); const id = ctx.createImageData(r.width, r.height);
    id.data.set(r.pixels); ctx.putImageData(id, 0, 0);
    const a = document.createElement('a'); a.download = `distort_${this.state.globalSeed}.png`; a.href = c.toDataURL('image/png'); a.click();
  }
  _exportJSON() { const json = Recipe.exp(this.state, REGISTRY); const b = new Blob([json], { type: 'application/json' }); const a = document.createElement('a'); a.download = `recipe_${this.state.globalSeed}.json`; a.href = URL.createObjectURL(b); a.click(); }
  _loadRecipe(file) { if (!file) return; this._snap(); const r = new FileReader(); r.onload = (e) => { Recipe.imp(this.state, e.target.result, REGISTRY); document.getElementById('seed-input').value = this.state.globalSeed; this.refreshStack(); this.onRender(); }; r.readAsText(file); }
  _preset(name) { Recipe.imp(this.state, JSON.stringify(PRESETS[name]), REGISTRY); document.getElementById('seed-input').value = this.state.globalSeed; this.refreshStack(); this.onRender(); }

  /* ── Stack rebuild ── */
  refreshStack() {
    const el = document.getElementById('stack');
    const scrollTop = el.scrollTop;
    el.innerHTML = '';
    document.getElementById('h-nodes').textContent = this.state.stack.length;
    this.statusPanel.update(this.state);

    this.state.stack.forEach((node, idx) => {
      const selected = idx === this.state.selectedNodeIdx;
      const card = document.createElement('div');
      card.className = 'nc' + (node.enabled ? '' : ' off') + (node.id === this.state.soloNodeId ? ' solo' : '') + (selected ? ' selected' : '');
      card.dataset.idx = idx;

      // ── Drag: only from header grab handle, not from sliders ──
      // We set draggable on header only, not the whole card
      card.addEventListener('click', (e) => { if (e.target.closest('.np, .mask-sec')) return; this.state.selectedNodeIdx = idx; this.refreshStack(); });

      // ── Improved drag-drop with between/before/after/swap ──
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        const rect = card.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const zone = y < rect.height * 0.25 ? 'before' : y > rect.height * 0.75 ? 'after' : 'swap';
        card.classList.remove('dragover-before', 'dragover-after', 'dragover-swap');
        card.classList.add('dragover-' + zone);
        card.dataset.dropZone = zone;
      });
      card.addEventListener('dragleave', () => { card.classList.remove('dragover-before', 'dragover-after', 'dragover-swap'); });
      card.addEventListener('drop', (e) => {
        e.preventDefault(); card.classList.remove('dragover-before', 'dragover-after', 'dragover-swap');
        const from = parseInt(e.dataTransfer.getData('text/plain'));
        const zone = card.dataset.dropZone || 'swap';
        if (from === idx) return;
        this._snap();
        const [moved] = this.state.stack.splice(from, 1);
        if (zone === 'swap') {
          // Swap positions
          const target = this.state.stack[idx > from ? idx - 1 : idx];
          const targetIdx = this.state.stack.indexOf(target);
          this.state.stack.splice(targetIdx, 0, moved);
        } else if (zone === 'before') {
          const insertIdx = idx > from ? idx - 1 : idx;
          this.state.stack.splice(insertIdx, 0, moved);
        } else { // after
          const insertIdx = idx > from ? idx : idx + 1;
          this.state.stack.splice(insertIdx, 0, moved);
        }
        this.state.needsRender = true; this.refreshStack(); this.onRender();
      });

      // Header (this is the drag handle)
      const hdr = document.createElement('div'); hdr.className = 'nh';
      hdr.draggable = true;
      hdr.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', idx); card.classList.add('dragging'); });
      hdr.addEventListener('dragend', () => { card.classList.remove('dragging'); document.querySelectorAll('.nc').forEach(c => c.classList.remove('dragover-before', 'dragover-after', 'dragover-swap')); });

      const nidx = document.createElement('span'); nidx.className = 'nidx'; nidx.textContent = String(idx + 1).padStart(2, '0');
      const sq = document.createElement('span'); sq.className = 'sq' + (node.enabled ? ' on' : ''); sq.style.cursor = 'pointer';
      sq.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); node.enabled = !node.enabled; this.state.needsRender = true; this.refreshStack(); this.onRender(); });
      const hb = document.createElement('span'); hb.className = 'hbar' + (node.enabled ? '' : ' off');
      const nm = document.createElement('span'); nm.className = 'nn'; nm.textContent = node.name;
      const soloBtn = document.createElement('button'); soloBtn.className = 'nb' + (node.id === this.state.soloNodeId ? ' son' : ''); soloBtn.textContent = 'S';
      soloBtn.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); this.state.soloNodeId = this.state.soloNodeId === node.id ? null : node.id; this.state.needsRender = true; this.refreshStack(); this.onRender(); });
      const maskBtn = document.createElement('button'); maskBtn.className = 'nb mask-btn' + (node.mask.enabled ? ' on' : ''); maskBtn.textContent = 'M';
      maskBtn.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); node.mask.enabled = !node.mask.enabled; if (node.mask.enabled && node.mask.source === 'none') node.mask.source = 'luminance'; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
      const expBtn = document.createElement('button'); expBtn.className = 'nb'; expBtn.textContent = node.expanded ? '\u25be' : '\u25b8';
      expBtn.addEventListener('click', (e) => { e.stopPropagation(); node.expanded = !node.expanded; this.refreshStack(); });
      const diceBtn = document.createElement('button'); diceBtn.className = 'nb dice'; diceBtn.textContent = '\u2684';
      diceBtn.addEventListener('click', (e) => {
        e.stopPropagation(); this._snap();
        for (const [k, def] of Object.entries(node.paramDefs)) { if (def.type === 'select') node.params[k] = def.options[Math.floor(Math.random() * def.options.length)]; else node.params[k] = def.min + Math.random() * (def.max - def.min); }
        node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender();
      });

      hdr.append(nidx, sq, hb, nm, soloBtn, maskBtn, diceBtn, expBtn);
      card.appendChild(hdr);

      // Mask controls
      if (node.mask.enabled && node.expanded) {
        const maskSec = document.createElement('div'); maskSec.className = 'mask-sec';
        this._maskControls(maskSec, node);
        card.appendChild(maskSec);
      }

      // Parameters
      const params = document.createElement('div'); params.className = 'np' + (node.expanded ? '' : ' hide');
      this._p(params, node, 'opacity', { value: node.opacity, min: 0, max: 1, step: 0.01, label: 'OPACITY' }, (v) => { node.opacity = v; });
      for (const [k, def] of Object.entries(node.paramDefs)) {
        this._p(params, node, k, def, (v) => { node.params[k] = v; });
        if (def.type !== 'select' && def.modulatable !== false) this._modRow(params, node, k, def);
      }
      if (node.expanded) {
        const delRow = document.createElement('div'); delRow.className = 'pr'; delRow.style.justifyContent = 'flex-end'; delRow.style.marginTop = '4px';
        const delBtn = document.createElement('button'); delBtn.className = 'sdiv-btn'; delBtn.textContent = 'DELETE NODE'; delBtn.style.fontSize = '9px'; delBtn.style.color = '#c47070';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); this.state.stack.splice(idx, 1); if (this.state.soloNodeId === node.id) this.state.soloNodeId = null; this.state.selectedNodeIdx = Math.min(idx, this.state.stack.length - 1); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
        delRow.appendChild(delBtn); params.appendChild(delRow);
      }
      card.appendChild(params);
      el.appendChild(card);
    });

    // Drop zone after the last node (append to end of stack)
    const afterZone = document.createElement('div');
    afterZone.className = 'nc-dropafter';
    afterZone.addEventListener('dragover', (e) => { e.preventDefault(); afterZone.classList.add('dragover-after'); });
    afterZone.addEventListener('dragleave', () => afterZone.classList.remove('dragover-after'));
    afterZone.addEventListener('drop', (e) => {
      e.preventDefault(); afterZone.classList.remove('dragover-after');
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      if (isNaN(from)) return;
      this._snap();
      const [moved] = this.state.stack.splice(from, 1);
      this.state.stack.push(moved);
      this.state.needsRender = true; this.refreshStack(); this.onRender();
    });
    el.appendChild(afterZone);

    el.scrollTop = scrollTop;
  }

  /* ── Mask controls ── */
  _maskControls(container, node) {
    const srcRow = document.createElement('div'); srcRow.className = 'pr';
    const srcLbl = document.createElement('span'); srcLbl.className = 'pl'; srcLbl.textContent = 'SOURCE';
    const srcSel = document.createElement('select'); srcSel.className = 'psel';
    for (const opt of ['luminance', 'gradient', 'upload']) { const o = document.createElement('option'); o.value = opt; o.textContent = opt.toUpperCase(); if (node.mask.source === opt) o.selected = true; srcSel.appendChild(o); }
    srcSel.addEventListener('change', () => { if (srcSel.value === 'upload') { this._maskTargetNode = node; document.getElementById('mask-input').click(); } else { node.mask.source = srcSel.value; node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); } });
    srcRow.append(srcLbl, srcSel); container.appendChild(srcRow);
    const invRow = document.createElement('div'); invRow.className = 'pr';
    const invLbl = document.createElement('span'); invLbl.className = 'pl'; invLbl.textContent = 'INVERT';
    const invSq = document.createElement('span'); invSq.className = 'sq' + (node.mask.invert ? ' on' : ''); invSq.style.cursor = 'pointer';
    invSq.addEventListener('click', () => { node.mask.invert = !node.mask.invert; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
    invRow.append(invLbl, invSq); container.appendChild(invRow);
    this._p(container, node, '_feather', { value: node.mask.feather, min: 0, max: 20, step: 0.5, label: 'FEATHER' }, (v) => { node.mask.feather = v; node.invalidate(this.state.stack); });
  }

  /* ── Modulation row ── */
  _modRow(container, node, key, def) {
    const mapNames = this.state.getModMapNames(); if (mapNames.length === 0) return;
    const mod = node.modulation[key] || { mapId: '', amount: 0 };
    const row = document.createElement('div'); row.className = 'mod-row' + (mod.mapId ? '' : ' hide');
    const lbl = document.createElement('span'); lbl.className = 'pl'; lbl.textContent = '\u2192 MOD';
    const sel = document.createElement('select'); sel.className = 'psel';
    const noneOpt = document.createElement('option'); noneOpt.value = ''; noneOpt.textContent = 'NONE'; if (!mod.mapId) noneOpt.selected = true; sel.appendChild(noneOpt);
    for (const name of mapNames) { const o = document.createElement('option'); o.value = name; o.textContent = name.toUpperCase(); if (mod.mapId === name) o.selected = true; sel.appendChild(o); }
    sel.addEventListener('change', () => { if (sel.value) node.modulation[key] = { mapId: sel.value, amount: node.modulation[key]?.amount || 1 }; else delete node.modulation[key]; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
    const amtSl = document.createElement('input'); amtSl.type = 'range'; amtSl.className = 'ps'; amtSl.min = 0; amtSl.max = 2; amtSl.step = 0.01; amtSl.value = mod.amount || 0;
    amtSl.addEventListener('input', () => { if (!node.modulation[key]) node.modulation[key] = { mapId: sel.value, amount: 0 }; node.modulation[key].amount = parseFloat(amtSl.value); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
    row.append(lbl, sel, amtSl); container.appendChild(row);
    const prevRow = container.lastElementChild?.previousElementSibling;
    if (prevRow && prevRow.classList.contains('pr')) { const dot = document.createElement('span'); dot.className = 'mod-dot' + (mod.mapId ? ' on' : ''); dot.title = 'Modulation'; dot.addEventListener('click', (e) => { e.stopPropagation(); row.classList.toggle('hide'); }); prevRow.querySelector('.pl')?.appendChild(dot); }
  }

  /* ── Parameter row factory ── */
  _p(container, node, key, def, setter) {
    const row = document.createElement('div'); row.className = 'pr';
    const lbl = document.createElement('span'); lbl.className = 'pl'; lbl.textContent = def.label || key;
    if (def.type === 'select') {
      const sel = document.createElement('select'); sel.className = 'psel';
      for (const o of def.options) { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; if (node.params[key] === o) opt.selected = true; sel.appendChild(opt); }
      sel.addEventListener('change', () => { this._snap(); setter(sel.value); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
      row.append(lbl, sel);
    } else {
      const val = key === 'opacity' ? node.opacity : (key === '_feather' ? node.mask.feather : node.params[key]);
      const sl = document.createElement('input'); sl.type = 'range'; sl.className = 'ps'; sl.min = def.min; sl.max = def.max; sl.step = def.step; sl.value = val;
      const num = document.createElement('input'); num.type = 'number'; num.className = 'pv'; num.min = def.min; num.max = def.max; num.step = def.step; num.value = Number(val).toFixed(def.step < 1 ? 2 : 0);
      sl.addEventListener('input', (e) => {
        e.stopPropagation(); // prevent drag
        const v = parseFloat(sl.value); setter(v); num.value = v.toFixed(def.step < 1 ? 2 : 0);
        node.invalidate(this.state.stack); this.state.needsRender = true;
        if (this.state.quality !== 'final') { this._savedScale = this._savedScale || this.state.previewScale; this.state.previewScale = Math.min(this._savedScale, 0.25); }
        this.onRender();
      });
      sl.addEventListener('mousedown', (e) => e.stopPropagation()); // prevent card drag
      sl.addEventListener('change', () => { this._snap(); if (this._savedScale) { this.state.previewScale = this._savedScale; this._savedScale = null; this.state.needsRender = true; node.invalidate(this.state.stack); this.onRender(); } });
      num.addEventListener('mousedown', (e) => e.stopPropagation()); // prevent card drag
      num.addEventListener('change', () => { this._snap(); let v = Math.max(def.min, Math.min(def.max, parseFloat(num.value))); setter(v); sl.value = v; num.value = v.toFixed(def.step < 1 ? 2 : 0); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
      const dice = document.createElement('button'); dice.className = 'nb dice'; dice.textContent = '\u2684';
      dice.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); const rv = def.min + Math.random() * (def.max - def.min); setter(rv); sl.value = rv; num.value = rv.toFixed(def.step < 1 ? 2 : 0); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
      row.append(lbl, sl, num, dice);
    }
    container.appendChild(row);
  }
}
import { REGISTRY, PRESETS } from '../nodes/registry.js';
import { Pipeline } from '../core/Pipeline.js';
import { Recipe } from '../core/Recipe.js';
import { History } from '../core/History.js';
import { StatusPanel } from './StatusPanel.js';

export class UI {
  constructor(state, onRender) {
    this.state = state;
    this.onRender = onRender;
    this._maskTargetNode = null;
    this._savedScale = null;
    this.history = new History(30);
    this.statusPanel = new StatusPanel(document.getElementById('statpanel'));
    // No reticle — removed per user request
    this._menu();
    this._top();
    this._fnKeys();
    this._dragDrop();
    this._clock();
    this._keyboard();
    this._modMapUpload();
    this._panelResize();
    this._transport();
    this._progressInterval();
    this._variationGrid();
    this._presetMenu();
    this._zoomCycle();
    this._versionDisplay();
    this.history.push(state, REGISTRY);
  }

  _snap() { this.history.push(this.state, REGISTRY); }

  /* ── Version display (commit date as numeric) ── */
  _versionDisplay() {
    // BUILD_DATE is injected; fallback to current date
    const dateStr = typeof BUILD_DATE !== 'undefined' ? BUILD_DATE : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const titleEl = document.querySelector('#hdr1 .hc.inv');
    if (titleEl) titleEl.textContent = `DISTORT ${dateStr}`;
  }

  /* ── Clock ── */
  _clock() {
    const el = document.getElementById('h-clock');
    const u = () => { const d = new Date(); el.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':'); };
    u(); setInterval(u, 1000);
  }

  /* ── Progress bar ── */
  _progressInterval() {
    const bar = document.getElementById('render-progress');
    setInterval(() => { bar.style.width = this.state.rendering ? (this.state.renderProgress * 100) + '%' : '0%'; }, 50);
  }

  /* ── Zoom cycle: click to cycle fit→fill→1:1 ── */
  _zoomCycle() {
    const zoomEl = document.getElementById('h-zoom');
    if (!zoomEl) return;
    zoomEl.style.cursor = 'pointer';
    zoomEl.addEventListener('click', () => {
      const s = this.state;
      if (s.zoom === 'fit') { s.zoom = 'fill'; s.panX = s.panY = 0; zoomEl.textContent = 'FILL'; }
      else if (s.zoom === 'fill') { s.zoom = '1:1'; s.zoomLevel = 1; s.panX = s.panY = 0; zoomEl.textContent = '1:1'; }
      else { s.zoom = 'fit'; s.panX = s.panY = 0; zoomEl.textContent = 'FIT'; }
    });
  }

  /* ── Add-node menu with search ── */
  _menu() {
    const menu = document.getElementById('amenu');
    menu.innerHTML = '';
    const search = document.createElement('input');
    search.id = 'amenu-search'; search.type = 'text'; search.placeholder = 'SEARCH NODES...';
    menu.appendChild(search);
    const allItems = [];

    for (const [group, items] of Object.entries(REGISTRY)) {
      const g = document.createElement('div'); g.className = 'mg'; g.textContent = group;
      menu.appendChild(g);
      for (const item of items) {
        const mi = document.createElement('div'); mi.className = 'mi';
        mi.dataset.label = item.label.toLowerCase(); mi.dataset.group = group.toLowerCase();
        mi.innerHTML = `<span class="md">&#9656;</span>${item.label}`;
        mi.addEventListener('click', () => {
          this._snap(); this.state.stack.push(item.factory()); this.state.needsRender = true;
          menu.classList.remove('show'); search.value = ''; this.refreshStack(); this.onRender();
        });
        menu.appendChild(mi);
        allItems.push({ el: mi, groupEl: g, label: item.label.toLowerCase(), group: group.toLowerCase() });
      }
    }

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim(); const groups = new Set();
      for (const item of allItems) {
        const match = !q || item.label.includes(q) || item.group.includes(q);
        item.el.style.display = match ? '' : 'none'; if (match) groups.add(item.groupEl);
      }
      menu.querySelectorAll('.mg').forEach(g => { g.style.display = groups.has(g) || !q ? '' : 'none'; });
    });

    document.getElementById('add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const r = e.target.getBoundingClientRect();
      const menuW = 230;
      const x = Math.max(8, Math.min(window.innerWidth - menuW - 8, r.right - 210));
      menu.style.left = x + 'px';
      menu.style.top = (r.bottom + 2) + 'px';
      menu.classList.toggle('show');
      if (menu.classList.contains('show')) {
        search.value = '';
        search.dispatchEvent(new Event('input'));
        menu.scrollTop = 0;
        const maxH = Math.min(window.innerHeight * 0.7, 520);
        menu.style.maxHeight = maxH + 'px';
        const rect = menu.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 8) {
          menu.style.top = Math.max(8, window.innerHeight - rect.height - 8) + 'px';
        }
        setTimeout(() => search.focus(), 10);
      }
    });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target) && e.target.id !== 'add-btn') menu.classList.remove('show'); });
  }

  /* ── Top bar ── */
  _top() {
    document.getElementById('seed-input').addEventListener('change', (e) => { this._snap(); this.state.globalSeed = parseInt(e.target.value) || 0; this.state.needsRender = true; this.onRender(); });
    document.getElementById('btn-rseed').addEventListener('click', () => { this._snap(); this.state.globalSeed = Math.floor(Math.random() * 999999); document.getElementById('seed-input').value = this.state.globalSeed; this.state.needsRender = true; this.onRender(); });
    document.getElementById('file-input').addEventListener('change', (e) => this._loadImg(e.target.files[0]));
    document.getElementById('recipe-input').addEventListener('change', (e) => this._loadRecipe(e.target.files[0]));
  }

  /* ── Function key bar ── */
  _fnKeys() {
    const fk = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    fk('fk1', () => document.getElementById('file-input').click());
    fk('fk2', () => { this.state.quality = 'preview'; document.getElementById('fk2')?.classList.add('act'); document.getElementById('fk3')?.classList.remove('act'); document.getElementById('h-mode').textContent = 'PREV'; this.state.needsRender = true; this.onRender(); this.statusPanel.update(this.state); });
    fk('fk3', () => { this.state.quality = 'final'; document.getElementById('fk3')?.classList.add('act'); document.getElementById('fk2')?.classList.remove('act'); document.getElementById('h-mode').textContent = 'FINAL'; this.state.needsRender = true; this.onRender(); this.statusPanel.update(this.state); });
    fk('fk4', () => { this.state.zoom = 'fit'; this.state.panX = this.state.panY = 0; document.getElementById('h-zoom').textContent = 'FIT'; });
    fk('fk5', () => { this.state.zoom = '1:1'; this.state.zoomLevel = 1; this.state.panX = this.state.panY = 0; document.getElementById('h-zoom').textContent = '1:1'; });
    fk('fk6', () => this._exportPNG());
    fk('fk7', () => this._exportJSON());
    fk('fk8', () => document.getElementById('recipe-input').click());
    fk('fk-modmap', () => document.getElementById('modmap-input').click());
  }

  /* ── Preset submenu ── */
  _presetMenu() {
    const menu = document.getElementById('preset-menu');
    for (const name of Object.keys(PRESETS)) {
      const mi = document.createElement('div'); mi.className = 'mi'; mi.textContent = name;
      mi.addEventListener('click', () => { this._snap(); this._preset(name); menu.classList.remove('show'); });
      menu.appendChild(mi);
    }
    const btn = document.getElementById('fk-presets');
    if (btn) btn.addEventListener('click', (e) => {
      e.stopPropagation(); const r = btn.getBoundingClientRect();
      menu.style.bottom = (window.innerHeight - r.top + 2) + 'px'; menu.style.left = r.left + 'px';
      menu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target) && e.target?.id !== 'fk-presets') menu.classList.remove('show'); });
  }

  /* ── Variation grid ── */
  _variationGrid() {
    const modal = document.getElementById('var-grid');
    const grid = document.getElementById('vg-grid');
    const closeBtn = document.getElementById('vg-close');
    const btn = document.getElementById('fk-vargrid');
    if (btn) btn.addEventListener('click', () => { if (!this.state.sourcePixels) return; this._renderVariations(grid); modal.classList.add('show'); });
    closeBtn?.addEventListener('click', () => modal.classList.remove('show'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
  }

  _renderVariations(grid) {
    grid.innerHTML = '';
    const baseSeed = this.state.globalSeed;
    const pipe = new Pipeline(this.state);
    const origQuality = this.state.quality; const origScale = this.state.previewScale;
    this.state.quality = 'preview'; this.state.previewScale = 0.2;
    for (let i = 0; i < 9; i++) {
      const seed = baseSeed + i * 7919;
      this.state.globalSeed = seed; this.state.needsRender = true;
      for (const n of this.state.stack) { n._cacheValid = false; n._cache = null; }
      const r = pipe.render();
      const cell = document.createElement('div'); cell.className = 'vg-cell';
      if (r) { const c = document.createElement('canvas'); c.width = r.width; c.height = r.height; const ctx = c.getContext('2d'); const id = ctx.createImageData(r.width, r.height); id.data.set(r.pixels); ctx.putImageData(id, 0, 0); cell.appendChild(c); }
      const seedLbl = document.createElement('span'); seedLbl.className = 'vg-seed'; seedLbl.textContent = seed; cell.appendChild(seedLbl);
      cell.addEventListener('click', () => {
        this._snap(); this.state.globalSeed = seed; document.getElementById('seed-input').value = seed;
        this.state.needsRender = true; for (const n of this.state.stack) { n._cacheValid = false; n._cache = null; }
        document.getElementById('var-grid').classList.remove('show');
        this.state.quality = origQuality; this.state.previewScale = origScale; this.onRender();
      });
      grid.appendChild(cell);
    }
    this.state.globalSeed = baseSeed; this.state.quality = origQuality; this.state.previewScale = origScale;
  }

  /* ── Keyboard shortcuts ── */
  _keyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const key = e.key.toLowerCase();
      if (key >= '1' && key <= '8') { const el = document.getElementById('fk' + key); if (el) el.click(); return; }
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) { if (this.history.redo(this.state, REGISTRY)) { this.refreshStack(); this.state.needsRender = true; this.onRender(); } }
        else { if (this.history.undo(this.state, REGISTRY)) { this.refreshStack(); this.state.needsRender = true; this.onRender(); } }
        return;
      }
      const s = this.state; const idx = s.selectedNodeIdx;
      if (key === 'a') { document.getElementById('add-btn').click(); return; }
      if (key === 'v') { document.getElementById('fk-vargrid')?.click(); return; }
      if (key === 'tab') { e.preventDefault(); if (s.stack.length === 0) return; if (e.shiftKey) s.selectedNodeIdx = Math.max(0, idx - 1); else s.selectedNodeIdx = Math.min(s.stack.length - 1, idx + 1); this.refreshStack(); return; }
      if (idx >= 0 && idx < s.stack.length) {
        const node = s.stack[idx];
        if (key === 'e') { this._snap(); node.enabled = !node.enabled; s.needsRender = true; this.refreshStack(); this.onRender(); }
        else if (key === 'd') { this._snap(); s.stack.splice(idx, 1); if (s.soloNodeId === node.id) s.soloNodeId = null; s.selectedNodeIdx = Math.min(idx, s.stack.length - 1); s.needsRender = true; this.refreshStack(); this.onRender(); }
        else if (key === '[' && idx > 0) { this._snap(); [s.stack[idx], s.stack[idx-1]] = [s.stack[idx-1], s.stack[idx]]; s.selectedNodeIdx = idx - 1; s.needsRender = true; this.refreshStack(); this.onRender(); }
        else if (key === ']' && idx < s.stack.length - 1) { this._snap(); [s.stack[idx], s.stack[idx+1]] = [s.stack[idx+1], s.stack[idx]]; s.selectedNodeIdx = idx + 1; s.needsRender = true; this.refreshStack(); this.onRender(); }
      }
      if (key === ' ' && s.frameCount > 1) { e.preventDefault(); document.getElementById('t-play')?.click(); }
    });
  }

  /* ── Modulation map + mask upload ── */
  _modMapUpload() {
    document.getElementById('modmap-input').addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const name = file.name.replace(/\.[^.]+$/, '').substring(0, 16);
      const reader = new FileReader();
      reader.onload = (ev) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); const id = ctx.getImageData(0, 0, img.width, img.height); this.state.addModulationMap(name, new Uint8ClampedArray(id.data), img.width, img.height); this.refreshStack(); }; img.src = ev.target.result; };
      reader.readAsDataURL(file); e.target.value = null;
    });
    document.getElementById('mask-input').addEventListener('change', (e) => {
      const file = e.target.files[0]; const node = this._maskTargetNode; if (!file || !node) return;
      const reader = new FileReader();
      reader.onload = (ev) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); const id = ctx.getImageData(0, 0, img.width, img.height); node.mask._sourcePixels = new Uint8ClampedArray(id.data); node.mask._sourceW = img.width; node.mask._sourceH = img.height; node.mask.source = 'upload'; node.mask.enabled = true; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); }; img.src = ev.target.result; };
      reader.readAsDataURL(file); e.target.value = null; this._maskTargetNode = null;
    });
  }

  /* ── Panel resize ── */
  _panelResize() {
    const handle = document.getElementById('panel-resize');
    const app = document.getElementById('app');
    if (!handle) return;
    let dragging = false;
    handle.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', (e) => { if (!dragging) return; const w = Math.max(200, Math.min(600, e.clientX)); app.style.gridTemplateColumns = w + 'px 1fr'; });
    window.addEventListener('mouseup', () => { dragging = false; });
  }

  /* ── Transport controls ── */
  _transport() {
    const transport = document.getElementById('transport');
    const scrub = document.getElementById('t-scrub');
    const infoFrame = document.getElementById('t-info-frame');
    const playBtn = document.getElementById('t-play');
    let animInterval = null;
    const updateTransport = () => { const s = this.state; if (s.frameCount > 1) { transport.classList.add('show'); scrub.max = s.frameCount - 1; scrub.value = s.currentFrame; infoFrame.textContent = `${s.currentFrame + 1}/${s.frameCount}`; } else transport.classList.remove('show'); };
    this._updateTransport = updateTransport;
    scrub?.addEventListener('input', () => { this.state.seekFrame(parseInt(scrub.value)); this.onRender(); updateTransport(); });
    playBtn?.addEventListener('click', () => { const s = this.state; if (s.isPlaying) { s.isPlaying = false; if (animInterval) { clearInterval(animInterval); animInterval = null; } playBtn.textContent = '\u25b6'; } else { s.isPlaying = true; playBtn.textContent = '\u25a0'; animInterval = setInterval(() => { s.seekFrame((s.currentFrame + 1) % s.frameCount); this.onRender(); updateTransport(); }, 1000 / s.fps); } });
    document.getElementById('t-step-fwd')?.addEventListener('click', () => { this.state.seekFrame(this.state.currentFrame + 1); this.onRender(); updateTransport(); });
    document.getElementById('t-step-back')?.addEventListener('click', () => { this.state.seekFrame(this.state.currentFrame - 1); this.onRender(); updateTransport(); });
    document.getElementById('t-prev')?.addEventListener('click', () => { this.state.seekFrame(0); this.onRender(); updateTransport(); });
    document.getElementById('t-next')?.addEventListener('click', () => { this.state.seekFrame(this.state.frameCount - 1); this.onRender(); updateTransport(); });
  }

  /* ── Drag / drop / pan / zoom ── */
  _dragDrop() {
    const vp = document.getElementById('vp'); const dz = document.getElementById('dropzone');
    vp.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('on'); });
    vp.addEventListener('dragleave', () => dz.classList.remove('on'));
    vp.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('on'); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) this._loadImg(f); });
    let pan = false, lx = 0, ly = 0;
    vp.addEventListener('mousedown', (e) => { if (e.button === 0) { pan = true; lx = e.clientX; ly = e.clientY; } });
    window.addEventListener('mousemove', (e) => { if (pan) { this.state.panX += e.clientX - lx; this.state.panY += e.clientY - ly; lx = e.clientX; ly = e.clientY; } });
    window.addEventListener('mouseup', () => { pan = false; });
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.state.zoom === 'fit' || this.state.zoom === 'fill') { this.state.zoom = 'custom'; this.state.zoomLevel = 1; }
      this.state.zoomLevel *= e.deltaY > 0 ? 0.9 : 1.1;
      this.state.zoomLevel = Math.max(0.1, Math.min(10, this.state.zoomLevel));
      document.getElementById('h-zoom').textContent = (this.state.zoomLevel * 100).toFixed(0) + '%';
    });
  }

  _loadImg(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, img.width, img.height);
      this.state.setSource(new Uint8ClampedArray(id.data), img.width, img.height);
      this.state.sourceImage = img; this.state.needsRender = true;
      document.getElementById('empty').style.display = 'none';
      document.getElementById('h-img').textContent = img.width + '\u00d7' + img.height;
      this.statusPanel.update(this.state);
      if (this._updateTransport) this._updateTransport();
      this.onRender();
    }; img.src = e.target.result; };
    reader.readAsDataURL(file);
  }

  _exportPNG() {
    if (!this.state.sourcePixels) return;
    const p = new Pipeline(this.state); const r = p.renderFinal(); if (!r) return;
    const c = document.createElement('canvas'); c.width = r.width; c.height = r.height;
    const ctx = c.getContext('2d'); const id = ctx.createImageData(r.width, r.height);
    id.data.set(r.pixels); ctx.putImageData(id, 0, 0);
    const a = document.createElement('a'); a.download = `distort_${this.state.globalSeed}.png`; a.href = c.toDataURL('image/png'); a.click();
  }
  _exportJSON() { const json = Recipe.exp(this.state, REGISTRY); const b = new Blob([json], { type: 'application/json' }); const a = document.createElement('a'); a.download = `recipe_${this.state.globalSeed}.json`; a.href = URL.createObjectURL(b); a.click(); }
  _loadRecipe(file) { if (!file) return; this._snap(); const r = new FileReader(); r.onload = (e) => { Recipe.imp(this.state, e.target.result, REGISTRY); document.getElementById('seed-input').value = this.state.globalSeed; this.refreshStack(); this.onRender(); }; r.readAsText(file); }
  _preset(name) { Recipe.imp(this.state, JSON.stringify(PRESETS[name]), REGISTRY); document.getElementById('seed-input').value = this.state.globalSeed; this.refreshStack(); this.onRender(); }

  /* ── Stack rebuild ── */
  refreshStack() {
    const el = document.getElementById('stack');
    const scrollTop = el.scrollTop;
    el.innerHTML = '';
    document.getElementById('h-nodes').textContent = this.state.stack.length;
    this.statusPanel.update(this.state);

    this.state.stack.forEach((node, idx) => {
      const selected = idx === this.state.selectedNodeIdx;
      const card = document.createElement('div');
      card.className = 'nc' + (node.enabled ? '' : ' off') + (node.id === this.state.soloNodeId ? ' solo' : '') + (selected ? ' selected' : '');
      card.dataset.idx = idx;

      // ── Drag: only from header grab handle, not from sliders ──
      // We set draggable on header only, not the whole card
      card.addEventListener('click', (e) => { if (e.target.closest('.np, .mask-sec')) return; this.state.selectedNodeIdx = idx; this.refreshStack(); });

      // ── Improved drag-drop with between/before/after/swap ──
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        const rect = card.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const zone = y < rect.height * 0.25 ? 'before' : y > rect.height * 0.75 ? 'after' : 'swap';
        card.classList.remove('dragover-before', 'dragover-after', 'dragover-swap');
        card.classList.add('dragover-' + zone);
        card.dataset.dropZone = zone;
      });
      card.addEventListener('dragleave', () => { card.classList.remove('dragover-before', 'dragover-after', 'dragover-swap'); });
      card.addEventListener('drop', (e) => {
        e.preventDefault(); card.classList.remove('dragover-before', 'dragover-after', 'dragover-swap');
        const from = parseInt(e.dataTransfer.getData('text/plain'));
        const zone = card.dataset.dropZone || 'swap';
        if (from === idx) return;
        this._snap();
        const [moved] = this.state.stack.splice(from, 1);
        if (zone === 'swap') {
          // Swap positions
          const target = this.state.stack[idx > from ? idx - 1 : idx];
          const targetIdx = this.state.stack.indexOf(target);
          this.state.stack.splice(targetIdx, 0, moved);
        } else if (zone === 'before') {
          const insertIdx = idx > from ? idx - 1 : idx;
          this.state.stack.splice(insertIdx, 0, moved);
        } else { // after
          const insertIdx = idx > from ? idx : idx + 1;
          this.state.stack.splice(insertIdx, 0, moved);
        }
        this.state.needsRender = true; this.refreshStack(); this.onRender();
      });

      // Header (this is the drag handle)
      const hdr = document.createElement('div'); hdr.className = 'nh';
      hdr.draggable = true;
      hdr.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', idx); card.classList.add('dragging'); });
      hdr.addEventListener('dragend', () => { card.classList.remove('dragging'); document.querySelectorAll('.nc').forEach(c => c.classList.remove('dragover-before', 'dragover-after', 'dragover-swap')); });

      const nidx = document.createElement('span'); nidx.className = 'nidx'; nidx.textContent = String(idx + 1).padStart(2, '0');
      const sq = document.createElement('span'); sq.className = 'sq' + (node.enabled ? ' on' : ''); sq.style.cursor = 'pointer';
      sq.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); node.enabled = !node.enabled; this.state.needsRender = true; this.refreshStack(); this.onRender(); });
      const hb = document.createElement('span'); hb.className = 'hbar' + (node.enabled ? '' : ' off');
      const nm = document.createElement('span'); nm.className = 'nn'; nm.textContent = node.name;
      const soloBtn = document.createElement('button'); soloBtn.className = 'nb' + (node.id === this.state.soloNodeId ? ' son' : ''); soloBtn.textContent = 'S';
      soloBtn.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); this.state.soloNodeId = this.state.soloNodeId === node.id ? null : node.id; this.state.needsRender = true; this.refreshStack(); this.onRender(); });
      const maskBtn = document.createElement('button'); maskBtn.className = 'nb mask-btn' + (node.mask.enabled ? ' on' : ''); maskBtn.textContent = 'M';
      maskBtn.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); node.mask.enabled = !node.mask.enabled; if (node.mask.enabled && node.mask.source === 'none') node.mask.source = 'luminance'; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
      const expBtn = document.createElement('button'); expBtn.className = 'nb'; expBtn.textContent = node.expanded ? '\u25be' : '\u25b8';
      expBtn.addEventListener('click', (e) => { e.stopPropagation(); node.expanded = !node.expanded; this.refreshStack(); });
      const diceBtn = document.createElement('button'); diceBtn.className = 'nb dice'; diceBtn.textContent = '\u2684';
      diceBtn.addEventListener('click', (e) => {
        e.stopPropagation(); this._snap();
        for (const [k, def] of Object.entries(node.paramDefs)) { if (def.type === 'select') node.params[k] = def.options[Math.floor(Math.random() * def.options.length)]; else node.params[k] = def.min + Math.random() * (def.max - def.min); }
        node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender();
      });

      hdr.append(nidx, sq, hb, nm, soloBtn, maskBtn, diceBtn, expBtn);
      card.appendChild(hdr);

      // Mask controls
      if (node.mask.enabled && node.expanded) {
        const maskSec = document.createElement('div'); maskSec.className = 'mask-sec';
        this._maskControls(maskSec, node);
        card.appendChild(maskSec);
      }

      // Parameters
      const params = document.createElement('div'); params.className = 'np' + (node.expanded ? '' : ' hide');
      this._p(params, node, 'opacity', { value: node.opacity, min: 0, max: 1, step: 0.01, label: 'OPACITY' }, (v) => { node.opacity = v; });
      for (const [k, def] of Object.entries(node.paramDefs)) {
        this._p(params, node, k, def, (v) => { node.params[k] = v; });
        if (def.type !== 'select' && def.modulatable !== false) this._modRow(params, node, k, def);
      }
      if (node.expanded) {
        const delRow = document.createElement('div'); delRow.className = 'pr'; delRow.style.justifyContent = 'flex-end'; delRow.style.marginTop = '4px';
        const delBtn = document.createElement('button'); delBtn.className = 'sdiv-btn'; delBtn.textContent = 'DELETE NODE'; delBtn.style.fontSize = '9px'; delBtn.style.color = '#c47070';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); this.state.stack.splice(idx, 1); if (this.state.soloNodeId === node.id) this.state.soloNodeId = null; this.state.selectedNodeIdx = Math.min(idx, this.state.stack.length - 1); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
        delRow.appendChild(delBtn); params.appendChild(delRow);
      }
      card.appendChild(params);
      el.appendChild(card);
    });

    // Drop zone after the last node (append to end of stack)
    const afterZone = document.createElement('div');
    afterZone.className = 'nc-dropafter';
    afterZone.addEventListener('dragover', (e) => { e.preventDefault(); afterZone.classList.add('dragover-after'); });
    afterZone.addEventListener('dragleave', () => afterZone.classList.remove('dragover-after'));
    afterZone.addEventListener('drop', (e) => {
      e.preventDefault(); afterZone.classList.remove('dragover-after');
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      if (isNaN(from)) return;
      this._snap();
      const [moved] = this.state.stack.splice(from, 1);
      this.state.stack.push(moved);
      this.state.needsRender = true; this.refreshStack(); this.onRender();
    });
    el.appendChild(afterZone);

    el.scrollTop = scrollTop;
  }

  /* ── Mask controls ── */
  _maskControls(container, node) {
    const srcRow = document.createElement('div'); srcRow.className = 'pr';
    const srcLbl = document.createElement('span'); srcLbl.className = 'pl'; srcLbl.textContent = 'SOURCE';
    const srcSel = document.createElement('select'); srcSel.className = 'psel';
    for (const opt of ['luminance', 'gradient', 'upload']) { const o = document.createElement('option'); o.value = opt; o.textContent = opt.toUpperCase(); if (node.mask.source === opt) o.selected = true; srcSel.appendChild(o); }
    srcSel.addEventListener('change', () => { if (srcSel.value === 'upload') { this._maskTargetNode = node; document.getElementById('mask-input').click(); } else { node.mask.source = srcSel.value; node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); } });
    srcRow.append(srcLbl, srcSel); container.appendChild(srcRow);
    const invRow = document.createElement('div'); invRow.className = 'pr';
    const invLbl = document.createElement('span'); invLbl.className = 'pl'; invLbl.textContent = 'INVERT';
    const invSq = document.createElement('span'); invSq.className = 'sq' + (node.mask.invert ? ' on' : ''); invSq.style.cursor = 'pointer';
    invSq.addEventListener('click', () => { node.mask.invert = !node.mask.invert; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
    invRow.append(invLbl, invSq); container.appendChild(invRow);
    this._p(container, node, '_feather', { value: node.mask.feather, min: 0, max: 20, step: 0.5, label: 'FEATHER' }, (v) => { node.mask.feather = v; node.invalidate(this.state.stack); });
  }

  /* ── Modulation row ── */
  _modRow(container, node, key, def) {
    const mapNames = this.state.getModMapNames(); if (mapNames.length === 0) return;
    const mod = node.modulation[key] || { mapId: '', amount: 0 };
    const row = document.createElement('div'); row.className = 'mod-row' + (mod.mapId ? '' : ' hide');
    const lbl = document.createElement('span'); lbl.className = 'pl'; lbl.textContent = '\u2192 MOD';
    const sel = document.createElement('select'); sel.className = 'psel';
    const noneOpt = document.createElement('option'); noneOpt.value = ''; noneOpt.textContent = 'NONE'; if (!mod.mapId) noneOpt.selected = true; sel.appendChild(noneOpt);
    for (const name of mapNames) { const o = document.createElement('option'); o.value = name; o.textContent = name.toUpperCase(); if (mod.mapId === name) o.selected = true; sel.appendChild(o); }
    sel.addEventListener('change', () => { if (sel.value) node.modulation[key] = { mapId: sel.value, amount: node.modulation[key]?.amount || 1 }; else delete node.modulation[key]; node.invalidate(this.state.stack); this.state.needsRender = true; this.refreshStack(); this.onRender(); });
    const amtSl = document.createElement('input'); amtSl.type = 'range'; amtSl.className = 'ps'; amtSl.min = 0; amtSl.max = 2; amtSl.step = 0.01; amtSl.value = mod.amount || 0;
    amtSl.addEventListener('input', () => { if (!node.modulation[key]) node.modulation[key] = { mapId: sel.value, amount: 0 }; node.modulation[key].amount = parseFloat(amtSl.value); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
    row.append(lbl, sel, amtSl); container.appendChild(row);
    const prevRow = container.lastElementChild?.previousElementSibling;
    if (prevRow && prevRow.classList.contains('pr')) { const dot = document.createElement('span'); dot.className = 'mod-dot' + (mod.mapId ? ' on' : ''); dot.title = 'Modulation'; dot.addEventListener('click', (e) => { e.stopPropagation(); row.classList.toggle('hide'); }); prevRow.querySelector('.pl')?.appendChild(dot); }
  }

  /* ── Parameter row factory ── */
  _p(container, node, key, def, setter) {
    const row = document.createElement('div'); row.className = 'pr';
    const lbl = document.createElement('span'); lbl.className = 'pl'; lbl.textContent = def.label || key;
    if (def.type === 'select') {
      const sel = document.createElement('select'); sel.className = 'psel';
      for (const o of def.options) { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; if (node.params[key] === o) opt.selected = true; sel.appendChild(opt); }
      sel.addEventListener('change', () => { this._snap(); setter(sel.value); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
      row.append(lbl, sel);
    } else {
      const val = key === 'opacity' ? node.opacity : (key === '_feather' ? node.mask.feather : node.params[key]);
      const sl = document.createElement('input'); sl.type = 'range'; sl.className = 'ps'; sl.min = def.min; sl.max = def.max; sl.step = def.step; sl.value = val;
      const num = document.createElement('input'); num.type = 'number'; num.className = 'pv'; num.min = def.min; num.max = def.max; num.step = def.step; num.value = Number(val).toFixed(def.step < 1 ? 2 : 0);
      sl.addEventListener('input', (e) => {
        e.stopPropagation(); // prevent drag
        const v = parseFloat(sl.value); setter(v); num.value = v.toFixed(def.step < 1 ? 2 : 0);
        node.invalidate(this.state.stack); this.state.needsRender = true;
        if (this.state.quality !== 'final') { this._savedScale = this._savedScale || this.state.previewScale; this.state.previewScale = Math.min(this._savedScale, 0.25); }
        this.onRender();
      });
      sl.addEventListener('mousedown', (e) => e.stopPropagation()); // prevent card drag
      sl.addEventListener('change', () => { this._snap(); if (this._savedScale) { this.state.previewScale = this._savedScale; this._savedScale = null; this.state.needsRender = true; node.invalidate(this.state.stack); this.onRender(); } });
      num.addEventListener('mousedown', (e) => e.stopPropagation()); // prevent card drag
      num.addEventListener('change', () => { this._snap(); let v = Math.max(def.min, Math.min(def.max, parseFloat(num.value))); setter(v); sl.value = v; num.value = v.toFixed(def.step < 1 ? 2 : 0); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
      const dice = document.createElement('button'); dice.className = 'nb dice'; dice.textContent = '\u2684';
      dice.addEventListener('click', (e) => { e.stopPropagation(); this._snap(); const rv = def.min + Math.random() * (def.max - def.min); setter(rv); sl.value = rv; num.value = rv.toFixed(def.step < 1 ? 2 : 0); node.invalidate(this.state.stack); this.state.needsRender = true; this.onRender(); });
      row.append(lbl, sl, num, dice);
    }
    container.appendChild(row);
  }
}
