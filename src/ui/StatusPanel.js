export class StatusPanel {
  constructor(containerEl) {
    this.el = containerEl;
    this.indicators = {};
    this._build();
  }

  _build() {
    const rows = [
      { label: 'STACK ACTIVE', id: 'ss-a' },
      { label: 'SOLO MODE',    id: 'ss-s' },
      { label: 'PREVIEW',      id: 'ss-p' },
      { label: 'IMAGE LOADED', id: 'ss-i' }
    ];

    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'st-row';

      const sq = document.createElement('span');
      sq.className = 'st-sq';
      sq.id = r.id;

      const hb = document.createElement('span');
      hb.className = 'st-hb off';

      const lbl = document.createElement('span');
      lbl.className = 'st-lbl';
      lbl.textContent = r.label;

      row.append(sq, hb, lbl);
      this.el.appendChild(row);
      this.indicators[r.id] = sq;
    }
  }

  update(state) {
    const hasActive = state.stack.filter(n => n.enabled).length > 0;
    this.indicators['ss-a'].className = 'st-sq' + (hasActive ? ' on' : '');
    this.indicators['ss-s'].className = 'st-sq' + (state.soloNodeId !== null ? ' on' : '');
    this.indicators['ss-p'].className = 'st-sq' + (state.quality === 'preview' ? ' on' : '');
    this.indicators['ss-i'].className = 'st-sq' + (state.sourcePixels ? ' on' : '');
  }
}
