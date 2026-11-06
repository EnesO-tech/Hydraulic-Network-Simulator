(function () {
  'use strict';
  const S = 76;
  const NS = 'http://www.w3.org/2000/svg';
  const WIRE = new Set(['I', 'W', 'F', 'T', 'V', '-']);
  const ORIENTS = ['^', '>', 'v', '<'];
  const KIND_ORDER = ['RZ', 'RK', 'RR', 'RL', 'UCP', 'UPR', 'UCV', 'UPT', 'UPM', 'R', 'P', 'U'];
  const KIND = {
    R: { title: 'Pipe', family: 'pipe', prefix: 'R', fields: [['L', 'Length', 'm', 1], ['d', 'Inner diameter', 'mm', 12.7]] },
    RZ: { title: 'Loss coefficient ζ', family: 'res', prefix: 'Rz', fields: [['zeta', 'Loss coefficient ζ', '–', 10], ['d', 'Diameter', 'mm', 12.7]] },
    RK: { title: 'kv valve', family: 'valve', prefix: 'Rk_', fields: [['kv', 'Flow coefficient kv', 'm³/h', 0.54]] },
    RR: { title: 'Restrictor', family: 'res', prefix: 'Rr', fields: [['d', 'Bore diameter', 'mm', 4]] },
    RL: { title: 'Linear resistance', family: 'res', prefix: 'Rl_', fields: [['R', 'Resistance', 'bar/(m³/h)', 1], ['d', 'Diameter', 'mm', 12.7]] },
    P: { title: 'Fixed-flow pump', family: 'pump', prefix: 'P', fields: [['Q', 'Delivered flow', 'm³/h', 1], ['d', 'Port diameter', 'mm', 12.7]] },
    UCP: { title: 'Characteristic pump', family: 'pump', prefix: 'Ucp', fields: [['Q', 'Flow at Δp = 0', 'm³/h', 5], ['dp', 'Shut-off Δp', 'bar', 200], ['d', 'Port diameter', 'mm', 12.7]] },
    UPR: { title: 'Pressure regulator', family: 'valve', prefix: 'Upr', fields: [['dp', 'Regulated Δp', 'bar', 50], ['R', 'Resistance', 'bar/(m³/h)', 1], ['d', 'Diameter', 'mm', 12.7]] },
    UCV: { title: 'Check / relief valve', family: 'valve', prefix: 'Ucv', fields: [['dp', 'Cracking Δp', 'bar', 1], ['R', 'Resistance', 'bar/(m³/h)', 1], ['d', 'Diameter', 'mm', 12.7]] },
    U: { title: 'Universal component', family: 'actuator', prefix: 'U', fields: [['dp', 'Δp', 'bar', -5], ['Q', 'Flow', 'm³/h', 0.01], ['d', 'Diameter', 'mm', 999]] },
    UPTa: { title: 'PTU – motor side', family: 'pump', prefix: 'Upt', fields: [['etaV', 'Volumetric efficiency ηv', '–', 0.96], ['etaHm', 'Hydro-mechanical efficiency ηhm', '–', 0.92], ['R0', 'Resistance R0', 'bar/(m³/h)', 5], ['d', 'Diameter', 'mm', 12.7]] },
    UPTb: { title: 'PTU – pump side', family: 'pump', prefix: 'Upt', fields: [['etaV', 'Volumetric efficiency ηv', '–', 0.95], ['etaHm', 'Hydro-mechanical efficiency ηhm', '–', 0.92], ['ratio', 'Displacement ratio Vb/Va', '–', 0.95], ['d', 'Diameter', 'mm', 12.7]] },
    UPM: { title: 'Pressure-compensated pump', family: 'pump', prefix: 'Upm', fields: [['pset', 'Set pressure', 'bar', 206], ['Qmax', 'Maximum flow', 'm³/h', 8.4], ['d', 'Port diameter', 'mm', 19.6]] }
  };
  const FAMILY_COLOR = { pipe: '#7aa2ff', res: '#c792ff', valve: '#ffc94d', pump: '#38e1c8', actuator: '#ff7eb6' };
  const PALETTE = [['R', 'Pipe'], ['RZ', 'ζ loss'], ['RL', 'Linear R'], ['RR', 'Restrictor'], ['RK', 'kv valve'], ['UCV', 'Check valve'], ['UPR', 'Regulator'], ['P', 'Pump'], ['UPM', 'Pc pump'], ['UCP', 'Char. pump'], ['U', 'Universal'], ['UPTa', 'PTU motor'], ['UPTb', 'PTU pump']];
  const P_STOPS = [[0, [48, 18, 110]], [0.18, [64, 66, 214]], [0.38, [24, 166, 232]], [0.56, [30, 222, 160]], [0.74, [188, 236, 48]], [0.88, [255, 176, 0]], [1, [255, 60, 92]]];

  const st = {
    on: true, tool: 'select', place: null, sel: null, view: { x: 40, y: 40, k: 0.8 }, undo: [], redo: [], stale: false, results: null, flow: true,
    model: null, particles: [], raf: 0, last: 0, hover: null, drag: null, wirePaint: null, built: false,
    opts: {}, ev: {}, colorMode: 'p', hl: null, dim: new Set(), scales: null, anim: true
  };
  function on(name, fn) { (st.ev[name] = st.ev[name] || []).push(fn); }
  function emit(name, arg) { (st.ev[name] || []).forEach(fn => { try { fn(arg); } catch (e) { console.error(e); } }); }

  const $ = (q, r) => (r || document).querySelector(q);
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const html = (tag, attrs, parent) => { const e = document.createElement(tag); for (const k in attrs || {}) { if (k === 'text') e.textContent = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k]; else e.setAttribute(k, attrs[k]); } if (parent) parent.appendChild(e); return e; };
  const g = () => window;
  const data = () => (typeof D !== 'undefined' ? D : {});
  const rows = () => (typeof R !== 'undefined' ? R : 50);
  const cols = () => (typeof C !== 'undefined' ? C : 40);
  const key = (r, c) => r + ',' + c;
  const center = (r, c) => [(c - 1) * S + S / 2, (r - 1) * S + S / 2];
  const fmt = (v, n) => (Number.isFinite(v) ? (Math.abs(v) >= 1000 ? v.toFixed(0) : v.toFixed(n == null ? 3 : n)) : '–');

  function kindOf(name) {
    const up = String(name || '').toUpperCase();
    for (const k of KIND_ORDER) if (up.startsWith(k)) return k;
    return '';
  }
  function kindKey(name) {
    const k = kindOf(name);
    if (k === 'UPT') return String(name).slice(-1).toLowerCase() === 'b' ? 'UPTb' : 'UPTa';
    return k;
  }
  function isComponentText(t) { const h = (t || '')[0]; return h === 'R' || h === 'P' || h === 'U'; }
  function isNodeText(t) { const h = (t || '')[0]; return h === 'N' || h === 'S'; }
  function isWireText(t) { return WIRE.has(String((t || '')[0] || '').toUpperCase()); }

  function parseTok(text) {
    const parts = String(text || '').trim().split(/\s+/).filter(Boolean);
    const name = parts[0] || '';
    const nums = [];
    let i = 1;
    for (; i < parts.length; i++) { const v = Number(parts[i]); if (parts[i] === '' || !Number.isFinite(v)) break; nums.push(v); }
    let orient = null;
    const rest = [];
    for (; i < parts.length; i++) { if (orient === null && ORIENTS.includes(parts[i])) orient = parts[i]; else rest.push(parts[i]); }
    return { name, nums, orient, rest };
  }

  function fieldValues(kk, tok) {
    const n = tok.nums;
    if (kk === 'UPTb') return n.length >= 4 ? n.slice(0, 4) : [1, 1, 1, n[0]];
    if (kk === 'UPTa') return n.length >= 4 ? n.slice(0, 4) : [1, n[0], n[1], n[2]];
    return KIND[kk].fields.map((f, i) => n[i]);
  }

  function buildTok(name, vals, orient, rest) {
    const p = [name].concat(vals.map(v => (Number.isFinite(v) ? String(+v.toPrecision(10)) : '0')));
    if (orient) p.push(orient);
    return p.concat(rest || []).join(' ');
  }

  function startDir(o) { return o === '^' ? 1 : o === '<' ? 2 : o === 'v' ? 3 : 4; }
  function rowStep(d) { return d === 1 ? 1 : d === 3 ? -1 : 0; }
  function colStep(d) { return d === 2 ? 1 : d === 4 ? -1 : 0; }

  function analyse() {
    const Dd = data();
    const cells = [];
    const at = new Map();
    for (const ky in Dd) {
      const t = String(Dd[ky] || '').trim();
      if (!t) continue;
      const [r, c] = ky.split(',').map(Number);
      if (!(r >= 1 && r <= rows() && c >= 1 && c <= cols())) continue;
      const kind = isComponentText(t) ? 'comp' : isNodeText(t) ? 'node' : isWireText(t) ? 'wire' : 'text';
      const o = { key: ky, r, c, text: t, kind };
      cells.push(o);
      at.set(ky, o);
    }
    const usedWire = new Set();
    const comps = [];
    for (const o of cells) {
      if (o.kind !== 'comp') continue;
      const tok = parseTok(o.text);
      const kk = kindKey(tok.name);
      const comp = { cell: o, tok, kk, name: tok.name, ends: [], error: kk ? null : 'unknown component type' };
      const sd = startDir(tok.orient || '^');
      const lim = rows() + cols() + 4;
      for (let off = 0; off < 4 && comp.ends.length < 2; off++) {
        let dir = sd + off;
        if (dir > 4) dir -= 4;
        let ii = o.r + rowStep(dir), jj = o.c + colStep(dir);
        const first = at.get(key(ii, jj));
        if (!first) continue;
        if (first.kind === 'node') { comp.ends.push({ node: first, path: [], dir }); continue; }
        if (first.kind !== 'wire') continue;
        const path = [];
        for (let n = 0; n < lim; n++) {
          const cc = at.get(key(ii, jj));
          if (!cc) break;
          if (cc.kind === 'node') { comp.ends.push({ node: cc, path: path.slice(), dir }); break; }
          if (cc.kind !== 'wire') break;
          path.push(cc);
          ii += rowStep(dir); jj += colStep(dir);
          if (!(ii >= 1 && ii <= rows() && jj >= 1 && jj <= cols())) break;
        }
      }
      if (comp.ends.length > 2) comp.ends = comp.ends.slice(0, 2);
      if (comp.ends.length === 2) comp.ends.forEach(e => e.path.forEach(w => usedWire.add(w.key)));
      else if (!comp.error) comp.error = 'not connected to two nodes';
      comps.push(comp);
    }
    const nodes = cells.filter(o => o.kind === 'node').map(o => { const p = o.text.split(/\s+/); const nr = /^nr/i.test(p[0]); return { cell: o, name: p[0], nr, pset: nr ? Number(p[1]) : NaN, z: nr ? 0 : (Number(p[1]) || 0) }; });
    const wires = cells.filter(o => o.kind === 'wire');
    let bb = [Infinity, Infinity, -Infinity, -Infinity];
    for (const o of cells) { bb[0] = Math.min(bb[0], o.c); bb[1] = Math.min(bb[1], o.r); bb[2] = Math.max(bb[2], o.c); bb[3] = Math.max(bb[3], o.r); }
    if (!cells.length) bb = [1, 1, 12, 8];
    return { cells, at, comps, nodes, wires, usedWire, bb };
  }

  function pcol(t, a) {
    t = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
    for (let i = 1; i < P_STOPS.length; i++) {
      if (t <= P_STOPS[i][0]) {
        const [t0, c0] = P_STOPS[i - 1], [t1, c1] = P_STOPS[i];
        const u = (t - t0) / (t1 - t0 || 1);
        const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * u));
        return a == null ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      }
    }
    return 'rgb(255,60,92)';
  }

  function symbol(kk, gp, opts) {
    const col = FAMILY_COLOR[(KIND[kk] || {}).family] || '#9fb4e8';
    const closed = opts && opts.closed;
    const sw = 2.4;
    const stroke = closed ? '#ff4d6d' : col;
    const body = (tag, a) => el(tag, Object.assign({ fill: 'url(#bs-glass)', stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' }, a), gp);
    const line = (d, a) => el('path', Object.assign({ d, fill: 'none', stroke, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, a), gp);
    if (kk === 'R') {
      body('rect', { x: -26, y: -9, width: 52, height: 18, rx: 9 });
      line('M-18 0H18', { 'stroke-width': 1.2, opacity: 0.6, 'stroke-dasharray': '2 4' });
    } else if (kk === 'RZ') {
      line('M-24 0H-7M7 0H24');
      body('rect', { x: -7, y: -17, width: 4, height: 34, rx: 2 });
      body('rect', { x: 3, y: -17, width: 4, height: 34, rx: 2 });
      line('M-3 -6L3 6', { 'stroke-width': 1.4 });
    } else if (kk === 'RK') {
      body('path', { d: 'M-20 -14L0 0L-20 14ZM20 -14L0 0L20 14Z', fill: closed ? 'rgba(255,77,109,.35)' : 'url(#bs-glass)' });
      line('M0 0V-18M-7 -18H7');
      if (closed) line('M-22 -20L22 20', { stroke: '#ff4d6d', 'stroke-width': 3 });
    } else if (kk === 'RR') {
      body('path', { d: 'M-24 -14Q-4 -14 -3 -3L-3 3Q-4 14 -24 14ZM24 -14Q4 -14 3 -3L3 3Q4 14 24 14Z' });
    } else if (kk === 'RL') {
      line('M-26 0H-18L-13 -10L-6 10L1 -10L8 10L13 -10L18 0H26', { 'stroke-width': 2.6 });
    } else if (kk === 'P' || kk === 'UPM' || kk === 'UCP' || kk === 'UPTb') {
      body('circle', { r: 21 });
      const sp = el('g', { class: 'bs-impeller' }, gp);
      for (let i = 0; i < 3; i++) el('path', { d: 'M0 0C5 -6 10 -9 14 -8', stroke, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', transform: `rotate(${i * 120})` }, sp);
      el('path', { d: 'M21 0L9 -8L9 8Z', fill: stroke, stroke: 'none' }, gp);
      if (kk === 'UPM') line('M-17 15L17 -15M11 -15H17V-9', { 'stroke-width': 1.8 });
      if (kk === 'UCP') line('M-14 10Q-2 -16 14 -6', { 'stroke-width': 1.6, 'stroke-dasharray': '3 3' });
      if (kk === 'UPTb') line('M-21 0H-34', { 'stroke-width': 4, opacity: 0.8 });
    } else if (kk === 'UPTa') {
      body('circle', { r: 21 });
      el('path', { d: 'M8 0L20 -8L20 8Z', fill: stroke, stroke: 'none', transform: 'rotate(180 14 0)' }, gp);
      const sp = el('g', { class: 'bs-impeller' }, gp);
      for (let i = 0; i < 3; i++) el('path', { d: 'M0 0C5 -6 10 -9 14 -8', stroke, 'stroke-width': 2, fill: 'none', transform: `rotate(${i * 120})` }, sp);
      line('M21 0H34', { 'stroke-width': 4, opacity: 0.8 });
    } else if (kk === 'UCV') {
      line('M-26 0H-10M10 0H26');
      body('path', { d: 'M-10 -14L4 0L-10 14' });
      body('circle', { cx: 6, cy: 0, r: 8, fill: closed ? 'rgba(255,77,109,.5)' : 'url(#bs-glass)' });
      line('M14 0L17 -6L20 6L23 -6L26 0', { 'stroke-width': 1.6 });
    } else if (kk === 'UPR') {
      body('rect', { x: -20, y: -16, width: 40, height: 32, rx: 5 });
      line('M-14 8L10 -8M5 -9H11V-3');
      line('M-20 -16L-28 -26L-20 -24', { 'stroke-width': 1.6 });
    } else if (kk === 'U') {
      body('rect', { x: -20, y: -18, width: 40, height: 36, rx: 9 });
      el('text', { x: 0, y: 6, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: stroke, 'font-family': 'Inter,Segoe UI,sans-serif', class: 'bs-upright' }, gp).textContent = 'U';
    } else {
      body('rect', { x: -18, y: -18, width: 36, height: 36, rx: 6 });
      el('text', { x: 0, y: 6, 'text-anchor': 'middle', 'font-size': 16, fill: '#ff4d6d' }, gp).textContent = '?';
    }
  }

  function buildDOM() {
    if (st.built) return;
    const host = $('#studioWrap');
    if (!host) return;
    st.built = true;
    host.innerHTML = '';
    if (st.opts.embedded) host.classList.add('bs-embedded');
    const svg = el('svg', { id: 'bsSvg', class: 'bs-svg', tabindex: 0 }, host);
    const defs = el('defs', {}, svg);
    defs.innerHTML = `
<pattern id="bs-dots" width="${S}" height="${S}" patternUnits="userSpaceOnUse"><circle cx="${S / 2}" cy="${S / 2}" r="1.3" fill="rgba(140,170,255,.18)"/></pattern>
<radialGradient id="bs-glass" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="rgba(255,255,255,.22)"/><stop offset=".55" stop-color="rgba(120,150,255,.08)"/><stop offset="1" stop-color="rgba(10,14,40,.85)"/></radialGradient>
<filter id="bs-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="bs-softglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>`;
    st.svg = svg;
    st.world = el('g', { id: 'bsWorld' }, svg);
    st.layers = {};
    for (const n of ['bg', 'wires', 'pipesGlow', 'pipes', 'particles', 'nodes', 'comps', 'labels', 'overlay']) st.layers[n] = el('g', { class: 'bs-' + n }, st.world);
    st.hud = html('div', { class: 'bs-hud' }, host);
    st.legend = html('div', { class: 'bs-legend' }, host);
    st.tip = html('div', { class: 'bs-tip' }, host);
    st.inspector = html('div', { class: 'bs-inspector' }, host);
    st.banner = html('div', { class: 'bs-banner' }, host);
    const dock = html('div', { class: 'bs-dock' }, host);
    const tools = html('div', { class: 'bs-tools' }, dock);
    for (const [t, ic, tt] of [['select', '➤', 'Select & move view (V)'], ['wire', '┃', 'Draw connection (W) – drag across cells'], ['node', '●', 'Place node (N)'], ['erase', '⌫', 'Erase (E)']]) {
      const b = html('button', { class: 'bs-tool', 'data-tool': t, title: tt, html: `<span>${ic}</span>` }, tools);
      b.addEventListener('click', () => setTool(t));
    }
    const pt = html('button', { class: 'bs-tool', title: 'Show / hide the component library', html: '<span>⊞</span>' }, tools);
    const pal = html('div', { class: 'bs-palette' }, dock);
    pt.addEventListener('click', () => { pal.classList.toggle('hidden'); pt.classList.toggle('on', !pal.classList.contains('hidden')); });
    pt.classList.add('on');
    for (const [kk, lab] of PALETTE) {
      const it = html('button', { class: 'bs-pal-item', title: KIND[kk].title + ' – click, then click a free cell', draggable: 'true' }, pal);
      const sv = el('svg', { viewBox: '-36 -26 72 52', width: 54, height: 38 }, it);
      symbol(kk, el('g', {}, sv));
      html('span', { text: lab, class: 'bs-pal-lab' }, it);
      it.addEventListener('click', () => setPlace(kk));
      it.addEventListener('dragstart', e => { e.dataTransfer.setData('text/bs-kind', kk); });
    }
    const bar = html('div', { class: 'bs-bar' }, host);
    const mk = (label, title, fn, cls) => { const b = html('button', { class: 'bs-btn ' + (cls || ''), title, html: label }, bar); b.addEventListener('click', fn); return b; };
    st.btnFlow = mk('◉ Flow', 'Animated flow view (results)', () => { st.flow = !st.flow; redraw(); });
    st.btnFocus = mk('⛶ Focus', 'Hide side panels and result table (M)', toggleFocus);
    mk('⤢ Fit', 'Fit the network into view (F)', fit);
    mk('↶', 'Undo (Ctrl+Z)', undo);
    mk('↷', 'Redo (Ctrl+Y)', redo);
    mk('▦ Excel grid', 'Switch to the classic grid view', () => setMode(false), 'bs-btn-alt');
    svg.addEventListener('wheel', onWheel, { passive: false });
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointerleave', () => { st.tip.style.opacity = 0; });
    svg.addEventListener('dragover', e => e.preventDefault());
    svg.addEventListener('drop', e => { e.preventDefault(); const kk = e.dataTransfer.getData('text/bs-kind'); if (kk) { const [r, c] = cellAt(e); placeComponent(kk, r, c); } });
    svg.addEventListener('keydown', onKey);
    markTools();
  }

  function toggleFocus(force) {
    const on = typeof force === 'boolean' ? force : !document.body.classList.contains('bs-focus');
    document.body.classList.toggle('bs-focus', on);
    if (st.btnFocus) st.btnFocus.classList.toggle('on', on);
    try { localStorage.setItem('boheme_focus', on ? '1' : '0'); } catch (e) { }
    setTimeout(fit, 60);
  }

  function setTool(t) { st.tool = t; if (t !== 'place') st.place = null; markTools(); emit('tool', { tool: st.tool, place: st.place }); }
  function markTools() {
    document.querySelectorAll('.bs-tool').forEach(b => b.classList.toggle('on', b.dataset.tool === st.tool));
    document.querySelectorAll('.bs-pal-item').forEach((b, i) => b.classList.toggle('on', st.tool === 'place' && PALETTE[i][0] === st.place));
    if (st.svg) st.svg.style.cursor = st.tool === 'select' ? 'default' : 'crosshair';
  }

  function setPlace(kk) { setTool('place'); st.place = kk; markTools(); emit('tool', { tool: st.tool, place: kk }); }
  function zoomBy(f) {
    const w = st.svg.clientWidth || 800, h = st.svg.clientHeight || 600;
    const k = Math.max(0.2, Math.min(3.5, st.view.k * f));
    st.view.x = w / 2 - (w / 2 - st.view.x) * k / st.view.k;
    st.view.y = h / 2 - (h / 2 - st.view.y) * k / st.view.k;
    st.view.k = k;
    applyView();
  }
  function focusKey(k, zoom) {
    if (!k) return;
    const [r, c] = k.split(',').map(Number);
    const [x, y] = center(r, c);
    const w = st.svg.clientWidth || 800, h = st.svg.clientHeight || 600;
    if (zoom) st.view.k = Math.max(st.view.k, zoom);
    st.view.x = w / 2 - x * st.view.k;
    st.view.y = h / 2 - y * st.view.k;
    applyView();
    select(k);
    const L = st.layers.overlay;
    const ring = el('circle', { cx: x, cy: y, r: 10, class: 'bs-ping' }, L);
    setTimeout(() => ring.remove(), 1600);
  }
  function highlight(keys) { st.hl = keys && keys.length ? new Set(keys) : null; redraw(); }
  function setDim(keys, on) { keys.forEach(k => on ? st.dim.add(k) : st.dim.delete(k)); redraw(); }
  function setColorMode(m) { st.colorMode = m; st.flow = m !== 'none'; redraw(); emit('mode', m); }
  function setAnim(on) { st.anim = on; if (on && st.particles.length && !st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(tick); } emit('mode', st.colorMode); }
  function symbolSVG(kk, w, h) {
    const tmp = document.createElementNS(NS, 'svg');
    const gp = el('g', {}, tmp);
    symbol(kk, gp);
    return `<svg viewBox="-36 -26 72 52" width="${w || 36}" height="${h || 26}" class="bs-mini">${tmp.innerHTML}</svg>`;
  }
  function nodeSVG(ground, w) {
    const tmp = document.createElementNS(NS, 'svg');
    drawNodeGlyph(el('g', {}, tmp), ground, null);
    return `<svg viewBox="-24 -24 48 48" width="${w || 22}" height="${w || 22}" class="bs-mini">${tmp.innerHTML}</svg>`;
  }

  function applyView() {
    st.world.setAttribute('transform', `translate(${st.view.x},${st.view.y}) scale(${st.view.k})`);
    st.svg.classList.toggle('lod-far', st.view.k < 0.62);
    st.svg.classList.toggle('lod-mid', st.view.k >= 0.62 && st.view.k < 0.9);
    emit('view', st.view);
  }
  function fit() {
    if (!st.model) return;
    const [c0, r0, c1, r1] = st.model.bb;
    const w = st.svg.clientWidth || 1000, h = st.svg.clientHeight || 600;
    const ww = (c1 - c0 + 3) * S, hh = (r1 - r0 + 3) * S;
    const k = Math.min(w / ww, h / hh, 1.6);
    st.view.k = k;
    st.view.x = (w - (c1 + c0 - 1) * S * k) / 2;
    st.view.y = (h - (r1 + r0 - 1) * S * k) / 2;
    applyView();
  }
  function toWorld(e) {
    const rc = st.svg.getBoundingClientRect();
    return [(e.clientX - rc.left - st.view.x) / st.view.k, (e.clientY - rc.top - st.view.y) / st.view.k];
  }
  function cellAt(e) { const [x, y] = toWorld(e); return [Math.floor(y / S) + 1, Math.floor(x / S) + 1]; }
  function onWheel(e) {
    e.preventDefault();
    const rc = st.svg.getBoundingClientRect();
    const mx = e.clientX - rc.left, my = e.clientY - rc.top;
    const f = Math.exp(-e.deltaY * 0.0015);
    const k = Math.max(0.2, Math.min(3.5, st.view.k * f));
    st.view.x = mx - (mx - st.view.x) * k / st.view.k;
    st.view.y = my - (my - st.view.y) * k / st.view.k;
    st.view.k = k;
    applyView();
  }
  function onDown(e) {
    st.svg.focus();
    const [r, c] = cellAt(e);
    if (e.button === 1 || (st.tool === 'select' && !data()[key(r, c)])) { st.drag = { x: e.clientX, y: e.clientY, vx: st.view.x, vy: st.view.y, moved: false }; st.svg.setPointerCapture(e.pointerId); if (st.tool === 'select') select(null); return; }
    if (st.tool === 'select') { select(key(r, c)); return; }
    if (st.tool === 'place' && st.place) { placeComponent(st.place, r, c); return; }
    if (st.tool === 'node') { placeNode(r, c); return; }
    if (st.tool === 'erase') { if (data()[key(r, c)] != null) commit([[key(r, c), null]]); return; }
    if (st.tool === 'wire') { st.wirePaint = { r, c, axis: null, cells: [[r, c]] }; st.svg.setPointerCapture(e.pointerId); preview(); }
  }
  function onMove(e) {
    if (st.drag) {
      const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) st.drag.moved = true;
      st.view.x = st.drag.vx + dx; st.view.y = st.drag.vy + dy; applyView(); return;
    }
    if (st.wirePaint) {
      const [r, c] = cellAt(e);
      const w = st.wirePaint;
      if (!w.axis && (r !== w.r || c !== w.c)) w.axis = Math.abs(r - w.r) >= Math.abs(c - w.c) ? 'v' : 'h';
      w.cells = [];
      if (w.axis === 'v') for (let i = Math.min(r, w.r); i <= Math.max(r, w.r); i++) w.cells.push([i, w.c]);
      else if (w.axis === 'h') for (let j = Math.min(c, w.c); j <= Math.max(c, w.c); j++) w.cells.push([w.r, j]);
      else w.cells = [[w.r, w.c]];
      preview(); return;
    }
    hover(e);
  }
  function onUp() {
    if (st.drag) { st.drag = null; return; }
    if (st.wirePaint) {
      const ops = st.wirePaint.cells.filter(([r, c]) => !data()[key(r, c)]).map(([r, c]) => [key(r, c), 'I']);
      st.wirePaint = null;
      st.layers.overlay.innerHTML = '';
      if (ops.length) commit(ops); else redraw();
    }
  }
  function preview() {
    const L = st.layers.overlay;
    L.innerHTML = '';
    for (const [r, c] of st.wirePaint.cells) { const [x, y] = center(r, c); el('rect', { x: x - S / 2 + 4, y: y - S / 2 + 4, width: S - 8, height: S - 8, rx: 10, fill: 'rgba(56,225,200,.12)', stroke: '#38e1c8', 'stroke-dasharray': '4 4' }, L); }
  }
  function onKey(e) {
    const kk = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && kk === 'z') { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && kk === 'y') { e.preventDefault(); redo(); return; }
    if (kk === 'delete' || kk === 'backspace') { if (st.sel) { commit([[st.sel, null]]); select(null); } e.preventDefault(); return; }
    if (kk === 'escape') { setTool('select'); select(null); return; }
    if (kk === 'v') setTool('select');
    if (kk === 'w') setTool('wire');
    if (kk === 'n') setTool('node');
    if (kk === 'e') setTool('erase');
    if (kk === 'f') fit();
    if (kk === 'm') toggleFocus();
    if (kk === 'r' && st.sel) rotateSel();
  }

  function snapshot() { return JSON.stringify(data()); }
  function restore(s) { const Dd = data(); for (const k in Dd) delete Dd[k]; Object.assign(Dd, JSON.parse(s)); afterChange(); }
  function undo() { if (!st.undo.length) return; st.redo.push(snapshot()); restore(st.undo.pop()); }
  function redo() { if (!st.redo.length) return; st.undo.push(snapshot()); restore(st.redo.pop()); }
  function commit(ops, label) {
    st.lastLabel = label || null;
    st.undo.push(snapshot()); if (st.undo.length > 80) st.undo.shift(); st.redo = [];
    const Dd = data();
    for (const [k, v] of ops) { if (v == null || v === '') delete Dd[k]; else Dd[k] = v; }
    afterChange();
  }
  function afterChange() {
    st.stale = !!st.results && st.results.__snap !== snapshot();
    emit('change', st.lastLabel);
    st.lastLabel = null;
    st.inCommit = true;
    try { if (typeof updateUI === 'function') updateUI(); } catch (e) { }
    st.inCommit = false;
    try { if (typeof saveToLocalStorage === 'function') saveToLocalStorage(); } catch (e) { }
    try { if (!st.on && typeof renderGridData === 'function') renderGridData(); } catch (e) { }
    redraw();
    if (st.sel && !st.opts.embedded) showInspector(st.sel);
  }

  function existingNames() { return new Set(Object.values(data()).map(v => String(v).trim().split(/\s+/)[0].toUpperCase())); }
  function nextName(prefix) {
    const used = existingNames();
    for (let i = 1; i < 999; i++) { const n = prefix + (i < 10 ? '0' + i : i); if (!used.has(n.toUpperCase())) return n; }
    return prefix + Date.now() % 1000;
  }
  function placeComponent(kk, r, c) {
    if (!(r >= 1 && r <= rows() && c >= 1 && c <= cols())) return;
    if (data()[key(r, c)]) { select(key(r, c)); return; }
    const info = KIND[kk];
    let name = nextName(info.prefix);
    if (kk === 'UPTa' || kk === 'UPTb') { let i = 1; const used = existingNames(); while (used.has(('Upt' + i + 'a').toUpperCase()) || used.has(('Upt' + i + 'b').toUpperCase())) i++; name = 'Upt' + i + (kk === 'UPTa' ? 'a' : 'b'); }
    commit([[key(r, c), buildTok(name, info.fields.map(f => f[3]), '^', [])]], 'Inserted ' + info.title + ' ' + name);
    setTool('select');
    select(key(r, c));
  }
  function placeNode(r, c) {
    if (data()[key(r, c)]) { select(key(r, c)); return; }
    const used = existingNames();
    let i = 1; while (used.has(('N' + (i < 10 ? '0' + i : i)).toUpperCase())) i++;
    commit([[key(r, c), 'N' + (i < 10 ? '0' + i : i) + ' 0']], 'Inserted node N' + (i < 10 ? '0' + i : i));
    select(key(r, c));
  }
  function rotateSel() {
    const t = data()[st.sel];
    if (!t || !isComponentText(t)) return;
    const tok = parseTok(t);
    const o = ORIENTS[(ORIENTS.indexOf(tok.orient || '^') + 1) % 4];
    commit([[st.sel, buildTok(tok.name, tok.nums, o, tok.rest)]]);
  }

  function select(k) { st.sel = k; redrawSelection(); if (!st.opts.embedded) showInspector(k); emit('select', k); }
  function redrawSelection() {
    const L = st.layers.overlay;
    L.querySelectorAll('.bs-selbox').forEach(n => n.remove());
    if (!st.sel) return;
    const [r, c] = st.sel.split(',').map(Number);
    const [x, y] = center(r, c);
    el('rect', { class: 'bs-selbox', x: x - S / 2 + 3, y: y - S / 2 + 3, width: S - 6, height: S - 6, rx: 14 }, L);
  }

  function showInspector(k) {
    const box = st.inspector;
    const t = k ? data()[k] : null;
    if (!t) { box.classList.remove('open'); box.innerHTML = ''; return; }
    box.classList.add('open');
    box.innerHTML = '';
    const [r, c] = k.split(',').map(Number);
    const head = html('div', { class: 'bs-ins-head' }, box);
    const close = html('button', { class: 'bs-ins-x', text: '×', title: 'Close' }, head);
    close.addEventListener('click', () => select(null));
    const cellLabel = (typeof cn === 'function') ? cn(r, c) : (r + ',' + c);
    if (isComponentText(t)) {
      const tok = parseTok(t);
      const kk = kindKey(tok.name);
      const info = KIND[kk];
      const sv = el('svg', { viewBox: '-36 -26 72 52', width: 64, height: 46 }, head);
      symbol(kk || '?', el('g', {}, sv));
      html('div', { class: 'bs-ins-title', html: `<b>${info ? info.title : 'Unknown component'}</b><small>cell ${cellLabel}</small>` }, head);
      const form = html('div', { class: 'bs-ins-form' }, box);
      const nameIn = row(form, 'Name', '', tok.name, 'text');
      const vals = info ? fieldValues(kk, tok) : tok.nums;
      const ins = [];
      if (info) info.fields.forEach((f, i) => ins.push(row(form, f[1], f[2], vals[i] != null ? vals[i] : f[3], 'number')));
      const or = html('div', { class: 'bs-ins-row' }, form);
      html('label', { text: 'Orientation' }, or);
      const og = html('div', { class: 'bs-orient' }, or);
      for (const o of ORIENTS) { const b = html('button', { text: { '^': '↑', '>': '→', 'v': '↓', '<': '←' }[o], class: (tok.orient || '^') === o ? 'on' : '' }, og); b.addEventListener('click', () => { commit([[k, buildTok(tok.name, info ? ins.map(i => Number(i.value)) : tok.nums, o, tok.rest)]]); }); }
      const apply = () => {
        const nm = nameIn.value.trim() || tok.name;
        if (kindOf(nm) !== kindOf(tok.name)) { nameIn.classList.add('bad'); return; }
        nameIn.classList.remove('bad');
        commit([[k, buildTok(nm, info ? ins.map(i => Number(i.value)) : tok.nums, tok.orient, tok.rest)]]);
      };
      [nameIn].concat(ins).forEach(i => i.addEventListener('change', apply));
      const comp = st.model && st.model.comps.find(x => x.cell.key === k);
      if (comp) {
        const conn = html('div', { class: 'bs-ins-conn' }, box);
        conn.innerHTML = comp.ends.length === 2 ? `<span>⟷</span> ${comp.ends[0].node.text.split(/\s+/)[0]} → ${comp.ends[1].node.text.split(/\s+/)[0]}` : `<span class="bad">⚠ ${comp.error || 'not connected'}</span>`;
      }
      resultCard(box, tok.name);
      html('div', { class: 'bs-ins-raw', html: `<small>Solver token</small><code>${escapeHtml(data()[k])}</code>` }, box);
    } else if (isNodeText(t)) {
      const p = t.split(/\s+/);
      const ground = p[0][0].toUpperCase() === 'S';
      const nr = /^nr/i.test(p[0]);
      const sv = el('svg', { viewBox: '-30 -30 60 60', width: 54, height: 54 }, head);
      drawNodeGlyph(el('g', {}, sv), ground, null);
      html('div', { class: 'bs-ins-title', html: `<b>${ground ? 'Reservoir / ambient' : nr ? 'Pressure set-point node' : 'Node'}</b><small>cell ${cellLabel}</small>` }, head);
      const form = html('div', { class: 'bs-ins-form' }, box);
      const nm = row(form, 'Name', '', p[0], 'text');
      const z = row(form, nr ? 'Set total pressure' : 'Elevation z', nr ? 'bar' : 'm', p[1] != null ? Number(p[1]) : 0, 'number');
      const apply = () => commit([[k, [nm.value.trim() || p[0], String(Number(z.value) || 0)].concat(p.slice(2)).join(' ')]]);
      nm.addEventListener('change', apply); z.addEventListener('change', apply);
      const res = st.results && (st.results.nodes || []).find(n => String(n.id).trim().toUpperCase() === p[0].toUpperCase());
      if (res) html('div', { class: 'bs-ins-res', html: `<div><span>Total pressure</span><b>${fmt(Number(res.ptot), 2)} bar</b></div><div><span>Static (ρ·g·z removed)</span><b>${fmt(Number(res.pstat), 2)} bar</b></div>` }, box);
    } else {
      html('div', { class: 'bs-ins-title', html: `<b>${isWireText(t) ? 'Connection' : 'Text cell'}</b><small>cell ${cellLabel}</small>` }, head);
      html('div', { class: 'bs-ins-raw', html: `<code>${escapeHtml(t)}</code>` }, box);
    }
    const del = html('button', { class: 'bs-ins-del', text: 'Delete' }, box);
    del.addEventListener('click', () => { commit([[k, null]]); select(null); });
  }
  function row(form, label, unit, value, type) {
    const r = html('div', { class: 'bs-ins-row' }, form);
    html('label', { html: label + (unit ? ` <small>[${unit}]</small>` : '') }, r);
    const i = html('input', { type: type === 'number' ? 'text' : 'text', value: String(value), inputmode: type === 'number' ? 'decimal' : 'text' }, r);
    return i;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
  function resultFor(name) { return st.results && (st.results.components || []).find(c => String(c.name).trim() === name); }
  function regime(re) { const rc = Number((document.getElementById('pRecrit') || {}).value) || 2320; return re < rc * 0.8 ? 'laminar' : re < rc * 1.2 ? 'transitional' : 'turbulent'; }
  function resultCard(box, name) {
    const rr = resultFor(name);
    if (!rr || st.stale) return;
    const q = Number(rr.q), aq = Math.abs(q);
    html('div', { class: 'bs-ins-res', html: `<div><span>Flow Q</span><b>${fmt(aq)} m³/h <small>(${fmt(aq * 1000 / 60, 1)} l/min)</small></b></div><div><span>Velocity U</span><b>${fmt(Math.abs(Number(rr.u)))} m/s</b></div><div><span>Δp total</span><b>${fmt(Number(rr.dp), 2)} bar</b></div><div><span>Re</span><b>${fmt(Number(rr.reD), 0)} <small>${regime(Number(rr.reD))}</small></b></div><div><span>Power</span><b>${fmt(Number(rr.pow))} kW</b></div>` }, box);
  }

  function drawNodeGlyph(gp, ground, color) {
    if (ground) {
      el('path', { d: 'M-18 -6V14H18V-6', fill: 'url(#bs-glass)', stroke: color || '#8fb3ff', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, gp);
      el('path', { d: 'M-14 4H14', stroke: color || '#8fb3ff', 'stroke-width': 1.4, 'stroke-dasharray': '3 3' }, gp);
      el('path', { d: 'M-10 -14H10', stroke: color || '#8fb3ff', 'stroke-width': 2 }, gp);
    } else {
      el('circle', { r: 11, fill: color || '#1d2550', stroke: color ? '#fff' : '#8fb3ff', 'stroke-width': 2 }, gp);
      el('circle', { r: 4, fill: '#fff', opacity: 0.85 }, gp);
    }
  }

  function computeScales() {
    const r = st.results;
    if (!r || st.stale) return null;
    const comps = new Map((r.components || []).map(c => [String(c.name).trim(), c]));
    const nodes = new Map((r.nodes || []).map(n => [String(n.id).trim().toUpperCase(), n]));
    const ps = [...nodes.values()].map(n => Number(n.ptot)).filter(Number.isFinite);
    const qs = [...comps.values()].map(c => Math.abs(Number(c.q))).filter(q => q > 1e-9);
    const us = [...comps.values()].map(c => Math.abs(Number(c.u))).filter(u => u > 1e-9 && u < 1e3);
    return { comps, nodes, pmin: Math.min(...ps), pmax: Math.max(...ps), qmax: qs.length ? Math.max(...qs) : 1, umax: us.length ? Math.max(...us) : 1 };
  }

  function nodePressure(sc, name) { const n = sc && sc.nodes.get(String(name).toUpperCase()); return n ? Number(n.ptot) : NaN; }
  function pT(sc, p) { return sc && Number.isFinite(p) ? (p - sc.pmin) / ((sc.pmax - sc.pmin) || 1) : 0; }

  function redraw() {
    if (!st.built) buildDOM();
    if (!st.built) return;
    st.model = analyse();
    const M = st.model;
    const L = st.layers;
    for (const k in L) L[k].innerHTML = '';
    const [c0, r0, c1, r1] = M.bb;
    el('rect', { x: (c0 - 4) * S, y: (r0 - 4) * S, width: (c1 - c0 + 8) * S, height: (r1 - r0 + 8) * S, fill: 'url(#bs-dots)' }, L.bg);
    const sc = st.flow ? computeScales() : null;
    st.scales = computeScales();
    if (st.btnFlow) { st.btnFlow.classList.toggle('on', !!sc); st.btnFlow.style.display = st.results ? '' : 'none'; }
    const mode = st.colorMode;
    const dimOf = k => (st.dim.has(k) || (st.hl && !st.hl.has(k)));
    for (const w of M.wires) {
      if (M.usedWire.has(w.key)) continue;
      const [x, y] = center(w.r, w.c);
      el('rect', { x: x - 6, y: y - 6, width: 12, height: 12, rx: 3, fill: 'none', stroke: 'rgba(160,180,255,.35)', 'stroke-dasharray': '3 3' }, L.wires);
    }
    st.particles = [];
    let gid = 0;
    for (const comp of M.comps) {
      const [cx, cy] = center(comp.cell.r, comp.cell.c);
      const res = sc ? sc.comps.get(comp.name) : null;
      const vl = (typeof ValveRegistry !== 'undefined' && ValveRegistry.valves) ? ValveRegistry.valves.get(comp.name) : null;
      const closed = !!(vl && !vl.open);
      const aq = res ? Math.abs(Number(res.q)) : 0;
      const width = res ? 3 + 11 * Math.sqrt(aq / sc.qmax) : 2 + Math.min(8, (Number(comp.tok.nums[KIND[comp.kk] && KIND[comp.kk].fields.findIndex(f => f[0] === 'd')]) || 10) / 5);
      const ends = comp.ends.map(e => { const [nx, ny] = center(e.node.r, e.node.c); const nm = e.node.text.split(/\s+/)[0]; return { x: nx, y: ny, name: nm, p: nodePressure(sc, nm) }; });
      const pc = res ? 0.5 * ((Number.isFinite(ends[0] && ends[0].p) ? ends[0].p : 0) + (Number.isFinite(ends[1] && ends[1].p) ? ends[1].p : 0)) : NaN;
      for (const e of ends) {
        const id = 'bsg' + (gid++);
        let stroke = comp.error ? '#ff4d6d' : 'rgba(150,175,255,.55)';
        const dimmed = dimOf(comp.cell.key);
        if (res) {
          let ca, cb;
          if (mode === 'u') { const t = Math.sqrt(Math.min(1, Math.abs(Number(res.u)) / sc.umax)); ca = cb = pcol(t); }
          else if (mode === 'q') { const t = Math.sqrt(aq / sc.qmax); ca = cb = pcol(t); }
          else { ca = pcol(pT(sc, e.p)); cb = pcol(pT(sc, pc)); }
          const gr = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: e.x, y1: e.y, x2: cx, y2: cy }, L.pipes);
          el('stop', { offset: 0, 'stop-color': ca }, gr);
          el('stop', { offset: 1, 'stop-color': cb }, gr);
          stroke = `url(#${id})`;
          if (aq > 1e-6 && !dimmed) el('line', { x1: e.x, y1: e.y, x2: cx, y2: cy, stroke: cb, opacity: 0.5, 'stroke-width': width * 2.2, 'stroke-linecap': 'round', filter: 'url(#bs-softglow)' }, L.pipesGlow);
        }
        el('line', { x1: e.x, y1: e.y, x2: cx, y2: cy, stroke, 'stroke-width': width, 'stroke-linecap': 'round', opacity: dimmed ? 0.1 : closed ? 0.35 : 1, class: 'bs-pipe' }, L.pipes);
        if (!res) el('line', { x1: e.x, y1: e.y, x2: cx, y2: cy, stroke: 'rgba(255,255,255,.25)', 'stroke-width': 1, 'stroke-linecap': 'round' }, L.pipes);
      }
      let ang = 0;
      if (ends.length) {
        const d0 = [ends[0].x - cx, ends[0].y - cy];
        const d1 = ends.length === 2 ? [ends[1].x - cx, ends[1].y - cy] : null;
        const n0 = Math.hypot(d0[0], d0[1]) || 1, n1 = d1 ? Math.hypot(d1[0], d1[1]) || 1 : 1;
        const opposite = d1 && (d0[0] * d1[0] + d0[1] * d1[1]) / (n0 * n1) < -0.5;
        ang = opposite ? Math.atan2(d1[1] - d0[1], d1[0] - d0[0]) * 180 / Math.PI : Math.atan2(-d0[1], -d0[0]) * 180 / Math.PI;
      }
      const gp = el('g', { transform: `translate(${cx},${cy})`, class: 'bs-comp' + (dimOf(comp.cell.key) ? ' bs-dim' : '') + (st.hl && st.hl.has(comp.cell.key) ? ' bs-hl' : ''), 'data-key': comp.cell.key }, L.comps);
      if (res && aq > 1e-6 && !closed) el('circle', { r: 30, fill: pcol(pT(sc, pc), 0.18), filter: 'url(#bs-softglow)' }, gp);
      const sg = el('g', { transform: `rotate(${ang})` }, gp);
      symbol(comp.kk || '?', sg, { closed });
      sg.querySelectorAll('.bs-upright').forEach(t => t.setAttribute('transform', `rotate(${-ang} 0 0)`));
      if (res && /^(P|UPM|UCP|UPTa|UPTb)$/.test(comp.kk)) { const imp = sg.querySelector('.bs-impeller'); if (imp) imp.style.animationDuration = Math.max(0.25, 2.2 - 2 * Math.sqrt(aq / sc.qmax)) + 's'; imp && imp.classList.add('spin'); }
      if (comp.error) el('circle', { r: 34, fill: 'none', stroke: '#ff4d6d', 'stroke-width': 2, 'stroke-dasharray': '5 5', class: 'bs-err' }, gp);
      if (closed && res) el('circle', { r: 30, fill: 'none', stroke: '#ff4d6d', 'stroke-width': 2.5, class: 'bs-pulse' }, gp);
      const vertical = Math.abs(Math.sin(ang * Math.PI / 180)) > 0.7;
      const txt = res ? `${comp.name} · ${fmt(aq, 2)} m³/h` : comp.name;
      const tw = txt.length * 6.4 + 14;
      const lab = el('g', { transform: vertical ? `translate(${cx + 26},${cy})` : `translate(${cx},${cy + 32})`, class: dimOf(comp.cell.key) ? 'bs-dim' : '' }, L.labels);
      el('rect', { x: vertical ? 0 : -tw / 2, y: -9, width: tw, height: 18, rx: 9, class: res ? 'bs-chip bs-chip-res' : 'bs-chip' }, lab);
      el('text', { x: vertical ? tw / 2 : 0, y: 4, 'text-anchor': 'middle', class: 'bs-chip-t' }, lab).textContent = txt;
      if (res && ends.length === 2 && aq > 1e-6 && !closed && !dimOf(comp.cell.key)) {
        const n1 = String(res.n1 || '').trim().toUpperCase();
        let a = ends[0], b = ends[1];
        if (b.name.toUpperCase() === n1 && a.name.toUpperCase() !== n1) { const t = a; a = b; b = t; }
        if (Number(res.q) < 0) { const t = a; a = b; b = t; }
        const pts = [[a.x, a.y], [cx, cy], [b.x, b.y]];
        const seg = [Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1])];
        const len = seg[0] + seg[1];
        if (len > 1) {
          const u = Math.abs(Number(res.u));
          const speed = 26 + 150 * Math.sqrt(Math.min(1, u / sc.umax));
          const n = Math.max(2, Math.min(14, Math.round(len / 34 * (0.5 + Math.sqrt(aq / sc.qmax)))));
          const rad = 2.2 + 2.6 * Math.sqrt(aq / sc.qmax);
          for (let i = 0; i < n; i++) {
            const dot = el('circle', { r: rad, class: 'bs-dot' }, L.particles);
            const tu = mode === 'u' ? Math.sqrt(Math.min(1, u / sc.umax)) : mode === 'q' ? Math.sqrt(aq / sc.qmax) : null;
            st.particles.push({ dot, pts, seg, len, s: (i / n) * len, speed, pa: tu == null ? pT(sc, a.p) : tu, pb: tu == null ? pT(sc, b.p) : tu });
          }
          const mx = (a.x + cx) / 2, my = (a.y + cy) / 2, an = Math.atan2(cy - a.y, cx - a.x) * 180 / Math.PI;
          el('path', { d: 'M-7 -7L3 0L-7 7', fill: 'none', stroke: '#fff', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: `translate(${mx},${my}) rotate(${an})`, opacity: 0.9 }, L.labels);
        }
      }
    }
    for (const nd of M.nodes) {
      const [x, y] = center(nd.cell.r, nd.cell.c);
      const ground = nd.name[0] === 'S';
      const p = nodePressure(sc, nd.name);
      const col = sc && Number.isFinite(p) ? (mode === 'p' ? pcol(pT(sc, p)) : '#c9d6ff') : null;
      const ndim = dimOf(nd.cell.key);
      const gp = el('g', { transform: `translate(${x},${y})`, class: 'bs-node' + (ndim ? ' bs-dim' : ''), 'data-key': nd.cell.key }, L.nodes);
      if (col) { el('circle', { r: 20, fill: col, opacity: 0.35, filter: 'url(#bs-softglow)' }, gp); el('circle', { r: 16, fill: 'none', stroke: col, 'stroke-width': 1.5, class: 'bs-ring' }, gp); }
      drawNodeGlyph(gp, ground, col);
      const lab = el('g', { transform: `translate(${x + 14},${y - 20})`, class: ndim ? 'bs-dim' : '' }, L.labels);
      const txt = col ? `${nd.name} ${fmt(p, 1)} bar` : nd.nr ? `${nd.name} set ${fmt(nd.pset, 1)} bar` : `${nd.name}${nd.z ? '  z ' + nd.z + ' m' : ''}`;
      const tw = txt.length * 6.4 + 14;
      el('rect', { x: 0, y: -9, width: tw, height: 18, rx: 9, class: col ? 'bs-chip bs-chip-node' : 'bs-chip', style: col ? `stroke:${col}` : '' }, lab);
      el('text', { x: tw / 2, y: 4, 'text-anchor': 'middle', class: 'bs-chip-t' }, lab).textContent = txt;
    }
    redrawSelection();
    drawHud(sc);
    drawLegend(sc);
    st.banner.className = 'bs-banner' + (st.stale ? ' show' : '');
    st.banner.innerHTML = st.stale ? '⚡ Model changed since the last solution – press <b>Solve</b> to update the flow view' : '';
    if (!st.fitData && M.cells.length && st.on) { st.fitData = true; fit(); }
    emit('redraw', M);
    if (st.particles.length && !st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(tick); }
  }

  function tick(t) {
    const dt = Math.min(0.05, (t - st.last) / 1000);
    st.last = t;
    for (const p of st.particles) {
      p.s = (p.s + p.speed * dt) % p.len;
      let s = p.s, x, y;
      if (s <= p.seg[0]) { const f = s / (p.seg[0] || 1); x = p.pts[0][0] + (p.pts[1][0] - p.pts[0][0]) * f; y = p.pts[0][1] + (p.pts[1][1] - p.pts[0][1]) * f; }
      else { const f = (s - p.seg[0]) / (p.seg[1] || 1); x = p.pts[1][0] + (p.pts[2][0] - p.pts[1][0]) * f; y = p.pts[1][1] + (p.pts[2][1] - p.pts[1][1]) * f; }
      const tt = p.pa + (p.pb - p.pa) * (p.s / p.len);
      p.dot.setAttribute('cx', x.toFixed(1));
      p.dot.setAttribute('cy', y.toFixed(1));
      p.dot.setAttribute('fill', pcol(tt));
    }
    st.raf = st.particles.length && st.on && st.anim ? requestAnimationFrame(tick) : 0;
  }

  function drawHud(sc) {
    const r = st.results;
    if (!r) { st.hud.innerHTML = `<div class="bs-hud-t">BOHEME Studio</div><div class="bs-hud-s">${st.model.comps.length} components · ${st.model.nodes.length} nodes · click an object to edit it</div>`; return; }
    const comps = r.components || [];
    const pumps = comps.filter(c => /^(P|UPM|UCP|UPT)/i.test(String(c.type || kindOf(c.name))));
    const ppow = pumps.reduce((s, c) => s + Math.abs(Number(c.pow) || 0), 0);
    let umax = 0, uname = '';
    for (const c of comps) { const u = Math.abs(Number(c.u)); if (u > umax && u < 1e3) { umax = u; uname = c.name; } }
    const qpump = pumps.reduce((s, c) => s + Math.abs(Number(c.q) || 0), 0);
    const ok = !(r.iterations >= Number((document.getElementById('itNiter') || {}).value || 1e9) && Number(r.residual) > Number((document.getElementById('itDUcrit') || {}).value || 0));
    st.hud.innerHTML = `<div class="bs-hud-t">${st.stale ? 'Result (outdated)' : 'Solved network'} <span class="${ok ? 'ok' : 'bad'}">${ok ? 'converged' : 'not converged'}</span></div>
<div class="bs-kpis">
<div><span>Pump power</span><b>${fmt(ppow, 2)}<small> kW</small></b></div>
<div><span>Pump flow</span><b>${fmt(qpump, 2)}<small> m³/h</small></b></div>
<div><span>Max. velocity</span><b>${fmt(umax, 2)}<small> m/s</small></b><em>${uname}</em></div>
<div><span>Pressure range</span><b>${sc ? fmt(sc.pmin, 1) + '–' + fmt(sc.pmax, 1) : '–'}<small> bar</small></b></div>
<div><span>Iterations</span><b>${r.iterations}</b><em>res ${Number(r.residual).toExponential(1)}</em></div>
${r.ptu && r.ptu.present ? `<div><span>PTU</span><b>${r.ptu.active ? 'active' : 'off'}</b></div>` : ''}
</div>`;
  }

  function drawLegend(sc) {
    if (!sc) { st.legend.innerHTML = ''; st.legend.style.display = 'none'; return; }
    st.legend.style.display = '';
    const stops = P_STOPS.map(([t]) => `${pcol(t)} ${Math.round(t * 100)}%`).join(',');
    st.legend.innerHTML = `<div class="bs-leg-t">Total pressure [bar]</div><div class="bs-leg-bar" style="background:linear-gradient(90deg,${stops})"></div><div class="bs-leg-s"><span>${fmt(sc.pmin, 1)}</span><span>${fmt((sc.pmin + sc.pmax) / 2, 1)}</span><span>${fmt(sc.pmax, 1)}</span></div><div class="bs-leg-t" style="margin-top:8px">Line width ∝ √|Q| · particle speed ∝ √U</div><div class="bs-leg-w"><i style="height:3px"></i><i style="height:7px"></i><i style="height:13px"></i><span>max ${fmt(sc.qmax, 2)} m³/h</span></div>`;
  }

  function hover(e) {
    const tgt = e.target.closest && e.target.closest('.bs-comp,.bs-node');
    if (!tgt) { st.tip.style.opacity = 0; return; }
    const k = tgt.getAttribute('data-key');
    const t = data()[k];
    if (!t) return;
    let h = '';
    if (isComponentText(t)) {
      const tok = parseTok(t), kk = kindKey(tok.name), rr = resultFor(tok.name);
      h = `<b>${tok.name}</b> <small>${KIND[kk] ? KIND[kk].title : ''}</small>`;
      if (rr && !st.stale) {
        const aq = Math.abs(Number(rr.q));
        h += `<div class="bs-tip-g"><span>Q</span><b>${fmt(aq)} m³/h</b><span>U</span><b>${fmt(Math.abs(Number(rr.u)))} m/s</b><span>Δp</span><b>${fmt(Number(rr.dp), 2)} bar</b><span>Re</span><b>${fmt(Number(rr.reD), 0)} · ${regime(Number(rr.reD))}</b><span>Power</span><b>${fmt(Number(rr.pow))} kW</b><span>From → to</span><b>${(Number(rr.q) >= 0 ? rr.n1 + ' → ' + rr.n2 : rr.n2 + ' → ' + rr.n1)}</b></div>`;
      } else {
        const info = KIND[kk];
        if (info) { const v = fieldValues(kk, tok); h += '<div class="bs-tip-g">' + info.fields.map((f, i) => `<span>${f[1]}</span><b>${fmt(v[i], 3)} ${f[2]}</b>`).join('') + '</div>'; }
      }
    } else if (isNodeText(t)) {
      const p = t.split(/\s+/);
      const rr = st.results && !st.stale && (st.results.nodes || []).find(n => String(n.id).trim().toUpperCase() === p[0].toUpperCase());
      h = `<b>${p[0]}</b> <small>${p[0][0] === 'S' ? 'reservoir' : 'node'} · z = ${Number(p[1]) || 0} m</small>` + (rr ? `<div class="bs-tip-g"><span>Ptot</span><b>${fmt(Number(rr.ptot), 3)} bar</b><span>Pstat</span><b>${fmt(Number(rr.pstat), 3)} bar</b></div>` : '');
    }
    const rc = st.svg.getBoundingClientRect();
    st.tip.innerHTML = h;
    st.tip.style.opacity = 1;
    st.tip.style.left = Math.min(rc.width - 260, e.clientX - rc.left + 18) + 'px';
    st.tip.style.top = Math.min(rc.height - 140, e.clientY - rc.top + 14) + 'px';
  }

  function setMode(on) {
    if (st.opts.embedded) { st.on = true; redraw(); if (!st.fitted) { fit(); st.fitted = true; } return; }
    st.on = on;
    const sw = $('#studioWrap'), gw = document.querySelector('#tab-comp .grid-wrap'), fb = document.querySelector('#tab-comp .formula-bar');
    if (sw) sw.style.display = on ? '' : 'none';
    if (!on) document.body.classList.remove('bs-focus');
    if (gw) gw.style.display = on ? 'none' : '';
    if (fb) fb.style.display = on ? 'none' : '';
    document.querySelectorAll('.bs-modebtn').forEach(b => b.classList.toggle('active', (b.dataset.mode === 'studio') === on));
    try { localStorage.setItem('boheme_view_mode', on ? 'studio' : 'grid'); } catch (e) { }
    if (on) { redraw(); if (!st.fitted) { fit(); st.fitted = true; } if (st.particles.length && !st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(tick); } }
    else { try { if (typeof renderGridData === 'function') { if (typeof resultViewOn !== 'undefined' && resultViewOn && typeof renderResultView === 'function') renderResultView(); else renderGridData(); } } catch (e) { } }
  }

  function setResults(r) { st.results = r; st.stale = false; if (st.on) redraw(); emit('results', r); }

  function wrapUpdateUI() {
    if (typeof window.updateUI !== 'function' || window.updateUI.__bs) return;
    const orig = window.updateUI;
    const wrapped = function () { const out = orig.apply(this, arguments); if (st.on && !st.inCommit) { clearTimeout(st.t); st.t = setTimeout(() => { st.stale = !!st.results && st.results.__snap !== snapshot(); redraw(); }, 60); } return out; };
    wrapped.__bs = true;
    window.updateUI = wrapped;
  }

  function init(opts) {
    st.opts = opts || {};
    buildDOM();
    if (!st.built) return;
    wrapUpdateUI();
    let mode = 'studio';
    try { mode = localStorage.getItem('boheme_view_mode') || 'studio'; } catch (e) { }
    if (st.opts.embedded) { setMode(true); }
    else {
      setMode(mode !== 'grid');
      let foc = '0';
      try { foc = localStorage.getItem('boheme_focus') || '0'; } catch (e) { }
      if (foc === '1' && mode !== 'grid') toggleFocus(true);
    }
    window.addEventListener('resize', () => { if (st.on) applyView(); });
  }

  window.BohemeStudio = {
    init, redraw, fit, setMode, toggleFocus, on, setTool, setPlace, zoomBy, focusKey, highlight, setDim, setColorMode, setAnim, symbolSVG, nodeSVG, KIND, PALETTE, kindOf, isComponentText, isNodeText, isWireText, regime, resultFor, analyse, parseTok, buildTok, kindKey, fieldValues, pcol,
    setResults(r) { if (r) r.__snap = snapshot(); setResults(r); },
    state: st, select, placeComponent, placeNode, commit, undo, redo, rotateSel
  };
})();
