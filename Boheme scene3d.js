(function () {
  'use strict';
  const U = 2;
  const Y = 0.62;
  const CSS = `
.s3{position:absolute;inset:0;z-index:1;overflow:hidden}
.s3 canvas{display:block;width:100%!important;height:100%!important;outline:none}
.s3-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.s3-l{position:absolute;left:0;top:0;white-space:nowrap;font:12.5px "Segoe UI",Tahoma,sans-serif;color:#111;padding:1px 6px;background:#fff;border:1px solid #6b6b6b;line-height:17px}
.s3-l.n{background:#fafafa}
.s3-l.sel{border-color:#00a000;box-shadow:0 0 0 1px #00a000;z-index:2}
.s3-l.pmax,.s3-l.pmin{color:#fff;font-weight:600;border:none;padding:0 5px;z-index:3}
.s3-l.pmax{background:#c62828}.s3-l.pmin{background:#1565c0}
.s3-l.pmax::after,.s3-l.pmin::after{content:"";position:absolute;left:-6px;bottom:-6px;width:8px;height:8px;border-left:1.5px solid #111;border-bottom:1.5px solid #111;transform:skewX(-30deg)}
.s3-tip{position:absolute;pointer-events:none;display:none;min-width:220px;max-width:320px;padding:6px 10px;background:#ffffe1;border:1px solid #767676;color:#111;font:13px "Segoe UI",Tahoma,sans-serif;box-shadow:2px 2px 5px rgba(0,0,0,.2);z-index:6}
.s3-tip small{color:#555}
.s3-tip .g{display:grid;grid-template-columns:auto 1fr;gap:1px 12px;margin-top:3px}
.s3-tip .g span{color:#444}
.s3-tip .g b{text-align:right;font-weight:600}
.s3-help{position:absolute;right:8px;bottom:6px;z-index:4;font:11px "Segoe UI",sans-serif;color:#555;pointer-events:none}
`;
  const st = {
    S: null, ok: false, on: false, wrap: null, renderer: null, scene: null, camera: null, controls: null,
    root: null, pick: [], spin: [], labels: [], lblBox: null, tip: null, ghost: null, arrows: null, adata: [], sig: '', raf: 0, clock: null,
    mats: {}, paint: null, down: null, anim: null, size: 20, selBox: null, center: null, bbox: null, grid: null, triad: null
  };
  const $ = (q, r) => (r || document).querySelector(q);
  function webglOK() { try { const c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  function col(css) { return new THREE.Color(css).convertSRGBToLinear(); }
  function band(t) { t = Math.max(0, Math.min(1, t)); return col(st.S.pcol(Math.min(8, Math.floor(t * 9)) / 8)); }
  function pos(r, c) { return new THREE.Vector3((c - 0.5) * U, Y, (r - 0.5) * U); }
  function fmt(v, n) { return Number.isFinite(v) ? (Math.abs(v) >= 1e4 ? v.toFixed(0) : v.toFixed(n == null ? 3 : n)) : '–'; }
  function wb() { return (window.BohemeWorkbench && BohemeWorkbench.state) || {}; }

  function mats() {
    const M = st.mats;
    const std = (c, m, r) => new THREE.MeshStandardMaterial({ color: col(c), metalness: m, roughness: r });
    M.metal = std('#b3b9c1', 0.45, 0.42);
    M.dark = std('#7d848e', 0.35, 0.5);
    M.chrome = std('#dfe3e8', 0.85, 0.22);
    M.glassNode = std('#9aa3ad', 0.3, 0.45);
    M.err = new THREE.MeshStandardMaterial({ color: col('#c62828'), metalness: 0.1, roughness: 0.6 });
    M.accent = {};
    for (const [k, c] of Object.entries({ pipe: '#4f6a8a', res: '#7b62a3', valve: '#b5832a', pump: '#3f8a7f', actuator: '#a64d74', closed: '#c62828' })) M.accent[k] = std(c, 0.25, 0.5);
    M.edge = new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.55 });
    M.arrow = new THREE.MeshStandardMaterial({ color: col('#2b2b2b'), metalness: 0.2, roughness: 0.6 });
    M.ghost = new THREE.MeshBasicMaterial({ color: 0x00a000, transparent: true, opacity: 0.25, depthWrite: false });
    M.geom = std('#8f99a6', 0.2, 0.55);
    M.geomErr = std('#d46a6a', 0.1, 0.6);
  }

  function gradientBg() {
    const cv = document.createElement('canvas');
    cv.width = 4; cv.height = 512;
    const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#aebdcf');
    gr.addColorStop(1, '#f2f4f7');
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function environment() {
    const pm = new THREE.PMREMGenerator(st.renderer);
    const env = new THREE.Scene();
    const sg = new THREE.SphereGeometry(50, 32, 16);
    const cols = [];
    const p = sg.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 50; const c = new THREE.Color().lerpColors(new THREE.Color(0x3a3d42), new THREE.Color(0xe8ebef), 0.5 + 0.5 * y); cols.push(c.r, c.g, c.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    env.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    st.scene.environment = pm.fromScene(env, 0.06).texture;
    pm.dispose();
  }

  function makeTriad() {
    const sc = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 10);
    const add = (dir, color, label) => {
      const m = new THREE.MeshBasicMaterial({ color });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 10), m);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 14), m);
      const g = new THREE.Group();
      shaft.position.y = 0.45; head.position.y = 1.02;
      g.add(shaft, head);
      g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      sc.add(g);
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const x = cv.getContext('2d'); x.font = 'bold 44px Segoe UI, Arial'; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, 32, 34);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false }));
      sp.scale.set(0.42, 0.42, 1);
      sp.position.copy(dir).multiplyScalar(1.38);
      sc.add(sp);
    };
    add(new THREE.Vector3(1, 0, 0), '#d32f2f', 'X');
    add(new THREE.Vector3(0, 1, 0), '#2e7d32', 'Y');
    add(new THREE.Vector3(0, 0, 1), '#1565c0', 'Z');
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: 0x555555 })));
    return { scene: sc, cam };
  }

  function init(S) {
    st.S = S;
    if (!webglOK()) return false;
    const host = $('#wbViewport');
    if (!host) return false;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const wrap = document.createElement('div');
    wrap.className = 's3';
    wrap.id = 's3';
    host.insertBefore(wrap, host.firstChild);
    st.wrap = wrap;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false }); } catch (e) { wrap.remove(); return false; }
    renderer.setPixelRatio(Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.autoClear = false;
    wrap.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 0;
    st.renderer = renderer;
    st.scene = new THREE.Scene();
    st.scene.background = gradientBg();
    st.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 3000);
    st.camera.position.set(40, 45, 70);
    st.controls = new THREE.OrbitControls(st.camera, renderer.domElement);
    st.controls.enableDamping = true;
    st.controls.dampingFactor = 0.12;
    st.controls.screenSpacePanning = true;
    st.controls.minDistance = 3;
    st.controls.maxDistance = 900;
    st.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    mats();
    environment();
    st.scene.add(new THREE.HemisphereLight(0xffffff, 0x7d828a, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(0.5, 1, 0.7);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 5;
    st.key = key;
    st.scene.add(key.target);
    st.floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.3 }));
    st.floor.rotation.x = -Math.PI / 2;
    st.floor.position.y = 0;
    st.floor.receiveShadow = true;
    st.scene.add(st.floor);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-0.7, 0.4, -0.5);
    st.camLight = new THREE.DirectionalLight(0xffffff, 0.35);
    st.scene.add(key, fill, st.camLight);
    st.root = new THREE.Group();
    st.scene.add(st.root);
    st.ghost = new THREE.Group();
    st.scene.add(st.ghost);
    st.triad = makeTriad();
    st.lblBox = document.createElement('div');
    st.lblBox.className = 's3-labels';
    wrap.appendChild(st.lblBox);
    st.tip = document.createElement('div');
    st.tip.className = 's3-tip';
    wrap.appendChild(st.tip);
    const help = document.createElement('div');
    help.className = 's3-help';
    wrap.appendChild(help);
    st.help = help;
    try { st.nav = localStorage.getItem('boheme_nav') || 'pan'; } catch (e) { st.nav = 'pan'; }
    st.clock = new THREE.Clock();
    events();
    S.on('redraw', () => schedule());
    S.on('results', () => schedule());
    S.on('mode', () => schedule());
    S.on('select', k => { markSel(); if (k && st.on && st.focusNext !== false) focusOn(k); });
    S.on('tool', () => syncControls());
    new ResizeObserver(resize).observe(wrap);
    addToggle();
    st.ok = true;
    syncControls();
    setActive(true);
    return true;
  }

  function addToggle() {
    const bar = $('#wbModes');
    if (!bar) return;
    bar.innerHTML = '<button data-dim="3d" title="3D model view">3D</button><button data-dim="2d" title="2D schematic">2D</button>';
    bar.querySelectorAll('[data-dim]').forEach(b => b.addEventListener('click', () => setActive(b.dataset.dim === '3d')));
  }
  function markToggle() { document.querySelectorAll('[data-dim]').forEach(b => b.classList.toggle('on', (b.dataset.dim === '3d') === st.on)); }

  function gridMode(on) {
    const vp = $('#wbViewport');
    let box = $('#wbGrid2d');
    if (!box) { box = document.createElement('div'); box.id = 'wbGrid2d'; box.className = 'wb-grid2d'; vp.appendChild(box); }
    const fb = document.querySelector('.formula-bar'), gw = document.querySelector('.grid-wrap'), rp = $('#wbRaster');
    if (on) { if (fb) box.appendChild(fb); if (gw) { box.appendChild(gw); gw.style.display = ''; } box.style.display = 'flex'; }
    else { if (rp) { if (fb) rp.appendChild(fb); if (gw) rp.appendChild(gw); } box.style.display = 'none'; }
    vp.classList.toggle('wb-is-grid', on);
    const note = $('#wbRaster .wb-raster-note');
    if (note) note.innerHTML = on ? 'The cell grid is shown in the graphics window (2D view).' : 'Expert view of the solver input. Every cell is synchronised with the 3D model – paste from Excel with Ctrl+V after selecting a cell.';
  }
  function setNav(m) { st.nav = m; try { localStorage.setItem('boheme_nav', m); } catch (e) { } syncControls(); }
  function setActive(on) {
    st.on = on && st.ok;
    st.wrap.style.display = st.on ? '' : 'none';
    const sw = $('#studioWrap');
    if (sw) sw.style.visibility = 'hidden';
    gridMode(!st.on);
    try { localStorage.setItem('boheme_view_dim', st.on ? '3d' : '2d'); } catch (e) { }
    markToggle();
    const z = $('#wbZoom');
    if (z) z.style.display = st.on ? 'none' : '';
    if (st.on) { resize(); st.sig = ''; build(); if (!st.fitted) { view('iso', true); st.fitted = true; } loop(); }
    else { cancelAnimationFrame(st.raf); st.raf = 0; }
  }

  function resize() {
    if (!st.renderer) return;
    const w = st.wrap.clientWidth || 800, h = st.wrap.clientHeight || 600;
    st.renderer.setSize(w, h, false);
    st.camera.aspect = w / h;
    st.camera.updateProjectionMatrix();
  }

  let schedT = 0;
  function schedule() { if (!st.on) return; clearTimeout(schedT); schedT = setTimeout(build, 30); }
  function disposeTree(o) { o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material && x.material.__own) x.material.dispose(); }); }
  function signature() {
    const s = st.S.state, w = wb();
    return JSON.stringify([typeof D !== 'undefined' ? D : {}, s.results ? s.results.iterations + ':' + s.results.residual : 0, s.stale, s.colorMode, [...(s.dim || [])], s.hl ? [...s.hl] : 0, typeof ValveRegistry !== 'undefined' ? [...ValveRegistry.valves.values()].map(v => v.open) : 0, w.probesOff, w.labelsOff]);
  }

  function tube(points, radius, colors, mat) {
    const path = new THREE.CurvePath();
    for (let i = 1; i < points.length; i++) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
    const ts = Math.max(8, Math.round(path.getLength() * 8));
    const geo = new THREE.TubeGeometry(path, ts, radius, 24, false);
    if (colors) {
      const arr = new Float32Array(geo.attributes.position.count * 3);
      for (let i = 0; i <= ts; i++) { const c = colors(i / ts); for (let j = 0; j <= 24; j++) { const k = (i * 25 + j) * 3; arr[k] = c.r; arr[k + 1] = c.g; arr[k + 2] = c.b; } }
      geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    }
    return new THREE.Mesh(geo, mat);
  }
  function cyl(r1, r2, h, mat, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 32), mat); }
  function axisX(m) { m.rotation.z = Math.PI / 2; return m; }
  function addEdges(g) {
    const list = [];
    g.traverse(o => { if (o.isMesh && /^(Cylinder|Box|Cone|Lathe)/.test(o.geometry.type)) list.push(o); });
    list.forEach(o => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 32), st.mats.edge); e.raycast = () => { }; o.add(e); });
  }
  function model(kk, closed, res, spinRate, isValve) {
    const M = st.mats;
    const g = new THREE.Group();
    const fam = (st.S.KIND[kk] || {}).family || 'pipe';
    const acc = closed ? M.accent.closed : M.accent[fam] || M.accent.pipe;
    if (kk === 'R') {
      for (const x of [-0.62, 0.62]) { const f = axisX(cyl(0.3, 0.3, 0.12, M.metal)); f.position.x = x; g.add(f); for (let i = 0; i < 6; i++) { const b = cyl(0.03, 0.03, 0.16, M.chrome, 8); axisX(b); const a = i / 6 * Math.PI * 2; b.position.set(x, Math.sin(a) * 0.22, Math.cos(a) * 0.22); g.add(b); } }
      const band = axisX(cyl(0.2, 0.2, 0.08, acc)); g.add(band);
    } else if (kk === 'RZ') {
      for (const x of [-0.14, 0.14]) { const d = axisX(cyl(0.42, 0.42, 0.07, M.metal, 36)); d.position.x = x; g.add(d); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 40), acc); ring.rotation.y = Math.PI / 2; g.add(ring);
    } else if (kk === 'RK' || (kk === 'RL' && isValve)) {
      const c1 = axisX(cyl(0, 0.36, 0.62, M.dark, 28)); c1.position.x = -0.31; g.add(c1);
      const c2 = axisX(cyl(0.36, 0, 0.62, M.dark, 28)); c2.position.x = 0.31; g.add(c2);
      const stem = cyl(0.045, 0.045, 0.7, M.chrome, 10); stem.position.y = 0.35; g.add(stem);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 12, 36), acc); wheel.rotation.x = Math.PI / 2; wheel.position.y = 0.72; g.add(wheel);
      for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.035, 0.035), M.chrome); sp.position.y = 0.72; sp.rotation.y = i * Math.PI / 3; g.add(sp); }
    } else if (kk === 'RL') {
      const pts = [];
      for (let i = 0; i <= 120; i++) { const t = i / 120; const a = t * Math.PI * 12; pts.push(new THREE.Vector3(-0.6 + 1.2 * t, Math.sin(a) * 0.26, Math.cos(a) * 0.26)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.045, 8, false), acc));
      const core = axisX(cyl(0.12, 0.12, 1.3, M.dark)); g.add(core);
    } else if (kk === 'RR') {
      const prof = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; prof.push(new THREE.Vector2(0.14 + 0.3 * Math.pow(Math.abs(t - 0.5) * 2, 1.6), -0.55 + 1.1 * t)); }
      const l = axisX(new THREE.Mesh(new THREE.LatheGeometry(prof, 36), M.metal)); g.add(l);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 10, 30), acc); ring.rotation.y = Math.PI / 2; g.add(ring);
    } else if (kk === 'P' || kk === 'UPM' || kk === 'UCP' || kk === 'UPTb' || kk === 'UPTa') {
      const body = cyl(0.62, 0.62, 0.42, M.dark, 40); g.add(body);
      const cap = cyl(0.5, 0.56, 0.12, M.metal, 40); cap.position.y = 0.27; g.add(cap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 12, 48), acc); ring.rotation.x = Math.PI / 2; ring.position.y = 0.21; g.add(ring);
      const imp = new THREE.Group();
      for (let i = 0; i < 6; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.1), acc); bl.position.x = 0.2; const holder = new THREE.Group(); holder.rotation.y = i * Math.PI / 3; bl.rotation.y = 0.5; holder.add(bl); imp.add(holder); }
      imp.position.y = 0.36;
      g.add(imp);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), M.chrome); hub.position.y = 0.36; g.add(hub);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 20), acc);
      arrow.rotation.z = kk === 'UPTa' ? Math.PI / 2 : -Math.PI / 2;
      arrow.position.set(kk === 'UPTa' ? 0.45 : 0.78, 0, 0);
      g.add(arrow);
      if (kk === 'UPM') { const v = cyl(0.03, 0.03, 1.5, acc, 8); v.rotation.z = Math.PI / 4; v.position.y = 0.5; g.add(v); }
      if (kk === 'UPTa' || kk === 'UPTb') { const sh = axisX(cyl(0.07, 0.07, 0.9, M.chrome, 12)); sh.position.set(kk === 'UPTa' ? 0.85 : -0.85, 0.36, 0); g.add(sh); }
      if (res) st.spin.push({ o: imp, w: spinRate });
    } else if (kk === 'UCV') {
      const cone = axisX(cyl(0.36, 0.12, 0.5, M.dark, 28)); cone.position.x = -0.2; g.add(cone);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), closed ? acc : M.chrome); ball.position.x = 0.12; g.add(ball);
      const pts = [];
      for (let i = 0; i <= 80; i++) { const t = i / 80; const a = t * Math.PI * 10; pts.push(new THREE.Vector3(0.32 + 0.38 * t, Math.sin(a) * 0.14, Math.cos(a) * 0.14)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.03, 6, false), acc));
    } else if (kk === 'UPR') {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), M.dark); g.add(box);
      const pts = [];
      for (let i = 0; i <= 80; i++) { const t = i / 80; const a = t * Math.PI * 10; pts.push(new THREE.Vector3(Math.sin(a) * 0.14, 0.3 + 0.5 * t, Math.cos(a) * 0.14)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.032, 6, false), acc));
      const lid = cyl(0.2, 0.2, 0.06, M.chrome); lid.position.y = 0.84; g.add(lid);
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.62), acc); band.position.y = 0.2; g.add(band);
    } else if (kk === 'U') {
      const barrel = axisX(cyl(0.3, 0.3, 1.0, M.metal, 32)); barrel.position.x = -0.15; g.add(barrel);
      for (const x of [-0.66, 0.36]) { const e = axisX(cyl(0.34, 0.34, 0.08, M.dark, 32)); e.position.x = x; g.add(e); }
      const rod = axisX(cyl(0.09, 0.09, 0.7, M.chrome, 16)); rod.position.x = 0.7; g.add(rod);
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.04, 10, 24), M.chrome); eye.position.x = 1.08; g.add(eye);
      const band = axisX(cyl(0.31, 0.31, 0.06, acc, 32)); band.position.x = -0.15; g.add(band);
    } else {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), st.mats.err));
    }
    return g;
  }


  function foldCorner(g, dWorld) {
    const inv = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, g.rotation.y, 0)).invert();
    const dl = dWorld.clone().applyQuaternion(inv);
    const phi = -Math.atan2(dl.z, dl.x);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), phi);
    g.children.forEach(ch => {
      const cx = ch.position.x;
      if (cx > 0.05) { ch.position.applyQuaternion(q); ch.quaternion.premultiply(q); }
    });
    g.userData.corner = true;
  }

  function nodeModel(color, ground, nr) {
    const M = st.mats;
    const g = new THREE.Group();
    const mat = color ? new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.55 }) : M.metal;
    if (color) mat.__own = true;
    if (ground) {
      const body = cyl(0.62, 0.62, 1.0, M.metal, 40); g.add(body);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.metal); top.scale.y = 0.35; top.position.y = 0.5; g.add(top);
      const band = cyl(0.64, 0.64, 0.12, mat, 40); band.position.y = -0.15; g.add(band);
      const foot = cyl(0.5, 0.56, 0.14, M.dark, 40); foot.position.y = -0.56; g.add(foot);
      g.position.y = -0.0;
    } else {
      const core = new THREE.Mesh(nr ? new THREE.OctahedronGeometry(0.4) : new THREE.SphereGeometry(0.36, 32, 20), mat);
      g.add(core);
    }
    addEdges(g);
    return g;
  }

  function build() {
    if (!st.on || !st.renderer) return;
    const S = st.S, s = S.state, w = wb();
    const M0 = s.model || S.analyse();
    const sig = signature();
    if (sig === st.sig) { markSel(); return; }
    st.sig = sig;
    disposeTree(st.root);
    st.root.clear();
    st.pick = []; st.spin = [];
    st.labels.forEach(l => l.el.remove());
    st.labels = []; st.adata = [];
    if (st.arrows) { st.scene.remove(st.arrows); st.arrows.geometry.dispose(); st.arrows = null; }
    const sc = s.stale ? null : s.scales;
    const res = s.results && !s.stale ? s.results : null;
    const comps = res ? new Map((res.components || []).map(c => [String(c.name).trim(), c])) : new Map();
    const nodes = res ? new Map((res.nodes || []).map(n => [String(n.id).trim().toUpperCase(), n])) : new Map();
    const mode = s.colorMode;
    const contour = !!(res && sc && mode !== 'none');
    const pT = p => sc && Number.isFinite(p) ? (p - sc.pmin) / ((sc.pmax - sc.pmin) || 1) : 0;
    const dimOf = k => (s.dim && s.dim.has(k)) || (s.hl && !s.hl.has(k));
    const vreg = typeof ValveRegistry !== 'undefined' ? ValveRegistry.valves : new Map();
    const box = new THREE.Box3();
    const pipeMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.08, roughness: 0.42 });
    pipeMat.__own = true;
    const pipeDim = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.05, roughness: 0.6, transparent: true, opacity: 0.12, depthWrite: false });
    pipeDim.__own = true;
    const geomC = col('#8f99a6'), errC = col('#d46a6a');
    const arrows = [];
    let pmaxN = null, pminN = null, cmax = null, cmin = null;
    for (const comp of M0.comps) {
      const k = comp.cell.key;
      const C = pos(comp.cell.r, comp.cell.c);
      box.expandByPoint(C);
      const r = comps.get(comp.name);
      const vl = vreg.get(comp.name);
      const closed = !!(vl && !vl.open);
      const dim = dimOf(k);
      const aq = r ? Math.abs(Number(r.q)) : 0;
      const ends = comp.ends.map(e => { const nm = String(e.node.text).split(/\s+/)[0]; const n = nodes.get(nm.toUpperCase()); return { P: pos(e.node.r, e.node.c), name: nm, p: n ? Number(n.ptot) : NaN }; });
      const dIdx = (S.KIND[comp.kk] || { fields: [] }).fields.findIndex(f => f[0] === 'd');
      const dmm = dIdx >= 0 ? Number(S.fieldValues(comp.kk, comp.tok)[dIdx]) : 12;
      const rad = 0.15 + 0.15 * Math.min(1, (Number.isFinite(dmm) && dmm < 200 ? dmm : 12) / 30);
      const pc = ends.length === 2 ? 0.5 * ((Number.isFinite(ends[0].p) ? ends[0].p : 0) + (Number.isFinite(ends[1].p) ? ends[1].p : 0)) : NaN;
      let valT = null;
      if (contour && r) {
        if (mode === 'u') { const u = Math.abs(Number(r.u)); if (u < 1e3) valT = Math.sqrt(Math.min(1, u / sc.umax)); }
        else if (mode === 'q') valT = Math.sqrt(aq / sc.qmax);
        if (valT != null) { const v = mode === 'u' ? Math.abs(Number(r.u)) : aq; if (!cmax || v > cmax.v) cmax = { v, P: C, key: k }; if (!cmin || v < cmin.v) cmin = { v, P: C, key: k }; }
      }
      for (const e of ends) {
        let cf;
        if (contour && r) {
          if (mode === 'p') { const ta = pT(e.p), tb = pT(pc); cf = t => band(ta + (tb - ta) * t); }
          else { const c = valT != null ? band(valT) : geomC; cf = () => c; }
        } else { const c = comp.error ? errC : geomC; cf = () => c; }
        const t = tube([e.P, C], rad, cf, dim ? pipeDim : pipeMat);
        t.userData.key = k;
        t.castShadow = !dim;
        st.root.add(t);
        st.pick.push(t);
      }
      if (ends.length === 2) {
        const e0 = ends[0].P.clone().sub(C).setY(0).normalize(), e1 = ends[1].P.clone().sub(C).setY(0).normalize();
        if (e0.dot(e1) > -0.5) {
          let jc;
          if (contour && r) jc = mode === 'p' ? band(pT(pc)) : valT != null ? band(valT) : geomC;
          else jc = comp.error ? errC : geomC;
          const jm = new THREE.MeshStandardMaterial({ color: jc, metalness: 0.08, roughness: 0.42, transparent: dim, opacity: dim ? 0.12 : 1 });
          jm.__own = true;
          const joint = new THREE.Mesh(new THREE.SphereGeometry(rad, 32, 20), jm);
          joint.position.copy(C);
          joint.castShadow = !dim;
          joint.userData.key = k;
          st.root.add(joint);
          st.pick.push(joint);
        }
      }
      const sp = r && sc ? 0.6 + 6 * Math.sqrt(aq / sc.qmax) : 0;
      const g = model(comp.kk || '?', closed, r, sp, !!vl);
      g.position.copy(C);
      g.scale.setScalar(1.15);
      if (ends.length) {
        const d0 = ends[0].P.clone().sub(C).setY(0).normalize();
        const d1 = ends.length === 2 ? ends[1].P.clone().sub(C).setY(0).normalize() : null;
        const straight = d1 && d0.dot(d1) < -0.5;
        const dir = straight ? d1.clone().sub(d0).normalize() : d0.clone().negate();
        g.rotation.y = -Math.atan2(dir.z, dir.x);
        if (d1 && !straight) foldCorner(g, d1);
      }
      addEdges(g);
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      g.userData.key = k;
      if (dim) g.visible = false;
      st.root.add(g);
      st.pick.push(g);
      if (r && ends.length === 2 && aq > 1e-6 && !closed && !dim) {
        const n1 = String(r.n1 || '').trim().toUpperCase();
        let a = ends[0], b = ends[1];
        if (b.name.toUpperCase() === n1 && a.name.toUpperCase() !== n1) { const t = a; a = b; b = t; }
        if (Number(r.q) < 0) { const t = a; a = b; b = t; }
        const l0 = a.P.distanceTo(C), l1 = C.distanceTo(b.P);
        const u = Math.abs(Number(r.u));
        const speed = 0.4 + 2.2 * Math.sqrt(Math.min(1, u / (sc ? sc.umax : 1)));
        const n = Math.max(1, Math.round((l0 + l1) / 2.2));
        for (let i = 0; i < n; i++) arrows.push({ a: a.P, c: C, b: b.P, l0, l1, s: ((i + 0.5) / n) * (l0 + l1), speed, r: rad });
      }
      if (!dim && !w.labelsOff) addLabel(C.clone().add(new THREE.Vector3(0, 1.0, 0)), r ? `${comp.name}: ${fmt(aq, 3)} m³/h` : comp.name, 'c', k, 0);
    }
    for (const nd of M0.nodes) {
      const k = nd.cell.key;
      const P = pos(nd.cell.r, nd.cell.c);
      box.expandByPoint(P);
      const ground = nd.name[0].toUpperCase() === 'S';
      const n = nodes.get(nd.name.toUpperCase());
      const p = n ? Number(n.ptot) : NaN;
      const c = contour && Number.isFinite(p) ? (mode === 'p' ? band(pT(p)) : null) : null;
      if (contour && mode === 'p' && Number.isFinite(p) && !ground) { if (!pmaxN || p > pmaxN.v) pmaxN = { v: p, P, key: k }; if (!pminN || p < pminN.v) pminN = { v: p, P, key: k }; }
      const g = nodeModel(c, ground, nd.nr);
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      g.position.add(P);
      g.userData.key = k;
      if (dimOf(k)) g.visible = false;
      st.root.add(g);
      st.pick.push(g);
      if (!dimOf(k) && !w.labelsOff) addLabel(P.clone().add(new THREE.Vector3(0, ground ? 1.1 : 0.62, 0)), Number.isFinite(p) && contour ? `${nd.name}: ${fmt(p, 2)} bar` : nd.name, 'n', k, 1);
    }
    if (contour && !w.probesOff) {
      const mx = mode === 'p' ? pmaxN : cmax, mn = mode === 'p' ? pminN : cmin;
      const unit = mode === 'p' ? 'bar' : mode === 'u' ? 'm/s' : 'm³/h';
      if (mx) addLabel(mx.P.clone().add(new THREE.Vector3(0, 0.45, 0)), `Max ${fmt(mx.v, 2)} ${unit}`, 'pmax', mx.key, 2);
      if (mn) addLabel(mn.P.clone().add(new THREE.Vector3(0, 0.45, 0)), `Min ${fmt(mn.v, 2)} ${unit}`, 'pmin', mn.key, 2);
    }
    if (arrows.length) {
      const im = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 2.6, 14), st.mats.arrow, arrows.length);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      st.arrows = im;
      st.adata = arrows;
      st.scene.add(im);
      placeArrows(0);
    }
    if (box.isEmpty()) box.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(20, 1, 14));
    st.center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    st.bbox = { x: Math.max(size.x, 8) + 3, z: Math.max(size.z, 6) + 3 };
    st.size = Math.max(size.x, size.z, 10);
    if (st.grid) { st.scene.remove(st.grid); st.grid.geometry.dispose(); }
    const gs = Math.ceil((st.size + 20) / U) * U;
    st.grid = new THREE.GridHelper(gs, gs / U, 0x8a929c, 0xc2c8cf);
    st.grid.position.set(Math.round(st.center.x / U) * U, 0.01, Math.round(st.center.z / U) * U);
    st.grid.visible = st.S.state.tool !== 'select';
    st.scene.add(st.grid);
    const span = st.size * 1.6 + 30;
    st.floor.scale.set(span, span, 1);
    st.floor.position.set(st.center.x, 0, st.center.z);
    st.key.position.set(st.center.x + st.size * 0.35, st.size * 0.9 + 25, st.center.z + st.size * 0.45);
    st.key.target.position.copy(st.center);
    const sc2 = st.key.shadow.camera;
    sc2.left = sc2.bottom = -st.size * 0.72 - 4; sc2.right = sc2.top = st.size * 0.72 + 4; sc2.near = 1; sc2.far = st.size * 3 + 80; sc2.updateProjectionMatrix();
    markSel();
  }

  const tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), dirV = new THREE.Vector3();
  function placeArrows(dt) {
    const im = st.arrows;
    if (!im) return;
    for (let i = 0; i < st.adata.length; i++) {
      const p = st.adata[i];
      if (dt) p.s = (p.s + p.speed * dt) % (p.l0 + p.l1);
      if (p.s <= p.l0) { tmpV.lerpVectors(p.a, p.c, p.s / (p.l0 || 1)); dirV.subVectors(p.c, p.a); }
      else { tmpV.lerpVectors(p.c, p.b, (p.s - p.l0) / (p.l1 || 1)); dirV.subVectors(p.b, p.c); }
      dirV.normalize();
      tmpQ.setFromUnitVectors(up, dirV);
      const k = Math.min(p.s, p.l0 + p.l1 - p.s);
      const sc = (p.r + 0.04) * Math.min(1, k / 0.6) * 0.55;
      tmpS.set(sc, sc * 0.55, sc);
      tmpV.y += p.r + 0.12;
      tmpM.compose(tmpV, tmpQ, tmpS);
      im.setMatrixAt(i, tmpM);
    }
    im.instanceMatrix.needsUpdate = true;
  }

  function addLabel(P, text, cls, key, prio) {
    const el = document.createElement('div');
    el.className = 's3-l ' + cls;
    el.textContent = text;
    st.lblBox.appendChild(el);
    st.labels.push({ P, el, key, prio });
  }

  function objOf(k) { return st.root.children.find(o => o.userData.key === k && !o.isMesh) || st.root.children.find(o => o.userData.key === k); }
  function markSel() {
    const k = st.S.state.sel;
    if (st.selBox) { st.scene.remove(st.selBox); st.selBox = null; }
    st.labels.forEach(l => l.el.classList.toggle('sel', l.key === k));
    if (!k) return;
    const o = objOf(k);
    if (!o) return;
    const bx = new THREE.Box3().setFromObject(o).expandByScalar(0.12);
    st.selBox = new THREE.Box3Helper(bx, 0x00b000);
    st.selBox.material.depthTest = false;
    st.selBox.renderOrder = 10;
    st.scene.add(st.selBox);
  }

  function view(name, instant) {
    if (!st.center) build();
    const c = st.center || new THREE.Vector3();
    const b = st.bbox || { x: 30, z: 20 };
    const fov = st.camera.fov * Math.PI / 180, asp = st.camera.aspect || 1.6;
    const dirs = { iso: new THREE.Vector3(0.55, 0.62, 0.86), top: new THREE.Vector3(0, 1, 0.0001), front: new THREE.Vector3(0, 0.08, 1) };
    const dir = (dirs[name] || dirs.iso).clone().normalize();
    const ext = name === 'front' ? Math.max(b.x / asp, 6) : Math.max(b.z, b.x / asp);
    const d = ext * 0.5 / Math.tan(fov / 2) + 1;
    tweenTo(c.clone(), c.clone().add(dir.multiplyScalar(d)), instant ? 1 : 600);
  }
  function fit() { view(st.lastView || 'iso'); }
  function focusOn(k) {
    const [r, c] = k.split(',').map(Number);
    const P = pos(r, c);
    const off = st.camera.position.clone().sub(st.controls.target);
    off.setLength(Math.min(off.length(), 14));
    tweenTo(P.clone(), P.clone().add(off), 550);
  }
  function tweenTo(target, camPos, ms) {
    const t0 = performance.now(), a0 = st.controls.target.clone(), p0 = st.camera.position.clone();
    st.anim = t => {
      const u = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      st.controls.target.lerpVectors(a0, target, e);
      st.camera.position.lerpVectors(p0, camPos, e);
      if (u >= 1) st.anim = null;
    };
  }
  function zoomBy(f) { const off = st.camera.position.clone().sub(st.controls.target).multiplyScalar(1 / f); tweenTo(st.controls.target.clone(), st.controls.target.clone().add(off), 250); }

  function ndc(e) { const rc = st.renderer.domElement.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1); }
  function pickKey(e) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc(e), st.camera);
    for (const h of rc.intersectObjects(st.pick, true)) { let o = h.object; while (o && !(o.userData && o.userData.key)) o = o.parent; if (o && o.visible !== false) return o.userData.key; }
    return null;
  }
  function cellOf(e) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc(e), st.camera);
    const p = new THREE.Vector3();
    if (!rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y), p)) return null;
    return [Math.floor(p.z / U) + 1, Math.floor(p.x / U) + 1];
  }
  function ghostCells(cells, color) {
    st.ghost.children.slice().forEach(x => { st.ghost.remove(x); x.geometry.dispose(); });
    for (const [r, c] of cells) { const m = new THREE.Mesh(new THREE.PlaneGeometry(U * 0.92, U * 0.92), st.mats.ghost); m.rotation.x = -Math.PI / 2; m.position.copy(pos(r, c)).setY(0.03); st.ghost.add(m); }
    if (color) st.mats.ghost.color.set(color);
  }
  function syncControls() {
    const t = st.S.state.tool;
    const pan = st.nav !== 'rotate';
    st.controls.enableRotate = true;
    st.controls.mouseButtons.LEFT = t === 'select' ? (pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE) : null;
    st.controls.mouseButtons.RIGHT = pan ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
    st.controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
    if (st.help) st.help.textContent = pan ? 'Pan: left drag · Rotate: right drag · Zoom: wheel' : 'Rotate: left drag · Pan: right drag · Zoom: wheel';
    document.querySelectorAll('[data-act="nav-pan"],[data-act="nav-rot"]').forEach(b => b.classList.toggle('on', (b.dataset.act === 'nav-pan') === pan));
    if (st.grid) st.grid.visible = t !== 'select';
    if (t === 'select') ghostCells([]);
  }

  function events() {
    const cv = st.renderer.domElement;
    cv.addEventListener('pointerdown', e => {
      st.down = { x: e.clientX, y: e.clientY, b: e.button };
      if (e.button === 0 && st.S.state.tool === 'wire') { const c = cellOf(e); if (c) { st.paint = { r: c[0], c: c[1], cells: [c], axis: null }; cv.setPointerCapture(e.pointerId); ghostCells([c], 0x00a000); } }
    });
    cv.addEventListener('pointermove', e => {
      const t = st.S.state.tool;
      if (st.paint) {
        const c = cellOf(e); if (!c) return;
        const w = st.paint;
        if (!w.axis && (c[0] !== w.r || c[1] !== w.c)) w.axis = Math.abs(c[0] - w.r) >= Math.abs(c[1] - w.c) ? 'v' : 'h';
        w.cells = [];
        if (w.axis === 'v') for (let i = Math.min(c[0], w.r); i <= Math.max(c[0], w.r); i++) w.cells.push([i, w.c]);
        else if (w.axis === 'h') for (let j = Math.min(c[1], w.c); j <= Math.max(c[1], w.c); j++) w.cells.push([w.r, j]);
        else w.cells = [[w.r, w.c]];
        ghostCells(w.cells, 0x00a000);
        return;
      }
      if (t !== 'select') { const c = cellOf(e); if (c) ghostCells([c], t === 'erase' ? 0xc62828 : 0x00a000); }
      if (st.down && e.buttons) { st.tip.style.display = 'none'; return; }
      hover(e);
    });
    cv.addEventListener('pointerleave', () => { st.tip.style.display = 'none'; if (st.S.state.tool !== 'select') ghostCells([]); });
    cv.addEventListener('pointerup', e => {
      const S = st.S, t = S.state.tool;
      if (st.paint) {
        const wch = st.paint.axis === 'h' ? '-' : 'I';
        const ops = st.paint.cells.filter(([r, c]) => !(typeof D !== 'undefined' && D[r + ',' + c])).map(([r, c]) => [r + ',' + c, wch]);
        st.paint = null; ghostCells([]);
        if (ops.length) S.commit(ops, 'Drew a connection line (' + ops.length + ' cells)');
        return;
      }
      if (!st.down || Math.hypot(e.clientX - st.down.x, e.clientY - st.down.y) > 5 || st.down.b !== 0) { st.down = null; return; }
      st.down = null;
      const key = pickKey(e), cell = cellOf(e);
      if (t === 'select') { st.focusNext = false; S.select(key); st.focusNext = true; return; }
      if (!cell) return;
      const ck = cell[0] + ',' + cell[1];
      if (t === 'place' && S.state.place) { st.focusNext = false; S.placeComponent(S.state.place, cell[0], cell[1]); st.focusNext = true; }
      else if (t === 'node') { st.focusNext = false; S.placeNode(cell[0], cell[1]); st.focusNext = true; }
      else if (t === 'erase') { const kk = key || ck; if (typeof D !== 'undefined' && D[kk] != null) S.commit([[kk, null]], 'Erased ' + String(D[kk]).split(/\s+/)[0]); }
    });
    cv.addEventListener('dragover', e => e.preventDefault());
    cv.addEventListener('drop', e => { e.preventDefault(); const kk = e.dataTransfer.getData('text/bs-kind'); const c = cellOf(e); if (kk && c) st.S.placeComponent(kk, c[0], c[1]); });
    cv.addEventListener('keydown', e => {
      const S = st.S;
      if ((e.key === 'Delete' || e.key === 'Backspace') && S.state.sel) { S.commit([[S.state.sel, null]], 'Deleted ' + String(D[S.state.sel] || '').split(/\s+/)[0]); S.select(null); e.preventDefault(); }
    });
  }

  let hoverT = 0;
  function hover(e) {
    const now = performance.now();
    if (now - hoverT < 40) return;
    hoverT = now;
    const k = pickKey(e), S = st.S;
    if (!k || typeof D === 'undefined' || !D[k]) { st.tip.style.display = 'none'; st.renderer.domElement.style.cursor = S.state.tool === 'select' ? 'default' : 'crosshair'; return; }
    st.renderer.domElement.style.cursor = S.state.tool === 'select' ? 'pointer' : 'crosshair';
    const t = D[k];
    let h = '';
    if (S.isComponentText(t)) {
      const tok = S.parseTok(t), kk = S.kindKey(tok.name), rr = !S.state.stale && S.resultFor(tok.name);
      h = `<b>${tok.name}</b> <small>${S.KIND[kk] ? S.KIND[kk].title : ''}</small>`;
      if (rr) h += `<div class="g"><span>Volume flow</span><b>${fmt(Math.abs(Number(rr.q)))} m³/h</b><span>Velocity</span><b>${fmt(Math.abs(Number(rr.u)))} m/s</b><span>Pressure drop</span><b>${fmt(Number(rr.dp), 3)} bar</b><span>Reynolds</span><b>${fmt(Number(rr.reD), 0)} (${S.regime(Number(rr.reD))})</b><span>Power</span><b>${fmt(Number(rr.pow))} kW</b><span>Direction</span><b>${Number(rr.q) >= 0 ? rr.n1 + ' → ' + rr.n2 : rr.n2 + ' → ' + rr.n1}</b></div>`;
      else if (S.KIND[kk]) { const v = S.fieldValues(kk, tok); h += '<div class="g">' + S.KIND[kk].fields.map((f, i) => `<span>${f[1]}</span><b>${fmt(v[i], 3)} ${f[2] === '–' ? '' : f[2]}</b>`).join('') + '</div>'; }
    } else if (S.isNodeText(t)) {
      const p = t.split(/\s+/);
      const rr = !S.state.stale && S.state.results && (S.state.results.nodes || []).find(n => String(n.id).trim().toUpperCase() === p[0].toUpperCase());
      h = `<b>${p[0]}</b> <small>${p[0][0].toUpperCase() === 'S' ? 'reservoir' : /^nr/i.test(p[0]) ? 'pressure set-point' : 'node'}</small>` + (rr ? `<div class="g"><span>Total pressure</span><b>${fmt(Number(rr.ptot), 3)} bar</b><span>Static</span><b>${fmt(Number(rr.pstat), 3)} bar</b><span>Elevation</span><b>${fmt(Number(rr.z), 2)} m</b></div>` : '');
    } else h = `<b>Connection</b> <small>${t}</small>`;
    const rc = st.wrap.getBoundingClientRect();
    st.tip.innerHTML = h;
    st.tip.style.display = 'block';
    st.tip.style.left = Math.min(rc.width - 310, e.clientX - rc.left + 16) + 'px';
    st.tip.style.top = Math.min(rc.height - 150, e.clientY - rc.top + 14) + 'px';
  }

  function loop() {
    if (!st.on) { st.raf = 0; return; }
    st.raf = requestAnimationFrame(loop);
    if (!st.wrap.offsetParent) return;
    const dt = Math.min(0.05, st.clock.getDelta());
    if (st.anim) st.anim(performance.now());
    st.controls.update();
    st.camLight.position.copy(st.camera.position).sub(st.controls.target).normalize();
    const animOn = st.S.state.anim !== false;
    if (animOn) { st.spin.forEach(s => { s.o.rotation.y -= s.w * dt * 0.5; }); placeArrows(dt); }
    if (st.arrows) st.arrows.visible = animOn || true;
    const r = st.renderer, w = st.wrap.clientWidth, h = st.wrap.clientHeight;
    r.setViewport(0, 0, w, h); r.setScissorTest(false); r.clear();
    r.render(st.scene, st.camera);
    const tz = 92;
    r.setViewport(8, 8, tz, tz); r.setScissor(8, 8, tz, tz); r.setScissorTest(true); r.clearDepth();
    st.triad.cam.position.copy(st.camera.position).sub(st.controls.target).setLength(5);
    st.triad.cam.lookAt(0, 0, 0);
    r.render(st.triad.scene, st.triad.cam);
    r.setScissorTest(false);
    labels();
  }

  const proj = new THREE.Vector3();
  function labels() {
    const w = st.wrap.clientWidth, h = st.wrap.clientHeight;
    const dist = st.camera.position.distanceTo(st.controls.target);
    const showC = dist < 30, showN = dist < 48, sel = st.S.state.sel;
    for (const l of st.labels) {
      proj.copy(l.P).project(st.camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05 && (l.prio === 2 || l.key === sel || (l.prio === 1 ? showN : showC));
      if (!vis) { if (l.el.style.display !== 'none') l.el.style.display = 'none'; continue; }
      if (l.el.style.display === 'none') l.el.style.display = '';
      const x = (proj.x + 1) / 2 * w, y = (1 - proj.y) / 2 * h;
      l.el.style.transform = l.prio === 2 ? `translate(${(x + 6).toFixed(1)}px,${(y - 22).toFixed(1)}px)` : `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
    }
  }

  window.BohemeScene3D = { init, setActive, setNav, gridMode, fit, view: n => { st.lastView = n; view(n); }, zoomBy, active: () => st.on, state: st, rebuild: () => { st.sig = ''; build(); } };
})();
