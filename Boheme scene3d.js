(function () {
  'use strict';
  const U = 2;
  const Y = 0.62;
  const CSS = `
.s3{position:absolute;inset:0;z-index:1;overflow:hidden;background:#05070f}
.s3 canvas{display:block;width:100%!important;height:100%!important;outline:none}
.s3-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.s3-l{position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;font:600 11px Inter,"Segoe UI",system-ui,sans-serif;color:#eaf1ff;padding:2px 8px;border-radius:10px;background:rgba(8,12,30,.72);border:1px solid rgba(130,170,255,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.35);transition:opacity .2s;letter-spacing:.2px}
.s3-l.n{border-color:var(--c,rgba(130,170,255,.5));box-shadow:0 0 12px var(--c,transparent)}
.s3-l.c{color:#cfe0ff;font-weight:500;background:rgba(8,12,30,.58)}
.s3-l.c b{color:#fff;font-weight:700}
.s3-l.sel{border-color:#ffd43b;color:#fff;box-shadow:0 0 16px rgba(255,212,59,.6);z-index:2}
.s3-tip{position:absolute;pointer-events:none;opacity:0;transition:opacity .12s;min-width:210px;max-width:290px;padding:10px 12px;border-radius:12px;background:rgba(8,12,32,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(126,249,255,.4);color:#e8eeff;font:12px Inter,"Segoe UI",system-ui,sans-serif;box-shadow:0 14px 44px rgba(0,0,0,.5),0 0 26px rgba(126,249,255,.18);z-index:6}
.s3-tip small{color:#8e9cd0}
.s3-tip .g{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin-top:6px}
.s3-tip .g span{color:#8e9cd0}
.s3-tip .g b{text-align:right;color:#fff}
.s3-help{position:absolute;left:66px;bottom:12px;z-index:4;font:11px Inter,"Segoe UI",sans-serif;color:#7f8bc0;background:rgba(8,12,30,.6);border:1px solid rgba(130,160,255,.18);padding:4px 10px;border-radius:9px;pointer-events:none}
.s3-badge{position:absolute;right:12px;bottom:10px;z-index:4;font:700 11px Inter,sans-serif;letter-spacing:1px;color:#7ef9ff;background:rgba(8,12,30,.7);border:1px solid rgba(126,249,255,.35);padding:3px 10px;border-radius:8px;pointer-events:none}
.wb-vmodes .s3-dim{display:inline-flex;margin-left:4px;padding-left:6px;border-left:1px solid rgba(130,160,255,.25);gap:2px}
`;
  const st = {
    S: null, ok: false, on: false, host: null, wrap: null, renderer: null, scene: null, camera: null, controls: null, composer: null, bloom: null,
    root: null, pick: [], spin: [], pulse: [], labels: [], lblBox: null, tip: null, ghost: null, particles: null, pdata: [], sig: '', raf: 0, clock: null,
    mats: {}, geo: {}, hover: null, paint: null, down: null, anim: null, size: 20, built: false, selRing: null, center: null
  };
  const $ = (q, r) => (r || document).querySelector(q);

  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function col(css) { return new THREE.Color(css); }
  function pcolT(t) { return col(st.S.pcol(Math.max(0, Math.min(1, t)))); }
  function pos(r, c) { return new THREE.Vector3((c - 0.5) * U, Y, (r - 0.5) * U); }

  function mats() {
    const M = st.mats;
    M.metal = new THREE.MeshStandardMaterial({ color: 0x9fb0d8, metalness: 0.9, roughness: 0.22 });
    M.dark = new THREE.MeshStandardMaterial({ color: 0x29324f, metalness: 0.85, roughness: 0.32 });
    M.chrome = new THREE.MeshStandardMaterial({ color: 0xe6eeff, metalness: 1.0, roughness: 0.08 });
    M.glass = new THREE.MeshStandardMaterial({ color: 0x1c2b55, metalness: 0.0, roughness: 0.08, transparent: true, opacity: 0.13, depthWrite: false, envMapIntensity: 0.45 });
    M.glassNode = new THREE.MeshStandardMaterial({ color: 0x24366a, metalness: 0.0, roughness: 0.06, transparent: true, opacity: 0.26, depthWrite: false, envMapIntensity: 0.6 });
    M.err = new THREE.MeshBasicMaterial({ color: 0xff3b5c, toneMapped: false });
    M.accent = {};
    for (const [k, c] of Object.entries({ pipe: '#7aa2ff', res: '#c792ff', valve: '#ffc94d', pump: '#38e1c8', actuator: '#ff7eb6', closed: '#ff3b5c' })) {
      M.accent[k] = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.25, metalness: 0.3, roughness: 0.25, toneMapped: false });
    }
    M.particle = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    M.ghost = new THREE.MeshBasicMaterial({ color: 0x38e1c8, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false });
    M.sel = new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.85, toneMapped: false, side: THREE.DoubleSide, depthWrite: false });
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.25, 'rgba(255,255,255,.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    M.haloTex = new THREE.CanvasTexture(cv);
  }

  function environment() {
    const pm = new THREE.PMREMGenerator(st.renderer);
    const env = new THREE.Scene();
    const sg = new THREE.SphereGeometry(50, 32, 16);
    const cols = [];
    const p = sg.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 50; const c = new THREE.Color().lerpColors(new THREE.Color(0x05070f), new THREE.Color(0x3b4c8f), Math.max(0, y) * 0.9 + 0.1); cols.push(c.r, c.g, c.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    env.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const panel = (x, y, z, w, h, c, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
    panel(0, 40, 0, 40, 40, 0x8c9cc8);
    panel(-38, 12, 10, 18, 30, 0x2f8fbf);
    panel(36, 10, -14, 18, 26, 0x6a52c8);
    panel(10, 18, 40, 30, 10, 0x9aa8d0);
    st.scene.environment = pm.fromScene(env, 0.04).texture;
    pm.dispose();
  }

  function groundMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uCell: { value: U }, uCenter: { value: new THREE.Vector2() }, uRad: { value: 60 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float uCell; uniform vec2 uCenter; uniform float uRad; varying vec3 vW;
        float gridLine(vec2 p, float s, float w){ vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s); return 1.0 - min(min(g.x, g.y) / w, 1.0); }
        void main(){
          float d = length(vW.xz - uCenter) / uRad;
          float fade = smoothstep(0.85, 0.05, d);
          float minor = gridLine(vW.xz, uCell, 0.7);
          float major = gridLine(vW.xz, uCell * 5.0, 0.9);
          vec3 base = mix(vec3(0.03,0.045,0.11), vec3(0.012,0.016,0.04), clamp(d * 1.2,0.0,1.0));
          vec3 c = base + vec3(0.2,0.32,0.75) * minor * 0.07 * fade + vec3(0.3,0.6,1.0) * major * 0.14 * fade;
          gl_FragColor = vec4(c, 0.98);
        }`
    });
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
    host.insertBefore(wrap, host.firstChild.nextSibling);
    st.wrap = wrap;
    st.host = host;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); } catch (e) { wrap.remove(); return false; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 0;
    st.renderer = renderer;
    st.scene = new THREE.Scene();
    st.scene.background = new THREE.Color(0x05070f);
    st.scene.fog = new THREE.FogExp2(0x05070f, 0.006);
    st.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);
    st.camera.position.set(40, 45, 70);
    st.controls = new THREE.OrbitControls(st.camera, renderer.domElement);
    st.controls.enableDamping = true;
    st.controls.dampingFactor = 0.08;
    st.controls.screenSpacePanning = true;
    st.controls.maxPolarAngle = Math.PI * 0.47;
    st.controls.minDistance = 4;
    st.controls.maxDistance = 600;
    st.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    mats();
    environment();
    st.scene.add(new THREE.HemisphereLight(0x9cb8ff, 0x0a0d1c, 0.45));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    st.sun = sun;
    st.scene.add(sun, sun.target);
    const rimA = new THREE.PointLight(0x38c6f4, 1.2, 0, 2);
    const rimB = new THREE.PointLight(0x8a6bff, 1.2, 0, 2);
    st.rims = [rimA, rimB];
    st.scene.add(rimA, rimB);
    st.ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), groundMaterial());
    st.ground.rotation.x = -Math.PI / 2;
    st.ground.position.y = 0;
    st.ground.renderOrder = -1;
    st.scene.add(st.ground);
    st.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.45 }));
    st.shadow.rotation.x = -Math.PI / 2;
    st.shadow.position.y = 0.01;
    st.shadow.receiveShadow = true;
    st.scene.add(st.shadow);
    st.root = new THREE.Group();
    st.scene.add(st.root);
    st.ghost = new THREE.Group();
    st.scene.add(st.ghost);
    if (THREE.EffectComposer && THREE.UnrealBloomPass) {
      st.composer = new THREE.EffectComposer(renderer);
      st.composer.addPass(new THREE.RenderPass(st.scene, st.camera));
      st.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), 0.62, 0.42, 0.86);
      st.composer.addPass(st.bloom);
    }
    st.lblBox = document.createElement('div');
    st.lblBox.className = 's3-labels';
    wrap.appendChild(st.lblBox);
    st.tip = document.createElement('div');
    st.tip.className = 's3-tip';
    wrap.appendChild(st.tip);
    const help = document.createElement('div');
    help.className = 's3-help';
    help.textContent = 'Left drag: orbit · right drag: pan · wheel: zoom · click: select';
    wrap.appendChild(help);
    const badge = document.createElement('div');
    badge.className = 's3-badge';
    badge.textContent = '3D';
    wrap.appendChild(badge);
    st.clock = new THREE.Clock();
    events();
    S.on('redraw', () => schedule());
    S.on('results', () => schedule());
    S.on('mode', () => schedule());
    S.on('select', k => { markSel(); if (k && st.on && st.focusNext !== false) focusOn(k); });
    S.on('tool', () => { syncControls(); });
    new ResizeObserver(resize).observe(wrap);
    addToggle();
    st.ok = true;
    let pref = '3d';
    try { pref = localStorage.getItem('boheme_view_dim') || '3d'; } catch (e) { }
    setActive(pref !== '2d');
    return true;
  }

  function addToggle() {
    const bar = $('#wbModes');
    if (!bar) return;
    const box = document.createElement('span');
    box.className = 's3-dim';
    box.innerHTML = '<button data-dim="3d" title="Three-dimensional view">3D</button><button data-dim="2d" title="Flat schematic view">2D</button>';
    bar.appendChild(box);
    box.querySelectorAll('[data-dim]').forEach(b => b.addEventListener('click', () => setActive(b.dataset.dim === '3d')));
  }
  function markToggle() { document.querySelectorAll('[data-dim]').forEach(b => b.classList.toggle('on', (b.dataset.dim === '3d') === st.on)); }

  function setActive(on) {
    st.on = on && st.ok;
    st.wrap.style.display = st.on ? '' : 'none';
    const sw = $('#studioWrap');
    if (sw) sw.style.visibility = st.on ? 'hidden' : '';
    try { localStorage.setItem('boheme_view_dim', st.on ? '3d' : '2d'); } catch (e) { }
    markToggle();
    const z = $('#wbZoom');
    if (z) z.style.display = st.on ? 'none' : '';
    if (st.on) { resize(); st.sig = ''; build(); if (!st.fitted) { fit(); st.fitted = true; } loop(); }
    else { cancelAnimationFrame(st.raf); st.raf = 0; st.S.redraw(); }
  }

  function resize() {
    if (!st.renderer) return;
    const w = st.wrap.clientWidth || 800, h = st.wrap.clientHeight || 600;
    st.renderer.setSize(w, h, false);
    st.camera.aspect = w / h;
    st.camera.updateProjectionMatrix();
    if (st.composer) { st.composer.setSize(w, h); st.bloom.resolution.set(w, h); }
  }

  let schedT = 0;
  function schedule() { if (!st.on) return; clearTimeout(schedT); schedT = setTimeout(build, 30); }

  function disposeTree(o) {
    o.traverse(x => { if (x.geometry && !x.geometry.__shared) x.geometry.dispose(); if (x.material && x.material.__own) x.material.dispose(); });
  }

  function signature() {
    const S = st.S, s = S.state;
    return JSON.stringify([typeof D !== 'undefined' ? D : {}, s.results ? s.results.iterations + ':' + s.results.residual : 0, s.stale, s.colorMode, [...(s.dim || [])], s.hl ? [...s.hl] : 0, typeof ValveRegistry !== 'undefined' ? [...ValveRegistry.valves.values()].map(v => v.open) : 0]);
  }

  function tube(points, radius, colors, mat, seg) {
    const path = new THREE.CurvePath();
    for (let i = 1; i < points.length; i++) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
    const len = path.getLength();
    const ts = seg || Math.max(6, Math.round(len * 3));
    const geo = new THREE.TubeGeometry(path, ts, radius, 14, false);
    if (colors) {
      const n = geo.attributes.position.count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i <= ts; i++) { const c = colors(i / ts); for (let j = 0; j <= 14; j++) { const k = (i * 15 + j) * 3; arr[k] = c.r; arr[k + 1] = c.g; arr[k + 2] = c.b; } }
      geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    }
    const m = new THREE.Mesh(geo, mat);
    return m;
  }

  function cyl(r1, r2, h, mat, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 28), mat); }
  function axisX(m) { m.rotation.z = Math.PI / 2; return m; }

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
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    return g;
  }

  function nodeModel(name, color, ground, nr) {
    const M = st.mats;
    const g = new THREE.Group();
    const c = color || new THREE.Color(0x8fb3ff);
    if (ground) {
      const shell = cyl(0.62, 0.62, 1.1, M.glassNode, 40); shell.position.y = 0.0; g.add(shell);
      const liq = cyl(0.56, 0.56, 0.62, new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.85 }), 40); liq.position.y = -0.22; liq.material.__own = true; g.add(liq);
      for (const y of [-0.56, 0.56]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 10, 44), M.metal); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
      g.position.y = -0.05;
    } else {
      const core = new THREE.Mesh(nr ? new THREE.OctahedronGeometry(0.26) : new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
      core.material.__own = true;
      g.add(core);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 18), M.glassNode));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.8 }));
      ring.material.__own = true;
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      if (color) st.pulse.push(ring);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.haloTex, color: c, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      halo.material.__own = true;
      halo.scale.set(1.7, 1.7, 1);
      g.add(halo);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  function build() {
    if (!st.on || !st.renderer) return;
    const S = st.S, s = S.state;
    const M0 = s.model || S.analyse();
    const sig = signature();
    if (sig === st.sig) { markSel(); return; }
    st.sig = sig;
    disposeTree(st.root);
    st.root.clear();
    st.pick = [];
    st.spin = [];
    st.pulse = [];
    st.labels.forEach(l => l.el.remove());
    st.labels = [];
    st.pdata = [];
    if (st.particles) { st.scene.remove(st.particles); st.particles.geometry.dispose(); st.particles = null; }
    const sc = s.stale ? null : s.scales;
    const res = s.results && !s.stale ? s.results : null;
    const comps = res ? new Map((res.components || []).map(c => [String(c.name).trim(), c])) : new Map();
    const nodes = res ? new Map((res.nodes || []).map(n => [String(n.id).trim().toUpperCase(), n])) : new Map();
    const mode = s.colorMode;
    const pT = p => sc && Number.isFinite(p) ? (p - sc.pmin) / ((sc.pmax - sc.pmin) || 1) : 0;
    const dimOf = k => (s.dim && s.dim.has(k)) || (s.hl && !s.hl.has(k));
    const vreg = typeof ValveRegistry !== 'undefined' ? ValveRegistry.valves : new Map();
    const box = new THREE.Box3();
    const coreMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    coreMat.__own = true;
    const coreDim = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true, opacity: 0.12 });
    coreDim.__own = true;
    const pnum = [];
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
      const rad = r && sc ? 0.11 + 0.22 * Math.sqrt(aq / sc.qmax) : 0.1 + 0.14 * Math.min(1, (Number.isFinite(dmm) ? dmm : 12) / 35);
      const pc = ends.length === 2 ? 0.5 * ((Number.isFinite(ends[0].p) ? ends[0].p : 0) + (Number.isFinite(ends[1].p) ? ends[1].p : 0)) : NaN;
      for (const e of ends) {
        let cf;
        if (r && sc) {
          if (mode === 'u') { const c = pcolT(Math.sqrt(Math.min(1, Math.abs(Number(r.u)) / sc.umax))); cf = () => c; }
          else if (mode === 'q') { const c = pcolT(Math.sqrt(aq / sc.qmax)); cf = () => c; }
          else if (mode === 'none') { const c = new THREE.Color(0x5b74c9); cf = () => c; }
          else { const ca = pcolT(pT(e.p)), cb = pcolT(pT(pc)); cf = t => ca.clone().lerp(cb, t); }
        } else { const c = new THREE.Color(comp.error ? 0xff3b5c : 0x3c4f8f); cf = () => c; }
        const core = tube([e.P, C], rad, cf, dim ? coreDim : coreMat);
        st.root.add(core);
        const glass = tube([e.P, C], rad + 0.09, null, st.mats.glass);
        glass.castShadow = !dim;
        st.root.add(glass);
        core.userData.key = k;
        glass.userData.key = k;
        st.pick.push(glass);
      }
      const sp = r && sc ? 0.6 + 6 * Math.sqrt(aq / sc.qmax) : 0;
      const g = model(comp.kk || '?', closed, r, sp, !!vl);
      g.position.copy(C);
      g.scale.setScalar(1.25);
      let dir = null;
      if (ends.length) {
        const d0 = ends[0].P.clone().sub(C).setY(0).normalize();
        const d1 = ends.length === 2 ? ends[1].P.clone().sub(C).setY(0).normalize() : null;
        dir = d1 && d0.dot(d1) < -0.5 ? d1.clone().sub(d0).normalize() : d0.clone().negate();
        g.rotation.y = -Math.atan2(dir.z, dir.x);
      }
      g.userData.key = k;
      if (dim) g.traverse(o => { if (o.isMesh) { o.visible = false; } });
      st.root.add(g);
      st.pick.push(g);
      if (r && ends.length === 2 && aq > 1e-6 && !closed && !dim) {
        const n1 = String(r.n1 || '').trim().toUpperCase();
        let a = ends[0], b = ends[1];
        if (b.name.toUpperCase() === n1 && a.name.toUpperCase() !== n1) { const t = a; a = b; b = t; }
        if (Number(r.q) < 0) { const t = a; a = b; b = t; }
        const l0 = a.P.distanceTo(C), l1 = C.distanceTo(b.P);
        const u = Math.abs(Number(r.u));
        const speed = 0.8 + 6 * Math.sqrt(Math.min(1, u / sc.umax));
        const n = Math.max(2, Math.min(16, Math.round((l0 + l1) * (0.6 + 1.2 * Math.sqrt(aq / sc.qmax)))));
        const ta = mode === 'p' ? pT(a.p) : mode === 'u' ? Math.sqrt(Math.min(1, u / sc.umax)) : Math.sqrt(aq / sc.qmax);
        const tb = mode === 'p' ? pT(b.p) : ta;
        for (let i = 0; i < n; i++) pnum.push({ a: a.P, c: C, b: b.P, l0, l1, s: (i / n) * (l0 + l1), speed, ta, tb, rad: rad * 0.75 });
      }
      if (!dim) {
        const txt = r ? `<b>${comp.name}</b> ${fmt(aq, 2)} m³/h` : `<b>${comp.name}</b>`;
        addLabel(C.clone().add(new THREE.Vector3(0, 1.2, 0)), txt, 'c', k, 0);
      }
      if (comp.error && !dim) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 8, 48), st.mats.err);
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(C).setY(0.05);
        st.root.add(ring);
        st.pulse.push(ring);
      }
    }
    for (const nd of M0.nodes) {
      const k = nd.cell.key;
      const P = pos(nd.cell.r, nd.cell.c);
      box.expandByPoint(P);
      const ground = nd.name[0].toUpperCase() === 'S';
      const n = nodes.get(nd.name.toUpperCase());
      const p = n ? Number(n.ptot) : NaN;
      const c = sc && Number.isFinite(p) ? (mode === 'p' ? pcolT(pT(p)) : new THREE.Color(0xc9d6ff)) : null;
      const g = nodeModel(nd.name, c, ground, nd.nr);
      g.scale.setScalar(1.2);
      g.position.add(P);
      g.userData.key = k;
      if (dimOf(k)) g.visible = false;
      st.root.add(g);
      st.pick.push(g);
      let lift = 0;
      if (c && mode === 'p' && !ground && !dimOf(k)) {
        const h = 0.2 + 4.2 * pT(p);
        lift = h;
        const towerGeo = new THREE.CylinderGeometry(0.1, 0.1, h, 16, 1, true);
        const tcols = [];
        const tp = towerGeo.attributes.position;
        for (let i = 0; i < tp.count; i++) { const yy = (tp.getY(i) / h) + 0.5; const cc = pcolT(pT(p) * yy); tcols.push(cc.r, cc.g, cc.b); }
        towerGeo.setAttribute('color', new THREE.Float32BufferAttribute(tcols, 3));
        const tower = new THREE.Mesh(towerGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
        tower.material.__own = true;
        tower.position.copy(P).setY(Y + h / 2 + 0.3);
        st.root.add(tower);
        const cap = new THREE.Mesh(new THREE.CircleGeometry(0.22, 28), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, toneMapped: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        cap.material.__own = true;
        cap.rotation.x = -Math.PI / 2;
        cap.position.copy(P).setY(Y + h + 0.3);
        st.root.add(cap);
        st.pulse.push(cap);
      }
      if (!dimOf(k)) addLabel(P.clone().add(new THREE.Vector3(0, (ground ? 1.15 : 0.85) + lift, 0)), c ? `${nd.name} · ${fmt(p, 1)} bar` : nd.nr ? `${nd.name} · set ${fmt(nd.pset, 1)} bar` : nd.name, 'n', k, 1, c ? '#' + c.getHexString() : null);
    }
    if (pnum.length) {
      const geo = new THREE.SphereGeometry(1, 10, 8);
      const im = new THREE.InstancedMesh(geo, st.mats.particle, pnum.length);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < pnum.length; i++) im.setColorAt(i, pcolT(pnum[i].ta));
      st.particles = im;
      st.pdata = pnum;
      st.scene.add(im);
    }
    if (box.isEmpty()) box.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(20, 1, 14));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    st.center = center;
    st.bbox = { x: Math.max(size.x, 8) + 3, z: Math.max(size.z, 6) + 3 };
    st.size = Math.max(size.x, size.z, 10);
    const span = st.size * 2.2 + 40;
    st.ground.scale.set(span, span, 1);
    st.ground.position.set(center.x, 0, center.z);
    st.ground.material.uniforms.uCenter.value.set(center.x, center.z);
    st.ground.material.uniforms.uRad.value = span * 0.5;
    st.shadow.scale.set(span, span, 1);
    st.shadow.position.set(center.x, 0.01, center.z);
    st.sun.position.set(center.x + st.size * 0.35, st.size * 0.9 + 20, center.z + st.size * 0.55);
    st.sun.target.position.copy(center);
    const sh = st.sun.shadow.camera;
    sh.left = sh.bottom = -st.size * 0.75; sh.right = sh.top = st.size * 0.75; sh.near = 1; sh.far = st.size * 3 + 60; sh.updateProjectionMatrix();
    st.rims[0].position.set(center.x - st.size * 0.6, 10, center.z - st.size * 0.3);
    st.rims[1].position.set(center.x + st.size * 0.6, 8, center.z + st.size * 0.4);
    st.rims.forEach(l => { l.distance = st.size * 2.5; l.decay = 1; });
    st.scene.fog.density = 1.4 / (st.size * 3 + 60);
    markSel();
  }

  function fmt(v, n) { return Number.isFinite(v) ? (Math.abs(v) >= 1e4 ? v.toFixed(0) : v.toFixed(n == null ? 3 : n)) : '–'; }

  function addLabel(P, html, cls, key, prio, color) {
    const el = document.createElement('div');
    el.className = 's3-l ' + cls;
    el.innerHTML = html;
    if (color) el.style.setProperty('--c', color);
    st.lblBox.appendChild(el);
    st.labels.push({ P, el, key, prio });
  }

  function markSel() {
    const k = st.S.state.sel;
    if (st.selRing) { st.scene.remove(st.selRing); st.selRing.geometry.dispose(); st.selRing = null; }
    st.labels.forEach(l => l.el.classList.toggle('sel', l.key === k));
    if (!k) return;
    const [r, c] = k.split(',').map(Number);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.18, 64), st.mats.sel);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos(r, c)).setY(0.04);
    st.selRing = ring;
    st.scene.add(ring);
  }

  function fit() {
    if (!st.center) build();
    const c = st.center || new THREE.Vector3();
    const b = st.bbox || { x: 30, z: 20 };
    const fov = st.camera.fov * Math.PI / 180;
    const asp = st.camera.aspect || 1.6;
    const need = Math.max(b.z * 0.62, b.x / asp * 0.62) / Math.tan(fov / 2);
    const d = need * 0.88 + 3;
    const dir = new THREE.Vector3(0.16, 0.58, 0.8).normalize();
    tweenTo(c.clone(), c.clone().add(dir.multiplyScalar(d)), 700);
  }
  function focusOn(k) {
    const [r, c] = k.split(',').map(Number);
    const P = pos(r, c);
    const off = st.camera.position.clone().sub(st.controls.target);
    const want = Math.min(off.length(), 16);
    off.setLength(want);
    tweenTo(P.clone().setY(0.4), P.clone().add(off), 650);
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
  function zoomBy(f) {
    const off = st.camera.position.clone().sub(st.controls.target);
    off.multiplyScalar(1 / f);
    tweenTo(st.controls.target.clone(), st.controls.target.clone().add(off), 250);
  }

  function ndc(e) {
    const rc = st.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
  }
  function pickKey(e) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc(e), st.camera);
    const hits = rc.intersectObjects(st.pick, true);
    for (const h of hits) { let o = h.object; while (o && !(o.userData && o.userData.key)) o = o.parent; if (o && o.visible !== false) return o.userData.key; }
    return null;
  }
  function cellOf(e) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc(e), st.camera);
    const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y);
    const p = new THREE.Vector3();
    if (!rc.ray.intersectPlane(pl, p)) return null;
    return [Math.floor(p.z / U) + 1, Math.floor(p.x / U) + 1];
  }
  function ghostCells(cells, color) {
    st.ghost.children.slice().forEach(x => { st.ghost.remove(x); x.geometry.dispose(); });
    for (const [r, c] of cells) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(U * 0.9, U * 0.9), st.mats.ghost);
      m.rotation.x = -Math.PI / 2;
      m.position.copy(pos(r, c)).setY(0.03);
      st.ghost.add(m);
    }
    if (color) st.mats.ghost.color.set(color);
  }
  function syncControls() {
    const t = st.S.state.tool;
    st.controls.enableRotate = t === 'select';
    st.controls.mouseButtons.LEFT = t === 'select' ? THREE.MOUSE.ROTATE : null;
    if (t === 'select') ghostCells([]);
  }

  function events() {
    const cv = st.renderer.domElement;
    cv.addEventListener('pointerdown', e => {
      st.down = { x: e.clientX, y: e.clientY, b: e.button };
      const t = st.S.state.tool;
      if (e.button === 0 && t === 'wire') { const c = cellOf(e); if (c) { st.paint = { r: c[0], c: c[1], cells: [c], axis: null }; cv.setPointerCapture(e.pointerId); ghostCells([c], '#38e1c8'); } }
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
        ghostCells(w.cells, '#38e1c8');
        return;
      }
      if (t !== 'select') { const c = cellOf(e); if (c) ghostCells([c], t === 'erase' ? '#ff4d6d' : '#38e1c8'); }
      if (st.down && e.buttons) { st.tip.style.opacity = 0; return; }
      hover(e);
    });
    cv.addEventListener('pointerleave', () => { st.tip.style.opacity = 0; if (st.S.state.tool !== 'select') ghostCells([]); });
    cv.addEventListener('pointerup', e => {
      const S = st.S, t = S.state.tool;
      if (st.paint) {
        const ops = st.paint.cells.filter(([r, c]) => !(typeof D !== 'undefined' && D[r + ',' + c])).map(([r, c]) => [r + ',' + c, 'I']);
        st.paint = null;
        ghostCells([]);
        if (ops.length) S.commit(ops, 'Drew a connection line (' + ops.length + ' cells)');
        return;
      }
      if (!st.down || Math.hypot(e.clientX - st.down.x, e.clientY - st.down.y) > 5 || st.down.b !== 0) { st.down = null; return; }
      st.down = null;
      const key = pickKey(e);
      const cell = cellOf(e);
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
      const k = e.key.toLowerCase(), S = st.S;
      if ((k === 'delete' || k === 'backspace') && S.state.sel) { S.commit([[S.state.sel, null]], 'Deleted ' + String(D[S.state.sel] || '').split(/\s+/)[0]); S.select(null); e.preventDefault(); }
    });
  }

  let hoverT = 0;
  function hover(e) {
    const now = performance.now();
    if (now - hoverT < 40) return;
    hoverT = now;
    const k = pickKey(e);
    const S = st.S;
    if (!k || typeof D === 'undefined' || !D[k]) { st.tip.style.opacity = 0; st.renderer.domElement.style.cursor = S.state.tool === 'select' ? 'grab' : 'crosshair'; return; }
    st.renderer.domElement.style.cursor = S.state.tool === 'select' ? 'pointer' : 'crosshair';
    const t = D[k];
    let h = '';
    if (S.isComponentText(t)) {
      const tok = S.parseTok(t), kk = S.kindKey(tok.name), rr = !S.state.stale && S.resultFor(tok.name);
      h = `<b>${tok.name}</b> <small>${S.KIND[kk] ? S.KIND[kk].title : ''}</small>`;
      if (rr) {
        const aq = Math.abs(Number(rr.q));
        h += `<div class="g"><span>Q</span><b>${fmt(aq)} m³/h</b><span>U</span><b>${fmt(Math.abs(Number(rr.u)))} m/s</b><span>Δp</span><b>${fmt(Number(rr.dp), 2)} bar</b><span>Re</span><b>${fmt(Number(rr.reD), 0)} · ${S.regime(Number(rr.reD))}</b><span>Power</span><b>${fmt(Number(rr.pow))} kW</b><span>Flow</span><b>${Number(rr.q) >= 0 ? rr.n1 + ' → ' + rr.n2 : rr.n2 + ' → ' + rr.n1}</b></div>`;
      } else if (S.KIND[kk]) { const v = S.fieldValues(kk, tok); h += '<div class="g">' + S.KIND[kk].fields.map((f, i) => `<span>${f[1]}</span><b>${fmt(v[i], 3)} ${f[2] === '–' ? '' : f[2]}</b>`).join('') + '</div>'; }
    } else if (S.isNodeText(t)) {
      const p = t.split(/\s+/);
      const rr = !S.state.stale && S.state.results && (S.state.results.nodes || []).find(n => String(n.id).trim().toUpperCase() === p[0].toUpperCase());
      h = `<b>${p[0]}</b> <small>${p[0][0].toUpperCase() === 'S' ? 'reservoir' : /^nr/i.test(p[0]) ? 'pressure set-point' : 'node'}</small>` + (rr ? `<div class="g"><span>Ptot</span><b>${fmt(Number(rr.ptot), 3)} bar</b><span>Pstat</span><b>${fmt(Number(rr.pstat), 3)} bar</b><span>z</span><b>${fmt(Number(rr.z), 2)} m</b></div>` : '');
    } else h = `<b>Connection</b> <small>${t}</small>`;
    const rc = st.wrap.getBoundingClientRect();
    st.tip.innerHTML = h;
    st.tip.style.opacity = 1;
    st.tip.style.left = Math.min(rc.width - 300, e.clientX - rc.left + 18) + 'px';
    st.tip.style.top = Math.min(rc.height - 160, e.clientY - rc.top + 14) + 'px';
  }

  const tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3();
  function loop() {
    if (!st.on) { st.raf = 0; return; }
    st.raf = requestAnimationFrame(loop);
    if (!st.wrap.offsetParent) return;
    const dt = Math.min(0.05, st.clock.getDelta());
    const t = performance.now();
    if (st.anim) st.anim(t);
    st.controls.update();
    const animOn = st.S.state.anim !== false;
    if (animOn) st.spin.forEach(s => { s.o.rotation.y -= s.w * dt; });
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.004);
    st.pulse.forEach(r => { r.scale.setScalar(1 + 0.25 * pulse); if (r.material.opacity != null) r.material.opacity = 0.35 + 0.5 * (1 - pulse); });
    if (st.selRing) st.selRing.material.opacity = 0.55 + 0.4 * pulse;
    if (st.particles) {
      const im = st.particles;
      for (let i = 0; i < st.pdata.length; i++) {
        const p = st.pdata[i];
        if (animOn) p.s = (p.s + p.speed * dt) % (p.l0 + p.l1);
        if (p.s <= p.l0) tmpV.lerpVectors(p.a, p.c, p.s / (p.l0 || 1)); else tmpV.lerpVectors(p.c, p.b, (p.s - p.l0) / (p.l1 || 1));
        tmpS.setScalar(p.rad);
        tmpM.compose(tmpV, tmpQ, tmpS);
        im.setMatrixAt(i, tmpM);
      }
      im.instanceMatrix.needsUpdate = true;
    }
    if (st.composer) st.composer.render(); else st.renderer.render(st.scene, st.camera);
    labels();
  }

  const proj = new THREE.Vector3();
  function labels() {
    const w = st.wrap.clientWidth, h = st.wrap.clientHeight;
    const dist = st.camera.position.distanceTo(st.controls.target);
    const showC = dist < 34, showN = dist < 60;
    const sel = st.S.state.sel;
    for (const l of st.labels) {
      proj.copy(l.P).project(st.camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1 && (l.key === sel || (l.prio === 1 ? showN : showC));
      if (!vis) { if (l.el.style.display !== 'none') l.el.style.display = 'none'; continue; }
      if (l.el.style.display === 'none') l.el.style.display = '';
      l.el.style.transform = `translate(${((proj.x + 1) / 2 * w).toFixed(1)}px,${((1 - proj.y) / 2 * h).toFixed(1)}px) translate(-50%,-50%)`;
    }
  }

  window.BohemeScene3D = { init, setActive, fit, zoomBy, active: () => st.on, state: st, rebuild: () => { st.sig = ''; build(); } };
})();
