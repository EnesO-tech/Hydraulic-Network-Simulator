(function () {
  'use strict';
  const IC = {
    select: '<path d="M5 3l14 8-6.2 1.8L11 19z"/>',
    wire: '<path d="M4 19V11h16V5"/><circle cx="4" cy="19" r="1.8"/><circle cx="20" cy="5" r="1.8"/>',
    node: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
    erase: '<path d="M15.5 3.5l5 5L10 19H5.5l-2.5-2.5z"/><path d="M9 10l5 5"/>',
    lib: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M17.25 14v6.5M14 17.25h6.5"/>',
    play: '<path d="M7 4.5l12.5 7.5L7 19.5z"/>',
    schema: '<path d="M3 7h5M16 7h5M8 4h8v6H8zM12 10v4M5 14h14v6H5z"/>',
    pressure: '<path d="M4 17a8 8 0 1116 0"/><path d="M12 17l4.5-5.5"/><circle cx="12" cy="17" r="1.4"/>',
    speed: '<path d="M3 12h10M3 7h14M3 17h8"/><path d="M17 15.5l4-3.5-4-3.5"/>',
    flow: '<path d="M12 3.5s6 6.8 6 10.7a6 6 0 01-12 0c0-3.9 6-10.7 6-10.7z"/>',
    anim: '<path d="M2 12h4l3-7 4.5 14 3-7H22"/>',
    fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    focus: '<path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1.5"/>',
    zin: '<circle cx="11" cy="11" r="6.5"/><path d="M11 8v6M8 11h6M20.5 20.5l-4.8-4.8"/>',
    zout: '<circle cx="11" cy="11" r="6.5"/><path d="M8 11h6M20.5 20.5l-4.8-4.8"/>',
    open: '<path d="M3 6.5h6l2 2h10V19H3z"/>',
    save: '<path d="M5 3h11.5L20 6.5V21H5z"/><path d="M8.5 3v5.5h7V3M8.5 21v-6.5h7V21"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14.5h18M9 4v16"/>',
    csv: '<path d="M6 3h9l4 4v14H6z"/><path d="M14.5 3v4.5H19M9 13h6M9 17h6"/>',
    undo: '<path d="M9 5L4 10l5 5"/><path d="M4 10h10a6 6 0 010 12h-2"/>',
    redo: '<path d="M15 5l5 5-5 5"/><path d="M20 10H10a6 6 0 000 12h2"/>',
    eye: '<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.5 5.6A10 10 0 0122 12s-1.2 2.1-3.4 3.9M6.1 6.4C3.5 8.2 2 12 2 12s3.8 6.5 10 6.5c1.5 0 2.9-.4 4.1-.9"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5l-4.8-4.8"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    project: '<path d="M3 7.5l9-4.5 9 4.5-9 4.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/>',
    circuit: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4v5.5M12 14.5V20M4 12h5.5M14.5 12H20"/>',
    pump: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5L20 12H4z"/>',
    valve: '<path d="M3 6.5l9 5.5-9 5.5zM21 6.5L12 12l9 5.5z"/><path d="M12 12V5M9 5h6"/>',
    act: '<rect x="2.5" y="8" width="13" height="8" rx="2"/><path d="M15.5 12H22M7 8v8"/>',
    pipe: '<rect x="2.5" y="8" width="19" height="8" rx="4"/><path d="M7 12h10" stroke-dasharray="2 2.5"/>',
    nodes: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 8.2L10.8 16M16.5 8.2L13.2 16M8.5 6h7"/>',
    fluid: '<path d="M12 3.5s6 6.8 6 10.7a6 6 0 01-12 0c0-3.9 6-10.7 6-10.7z"/><path d="M9 15a3 3 0 003 3"/>',
    solver: '<path d="M4 6h16M4 12h9M4 18h6"/><circle cx="17.5" cy="15.5" r="3"/><path d="M19.7 17.7L22 20"/>',
    warn: '<path d="M12 3.5l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
    ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.5 9"/>',
    hist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.3 2"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M2 20.5h20"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    locate: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
    rotate: '<path d="M20 11.5a8 8 0 10-2.3 5.6"/><path d="M20.5 4v7.5H13"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    panelL: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    panelR: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    panelB: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 14h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'
  };
  const icon = (n, s) => `<svg class="wbi" viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;
  const $ = (q, r) => (r || document).querySelector(q);
  const $$ = (q, r) => [...(r || document).querySelectorAll(q)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (v, n) => (Number.isFinite(v) ? (Math.abs(v) >= 1e4 ? v.toFixed(0) : v.toFixed(n == null ? 3 : n)) : '–');
  const CAT = {
    pumps: { title: 'Pumps', icon: 'pump', kinds: ['P', 'UPM', 'UCP', 'UPTa', 'UPTb'] },
    valves: { title: 'Valves & regulators', icon: 'valve', kinds: ['RK', 'UCV', 'UPR', 'RL'] },
    actuators: { title: 'Consumers', icon: 'act', kinds: ['U'] },
    lines: { title: 'Lines & losses', icon: 'pipe', kinds: ['R', 'RZ', 'RR'] }
  };
  const LIB_TEXT = {
    R: 'Straight line with laminar/turbulent friction (Hagen–Poiseuille / Colebrook-type).',
    RZ: 'Local loss with loss coefficient ζ (bends, fittings, filters).',
    RL: 'Linear resistance Δp = R·Q, used as switchable valve (Rl_…).',
    RR: 'Orifice/restrictor defined by its bore diameter.',
    RK: 'Valve characterised by its flow coefficient kv (switchable Rk_…).',
    UCV: 'Check / relief valve opening above the cracking pressure.',
    UPR: 'Pressure regulator holding a set pressure at an Nr node.',
    P: 'Pump with fixed delivered flow.',
    UPM: 'Pressure-compensated pump (set pressure, maximum flow).',
    UCP: 'Pump with linear characteristic between Q at Δp = 0 and shut-off Δp.',
    U: 'Universal consumer (actuator) with Δp and flow.',
    UPTa: 'Power-transfer unit, hydraulic motor side.',
    UPTb: 'Power-transfer unit, pump side.'
  };
  const W = { S: null, tabL: 'objects', tabR: 'props', tabB: 'results', search: '', hiddenGroups: new Set(), hl: null, history: [], card: true, solving: false, sel: null, collapsed: {}, mode: 'p', lastStatus: '' };

  function load() { try { Object.assign(W, JSON.parse(localStorage.getItem('boheme_wb2') || '{}'), { hiddenGroups: new Set(), history: [], solving: false, sel: null }); } catch (e) { } }
  function save() { try { localStorage.setItem('boheme_wb2', JSON.stringify({ tabL: W.tabL, tabR: W.tabR, tabB: W.tabB, tabRt: W.tabRt, card: W.card, collapsed: W.collapsed, mode: W.mode, bottomH: W.bottomH, hideL: W.hideL, hideB: W.hideB, outline: W.outline, probesOff: W.probesOff, labelsOff: W.labelsOff })); } catch (e) { } }

  function build() {
    const tab = $('#tab-comp');
    const legacy = $('#comp-main');
    if (!tab || !legacy || $('#wb')) return false;
    legacy.classList.add('wb-legacy');
    const wb = document.createElement('div');
    wb.id = 'wb';
    wb.className = 'wb';
    wb.innerHTML = `
<div class="wb-ribbon">
  <div class="wb-rtabs"><span class="wb-app">BOHEME</span><button data-rt="home">Home</button><button data-rt="results">Results</button><button data-rt="display">Display</button>
    <div class="wb-rright">
      <button class="wb-ib" data-act="undo" title="Undo (Ctrl+Z)">${icon('undo', 16)}</button>
      <button class="wb-ib" data-act="redo" title="Redo (Ctrl+Y)">${icon('redo', 16)}</button>
    </div>
  </div>
  <div class="wb-rgroups">
    <div class="wb-rg" data-rtab="home"><div class="wb-rg-b">
      ${rbtn('select', 'select', 'Select', 'Select objects (V)')}
      ${rbtn('wire', 'wire', 'Line', 'Draw connection lines (W)')}
      ${rbtn('node', 'node', 'Node', 'Place a node (N)')}
      ${rbtn('erase', 'erase', 'Erase', 'Erase cells (E)')}
    </div><div class="wb-rg-l">Edit</div></div>
    <div class="wb-rg" data-rtab="home"><div class="wb-rg-b">
      <button class="wb-rb" id="wbLibBtn" title="Insert a component">${icon('lib', 24)}<span>Component ▾</span></button>
    </div><div class="wb-rg-l">Insert</div></div>
    <div class="wb-rg" data-rtab="home"><div class="wb-rg-b">
      <button class="wb-rb wb-solve" id="wbSolve" title="Solve the steady-state network">${icon('bolt', 24)}<span>Solve</span></button>
    </div><div class="wb-rg-l">Solve</div></div>
    <div class="wb-rg" data-rtab="home"><div class="wb-rg-b">
      ${rbtn('open', 'open', 'Open', 'Open a BOHEME project (.json)')}
      ${rbtn('save', 'save', 'Save', 'Save the project as .json')}
      ${rbtn('paste', 'table', 'Import', 'Paste a schematic copied from Excel')}
      ${rbtn('csv', 'csv', 'Export', 'Export the result table as CSV')}
    </div><div class="wb-rg-l">Project</div></div>
    <div class="wb-rg" data-rtab="results"><div class="wb-rg-b">
      ${rbtn('m-p', 'pressure', 'Total Pressure', 'Contour plot of the total pressure')}
      ${rbtn('m-u', 'speed', 'Velocity', 'Contour plot of the flow velocity')}
      ${rbtn('m-q', 'flow', 'Volume Flow', 'Contour plot of the volume flow')}
      ${rbtn('m-none', 'schema', 'Geometry', 'Show the model without results')}
    </div><div class="wb-rg-l">Result</div></div>
    <div class="wb-rg" data-rtab="results"><div class="wb-rg-b">
      ${rbtn('anim', 'anim', 'Flow Arrows', 'Animated flow-direction arrows')}
      ${rbtn('card', 'chart', 'Legend', 'Show the contour legend')}
      ${rbtn('probes', 'locate', 'Max / Min', 'Show maximum and minimum probes')}
      ${rbtn('labels', 'info', 'Labels', 'Show component and node annotations')}
    </div><div class="wb-rg-l">Display</div></div>
    <div class="wb-rg" data-rtab="display"><div class="wb-rg-b">
      ${rbtn('fit', 'fit', 'Fit', 'Zoom to fit (F)')}
      ${rbtn('v-iso', 'project', 'Isometric', 'Isometric view')}
      ${rbtn('v-top', 'panelB', 'Top', 'View from above')}
      ${rbtn('v-front', 'panelL', 'Front', 'Front view')}
    </div><div class="wb-rg-l">View</div></div>
    <div class="wb-rg" data-rtab="display"><div class="wb-rg-b">
      ${rbtn('toggleL', 'panelL', 'Outline', 'Show / hide outline and details')}
      ${rbtn('toggleB', 'panelB', 'Tables', 'Show / hide the tabular panel')}
      ${rbtn('focus', 'focus', 'Full Screen', 'Graphics only (M)')}
    </div><div class="wb-rg-l">Windows</div></div>
  </div>
</div>
<div class="wb-docbar"><span id="wbProj">A320 hydraulic network</span><span id="wbCrumb"></span></div>
<div class="wb-main">
  <aside class="wb-left">
    <div class="wb-box">
      <div class="wb-tabs"><button data-tl="objects">${icon('nodes', 13)} Outline</button><button data-tl="library">${icon('lib', 13)} Library</button></div>
      <div class="wb-pane" data-pl="objects">
        <div class="wb-search">${icon('search', 13)}<input id="wbSearch" placeholder="Search outline" autocomplete="off"></div>
        <div class="wb-tree" id="wbTree"></div>
      </div>
      <div class="wb-pane" data-pl="library"><div class="wb-lib" id="wbLib"></div></div>
    </div>
    <div class="wb-split" id="wbSplit"></div>
    <div class="wb-box">
      <div class="wb-boxh"><span id="wbDetT">Details of “Project”</span></div>
      <div class="wb-tabs"><button data-tr="props">Details</button><button data-tr="analysis">Results</button><button data-tr="solver">Analysis Settings</button></div>
      <div class="wb-pane wb-scroll" data-pr="props" id="wbProps"></div>
      <div class="wb-pane wb-scroll" data-pr="analysis" id="wbAnalysis"></div>
      <div class="wb-pane wb-scroll" data-pr="solver" id="wbSolver"></div>
    </div>
  </aside>
  <section class="wb-center">
    <div class="wb-gtool">
      ${vbtn('select', 'select', 'Select (V)')}${vbtn('wire', 'wire', 'Line (W)')}${vbtn('node', 'node', 'Node (N)')}${vbtn('erase', 'erase', 'Erase (E)')}
      <span class="wb-gsep"></span>
      ${vbtn('zin', 'zin', 'Zoom in')}${vbtn('zout', 'zout', 'Zoom out')}${vbtn('fit', 'fit', 'Zoom to fit (F)')}
      <span class="wb-gsep"></span>
      ${vbtn('v-iso', 'project', 'Isometric view')}${vbtn('v-top', 'panelB', 'Top view')}${vbtn('v-front', 'panelL', 'Front view')}
      <span class="wb-gsep"></span>
      <div id="wbModes"></div>
      <div class="wb-hint" id="wbHint"></div>
    </div>
    <div class="wb-viewport" id="wbViewport">
      <div class="wb-leg" id="wbCard"></div>
      <div class="wb-zoom" id="wbZoom">100 %</div>
    </div>
  </section>
</div>
<div class="wb-bottom" id="wbBottom">
  <div class="wb-bhandle" id="wbBHandle"></div>
  <div class="wb-tabs wb-btabs"><button data-tb="results">Tabular Data</button><button data-tb="charts">Graph</button><button data-tb="check">Model Check <i id="wbCheckBadge"></i></button><button data-tb="history">Messages</button><button data-tb="raster">Cell Grid (Expert)</button><span class="wb-btab-actions" id="wbBActions"></span></div>
  <div class="wb-bpane" data-pb="results" id="wbResults"></div>
  <div class="wb-bpane" data-pb="charts" id="wbCharts"></div>
  <div class="wb-bpane" data-pb="check" id="wbCheck"></div>
  <div class="wb-bpane" data-pb="history" id="wbHistory"></div>
  <div class="wb-bpane" data-pb="raster" id="wbRaster"></div>
</div>
<div class="wb-status" id="wbStatus"></div>
<div class="wb-flyout" id="wbFly"></div>`;
    tab.appendChild(wb);
    const vp = $('#wbViewport');
    const sw = $('#studioWrap');
    if (sw) { sw.style.display = ''; vp.insertBefore(sw, vp.firstChild); }
    const rt = $('#resultTable');
    if (rt) { const wrap = rt.parentElement; $('#wbResults').appendChild(wrap); wrap.classList.add('wb-rtable'); }
    const fb = $('#tab-comp .formula-bar'), gw = $('#tab-comp .grid-wrap');
    const rp = $('#wbRaster');
    rp.innerHTML = `<div class="wb-raster-note">${icon('info', 14)} Expert view of the solver input. Every cell is synchronised with the workbench – paste from Excel with Ctrl+V after selecting a cell.</div>`;
    if (fb) rp.appendChild(fb);
    if (gw) { gw.style.display = ''; rp.appendChild(gw); }
    buildSolverPanel();
    buildLibrary();
    wire();
    return true;
  }
  function rbtn(act, ic, label, title) { return `<button class="wb-rb" data-act="${act}" title="${esc(title)}">${icon(ic, 24)}<span>${label}</span></button>`; }
  function vbtn(act, ic, title) { return `<button class="wb-ib" data-act="${act}" title="${esc(title)}">${icon(ic, 16)}</button>`; }

  function rowOf(id) { const e = document.getElementById(id); return e ? (e.closest('.toggle-item') || e) : null; }
  function section(container, id, title, ic, bodyHTML, opts) {
    const sec = document.createElement('div');
    sec.className = 'wb-sec' + (W.collapsed[id] ? ' closed' : '') + (opts && opts.cls ? ' ' + opts.cls : '');
    sec.dataset.sec = id;
    sec.innerHTML = `<div class="wb-sec-h">${icon(ic, 15)}<span>${title}</span>${opts && opts.extra ? opts.extra : ''}<i class="wb-sec-c">${icon('chev', 14)}</i></div><div class="wb-sec-b"></div>`;
    const b = sec.querySelector('.wb-sec-b');
    if (typeof bodyHTML === 'string') b.innerHTML = bodyHTML;
    else if (bodyHTML) b.appendChild(bodyHTML);
    sec.querySelector('.wb-sec-h').addEventListener('click', e => { if (e.target.closest('button,select,input')) return; sec.classList.toggle('closed'); W.collapsed[id] = sec.classList.contains('closed'); save(); });
    container.appendChild(sec);
    return b;
  }

  function buildSolverPanel() {
    const box = $('#wbSolver');
    box.innerHTML = '';
    const fl = section(box, 's-fluid', 'Fluid', 'fluid', '');
    const fp = $('#fluidPreset');
    if (fp) { const d = document.createElement('div'); d.className = 'wb-field-full'; d.appendChild(fp); fl.appendChild(d); }
    ['fluidT', 'fluidRho', 'fluidMue'].forEach(id => { const r = rowOf(id); if (r) fl.appendChild(r); });
    const nu = document.createElement('div');
    nu.className = 'wb-kv';
    nu.id = 'wbNu';
    fl.appendChild(nu);
    const fm = $('#fluidModel');
    if (fm) fl.appendChild(fm);
    const nm = section(box, 's-num', 'Numerics', 'solver', '');
    ['itLambda', 'itDUcrit', 'itNiter', 'itKReD', 'itZanke', 'itProtect'].forEach(id => { const r = rowOf(id); if (r) nm.appendChild(r); });
    const ph = section(box, 's-phys', 'Physics & ambient', 'gear', '');
    ['grav', 'krough', 'redcrit', 'pamb'].forEach(id => { const r = rowOf(id); if (r) ph.appendChild(r); });
    const pt = section(box, 's-ptu', 'PTU activation', 'bolt', '<div class="wb-note">The PTU only runs if the pressure difference between the two circuits without PTU exceeds the threshold (A320: 500 psi).</div>');
    ['itPtuLogic', 'itPtuDp'].forEach(id => { const r = rowOf(id); if (r) pt.appendChild(r); });
    const vv = section(box, 's-vval', 'Valve on/off values', 'valve', '<div class="wb-note">Values written into Rl_… (linear resistance) and Rk_… (kv valve) when switched on or off.</div>');
    ['tglRlOn', 'tglRlOff', 'tglRkOn1', 'tglRkOn54', 'tglRkOff'].forEach(id => { const r = rowOf(id); if (r) vv.appendChild(r); });
    const vl = section(box, 's-valves', 'Switchable valves', 'valve', '');
    const list = $('#valveList');
    if (list) vl.appendChild(list);
    const add = document.createElement('div');
    add.className = 'wb-row-btns';
    add.innerHTML = `<button class="wb-btn" data-place="RK">${icon('plus', 14)} kv valve</button><button class="wb-btn" data-place="RL">${icon('plus', 14)} Rl valve</button>`;
    vl.appendChild(add);
    add.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => { W.S.setPlace(b.dataset.place); hint('Click a free cell in the schematic to place the valve.'); }));
  }

  function buildLibrary() {
    const lib = $('#wbLib');
    const S = W.S;
    lib.innerHTML = '<div class="wb-note">Click a component, then click a free cell in the schematic – or drag it onto the canvas.</div>' + S.PALETTE.map(([kk]) => {
      const k = S.KIND[kk];
      return `<div class="wb-libc" draggable="true" data-kk="${kk}">${S.symbolSVG(kk, 64, 46)}<div><b>${k.title}</b><small>${LIB_TEXT[kk] || ''}</small><code>${k.prefix}… ${k.fields.map(f => f[0]).join(' ')} ^</code></div></div>`;
    }).join('');
    lib.querySelectorAll('.wb-libc').forEach(c => {
      c.addEventListener('click', () => { S.setPlace(c.dataset.kk); hint('Click a free cell to place: ' + S.KIND[c.dataset.kk].title + ' · Esc cancels'); });
      c.addEventListener('dragstart', e => e.dataTransfer.setData('text/bs-kind', c.dataset.kk));
    });
    const fly = $('#wbFly');
    fly.innerHTML = '<div class="wb-fly-t">Component library</div><div class="wb-fly-g">' + S.PALETTE.map(([kk, lab]) => `<button data-kk="${kk}" title="${esc(S.KIND[kk].title)}">${S.symbolSVG(kk, 54, 38)}<span>${lab}</span></button>`).join('') + '</div>';
    fly.querySelectorAll('[data-kk]').forEach(b => b.addEventListener('click', () => { S.setPlace(b.dataset.kk); fly.classList.remove('open'); hint('Click a free cell to place: ' + S.KIND[b.dataset.kk].title + ' · Esc cancels'); }));
  }

  function wire() {
    const S = W.S;
    $$('.wb-ribbon [data-act], .wb-gtool [data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act)));
    $$('[data-rt]').forEach(b => b.addEventListener('click', () => { W.tabRt = b.dataset.rt; tabs(); save(); }));
    const sp = $('#wbSplit');
    sp.addEventListener('pointerdown', e => {
      const box = $('.wb-left').getBoundingClientRect();
      sp.setPointerCapture(e.pointerId);
      const mv = ev => { const f = Math.max(0.15, Math.min(0.85, (ev.clientY - box.top) / box.height)); W.outline = Math.round(f * 100); applyLayout(); };
      const up = () => { sp.removeEventListener('pointermove', mv); sp.removeEventListener('pointerup', up); save(); };
      sp.addEventListener('pointermove', mv);
      sp.addEventListener('pointerup', up);
    });
    $('#wbSolve').addEventListener('click', () => window.compute && window.compute());
    $('#wbLibBtn').addEventListener('click', e => { const f = $('#wbFly'); const r = e.currentTarget.getBoundingClientRect(); f.style.left = r.left + 'px'; f.style.top = (r.bottom + 6) + 'px'; f.classList.toggle('open'); e.stopPropagation(); });
    document.addEventListener('click', e => { if (!e.target.closest('#wbFly')) $('#wbFly').classList.remove('open'); });
    $$('[data-tl]').forEach(b => b.addEventListener('click', () => { W.tabL = b.dataset.tl; tabs(); save(); }));
    $$('[data-tr]').forEach(b => b.addEventListener('click', () => { W.tabR = b.dataset.tr; tabs(); save(); crumb(); }));
    $$('[data-tb]').forEach(b => b.addEventListener('click', () => { W.tabB = b.dataset.tb; tabs(); save(); if (W.tabB === 'charts') renderCharts(); }));
    $('#wbSearch').addEventListener('input', e => { W.search = e.target.value.trim().toLowerCase(); renderTree(); });
    const handle = $('#wbBHandle');
    handle.addEventListener('pointerdown', e => {
      const startY = e.clientY, startH = $('#wbBottom').offsetHeight;
      handle.setPointerCapture(e.pointerId);
      const mv = ev => { W.bottomH = Math.max(120, Math.min(window.innerHeight * 0.7, startH - (ev.clientY - startY))); applyLayout(); };
      const up = () => { handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); save(); S.fit(); };
      handle.addEventListener('pointermove', mv);
      handle.addEventListener('pointerup', up);
    });
    const rb = $('#resultBody');
    if (rb) rb.addEventListener('click', e => { const tr = e.target.closest('tr'); if (!tr) return; const name = (tr.cells[0] || {}).textContent; const k = keyOfName(name && name.trim()); if (k) S.focusKey(k, 1.0); const nn = (tr.cells[16] || {}).textContent; if (!k && nn) { const kn = keyOfName(nn.trim()); if (kn) S.focusKey(kn, 1.0); } });
    document.addEventListener('keydown', e => {
      if (!$('#tab-comp').classList.contains('active')) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); S.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); S.redo(); }
      else if (e.key === 'Escape') { S.setTool('select'); S.select(null); S.highlight(null); W.hl = null; hint(''); }
      else if (e.key === 'Delete' && W.sel) { S.commit([[W.sel, null]], 'Deleted ' + nameOfKey(W.sel)); S.select(null); }
      else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') act('select'); else if (k === 'w') act('wire'); else if (k === 'n') act('node'); else if (k === 'e') act('erase'); else if (k === 'f') act('fit'); else if (k === 'm') act('focus'); else if (k === 'r' && W.sel) S.rotateSel();
      }
    });
    S.on('select', k => { W.sel = k; if (k) { W.tabR = 'props'; tabs(); } renderProps(); renderTree(); crumb(); });
    S.on('change', label => { addHistory('edit', label || 'Edited the schematic'); scheduleRefresh(); });
    S.on('redraw', () => scheduleRefresh());
    S.on('results', r => { renderAll(); });
    S.on('tool', t => { if (t && t.tool === 'select') hint(''); markTools(t); });
    S.on('view', v => { const z = $('#wbZoom'); if (z) z.textContent = Math.round(v.k * 100) + ' %'; });
    const si = $('#statusInfo');
    if (si) new MutationObserver(() => { W.lastStatus = si.textContent; renderStatus(); }).observe(si, { childList: true, characterData: true, subtree: true });
    if (typeof window.compute === 'function' && !window.compute.__wb) {
      const orig = window.compute;
      const wrapped = async function () {
        W.solving = true; renderStatus();
        const t0 = performance.now();
        try { await orig.apply(this, arguments); } finally {
          W.solving = false;
          const r = (typeof loadedResults !== 'undefined') ? loadedResults : null;
          if (r) addHistory('solve', `Solved: ${r.ncomp} components, ${r.nnode} nodes, ${r.iterations} iterations, residual ${Number(r.residual).toExponential(2)} (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
          renderStatus();
        }
      };
      wrapped.__wb = true;
      window.compute = wrapped;
    }
    const ft = $('#fluidT'), fps = $('#fluidPreset');
    [ft, fps].forEach(x => x && x.addEventListener('change', () => { addHistory('fluid', 'Fluid: ' + fluidLabel() + ' at ' + (ft ? ft.value : '') + ' °C'); setTimeout(() => { renderNu(); renderStatus(); renderProps(); }, 30); }));
    $('#wbSolver').addEventListener('change', () => setTimeout(() => { renderNu(); renderStatus(); }, 30));
    $('#wbSolver').addEventListener('click', e => { if (e.target.closest('#valveList button, #valveList select')) setTimeout(afterValve, 30); });
    window.addEventListener('resize', () => applyLayout());
  }

  function act(a) {
    const S = W.S;
    if (a === 'select' || a === 'wire' || a === 'node' || a === 'erase') { S.setTool(a); hint({ select: '', wire: 'Drag across cells to draw a straight connection line.', node: 'Click a free cell to place a node.', erase: 'Click cells to erase them.' }[a]); }
    else if (a === 'zin') { if (window.BohemeScene3D && BohemeScene3D.active()) BohemeScene3D.zoomBy(1.3); else S.zoomBy(1.25); }
    else if (a === 'zout') { if (window.BohemeScene3D && BohemeScene3D.active()) BohemeScene3D.zoomBy(0.77); else S.zoomBy(0.8); }
    else if (a === 'fit') { if (window.BohemeScene3D && BohemeScene3D.active()) BohemeScene3D.fit(); else S.fit(); }
    else if (a === 'focus') { document.getElementById('wb').classList.toggle('wb-focus'); setTimeout(() => S.fit(), 80); }
    else if (a === 'card') { W.card = !W.card; save(); renderCard(); markTools(); }
    else if (a === 'probes' || a === 'labels') { W[a + 'Off'] = !W[a + 'Off']; save(); markTools(); if (window.BohemeScene3D) BohemeScene3D.rebuild(); }
    else if (a.startsWith('v-')) { if (window.BohemeScene3D && BohemeScene3D.active()) BohemeScene3D.view(a.slice(2)); else S.fit(); }
    else if (a === 'anim') { S.setAnim(!S.state.anim); markTools(); }
    else if (a.startsWith('m-')) setMode(a.slice(2));
    else if (a === 'undo') S.undo();
    else if (a === 'redo') S.redo();
    else if (a === 'open') { const fi = $('#fileInput'); if (fi) fi.click(); }
    else if (a === 'save') { if (typeof saveDataToFile === 'function') saveDataToFile(); addHistory('file', 'Saved the project file'); }
    else if (a === 'paste') { if (typeof openPasteDialog === 'function') openPasteDialog(); }
    else if (a === 'csv') { if (typeof exportResultsCSV === 'function') exportResultsCSV(); }
    else if (a === 'toggleL') { W.hideL = !W.hideL; applyLayout(); save(); setTimeout(() => S.fit(), 80); }
    else if (a === 'toggleR') { W.hideR = !W.hideR; applyLayout(); save(); setTimeout(() => S.fit(), 80); }
    else if (a === 'toggleB') { W.hideB = !W.hideB; applyLayout(); save(); setTimeout(() => S.fit(), 80); }
  }

  function setMode(m) { W.mode = m; save(); W.S.setColorMode(m); markTools(); renderCard(); }
  function markTools(t) {
    const S = W.S, st = S.state;
    const tool = st.tool;
    $$('[data-act="select"],[data-act="wire"],[data-act="node"],[data-act="erase"]').forEach(b => b.classList.toggle('on', b.dataset.act === tool));
    $$('#wbModes [data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === W.mode));
    $$('[data-act^="m-"]').forEach(b => b.classList.toggle('on', b.dataset.act === 'm-' + W.mode));
    $$('[data-act="anim"]').forEach(b => b.classList.toggle('on', st.anim));
    $$('[data-act="card"]').forEach(b => b.classList.toggle('on', W.card));
    $$('[data-act="probes"]').forEach(b => b.classList.toggle('on', !W.probesOff));
    $$('[data-act="labels"]').forEach(b => b.classList.toggle('on', !W.labelsOff));
    $$('[data-act="toggleL"]').forEach(b => b.classList.toggle('on', !W.hideL));
    $$('[data-act="toggleB"]').forEach(b => b.classList.toggle('on', !W.hideB));
    $$('[data-act="focus"]').forEach(b => b.classList.toggle('on', $('#wb').classList.contains('wb-focus')));
    if (tool === 'place' && st.place) hint('Click a free cell to place: ' + S.KIND[st.place].title + ' · Esc cancels');
  }
  function hint(t) { const h = $('#wbHint'); if (h) { h.innerHTML = t ? icon('info', 14) + ' ' + esc(t) : ''; h.classList.toggle('on', !!t); } }
  function tabs() {
    W.tabRt = W.tabRt || 'home';
    $$('[data-rt]').forEach(b => b.classList.toggle('on', b.dataset.rt === W.tabRt));
    $$('[data-rtab]').forEach(g => g.classList.toggle('vis', g.dataset.rtab === W.tabRt));
    $$('[data-tl]').forEach(b => b.classList.toggle('on', b.dataset.tl === W.tabL));
    $$('[data-pl]').forEach(p => p.classList.toggle('on', p.dataset.pl === W.tabL));
    $$('[data-tr]').forEach(b => b.classList.toggle('on', b.dataset.tr === W.tabR));
    $$('[data-pr]').forEach(p => p.classList.toggle('on', p.dataset.pr === W.tabR));
    $$('[data-tb]').forEach(b => b.classList.toggle('on', b.dataset.tb === W.tabB));
    $$('[data-pb]').forEach(p => p.classList.toggle('on', p.dataset.pb === W.tabB));
    const ba = $('#wbBActions');
    if (ba) ba.innerHTML = W.tabB === 'results' ? `<button class="wb-btn" data-bact="csv">${icon('csv', 14)} Export CSV</button>` : W.tabB === 'history' ? `<button class="wb-btn" data-bact="clearh">Clear</button>` : '';
    if (ba) ba.querySelectorAll('[data-bact]').forEach(b => b.addEventListener('click', () => { if (b.dataset.bact === 'csv') act('csv'); else { W.history = []; renderHistory(); } }));
  }
  function applyLayout() {
    const wb = $('#wb');
    if (!wb) return;
    const hd = document.querySelector('header');
    wb.style.setProperty('--wb-top', (hd ? hd.offsetHeight : 56) + 'px');
    wb.style.setProperty('--wb-bottom-h', (W.bottomH || 190) + 'px');
    wb.style.setProperty('--wb-outline', (W.outline || 52) + '%');
    wb.classList.toggle('wb-hide-l', !!W.hideL);
    wb.classList.toggle('wb-hide-r', !!W.hideR);
    wb.classList.toggle('wb-hide-b', !!W.hideB);
  }

  function model() { return W.S.state.model; }
  function results() { const st = W.S.state; return st.results && !st.stale ? st.results : null; }
  function resOf(name) { const r = results(); return r ? (r.components || []).find(c => String(c.name).trim() === name) : null; }
  function nodeRes(name) { const r = results(); return r ? (r.nodes || []).find(n => String(n.id).trim().toUpperCase() === String(name).toUpperCase()) : null; }
  function keyOfName(name) { if (!name) return null; const M = model(); if (!M) return null; const c = M.comps.find(x => x.name === name); if (c) return c.cell.key; const n = M.nodes.find(x => x.name.toUpperCase() === name.toUpperCase()); return n ? n.cell.key : null; }
  function nameOfKey(k) { const t = (typeof D !== 'undefined' && D[k]) || ''; return String(t).trim().split(/\s+/)[0] || k; }
  function cellName(k) { const [r, c] = k.split(',').map(Number); return typeof cn === 'function' ? cn(r, c) : k; }
  function catOf(kk) { for (const id in CAT) if (CAT[id].kinds.includes(kk)) return id; return 'lines'; }
  function fluidLabel() { const f = window.BohemeFluid; if (!f) return 'Fluid'; const p = f.PRESETS[f.state.id]; return p ? p.label.replace(/ – BOHEME default/, '') : 'Custom fluid'; }

  function circuits() {
    const M = model();
    const parent = new Map();
    const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    const add = x => { if (!parent.has(x)) parent.set(x, x); };
    const union = (a, b) => { add(a); add(b); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    for (const c of M.comps) {
      const ns = c.ends.map(e => String(e.node.text).split(/\s+/)[0].toUpperCase()).filter(n => n !== 'S');
      ns.forEach(add);
      if (ns.length === 2) union(ns[0], ns[1]);
    }
    const groups = new Map();
    for (const c of M.comps) {
      const ns = c.ends.map(e => String(e.node.text).split(/\s+/)[0].toUpperCase()).filter(n => n !== 'S');
      if (!ns.length) continue;
      const r = find(ns[0]);
      if (!groups.has(r)) groups.set(r, { comps: [], nodes: new Set() });
      groups.get(r).comps.push(c);
      ns.forEach(n => groups.get(r).nodes.add(n));
    }
    const list = [...groups.values()].filter(g => g.comps.length > 1).sort((a, b) => b.comps.length - a.comps.length);
    return list.map((g, i) => {
      const pumps = g.comps.filter(c => CAT.pumps.kinds.includes(c.kk)).map(c => c.name);
      const keys = g.comps.map(c => c.cell.key).concat(M.nodes.filter(n => g.nodes.has(n.name.toUpperCase())).map(n => n.cell.key));
      return { id: 'circ' + i, title: 'Circuit ' + (i + 1) + (pumps.length ? ' · ' + pumps.slice(0, 2).join(', ') + (pumps.length > 2 ? '…' : '') : ''), comps: g.comps, keys };
    });
  }

  function itemMeta(c) {
    const r = resOf(c.name);
    if (r) return fmt(Math.abs(Number(r.q)), 2) + ' m³/h';
    const v = W.S.fieldValues(c.kk, c.tok) || [];
    const f = (W.S.KIND[c.kk] || { fields: [] }).fields;
    return f.slice(0, 2).map((x, i) => (Number.isFinite(v[i]) ? +Number(v[i]).toPrecision(4) : '–') + (x[2] && x[2] !== '–' ? ' ' + x[2] : '')).join(' · ');
  }

  const STAT = {
    ok: '<svg class="wb-stat" viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="#2e7d32" stroke-width="2"/></svg>',
    need: '<svg class="wb-stat" viewBox="0 0 12 12"><path d="M7 1L2.5 7H6l-1 4 4.5-6H6z" fill="#f2b600" stroke="#8a6500" stroke-width=".6"/></svg>',
    err: '<svg class="wb-stat" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="#c62828" stroke-width="2"/></svg>',
    none: '<svg class="wb-stat" viewBox="0 0 12 12"></svg>'
  };
  function renderTree() {
    const box = $('#wbTree');
    const M = model();
    if (!box || !M) return;
    const S = W.S;
    const q = W.search;
    const match = t => !q || String(t).toLowerCase().includes(q);
    const vs = typeof ValveRegistry !== 'undefined' ? ValveRegistry.valves : new Map();
    const solved = !!results();
    const hasErr = M.comps.some(c => c.error);
    const solStat = hasErr ? 'err' : solved ? 'ok' : 'need';
    let h = '';
    W._groupKeys = {};
    const open = id => !W.collapsed['t-' + id];
    const branch = (id, ic, title, meta, stat, inner, attrs) => {
      h += `<div class="wb-tg${open(id) ? ' open' : ''}" data-g="${id}"><div class="wb-ti${attrs && attrs.hl ? ' hl' : ''}" ${attrs && attrs.data ? attrs.data : `data-tog="${id}"`}><i class="wb-tw">${icon('chev', 11)}</i>${STAT[stat || 'none']}${icon(ic, 15)}<span>${title}</span>${meta ? `<em>${meta}</em>` : ''}${attrs && attrs.eye !== undefined ? `<button class="wb-eye${attrs.eye ? ' off' : ''}" data-eye="${id}" title="Show / hide in the graphics window">${icon(attrs.eye ? 'eyeoff' : 'eye', 13)}</button>` : ''}</div><div class="wb-tc">`;
      inner();
      h += '</div></div>';
    };
    const leaf = (attrs, stat, iconHTML, title, meta, cls) => { h += `<div class="wb-ti wb-leaf${cls || ''}" ${attrs}><i class="wb-tw"></i>${STAT[stat || 'none']}${iconHTML}<span>${title}</span>${meta ? `<em>${meta}</em>` : ''}</div>`; };
    const group = (gid, title, ic, list, keys, render) => {
      W._groupKeys[gid] = keys;
      branch(gid, ic, title, String(list.length), list.some(x => x.error) ? 'err' : 'ok', () => list.forEach(render), { eye: W.hiddenGroups.has(gid), hl: W.hl && W.hl.id === gid, data: `data-gk="${gid}"` });
    };
    branch('project', 'project', 'Project', '', 'none', () => {
      branch('model', 'project', 'Model (A320 hydraulic network)', '', hasErr ? 'err' : 'ok', () => {
        leaf('data-goto="solver"', 'ok', icon('fluid', 15), 'Fluid Properties', esc(fluidLabel().split(' (')[0]));
        branch('network', 'nodes', 'Network', `${M.comps.length} components`, hasErr ? 'err' : 'ok', () => {
          const circ = circuits().filter(c => !q || c.comps.some(x => match(x.name)));
          W._circ = Object.fromEntries(circ.map(c => [c.id, c.keys]));
          group('circuits', 'Circuits', 'circuit', circ, circ.flatMap(c => c.keys), c => leaf(`data-hl="${c.id}"`, 'ok', icon('circuit', 14), esc(c.title), String(c.comps.length), W.hl && W.hl.id === c.id ? ' hl' : ''));
          for (const id in CAT) {
            const comps = M.comps.filter(c => catOf(c.kk) === id && match(c.name)).sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }));
            group(id, CAT[id].title, CAT[id].icon, comps, comps.map(c => c.cell.key), c => {
              const v = vs.get(c.name);
              leaf(`data-k="${c.cell.key}"`, c.error ? 'err' : 'ok', S.symbolSVG(c.kk, 26, 18), esc(c.name) + (v ? ` <b class="wb-vs ${v.open ? 'on' : 'off'}">${v.open ? 'open' : 'closed'}</b>` : ''), esc(itemMeta(c)), (W.sel === c.cell.key ? ' sel' : '') + (c.error ? ' err' : ''));
            });
          }
          const nodes = M.nodes.filter(n => match(n.name)).sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }));
          group('nodes', 'Nodes & Reservoirs', 'nodes', nodes, nodes.map(n => n.cell.key), n => {
            const r = nodeRes(n.name);
            leaf(`data-k="${n.cell.key}"`, 'ok', S.nodeSVG(n.name[0].toUpperCase() === 'S', 15), esc(n.name), r ? fmt(Number(r.ptot), 2) + ' bar' : n.nr ? 'set ' + fmt(n.pset, 1) + ' bar' : 'z ' + fmt(n.z, 2) + ' m', W.sel === n.cell.key ? ' sel' : '');
          });
        });
        branch('analysis', 'solver', 'Steady-State Hydraulics (A)', '', solStat, () => {
          leaf('data-goto="solver"', 'ok', icon('gear', 15), 'Analysis Settings', 'λU ' + esc(($('#itLambda') || {}).value || '') + ' · niter ' + esc(($('#itNiter') || {}).value || ''));
          branch('solution', 'bolt', 'Solution (A6)', solved ? 'solved' : '', solStat, () => {
            const K = kpis();
            leaf('data-goto="analysis"', solStat, icon('info', 15), 'Solution Information', K ? K.it + ' iterations' : '');
            [['p', 'pressure', 'Total Pressure', K ? fmt(K.pmin, 1) + ' … ' + fmt(K.pmax, 1) + ' bar' : ''], ['u', 'speed', 'Flow Velocity', K ? 'max ' + fmt(K.umax, 2) + ' m/s' : ''], ['q', 'flow', 'Volume Flow', K ? 'pumps ' + fmt(K.qpump, 2) + ' m³/h' : '']].forEach(([m, ic, t, meta]) => leaf(`data-res="${m}"`, solved ? 'ok' : 'need', icon(ic, 15), t, meta, W.mode === m && solved ? ' sel' : ''));
          });
        });
      });
    });
    box.innerHTML = h;
    box.querySelectorAll('[data-tog]').forEach(el => el.addEventListener('click', () => { const g = el.parentElement; g.classList.toggle('open'); W.collapsed['t-' + g.dataset.g] = !g.classList.contains('open'); save(); }));
    box.querySelectorAll('[data-gk]').forEach(el => el.addEventListener('click', e => {
      if (e.target.closest('[data-eye]')) return;
      const g = el.parentElement;
      if (e.target.closest('.wb-tw')) { g.classList.toggle('open'); W.collapsed['t-' + g.dataset.g] = !g.classList.contains('open'); save(); return; }
      const gid = el.dataset.gk;
      if (W.hl && W.hl.id === gid) { W.hl = null; S.highlight(null); } else { W.hl = { id: gid }; S.highlight(W._groupKeys[gid]); }
      renderTree();
    }));
    box.querySelectorAll('[data-eye]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const g = b.dataset.eye;
      if (W.hiddenGroups.has(g)) W.hiddenGroups.delete(g); else W.hiddenGroups.add(g);
      const dim = new Set();
      W.hiddenGroups.forEach(id => (W._groupKeys[id] || []).forEach(k => dim.add(k)));
      S.state.dim = dim;
      S.redraw();
    }));
    box.querySelectorAll('[data-hl]').forEach(el => el.addEventListener('click', () => {
      const id = el.dataset.hl;
      if (W.hl && W.hl.id === id) { W.hl = null; S.highlight(null); } else { W.hl = { id }; S.highlight(W._circ[id]); }
      renderTree();
    }));
    box.querySelectorAll('[data-k]').forEach(el => el.addEventListener('click', () => S.focusKey(el.dataset.k, 0.95)));
    box.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', () => { W.tabR = el.dataset.goto; tabs(); save(); crumb(); }));
    box.querySelectorAll('[data-res]').forEach(el => el.addEventListener('click', () => { setMode(el.dataset.res); W.tabR = 'analysis'; tabs(); save(); crumb(); renderTree(); }));
  }

  function propHead(svg, title, sub, badges) {
    return `<div class="wb-ph"><div class="wb-ph-ic">${svg}</div><div class="wb-ph-t"><b>${esc(title)}</b><small>${sub}</small><div class="wb-badges">${badges || ''}</div></div></div>`;
  }
  function metricRow(label, val, unit, frac, cls) {
    return `<div class="wb-met"><span>${label}</span><b>${val}<small> ${unit}</small></b>${frac != null ? `<i class="wb-mbar ${cls || ''}"><s style="width:${Math.max(2, Math.min(100, frac * 100)).toFixed(1)}%"></s></i>` : ''}</div>`;
  }

  function renderProps() {
    const box = $('#wbProps');
    if (!box) return;
    const S = W.S;
    const k = W.sel;
    const t = k && typeof D !== 'undefined' ? D[k] : null;
    box.innerHTML = '';
    if (!t) return renderOverview(box);
    if (S.isComponentText(t)) return renderComp(box, k, t);
    if (S.isNodeText(t)) return renderNode(box, k, t);
    box.innerHTML = propHead(icon('wire', 30), S.isWireText(t) ? 'Connection line' : 'Text cell', 'Cell ' + cellName(k)) + `<div class="wb-sec"><div class="wb-sec-b"><div class="wb-note">Raw cell content: <code>${esc(t)}</code></div><button class="wb-btn danger" id="wbDel">${icon('trash', 14)} Delete</button></div></div>`;
    $('#wbDel').addEventListener('click', () => { S.commit([[k, null]], 'Deleted line at ' + cellName(k)); S.select(null); });
  }

  function renderComp(box, k, t) {
    const S = W.S;
    const tok = S.parseTok(t);
    const kk = S.kindKey(tok.name);
    const info = S.KIND[kk];
    const comp = model() && model().comps.find(c => c.cell.key === k);
    const vs = typeof ValveRegistry !== 'undefined' ? ValveRegistry.valves.get(tok.name) : null;
    const r = resOf(tok.name);
    const fam = info ? { pipe: 'Line', res: 'Resistance', valve: 'Valve', pump: 'Pump', actuator: 'Consumer' }[info.family] : 'Unknown';
    let badges = `<i class="wb-bdg">${fam}</i>`;
    if (vs) badges += `<i class="wb-bdg ${vs.open ? 'ok' : 'bad'}">${vs.open ? 'open' : 'closed'}</i>`;
    if (comp && comp.error) badges += `<i class="wb-bdg bad">${esc(comp.error)}</i>`;
    if (r) badges += `<i class="wb-bdg ok">solved</i>`;
    else if (S.state.stale) badges += '<i class="wb-bdg warn">result outdated</i>';
    box.innerHTML = propHead(S.symbolSVG(kk || '?', 70, 50), tok.name, (info ? info.title : 'Unknown component') + ' · cell ' + cellName(k), badges);
    const g = section(box, 'p-general', 'General', 'info', '');
    g.innerHTML = `<div class="wb-f"><label>Name</label><input id="wbName" value="${esc(tok.name)}"></div>
<div class="wb-f"><label>Type</label><div class="wb-ro">${info ? info.title : '–'}</div></div>
<div class="wb-f"><label>Orientation</label><div class="wb-seg" id="wbOr">${['^', '>', 'v', '<'].map(o => `<button data-o="${o}" class="${(tok.orient || '^') === o ? 'on' : ''}">${{ '^': '↑', '>': '→', 'v': '↓', '<': '←' }[o]}</button>`).join('')}</div></div>`;
    const p = section(box, 'p-params', 'Parameters', 'gear', '');
    const vals = info ? S.fieldValues(kk, tok) : tok.nums;
    if (info) p.innerHTML = info.fields.map((f, i) => `<div class="wb-f"><label>${f[1]}</label><div class="wb-in"><input data-i="${i}" value="${vals[i] != null ? +Number(vals[i]).toPrecision(10) : f[3]}"><span>${f[2] === '–' ? '' : f[2]}</span></div></div>`).join('');
    else p.innerHTML = '<div class="wb-note">Unknown component type – edit the token in the cell grid.</div>';
    const apply = () => {
      const nm = $('#wbName').value.trim() || tok.name;
      if (S.kindOf(nm) !== S.kindOf(tok.name)) { $('#wbName').classList.add('bad'); return; }
      const nv = info ? $$('input[data-i]', p).map(i => Number(String(i.value).replace(',', '.'))) : tok.nums;
      if (nv.some(v => !Number.isFinite(v))) { $$('input[data-i]', p).forEach(i => i.classList.toggle('bad', !Number.isFinite(Number(String(i.value).replace(',', '.'))))); return; }
      S.commit([[k, S.buildTok(nm, nv, tok.orient, tok.rest)]], 'Changed ' + nm);
    };
    $('#wbName').addEventListener('change', apply);
    $$('input[data-i]', p).forEach(i => i.addEventListener('change', apply));
    $$('#wbOr [data-o]').forEach(b => b.addEventListener('click', () => S.commit([[k, S.buildTok(tok.name, info ? S.fieldValues(kk, tok) : tok.nums, b.dataset.o, tok.rest)]], 'Rotated ' + tok.name)));
    const cs = section(box, 'p-conn', 'Connection', 'nodes', '');
    if (comp && comp.ends.length === 2) {
      cs.innerHTML = `<div class="wb-conn">${comp.ends.map((e, i) => { const nm = String(e.node.text).split(/\s+/)[0]; const nr = nodeRes(nm); return `<button class="wb-chip" data-k="${e.node.key}">${W.S.nodeSVG(nm[0].toUpperCase() === 'S', 16)}<b>${esc(nm)}</b>${nr ? `<small>${fmt(Number(nr.ptot), 1)} bar</small>` : ''}</button>${i === 0 ? `<span class="wb-arrow">${icon('chev', 16)}</span>` : ''}`; }).join('')}</div>${r ? `<div class="wb-note">Flow direction: <b>${Number(r.q) >= 0 ? esc(r.n1) + ' → ' + esc(r.n2) : esc(r.n2) + ' → ' + esc(r.n1)}</b></div>` : ''}`;
      $$('[data-k]', cs).forEach(b => b.addEventListener('click', () => W.S.focusKey(b.dataset.k, 1)));
    } else cs.innerHTML = `<div class="wb-warnbox">${icon('warn', 15)} ${esc(comp ? comp.error : 'not analysed')}. Connect the component to two nodes with straight lines.</div>`;
    if (vs) {
      const v = section(box, 'p-valve', 'Valve state', 'valve', '');
      v.innerHTML = `<div class="wb-f"><label>State</label><button class="wb-switch ${vs.open ? 'on' : ''}" id="wbVSw"><i></i><span>${vs.open ? 'Open' : 'Closed'}</span></button></div>${vs.kind === 'RK' ? `<div class="wb-f"><label>ON value kv</label><div class="wb-seg" id="wbRk"><button data-v="0.1" class="${vs.rkSet === '0.1' ? 'on' : ''}">0.1</button><button data-v="0.54" class="${vs.rkSet === '0.54' ? 'on' : ''}">0.54</button></div></div>` : ''}<div class="wb-note">Current solver value: <code>${esc(vs.value)}</code></div>`;
      $('#wbVSw').addEventListener('click', () => { vs.toggle(); addHistory('edit', tok.name + (vs.open ? ' opened' : ' closed')); afterValve(); });
      $$('#wbRk [data-v]').forEach(b => b.addEventListener('click', () => { vs.setRkSet(b.dataset.v); addHistory('edit', tok.name + ' ON value ' + b.dataset.v); afterValve(); }));
    }
    const ds = section(box, 'p-desc', 'Description', 'info', '');
    let desc = '';
    try { desc = localStorage.getItem('boheme_comp_' + tok.name) || ''; } catch (e) { }
    if (!desc) { const it = $$('.comp-item').find(x => (x.querySelector('.type') || {}).textContent === tok.name); if (it) desc = it.querySelector('.desc').value; }
    ds.innerHTML = `<textarea id="wbDesc" rows="2" placeholder="Notes, data source, part number…">${esc(desc)}</textarea>`;
    $('#wbDesc').addEventListener('change', e => { try { localStorage.setItem('boheme_comp_' + tok.name, e.target.value); } catch (er) { } const it = $$('.comp-item').find(x => (x.querySelector('.type') || {}).textContent === tok.name); if (it) it.querySelector('.desc').value = e.target.value; });
    if (r) {
      const sc = W.S.state.scales;
      const rs = section(box, 'p-res', 'Results', 'chart', '', { cls: 'wb-sec-res' });
      const aq = Math.abs(Number(r.q)), u = Math.abs(Number(r.u)), re = Number(r.reD);
      rs.innerHTML = metricRow('Flow rate Q', fmt(aq), 'm³/h', sc ? aq / sc.qmax : null, 'q') + `<div class="wb-sub2">${fmt(aq * 1000 / 60, 2)} l/min</div>` +
        metricRow('Velocity U', fmt(u), 'm/s', sc ? u / sc.umax : null, 'u') +
        metricRow('Total Δp', fmt(Number(r.dp), 3), 'bar', null) +
        metricRow('Reynolds', fmt(re, 0), '', null) + `<div class="wb-sub2"><i class="wb-bdg ${re < 2000 ? 'ok' : re < 4000 ? 'warn' : 'info'}">${W.S.regime(re)}</i></div>` +
        metricRow('Hydraulic power', fmt(Number(r.pow), 3), 'kW', null) +
        metricRow('Dynamic pressure q', fmt(Number(r.qdyn), 5), 'bar', null);
    }
    const dz = document.createElement('div');
    dz.className = 'wb-actions';
    dz.innerHTML = `<button class="wb-btn" id="wbFocus">${icon('locate', 14)} Show</button><button class="wb-btn" id="wbRot">${icon('rotate', 14)} Rotate</button><button class="wb-btn danger" id="wbDel">${icon('trash', 14)} Delete</button>`;
    box.appendChild(dz);
    $('#wbFocus').addEventListener('click', () => S.focusKey(k, 1.1));
    $('#wbRot').addEventListener('click', () => S.rotateSel());
    $('#wbDel').addEventListener('click', () => { S.commit([[k, null]], 'Deleted ' + tok.name); S.select(null); });
    const raw = document.createElement('div');
    raw.className = 'wb-raw';
    raw.innerHTML = `<small>Solver token</small><code>${esc(t)}</code>`;
    box.appendChild(raw);
  }

  function renderNode(box, k, t) {
    const S = W.S;
    const p = String(t).split(/\s+/);
    const ground = p[0][0].toUpperCase() === 'S';
    const nr = /^nr/i.test(p[0]);
    const res = nodeRes(p[0]);
    box.innerHTML = propHead(S.nodeSVG(ground, 46), p[0], (ground ? 'Reservoir / ambient' : nr ? 'Pressure set-point node' : 'Node') + ' · cell ' + cellName(k), res ? '<i class="wb-bdg ok">solved</i>' : '');
    const g = section(box, 'p-general', 'General', 'info', '');
    g.innerHTML = `<div class="wb-f"><label>Name</label><input id="wbNName" value="${esc(p[0])}"></div><div class="wb-f"><label>${nr ? 'Set total pressure' : 'Elevation z'}</label><div class="wb-in"><input id="wbNZ" value="${p[1] != null ? esc(p[1]) : '0'}"><span>${nr ? 'bar' : 'm'}</span></div></div>`;
    const apply = () => { const z = Number(String($('#wbNZ').value).replace(',', '.')); if (!Number.isFinite(z)) { $('#wbNZ').classList.add('bad'); return; } S.commit([[k, [$('#wbNName').value.trim() || p[0], String(z)].concat(p.slice(2)).join(' ')]], 'Changed node ' + p[0]); };
    $('#wbNName').addEventListener('change', apply);
    $('#wbNZ').addEventListener('change', apply);
    const M = model();
    const conn = M ? M.comps.filter(c => c.ends.some(e => e.node.key === k)) : [];
    const cs = section(box, 'p-conn', 'Connected components', 'nodes', '');
    cs.innerHTML = conn.length ? conn.map(c => { const r = resOf(c.name); return `<button class="wb-crow" data-k="${c.cell.key}">${S.symbolSVG(c.kk, 30, 21)}<b>${esc(c.name)}</b><em>${r ? fmt(Math.abs(Number(r.q)), 3) + ' m³/h' : esc(S.KIND[c.kk] ? S.KIND[c.kk].title : '')}</em></button>`; }).join('') : '<div class="wb-note">No component is connected to this cell.</div>';
    $$('[data-k]', cs).forEach(b => b.addEventListener('click', () => S.focusKey(b.dataset.k, 1)));
    if (res) {
      const sc = S.state.scales;
      const rs = section(box, 'p-res', 'Results', 'chart', '', { cls: 'wb-sec-res' });
      rs.innerHTML = metricRow('Total pressure', fmt(Number(res.ptot), 3), 'bar', sc ? (Number(res.ptot) - sc.pmin) / ((sc.pmax - sc.pmin) || 1) : null, 'p') + metricRow('Ptot − ρ·g·z', fmt(Number(res.pstat), 3), 'bar', null) + metricRow('Elevation', fmt(Number(res.z), 2), 'm', null) + metricRow('In psi', fmt(Number(res.ptot) * 14.5037738, 0), 'psi', null);
    }
    const dz = document.createElement('div');
    dz.className = 'wb-actions';
    dz.innerHTML = `<button class="wb-btn" id="wbFocus">${icon('locate', 14)} Show</button><button class="wb-btn danger" id="wbDel">${icon('trash', 14)} Delete</button>`;
    box.appendChild(dz);
    $('#wbFocus').addEventListener('click', () => S.focusKey(k, 1.1));
    $('#wbDel').addEventListener('click', () => { S.commit([[k, null]], 'Deleted node ' + p[0]); S.select(null); });
  }

  function kpis() {
    const r = results();
    if (!r) return null;
    const comps = r.components || [];
    const pumps = comps.filter(c => /^(P|UPM|UCP|UPT)/i.test(String(c.type || '')));
    let umax = 0, uname = '';
    comps.forEach(c => { const u = Math.abs(Number(c.u)); if (u > umax && u < 1e3) { umax = u; uname = c.name; } });
    const ps = (r.nodes || []).map(n => Number(n.ptot)).filter(Number.isFinite);
    const nmax = Number((document.getElementById('itNiter') || {}).value || 1e9), dcrit = Number((document.getElementById('itDUcrit') || {}).value || 0);
    return { ppow: pumps.reduce((s, c) => s + Math.abs(Number(c.pow) || 0), 0), qpump: pumps.reduce((s, c) => s + Math.abs(Number(c.q) || 0), 0), umax, uname, pmin: Math.min(...ps), pmax: Math.max(...ps), it: r.iterations, res: Number(r.residual), conv: !(r.iterations >= nmax && Number(r.residual) > dcrit), ptu: r.ptu };
  }

  function renderOverview(box) {
    const M = model();
    const K = kpis();
    const S = W.S;
    box.innerHTML = propHead(icon('project', 34), 'A320 hydraulic network', 'Project · nothing selected', K ? `<i class="wb-bdg ${K.conv ? 'ok' : 'bad'}">${K.conv ? 'converged' : 'not converged'}</i>` : '<i class="wb-bdg warn">not solved yet</i>');
    if (!M) return;
    const counts = {};
    M.comps.forEach(c => { const id = catOf(c.kk); counts[id] = (counts[id] || 0) + 1; });
    const n = section(box, 'o-net', 'Network', 'nodes', '');
    n.innerHTML = Object.keys(CAT).map(id => `<div class="wb-kv2">${icon(CAT[id].icon, 15)}<span>${CAT[id].title}</span><b>${counts[id] || 0}</b></div>`).join('') + `<div class="wb-kv2">${icon('nodes', 15)}<span>Nodes & reservoirs</span><b>${M.nodes.length}</b></div><div class="wb-kv2">${icon('circuit', 15)}<span>Circuits</span><b>${circuits().length}</b></div>`;
    const f = section(box, 'o-fluid', 'Fluid', 'fluid', '');
    const T = Number(($('#fluidT') || {}).value), rho = Number(($('#pRho') || {}).value), mue = Number(($('#pMue') || {}).value);
    f.innerHTML = `<div class="wb-kv2"><span>Model</span><b class="wb-wrap">${esc(fluidLabel())}</b></div><div class="wb-kv2"><span>Temperature</span><b>${fmt(T, 1)} °C</b></div><div class="wb-kv2"><span>Density ρ</span><b>${fmt(rho, 2)} kg/m³</b></div><div class="wb-kv2"><span>Viscosity μ</span><b>${fmt(mue, 5)} Pa·s</b></div><div class="wb-kv2"><span>Kinematic ν</span><b>${fmt(mue / rho * 1e6, 2)} mm²/s</b></div><button class="wb-btn" id="wbToSolver">${icon('solver', 14)} Edit fluid & solver</button>`;
    $('#wbToSolver').addEventListener('click', () => { W.tabR = 'solver'; tabs(); save(); });
    const s = section(box, 'o-sol', 'Last solution', 'chart', '');
    s.innerHTML = K ? `<div class="wb-kpi2">${kpiTile('Pump power', fmt(K.ppow, 2), 'kW')}${kpiTile('Pump flow', fmt(K.qpump, 2), 'm³/h')}${kpiTile('Max. velocity', fmt(K.umax, 2), 'm/s', K.uname)}${kpiTile('Pressure range', fmt(K.pmin, 1) + '–' + fmt(K.pmax, 1), 'bar')}</div>` : `<div class="wb-empty">${icon('play', 28)}<div>Press <b>Solve</b> to compute pressures and flows.</div><button class="wb-btn primary" id="wbSolve2">${icon('play', 14)} Solve now</button></div>`;
    const s2 = $('#wbSolve2');
    if (s2) s2.addEventListener('click', () => window.compute());
    const ch = section(box, 'o-check', 'Model check', 'ok', '');
    const issues = checks();
    ch.innerHTML = issues.length ? `<div class="wb-warnbox">${icon('warn', 15)} ${issues.filter(i => i.lvl === 'err').length} errors, ${issues.filter(i => i.lvl === 'warn').length} warnings – see “Model check” below.</div>` : `<div class="wb-okbox">${icon('ok', 15)} Topology consistent: every component is connected to two nodes.</div>`;
  }
  function kpiTile(l, v, u, sub) { return `<div class="wb-kpi"><span>${l}</span><b>${v}<small> ${u}</small></b>${sub ? `<em>${esc(sub)}</em>` : ''}</div>`; }

  function renderAnalysis() {
    const box = $('#wbAnalysis');
    if (!box) return;
    const K = kpis();
    box.innerHTML = '';
    if (!K) { box.innerHTML = `<div class="wb-empty">${icon('chart', 30)}<div>${W.S.state.stale ? 'The model changed since the last solution.' : 'No solution yet.'} Press <b>Solve</b> to get the analysis.</div><button class="wb-btn primary" id="wbSolve3">${icon('play', 14)} Solve now</button></div>`; $('#wbSolve3').addEventListener('click', () => window.compute()); return; }
    const r = results();
    const a = section(box, 'a-kpi', 'Key figures', 'chart', '');
    a.innerHTML = `<div class="wb-kpi2">${kpiTile('Pump power', fmt(K.ppow, 2), 'kW')}${kpiTile('Pump flow', fmt(K.qpump, 2), 'm³/h')}${kpiTile('Max. velocity', fmt(K.umax, 2), 'm/s', K.uname)}${kpiTile('Pressure', fmt(K.pmin, 1) + '–' + fmt(K.pmax, 1), 'bar')}${kpiTile('Iterations', K.it, '', 'residual ' + K.res.toExponential(1))}${K.ptu && K.ptu.present ? kpiTile('PTU', K.ptu.active ? 'active' : 'off', '', K.ptu.dpOffPsi != null ? 'Δp w/o PTU ' + Math.round(K.ptu.dpOffPsi) + ' psi' : '') : ''}</div>`;
    const comps = (r.components || []).slice();
    const top = (title, id, ic, arr, val, unit, cls) => {
      const b = section(box, id, title, ic, '');
      const mx = Math.max(...arr.map(val), 1e-12);
      b.innerHTML = arr.map(c => `<button class="wb-bar" data-n="${esc(c.name)}"><span>${esc(c.name)}</span><i class="wb-mbar ${cls}"><s style="width:${(100 * val(c) / mx).toFixed(1)}%"></s></i><b>${fmt(val(c), 3)} ${unit}</b></button>`).join('');
      $$('[data-n]', b).forEach(x => x.addEventListener('click', () => { const k = keyOfName(x.dataset.n); if (k) W.S.focusKey(k, 1); }));
    };
    top('Largest pressure losses', 'a-dp', 'pressure', comps.filter(c => !/^(P|UPM|UCP|UPT)/i.test(String(c.type || ''))).sort((x, y) => Math.abs(Number(y.dp)) - Math.abs(Number(x.dp))).slice(0, 8), c => Math.abs(Number(c.dp)), 'bar', 'p');
    top('Highest velocities', 'a-u', 'speed', comps.filter(c => Math.abs(Number(c.u)) < 1e3).sort((x, y) => Math.abs(Number(y.u)) - Math.abs(Number(x.u))).slice(0, 8), c => Math.abs(Number(c.u)), 'm/s', 'u');
    top('Largest flows', 'a-q', 'flow', comps.slice().sort((x, y) => Math.abs(Number(y.q)) - Math.abs(Number(x.q))).slice(0, 8), c => Math.abs(Number(c.q)), 'm³/h', 'q');
    const vs = typeof ValveRegistry !== 'undefined' ? [...ValveRegistry.valves.values()] : [];
    if (vs.length) {
      const v = section(box, 'a-valves', 'Valve states', 'valve', '');
      v.innerHTML = vs.map(x => `<div class="wb-f"><label>${esc(x.name)}</label><button class="wb-switch ${x.open ? 'on' : ''}" data-v="${esc(x.name)}"><i></i><span>${x.open ? 'Open' : 'Closed'}</span></button></div>`).join('');
      $$('[data-v]', v).forEach(b => b.addEventListener('click', () => { const x = ValveRegistry.valves.get(b.dataset.v); if (x) { x.toggle(); addHistory('edit', x.name + (x.open ? ' opened' : ' closed')); afterValve(); } }));
    }
  }

  function afterValve() {
    const S = W.S;
    if (S.state.results) S.state.stale = S.state.results.__snap !== JSON.stringify(typeof D !== 'undefined' ? D : {});
    S.redraw();
    renderAll();
  }

  function renderNu() {
    const e = $('#wbNu');
    if (!e) return;
    const rho = Number(($('#pRho') || {}).value), mue = Number(($('#pMue') || {}).value);
    e.innerHTML = `<span>Kinematic viscosity ν</span><b>${fmt(mue / rho * 1e6, 3)} mm²/s</b>`;
  }

  function renderCard() {
    const c = $('#wbCard');
    if (!c) return;
    const S = W.S;
    const sc = S.state.scales;
    const r = results();
    if (!W.card || !r || !sc || W.mode === 'none') { c.innerHTML = ''; c.style.display = 'none'; return; }
    const isP = W.mode === 'p';
    const lo = isP ? sc.pmin : 0, hi = isP ? sc.pmax : W.mode === 'u' ? sc.umax : sc.qmax;
    const vAt = t => isP ? lo + t * (hi - lo) : t * t * hi;
    const name = { p: 'Total Pressure', u: 'Flow Velocity', q: 'Volume Flow' }[W.mode];
    const unit = { p: 'bar', u: 'm/s', q: 'm³/h' }[W.mode];
    const K = kpis();
    let vals;
    if (isP) vals = (r.nodes || []).map(n => Number(n.ptot)).filter(Number.isFinite);
    else if (W.mode === 'u') vals = (r.components || []).map(x => Math.abs(Number(x.u))).filter(v => Number.isFinite(v) && v < 1e3);
    else vals = (r.components || []).map(x => Math.abs(Number(x.q))).filter(Number.isFinite);
    const vmax = Math.max(...vals), vmin = Math.min(...vals);
    const N = 9, H = 20;
    const bands = Array.from({ length: N }, (_, i) => `<i style="background:${S.pcol((N - 1 - i) / (N - 1))}"></i>`).join('');
    const labs = Array.from({ length: N + 1 }, (_, i) => {
      const t = 1 - i / N;
      const v = i === 0 ? vmax : i === N ? vmin : vAt(t);
      const flag = i === 0 ? ' <b class="mx">Max</b>' : i === N ? ' <b class="mn">Min</b>' : '';
      return `<span style="top:${i * H}px">${fmt(v, Math.abs(v) >= 100 ? 2 : 3)}${flag}</span>`;
    }).join('');
    c.innerHTML = `<div class="wb-leg-h"><b>A: Steady-State Hydraulics</b><div><b>${name}</b></div><div>Type: ${name}</div><div>Unit: ${unit}</div><div>Fluid: ${esc(fluidLabel().split(' (')[0])}, ${esc(($('#fluidT') || {}).value)} °C</div><div>Iterations: ${K ? K.it : '–'}${isP ? '' : ' · scale √(x/x<sub>max</sub>)'}</div></div><div class="wb-leg-b"><div class="wb-leg-c">${bands}</div><div class="wb-leg-v" style="height:${N * H}px">${labs}</div></div>`;
    c.style.display = '';
  }

  function checks() {
    const M = model();
    if (!M) return [];
    const out = [];
    M.comps.forEach(c => { if (c.error) out.push({ lvl: 'err', key: c.cell.key, text: `${c.name}: ${c.error}` }); });
    const used = new Set();
    M.comps.forEach(c => c.ends.forEach(e => used.add(e.node.key)));
    M.nodes.forEach(n => { if (!used.has(n.cell.key) && n.name[0].toUpperCase() !== 'S') out.push({ lvl: 'warn', key: n.cell.key, text: `${n.name} is not connected to any component – ignored by the solver` }); });
    const names = {};
    M.comps.forEach(c => { names[c.name.toUpperCase()] = (names[c.name.toUpperCase()] || 0) + 1; });
    Object.keys(names).filter(n => names[n] > 1).forEach(n => out.push({ lvl: 'warn', key: keyOfName(M.comps.find(c => c.name.toUpperCase() === n).name), text: `Component name ${n} is used ${names[n]} times` }));
    const r = results();
    if (r) {
      (r.components || []).forEach(c => { const u = Math.abs(Number(c.u)); if (u > 7 && u < 1e3 && String(c.type) === 'R') out.push({ lvl: 'info', key: keyOfName(c.name), text: `${c.name}: velocity ${fmt(u, 2)} m/s – check the line size (ISO tab)` }); });
      const K = kpis();
      if (K && !K.conv) out.push({ lvl: 'err', key: null, text: 'Solver did not converge within niter – results are not valid' });
    }
    const vs = typeof ValveRegistry !== 'undefined' ? [...ValveRegistry.valves.values()].filter(v => !v.open) : [];
    vs.forEach(v => out.push({ lvl: 'info', key: keyOfName(v.name), text: `${v.name} is closed` }));
    return out;
  }
  function renderCheck() {
    const box = $('#wbCheck');
    if (!box) return;
    const list = checks();
    const ne = list.filter(i => i.lvl === 'err').length, nw = list.filter(i => i.lvl === 'warn').length;
    const badge = $('#wbCheckBadge');
    if (badge) { badge.textContent = ne + nw ? String(ne + nw) : ''; badge.className = ne ? 'err' : nw ? 'warn' : ''; }
    box.innerHTML = (list.length ? '' : `<div class="wb-okbox big">${icon('ok', 18)} No problems found: all ${model() ? model().comps.length : 0} components are connected to two nodes.</div>`) + list.map(i => `<button class="wb-issue ${i.lvl}" ${i.key ? `data-k="${i.key}"` : ''}>${icon(i.lvl === 'err' ? 'warn' : i.lvl === 'warn' ? 'warn' : 'info', 15)}<span>${esc(i.text)}</span>${i.key ? `<em>${cellName(i.key)}</em>` : ''}</button>`).join('');
    $$('[data-k]', box).forEach(b => b.addEventListener('click', () => W.S.focusKey(b.dataset.k, 1.1)));
  }

  function addHistory(kind, text) {
    W.history.unshift({ t: new Date(), kind, text });
    if (W.history.length > 200) W.history.pop();
    if (W.tabB === 'history') renderHistory();
  }
  function renderHistory() {
    const box = $('#wbHistory');
    if (!box) return;
    const ic = { edit: 'erase', solve: 'play', fluid: 'fluid', file: 'save' };
    box.innerHTML = W.history.length ? W.history.map(h => `<div class="wb-hrow ${h.kind}">${icon(ic[h.kind] || 'info', 14)}<time>${h.t.toLocaleTimeString()}</time><span>${esc(h.text)}</span></div>`).join('') : '<div class="wb-note">No actions yet in this session. Edits, solutions and fluid changes are listed here.</div>';
  }

  function renderCharts() {
    const box = $('#wbCharts');
    if (!box) return;
    const r = results();
    if (!r) { box.innerHTML = `<div class="wb-empty">${icon('chart', 28)}<div>Charts appear after <b>Solve</b>.</div></div>`; return; }
    const S = W.S, sc = S.state.scales;
    const nodes = (r.nodes || []).map(n => ({ n: String(n.id), p: Number(n.ptot) })).filter(x => Number.isFinite(x.p)).sort((a, b) => b.p - a.p);
    const W1 = Math.max(420, nodes.length * 16), H1 = 170;
    const bw = W1 / nodes.length;
    const pb = nodes.map((x, i) => { const h = Math.max(3, 130 * (x.p - Math.min(0, sc.pmin)) / ((sc.pmax - Math.min(0, sc.pmin)) || 1)); return `<g data-n="${esc(x.n)}" class="wb-cb"><rect x="${i * bw + 2}" y="${140 - h}" width="${bw - 4}" height="${h}" rx="2" fill="${S.pcol(0.22 + 0.78 * (x.p - sc.pmin) / ((sc.pmax - sc.pmin) || 1))}"/><text x="${i * bw + bw / 2}" y="156" text-anchor="middle" transform="rotate(-50 ${i * bw + bw / 2} 156)">${esc(x.n)}</text><title>${esc(x.n)}: ${fmt(x.p, 2)} bar</title></g>`; }).join('');
    const grid = [0, 0.25, 0.5, 0.75, 1].map(t => { const y = 140 - 130 * t; const v = Math.min(0, sc.pmin) + t * (sc.pmax - Math.min(0, sc.pmin)); return `<line x1="0" x2="${W1}" y1="${y}" y2="${y}" class="wb-gl"/><text x="2" y="${y - 2}" class="wb-gt">${fmt(v, 0)}</text>`; }).join('');
    const comps = (r.components || []).filter(c => !/^(P|UPM|UCP|UPT)/i.test(String(c.type || ''))).map(c => ({ n: c.name, dp: Math.abs(Number(c.dp)) })).sort((a, b) => b.dp - a.dp).slice(0, 12);
    const dmx = Math.max(...comps.map(c => c.dp), 1e-9);
    const dpb = comps.map((c, i) => `<g data-n="${esc(c.n)}" class="wb-cb"><text x="62" y="${i * 13 + 11}" text-anchor="end">${esc(c.n)}</text><rect x="66" y="${i * 13 + 3}" width="${Math.max(1, 220 * c.dp / dmx)}" height="9" rx="2" fill="url(#wbg1)"/><text x="${70 + 220 * c.dp / dmx}" y="${i * 13 + 11}" class="wb-gt">${fmt(c.dp, 2)}</text></g>`).join('');
    box.innerHTML = `<div class="wb-charts"><div class="wb-chart"><div class="wb-chart-t">Total pressure per node [bar] <small>sorted · click a bar</small></div><div class="wb-chart-s"><svg width="${W1}" height="${H1 + 20}">${grid}${pb}</svg></div></div>
<div class="wb-chart"><div class="wb-chart-t">Largest pressure drops |Δp| [bar] <small>all non-pump components</small></div><svg width="340" height="${comps.length * 13 + 8}"><defs><linearGradient id="wbg1" x1="0" x2="1"><stop offset="0" stop-color="#38e1c8"/><stop offset="1" stop-color="#8a6bff"/></linearGradient></defs>${dpb}</svg></div></div>`;
    $$('[data-n]', box).forEach(g => g.addEventListener('click', () => { const k = keyOfName(g.dataset.n); if (k) W.S.focusKey(k, 1.1); }));
  }

  function renderStatus() {
    const s = $('#wbStatus');
    if (!s) return;
    const M = model();
    const K = kpis();
    const st = W.S.state;
    const T = ($('#fluidT') || {}).value;
    const state = W.solving ? ['busy', 'Solving…'] : st.stale ? ['warn', 'Model changed – solve again'] : K ? (K.conv ? ['ok', 'Solved'] : ['bad', 'Not converged']) : ['idle', 'Ready'];
    s.innerHTML = `<span class="wb-st ${state[0]}"><i></i>${state[1]}</span><span>${M ? M.comps.length : 0} components</span><span>${M ? M.nodes.length : 0} nodes</span><span>${M ? circuits().length : 0} circuits</span><span>${icon('fluid', 13)} ${esc(fluidLabel())} · ${esc(T)} °C</span>${K ? `<span>iterations ${K.it}</span><span>residual ${K.res.toExponential(2)}</span>` : ''}<span class="wb-st-msg">${esc(W.lastStatus || '')}</span><span class="wb-st-r">Units: bar · m³/h · m/s · mm</span>`;
    const sb = $('#wbSolve');
    if (sb) sb.classList.toggle('busy', W.solving);
  }
  function crumb() {
    const c = $('#wbCrumb'); if (c) c.textContent = W.sel ? nameOfKey(W.sel) : '';
    const d = $('#wbDetT');
    if (d) d.textContent = W.tabR === 'solver' ? 'Details of “Analysis Settings”' : W.tabR === 'analysis' ? 'Details of “Solution”' : W.sel ? 'Details of “' + nameOfKey(W.sel) + '”' : 'Details of “Model”';
  }

  let rt = 0;
  function scheduleRefresh() { clearTimeout(rt); rt = setTimeout(renderAll, 40); }
  function renderAll() {
    renderTree();
    renderProps();
    renderAnalysis();
    renderCard();
    renderCheck();
    renderHistory();
    if (W.tabB === 'charts') renderCharts();
    renderNu();
    renderStatus();
    markTools();
    crumb();
  }

  const THEME = {
    bg: { '#0f0f1f': '#ffffff', '#1a1a2e': '#ffffff', '#16213e': '#eef1f5', '#0a0a1a': '#ffffff', '#15152a': '#fafafa', '#1a2a2a': '#f1f8f1', '#0f3460': '#e8e8e8', '#2a2a4a': '#f3f3f3', '#1a2a1a': '#e8f2e8', '#1f3a1f': '#e8f5e9', '#3a1f24': '#fdecea', '#2a1a3e': '#e5f1fb', '#1a4a80': '#e5f1fb', '#1a2a4a': '#eef1f5', '#2a1a1a': '#fdecea', '#2a2a1a': '#fff8e1', '#0a2a1a': '#e8f5e9', '#1a1a1a': '#f3f3f3', '#2a1a4a': '#f3e5f5', '#1a1a2a': '#f3f3f3', '#3a2a1a': '#fff3e0', '#1e2a3a': '#eef1f5', '#141428': '#fafafa', '#0d1b2a': '#ffffff', '#4472c4': '#e5f1fb', '#e94560': '#c62828', '#4caf50': '#2e7d32', '#2c3e50': '#eef1f5', '#2a2a3a': '#f3f3f3', '#0f2a1a': '#e8f5e9' },
    fg: { '#ffffff': '#1f1f1f', '#e0e0e0': '#1f1f1f', '#aaaacc': '#333333', '#c8d2e0': '#333333', '#aab3cc': '#444444', '#ffdd44': '#8a6500', '#6fc3f7': '#1565c0', '#e94560': '#c62828', '#4caf50': '#2e7d32', '#9fe79f': '#2e7d32', '#5fd068': '#2e7d32', '#ff6b81': '#c62828', '#ff8844': '#b5520b', '#888888': '#5f6368', '#ffd740': '#8a6500', '#ff5252': '#c62828', '#ccc': '#333333', '#cccccc': '#333333', '#ddd': '#333333', '#dddddd': '#333333', '#8fa3bf': '#5f6368', '#ffcc00': '#8a6500', '#ff6b6b': '#c62828', '#66bb6a': '#2e7d32', '#81c784': '#2e7d32', '#ffb74d': '#b26a00', '#ffa726': '#b26a00', '#ff9800': '#b26a00', '#90caf9': '#1565c0', '#64b5f6': '#1565c0', '#aaa': '#555555', '#aaaaaa': '#555555', '#bbb': '#555555', '#999': '#5f6368', '#999999': '#5f6368', '#ccd': '#333333', '#ccccdd': '#333333', '#ffb347': '#b26a00', '#ecf0f1': '#333333' },
    bd: { '#2a2a4a': '#c8c8c8', '#1a2a4a': '#dcdcdc', '#2a4a7a': '#b0b0b0', '#3b3b62': '#c8c8c8', '#2f6a2f': '#a5d6a7', '#6a2f3a': '#ef9a9a', '#ffdd44': '#d9a400', '#e94560': '#c62828', '#1a2a2a': '#e0e0e0', '#3a2a3a': '#e0c0c0', '#4caf50': '#66bb6a', '#4472c4': '#7eb4ea', '#0f3460': '#c8c8c8', '#16213e': '#c8c8c8', '#6fc3f7': '#7eb4ea' }
  };
  const PAPER = {
    bg: { '#0f0f1f': '#f8f7f4', '#0f3460': '#dfdcd6', '#16213e': '#e6e3dd', '#1a2a1a': '#e2eadc', '#2a2a4a': '#ebe9e4', '#15152a': '#f8f7f4', '#1a2a4a': '#e6e3dd' },
    bd: { '#2a2a4a': '#d3d0c9', '#1a2a4a': '#e1ded8', '#2a4a7a': '#bdb9b1', '#0f3460': '#d3d0c9' }
  };
  const paperRGB = {};
  const themeRGB = {};
  function toRGB(hex) { let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`; }
  for (const k of ['bg', 'fg', 'bd']) { themeRGB[k] = {}; for (const [a, b] of Object.entries(THEME[k])) themeRGB[k][toRGB(a)] = b; }
  for (const k of ['bg', 'bd']) { paperRGB[k] = {}; for (const [a, b] of Object.entries(PAPER[k])) paperRGB[k][toRGB(a)] = b; }
  function recolor(el) {
    if (!el || el.nodeType !== 1 || el.closest('#wb')) return;
    const st = el.style;
    if (st && st.length) {
      const paper = !!el.closest('#tab-iso,#tab-schematic,#tab-qr');
      const bg = st.backgroundColor;
      if (bg && paper && paperRGB.bg[bg]) st.backgroundColor = paperRGB.bg[bg];
      else if (bg && themeRGB.bg[bg]) st.backgroundColor = themeRGB.bg[bg];
      if (st.backgroundImage && /gradient/.test(st.backgroundImage)) { st.backgroundImage = 'none'; if (!st.backgroundColor) st.backgroundColor = '#ffffff'; }
      const fg = st.color;
      if (fg && themeRGB.fg[fg]) st.color = themeRGB.fg[fg];
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) { const c = st['border' + side + 'Color']; if (c && paper && paperRGB.bd[c]) st['border' + side + 'Color'] = paperRGB.bd[c]; else if (c && themeRGB.bd[c]) st['border' + side + 'Color'] = themeRGB.bd[c]; }
      if (st.borderRadius && parseFloat(st.borderRadius) > 3) st.borderRadius = '2px';
      if (st.boxShadow && st.boxShadow !== 'none') st.boxShadow = '0 2px 8px rgba(0,0,0,.18)';
    }
  }
  function recolorTree(root) { if (!root || root.nodeType !== 1) return; recolor(root); root.querySelectorAll('[style]').forEach(recolor); }
  function themeInit() {
    document.body.classList.add('bh-light');
    const roots = ['#tab-view3d', '#tab-iso', '#tab-schematic', '#tab-qr'].map(q => $(q)).filter(Boolean);
    roots.forEach(recolorTree);
    [...document.body.children].forEach(ch => { if (ch.tagName !== 'HEADER' && !ch.classList.contains('tab-content') && ch.tagName !== 'SCRIPT') recolorTree(ch); });
    const obs = new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.nodeType === 1 && (m.target === document.body ? n.tagName !== 'HEADER' && !n.classList.contains('tab-content') : true)) recolorTree(n); });
        else if (m.type === 'attributes') recolor(m.target);
      }
    });
    roots.forEach(r => obs.observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] }));
    obs.observe(document.body, { childList: true });
    const bodyObs = new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.tagName !== 'HEADER' && !n.classList.contains('tab-content') && n.tagName !== 'SCRIPT') obs.observe(n, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] }); })));
    bodyObs.observe(document.body, { childList: true });
    [...document.body.children].forEach(n => { if (n.tagName !== 'HEADER' && !n.classList.contains('tab-content') && n.tagName !== 'SCRIPT') obs.observe(n, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] }); });
  }

  function init() {
    if (!window.BohemeStudio) return;
    W.S = window.BohemeStudio;
    load();
    if (!build()) return;
    try { themeInit(); } catch (e) { console.warn('BOHEME theme', e); }
    applyLayout();
    tabs();
    W.S.setColorMode(W.mode || 'p');
    renderAll();
    setTimeout(() => { W.S.fit(); renderAll(); }, 120);
  }

  window.BohemeWorkbench = { init, state: W, renderAll, circuits, checks, recolorTree };
})();
