export class Reticle {
  constructor(containerEl) {
    this.el = containerEl;
    this._build();
  }

  _build() {
    const frag = document.createDocumentFragment();

    // Dashed crosshair lines
    const hdL = this._div('ret-hd left');
    const hdR = this._div('ret-hd right');
    const vdT = this._div('ret-vd top');
    const vdB = this._div('ret-vd btm');
    frag.append(hdL, hdR, vdT, vdB);

    // Concentric rings
    frag.appendChild(this._div('ret-ring r1'));
    frag.appendChild(this._div('ret-ring r2'));
    frag.appendChild(this._div('ret-ring r3'));

    // Axis labels
    const axVx = this._div('ax-lbl ax-vx');
    axVx.textContent = 'Vx +X';
    const axVy = this._div('ax-lbl ax-vy');
    axVy.textContent = 'Vy +Y';
    frag.append(axVx, axVy);

    // Scale marks
    const sm = this._div('scale-marks');
    for (const v of ['.1', '1', '10']) {
      const s = document.createElement('span');
      const tick = document.createElement('span');
      tick.className = 'tick';
      s.append(tick, document.createTextNode(v));
      sm.appendChild(s);
    }
    frag.appendChild(sm);

    // Asterisks
    const a1 = this._div('ast');
    a1.textContent = '*';
    a1.style.cssText = 'top:35%;right:40%';
    const a2 = this._div('ast');
    a2.textContent = '*';
    a2.style.cssText = 'bottom:30%;right:35%';
    frag.append(a1, a2);

    // Telemetry labels
    const tlTL = this._div('tl tl-tl');
    tlTL.innerHTML =
      '<div>Vx <span class="v" id="t-vx">00,00</span></div>' +
      '<div>Vy <span class="v" id="t-vy">00,00</span></div>' +
      '<div>Vz <span class="v" id="t-vz">00,00</span></div>';
    const tlTR = this._div('tl tl-tr');
    tlTR.innerHTML =
      '<div>Qz <span class="v">0,00</span></div>' +
      '<div>Qy <span class="v">0,00</span></div>';
    const tlBL = this._div('tl tl-bl');
    tlBL.innerHTML =
      '<div>p=<span class="v" id="t-px">0.0</span></div>' +
      '<div>\u1E61=<span class="v" id="t-py">0.0</span></div>' +
      '<div>A: <span class="v" id="t-stat">NONE</span></div>';
    const tlBR = this._div('tl tl-br');
    tlBR.innerHTML =
      '<div>IN: <span class="v" id="t-info">NONE</span></div>';
    frag.append(tlTL, tlTR, tlBL, tlBR);

    this.el.appendChild(frag);
  }

  _div(cls) {
    const d = document.createElement('div');
    d.className = cls;
    return d;
  }
}
