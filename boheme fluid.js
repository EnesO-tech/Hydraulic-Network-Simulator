(function () {
  'use strict';
  const PRESETS = {
    phosphate: {
      label: 'Phosphate-ester fire-resistant fluid (Type IV) – BOHEME default',
      rho0: 1025, beta: 0.00083, A: 5.17e-5, B: 1084, C: 110, Tmin: -54, Tmax: 107,
      note: 'Coefficients of the original BOHEME/Excel model: ρ = ρ0·exp(−β·T), μ = A·exp(B/(T + 273.15 − C)).'
    },
    mineral: {
      label: 'Mineral hydraulic oil (MIL-PRF-5606 type)',
      rho15: 860, beta: 0.00070, points: [[-40, 500], [40, 13.5], [100, 5.0]], Tmin: -54, Tmax: 135,
      note: 'Vogel fit to typical kinematic viscosities (mm²/s) at −40, 40 and 100 °C and ρ(15 °C) = 860 kg/m³. Typical values – use the datasheet of your fluid.'
    },
    synthetic: {
      label: 'Synthetic hydrocarbon fluid (MIL-PRF-83282 type)',
      rho15: 845, beta: 0.00068, points: [[-40, 2000], [40, 14.0], [100, 3.6]], Tmin: -40, Tmax: 205,
      note: 'Vogel fit to typical kinematic viscosities (mm²/s) at −40, 40 and 100 °C and ρ(15 °C) = 845 kg/m³. Typical values – use the datasheet of your fluid.'
    },
    water: {
      label: 'Water',
      rho15: 999.1, beta: 0.00021, points: [[10, 1.307], [40, 0.658], [80, 0.365]], Tmin: 1, Tmax: 95,
      note: 'Vogel fit to the kinematic viscosity of water at 10, 40 and 80 °C. The exponential density model is approximate (±0.5 % between 5 and 60 °C).'
    },
    custom: {
      label: 'Custom fluid (edit parameters or fit from datasheet)',
      rho0: 900, beta: 0.0007, A: 5e-5, B: 1000, C: 120, Tmin: -60, Tmax: 200,
      note: 'Own parameters. Use “Fit from datasheet” to derive A, B, C from three viscosity values.'
    }
  };

  function vogelFit(points, rhoAt) {
    const pts = points.map(([T, nu]) => [T + 273.15, Math.log(nu * 1e-6 * rhoAt(T))]);
    pts.sort((a, b) => a[0] - b[0]);
    const [[T1, l1], [T2, l2], [T3, l3]] = pts;
    const target = (l1 - l2) / (l2 - l3);
    const f = C => (1 / (T1 - C) - 1 / (T2 - C)) / (1 / (T2 - C) - 1 / (T3 - C)) - target;
    let lo = -400, hi = T1 - 1e-3;
    let flo = f(lo), fhi = f(hi);
    if (!(flo * fhi < 0)) return null;
    for (let i = 0; i < 200; i++) {
      const mid = 0.5 * (lo + hi), fm = f(mid);
      if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    }
    const C = 0.5 * (lo + hi);
    const B = (l1 - l2) / (1 / (T1 - C) - 1 / (T2 - C));
    const A = Math.exp(l1 - B / (T1 - C));
    return { A, B, C };
  }

  function resolve(id, over) {
    const p = Object.assign({}, PRESETS[id] || PRESETS.phosphate);
    if (p.rho15 != null && p.rho0 == null) p.rho0 = p.rho15 * Math.exp(p.beta * 15);
    if (p.points && p.A == null) {
      const rhoAt = T => p.rho0 * Math.exp(-p.beta * T);
      const fit = vogelFit(p.points, rhoAt);
      if (fit) Object.assign(p, fit);
    }
    return Object.assign(p, over || {});
  }

  const state = { id: 'phosphate', model: resolve('phosphate') };

  function props(T, m) {
    m = m || state.model;
    const rho = m.rho0 * Math.exp(-m.beta * T);
    const mue = m.A * Math.exp(m.B / (T + 273.15 - m.C));
    return { rho, mue, nu: mue / rho * 1e6, valid: T >= m.Tmin && T <= m.Tmax && T + 273.15 > m.C };
  }

  function save() {
    try { localStorage.setItem('boheme_fluid', JSON.stringify({ id: state.id, model: state.model })); } catch (e) { }
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('boheme_fluid') || 'null');
      if (s && PRESETS[s.id] && s.model && Number.isFinite(s.model.A)) { state.id = s.id; state.model = s.model; }
    } catch (e) { }
  }

  function num(v, p) { return Number.isFinite(v) ? (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e5 ? v.toExponential(p || 4) : +v.toPrecision(p || 6)) : ''; }

  function renderPanel() {
    const box = document.getElementById('fluidModel');
    if (!box) return;
    const m = state.model;
    const T = Number((document.getElementById('fluidT') || {}).value);
    const pr = props(T);
    const rows = [['rho0', 'ρ0 at 0 °C [kg/m³]'], ['beta', 'β [1/K]'], ['A', 'A [Pa·s]'], ['B', 'B [K]'], ['C', 'C [K]'], ['Tmin', 'valid from [°C]'], ['Tmax', 'valid to [°C]']];
    box.innerHTML = '<div style="color:#ccd;margin-bottom:3px">ρ = ρ0·e<sup>−β·T</sup> · μ = A·e<sup>B/(T+273.15−C)</sup></div>' +
      rows.map(([k, l]) => `<div class="fm-row"><span>${l}</span><input data-k="${k}" value="${num(m[k])}"></div>`).join('') +
      `<div class="fm-note">ν(T) = ${num(pr.nu, 4)} mm²/s${pr.valid ? '' : ' · <span class="fm-warn">⚠ T outside the validity range of this fluid model</span>'}<br>${m.note || ''}</div>` +
      '<button id="fluidFitBtn">Fit from datasheet (3 viscosity points)</button>';
    box.querySelectorAll('input[data-k]').forEach(inp => inp.addEventListener('change', () => {
      const v = Number(inp.value);
      if (!Number.isFinite(v)) { inp.style.borderColor = '#ff4d6d'; return; }
      state.model = Object.assign({}, state.model, { [inp.dataset.k]: v, note: 'Edited parameters (based on: ' + (PRESETS[state.id] || {}).label + ').' });
      apply();
    }));
    box.querySelector('#fluidFitBtn').addEventListener('click', openFit);
  }

  function openFit() {
    let dlg = document.getElementById('fluidFitDlg');
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.id = 'fluidFitDlg';
      dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;';
      document.body.appendChild(dlg);
    }
    const m = state.model;
    const pts = m.points || [[-40, 500], [40, 15], [100, 5]];
    dlg.innerHTML = `<div style="background:#16213e;border:1px solid #2a4a7a;border-radius:12px;padding:16px;width:min(460px,92vw);color:#ddd;font-size:13px">
<div style="color:#7ef9ff;font-weight:700;margin-bottom:6px">Fit fluid model from datasheet values</div>
<div style="color:#8fa3bf;font-size:12px;margin-bottom:10px">Enter three kinematic viscosities at different temperatures and the density at 15 °C. BOHEME fits A, B, C of μ = A·exp(B/(T + 273.15 − C)) exactly through the three points.</div>
${pts.map((p, i) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0"><label>T${i + 1} [°C] <input id="ffT${i}" value="${p[0]}" style="width:80px"></label><label>ν${i + 1} [mm²/s] <input id="ffN${i}" value="${p[1]}" style="width:80px"></label></div>`).join('')}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0"><label>ρ(15 °C) [kg/m³] <input id="ffRho" value="${num(m.rho0 * Math.exp(-m.beta * 15), 5)}" style="width:80px"></label><label>β [1/K] <input id="ffBeta" value="${num(m.beta)}" style="width:80px"></label></div>
<div id="ffMsg" style="min-height:18px;color:#ffb347;font-size:12px"></div>
<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button id="ffCancel" style="padding:5px 14px">Cancel</button><button id="ffOk" style="padding:5px 14px;background:#0f3460;color:#fff;border:1px solid #2a4a7a;border-radius:4px">Fit</button></div></div>`;
    dlg.style.display = 'flex';
    dlg.querySelector('#ffCancel').onclick = () => { dlg.style.display = 'none'; };
    dlg.querySelector('#ffOk').onclick = () => {
      const P = [0, 1, 2].map(i => [Number(dlg.querySelector('#ffT' + i).value), Number(dlg.querySelector('#ffN' + i).value)]);
      const rho15 = Number(dlg.querySelector('#ffRho').value), beta = Number(dlg.querySelector('#ffBeta').value);
      const msg = dlg.querySelector('#ffMsg');
      if (P.some(p => !Number.isFinite(p[0]) || !(p[1] > 0)) || !(rho15 > 0) || !Number.isFinite(beta)) { msg.textContent = 'Please enter valid numbers (ν > 0).'; return; }
      if (new Set(P.map(p => p[0])).size < 3) { msg.textContent = 'The three temperatures must differ.'; return; }
      const sorted = P.slice().sort((a, b) => a[0] - b[0]);
      if (!(sorted[0][1] > sorted[1][1] && sorted[1][1] > sorted[2][1])) { msg.textContent = 'Viscosity must decrease with temperature.'; return; }
      const rho0 = rho15 * Math.exp(beta * 15);
      const fit = vogelFit(P, T => rho0 * Math.exp(-beta * T));
      if (!fit) { msg.textContent = 'No Vogel curve passes through these points – check the values.'; return; }
      state.id = 'custom';
      state.model = Object.assign({}, PRESETS.custom, { rho0, beta, A: fit.A, B: fit.B, C: fit.C, points: P, Tmin: sorted[0][0] - 15, Tmax: sorted[2][0] + 15, note: 'Fitted from datasheet: ' + P.map(p => p[0] + ' °C → ' + p[1] + ' mm²/s').join(', ') + '.' });
      const sel = document.getElementById('fluidPreset');
      if (sel) sel.value = 'custom';
      dlg.style.display = 'none';
      apply();
    };
  }

  function apply() {
    save();
    if (typeof window.applyFluidT === 'function') window.applyFluidT();
    renderPanel();
    const rk = document.getElementById('fluidRhoKey'), mk = document.getElementById('fluidMueKey');
    if (rk) rk.title = 'ρ = ' + num(state.model.rho0) + '·exp(−' + num(state.model.beta) + '·T)';
    if (mk) mk.title = 'μ = ' + num(state.model.A) + '·exp(' + num(state.model.B) + '/(T + 273.15 − ' + num(state.model.C) + '))';
  }

  function init() {
    load();
    const sel = document.getElementById('fluidPreset');
    if (sel) {
      sel.innerHTML = Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${p.label}</option>`).join('');
      sel.value = state.id;
      sel.addEventListener('change', () => { state.id = sel.value; state.model = resolve(sel.value); apply(); });
    }
    window.fluidFromT = T => { const p = props(Number(T)); return { rho: p.rho, mue: p.mue }; };
    const t = document.getElementById('fluidT');
    if (t) t.addEventListener('change', renderPanel);
    apply();
  }

  window.BohemeFluid = { PRESETS, vogelFit, resolve, props, init, state };
})();
