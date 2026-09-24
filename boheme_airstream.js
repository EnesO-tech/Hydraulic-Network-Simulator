/* boheme_airstream.js – Streamlines + Lock & Steer for BOHEME 3D view
 *
 * EINBINDUNG:
 * 1. Speichere diese Datei als "boheme_airstream.js" im selben Ordner wie index3D.html
 * 2. In index3D.html, DIREKT VOR dem schließenden </body>-Tag, füge ein:
 *      <script src="boheme_airstream.js"></script>
 *
 * 3. In index3D.html, im 3D-Tab HTML (suche: <button id="resetView">Reset</button>),
 *    füge NACH der </div> der Toolbar und VOR <div id="sidebar"> diesen Block ein:
 *
 *    <div id="airstream-panel"></div>
 *
 *    Also so:
 *      <button id="resetView">Reset</button>
 *      </div>
 *      <div id="airstream-panel"></div>
 *      <div id="sidebar" style="flex:1;">
 *
 * FERTIG. Kein anderer Code wird geändert.
 */

(function () {
  'use strict';

  /* ---- wait until Three.js scene exists ---- */
  function waitForScene(cb) {
    const iv = setInterval(() => {
      if (typeof scene !== 'undefined' && scene && typeof THREE !== 'undefined') {
        clearInterval(iv);
        cb();
      }
    }, 300);
  }

  waitForScene(() => {
    /* ============================================================
       INJECT HTML CONTROLS
       ============================================================ */
    const panel = document.getElementById('airstream-panel');
    if (!panel) { console.warn('boheme_airstream: #airstream-panel not found'); return; }

    panel.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #2a2a4a;">
      <h4 style="color:#e94560;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Airstream</h4>
      <div style="display:flex;gap:4px;margin-bottom:6px;">
        <button id="asToggle" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Streams OFF</button>
        <button id="asColor" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Color: fixed</button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="color:#888;font-size:11px;width:50px;">Speed</span>
        <input type="range" id="asSpeed" min="0.5" max="5" step="0.1" value="2" style="flex:1;">
        <span id="asSpeedV" style="color:#aac;font-size:11px;width:30px;text-align:right;">2.0</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="color:#888;font-size:11px;width:50px;">Count</span>
        <input type="range" id="asCount" min="200" max="3000" step="100" value="1000" style="flex:1;">
        <span id="asCountV" style="color:#aac;font-size:11px;width:30px;text-align:right;">1000</span>
      </div>
    </div>
    <div style="padding:8px 10px;border-bottom:1px solid #2a2a4a;">
      <h4 style="color:#e94560;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Lock &amp; Steer</h4>
      <button id="asLock" style="width:100%;padding:5px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;margin-bottom:6px;">🔓 Lock Nodes to Aircraft</button>
      <div id="asSteer" style="display:none;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="color:#e94560;font-size:11px;width:36px;font-weight:700;">Pitch</span>
          <input type="range" id="asPitch" min="-30" max="30" step="0.5" value="0" style="flex:1;">
          <span id="asPitchV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="color:#4caf50;font-size:11px;width:36px;font-weight:700;">Yaw</span>
          <input type="range" id="asYaw" min="-45" max="45" step="0.5" value="0" style="flex:1;">
          <span id="asYawV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="color:#6fc3f7;font-size:11px;width:36px;font-weight:700;">Roll</span>
          <input type="range" id="asRoll" min="-60" max="60" step="0.5" value="0" style="flex:1;">
          <span id="asRollV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span>
        </div>
        <button id="asResetSteer" style="width:100%;padding:4px;background:#1a1a2e;border:1px solid #2a4a7a;color:#888;border-radius:3px;cursor:pointer;font-size:11px;">Reset Orientation</button>
      </div>
    </div>`;

    /* ============================================================
       STREAM VARIABLES
       ============================================================ */
    let active = false, colorBySpeed = false;
    let pts = null, geo = null, pos = null, col = null;
    let count = 1000, speed = 2.0;
    const R_FUSE = 1.5, L_FUSE = 8.0;
    let steerGrp = null, locked = false;

    /* ============================================================
       PARTICLE HELPERS
       ============================================================ */
    function resetP(i, randomZ) {
      const sp = 6, zF = 12, zB = -12;
      pos[i * 3]     = (Math.random() - 0.5) * sp * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * sp;
      pos[i * 3 + 2] = randomZ ? (Math.random() * (zF - zB) + zB) : (zF + Math.random() * 2);
      col[i * 3] = 0.4; col[i * 3 + 1] = 0.7; col[i * 3 + 2] = 1.0;
    }

    function createParticles(n) {
      if (pts) scene.remove(pts);
      count = n;
      pos = new Float32Array(n * 3);
      col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) resetP(i, true);
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      pts = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.04, vertexColors: true, transparent: true, opacity: 0.7,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      scene.add(pts);
    }

    /* ============================================================
       ANIMATE – called from the patched render loop
       ============================================================ */
    function animateStream() {
      if (!pos || !geo) return;
      const dt = 0.016;
      for (let i = 0; i < count; i++) {
        let x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        let lx = x, ly = y, lz = z;
        if (steerGrp) {
          const inv = new THREE.Matrix4().copy(steerGrp.matrixWorld).invert();
          const v = new THREE.Vector3(x, y, z).applyMatrix4(inv);
          lx = v.x; ly = v.y; lz = v.z;
        }
        let vx = 0, vy = 0, vz = -speed;
        const r2d = Math.sqrt(lx * lx + ly * ly);
        if (r2d > 0.01 && Math.abs(lz) < L_FUSE * 0.55) {
          if (r2d < R_FUSE * 2.5) {
            const f = (R_FUSE * R_FUSE) / (r2d * r2d);
            vx += (lx / r2d) * speed * f * 0.5;
            vy += (ly / r2d) * speed * f * 0.5;
            vz -= speed * f * 0.15;
          }
          if (r2d < R_FUSE * 1.05 && Math.abs(lz) < L_FUSE * 0.5) {
            const push = R_FUSE * 1.15 - r2d;
            vx += (lx / r2d) * push * 8;
            vy += (ly / r2d) * push * 8;
          }
        }
        if (steerGrp) {
          const vel = new THREE.Vector3(vx, vy, vz).applyQuaternion(steerGrp.quaternion);
          x += vel.x * dt; y += vel.y * dt; z += vel.z * dt;
        } else {
          x += vx * dt; y += vy * dt; z += vz * dt;
        }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        if (colorBySpeed) {
          const spd = Math.sqrt(vx * vx + vy * vy + vz * vz);
          const t = Math.min((spd / speed - 1) * 2 + 0.5, 1);
          col[i * 3] = t; col[i * 3 + 1] = 0.3 * (1 - t); col[i * 3 + 2] = 1 - t;
        } else {
          col[i * 3] = 0.4; col[i * 3 + 1] = 0.7; col[i * 3 + 2] = 1.0;
        }
        if (z < -14 || Math.abs(x) > 12 || Math.abs(y) > 8) resetP(i, false);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }

    /* ============================================================
       HOOK INTO THE EXISTING RENDER LOOP
       ============================================================ */
    // We monkey-patch renderer.render so our animation runs every frame
    // without touching the original animate() function at all.
    const _origRender = renderer.render.bind(renderer);
    renderer.render = function (s, c) {
      if (active && pts) animateStream();
      _origRender(s, c);
    };

    /* ============================================================
       BUTTON HANDLERS
       ============================================================ */
    document.getElementById('asToggle').addEventListener('click', () => {
      active = !active;
      const btn = document.getElementById('asToggle');
      if (active) {
        btn.textContent = 'Streams ON'; btn.style.background = '#4caf50';
        if (!pts) createParticles(count); else pts.visible = true;
      } else {
        btn.textContent = 'Streams OFF'; btn.style.background = '#2a2a4a';
        if (pts) pts.visible = false;
      }
    });

    document.getElementById('asColor').addEventListener('click', () => {
      colorBySpeed = !colorBySpeed;
      const btn = document.getElementById('asColor');
      btn.textContent = colorBySpeed ? 'Color: speed' : 'Color: fixed';
      btn.style.background = colorBySpeed ? '#0f3460' : '#2a2a4a';
    });

    document.getElementById('asSpeed').addEventListener('input', function () {
      speed = parseFloat(this.value);
      document.getElementById('asSpeedV').textContent = speed.toFixed(1);
    });

    document.getElementById('asCount').addEventListener('input', function () {
      const n = parseInt(this.value);
      document.getElementById('asCountV').textContent = n;
      if (n !== count && active) createParticles(n);
    });

    /* ============================================================
       LOCK & STEER
       ============================================================ */
    document.getElementById('asLock').addEventListener('click', () => {
      locked = !locked;
      const btn = document.getElementById('asLock');
      const steerDiv = document.getElementById('asSteer');
      if (locked) {
        btn.innerHTML = '🔒 Nodes LOCKED'; btn.style.background = '#4caf50';
        steerDiv.style.display = 'block';
        steerGrp = new THREE.Group();
        scene.add(steerGrp);
        if (typeof aircraftGroup !== 'undefined' && aircraftGroup) {
          scene.remove(aircraftGroup); steerGrp.add(aircraftGroup);
        }
        if (typeof pipeGroup !== 'undefined' && pipeGroup) {
          scene.remove(pipeGroup); steerGrp.add(pipeGroup);
        }
      } else {
        btn.innerHTML = '🔓 Lock Nodes to Aircraft'; btn.style.background = '#2a2a4a';
        steerDiv.style.display = 'none';
        if (steerGrp) {
          if (typeof aircraftGroup !== 'undefined' && aircraftGroup) {
            steerGrp.remove(aircraftGroup); scene.add(aircraftGroup);
          }
          if (typeof pipeGroup !== 'undefined' && pipeGroup) {
            steerGrp.remove(pipeGroup); scene.add(pipeGroup);
          }
          scene.remove(steerGrp); steerGrp = null;
        }
        doResetSteer();
      }
    });

    function applySteer() {
      if (!steerGrp) return;
      const p = parseFloat(document.getElementById('asPitch').value) * Math.PI / 180;
      const y = parseFloat(document.getElementById('asYaw').value) * Math.PI / 180;
      const r = parseFloat(document.getElementById('asRoll').value) * Math.PI / 180;
      steerGrp.rotation.set(p, y, r);
      document.getElementById('asPitchV').textContent = (p * 180 / Math.PI).toFixed(0) + '\u00B0';
      document.getElementById('asYawV').textContent = (y * 180 / Math.PI).toFixed(0) + '\u00B0';
      document.getElementById('asRollV').textContent = (r * 180 / Math.PI).toFixed(0) + '\u00B0';
    }

    function doResetSteer() {
      ['asPitch', 'asYaw', 'asRoll'].forEach(id => { document.getElementById(id).value = 0; });
      if (steerGrp) steerGrp.rotation.set(0, 0, 0);
      document.getElementById('asPitchV').textContent = '0\u00B0';
      document.getElementById('asYawV').textContent = '0\u00B0';
      document.getElementById('asRollV').textContent = '0\u00B0';
    }

    document.getElementById('asPitch').addEventListener('input', applySteer);
    document.getElementById('asYaw').addEventListener('input', applySteer);
    document.getElementById('asRoll').addEventListener('input', applySteer);
    document.getElementById('asResetSteer').addEventListener('click', doResetSteer);

    console.log('boheme_airstream.js loaded');
  });
})();
