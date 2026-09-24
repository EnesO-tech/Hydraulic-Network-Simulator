/* boheme_airstream.js v2 – Streamlines + Schlieren + Lock & Steer
 *
 * EINBINDUNG: siehe v1 (gleich wie vorher)
 * 1. "boheme_airstream.js" im selben Ordner wie index3D.html
 * 2. In index3D.html: <div id="airstream-panel"></div> zwischen Toolbar und Sidebar
 * 3. In index3D.html: <script src="boheme_airstream.js"></script> vor </body>
 */
(function () {
  'use strict';
  function waitForScene(cb) {
    const iv = setInterval(() => {
      if (typeof scene !== 'undefined' && scene && typeof THREE !== 'undefined' && typeof renderer !== 'undefined') { clearInterval(iv); cb(); }
    }, 300);
  }

  waitForScene(() => {
    /* ============================================================
       INJECT HTML
       ============================================================ */
    const panel = document.getElementById('airstream-panel');
    if (!panel) { console.warn('boheme_airstream: #airstream-panel not found'); return; }
    panel.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #2a2a4a;">
      <h4 style="color:#e94560;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Airstream</h4>
      <div style="display:flex;gap:4px;margin-bottom:6px;">
        <button id="asToggle" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Streams OFF</button>
        <button id="asSchlieren" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Schlieren OFF</button>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:6px;">
        <button id="asColor" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Color: fixed</button>
        <button id="asSlice" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Slice: XY</button>
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
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="color:#888;font-size:11px;width:50px;">AoA</span>
        <input type="range" id="asAoA" min="-15" max="20" step="0.5" value="5" style="flex:1;">
        <span id="asAoAV" style="color:#aac;font-size:11px;width:30px;text-align:right;">5°</span>
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
       PARTICLE STREAM (same as v1)
       ============================================================ */
    let active = false, colorBySpeed = false;
    let pts = null, geo = null, pos = null, col = null;
    let count = 1000, speed = 2.0, aoaDeg = 5;
    const R_FUSE = 1.5, L_FUSE = 8.0;
    let steerGrp = null, locked = false;

    function resetP(i, randomZ) {
      const sp = 6, zF = 12, zB = -12;
      pos[i*3]=(Math.random()-0.5)*sp*2; pos[i*3+1]=(Math.random()-0.5)*sp;
      pos[i*3+2]=randomZ?(Math.random()*(zF-zB)+zB):(zF+Math.random()*2);
      col[i*3]=0.4; col[i*3+1]=0.7; col[i*3+2]=1.0;
    }
    function createParticles(n) {
      if(pts) scene.remove(pts); count=n;
      pos=new Float32Array(n*3); col=new Float32Array(n*3);
      for(let i=0;i<n;i++) resetP(i,true);
      geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      geo.setAttribute('color',new THREE.BufferAttribute(col,3));
      pts=new THREE.Points(geo,new THREE.PointsMaterial({size:0.04,vertexColors:true,transparent:true,opacity:0.7,depthWrite:false,blending:THREE.AdditiveBlending}));
      scene.add(pts);
    }
    function animateStream() {
      if(!pos||!geo) return;
      const dt=0.016, aoa=aoaDeg*Math.PI/180;
      for(let i=0;i<count;i++){
        let x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2];
        let lx=x,ly=y,lz=z;
        if(steerGrp){const inv=new THREE.Matrix4().copy(steerGrp.matrixWorld).invert();const v=new THREE.Vector3(x,y,z).applyMatrix4(inv);lx=v.x;ly=v.y;lz=v.z;}
        let vx=0,vy=Math.sin(aoa)*speed*0.3,vz=-Math.cos(aoa)*speed;
        const r2d=Math.sqrt(lx*lx+ly*ly);
        if(r2d>0.01&&Math.abs(lz)<L_FUSE*0.55){
          if(r2d<R_FUSE*2.5){const f=(R_FUSE*R_FUSE)/(r2d*r2d);vx+=(lx/r2d)*speed*f*0.5;vy+=(ly/r2d)*speed*f*0.5;vz-=speed*f*0.15;}
          if(r2d<R_FUSE*1.05&&Math.abs(lz)<L_FUSE*0.5){const push=R_FUSE*1.15-r2d;vx+=(lx/r2d)*push*8;vy+=(ly/r2d)*push*8;}
        }
        if(steerGrp){const vel=new THREE.Vector3(vx,vy,vz).applyQuaternion(steerGrp.quaternion);x+=vel.x*dt;y+=vel.y*dt;z+=vel.z*dt;}
        else{x+=vx*dt;y+=vy*dt;z+=vz*dt;}
        pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;
        if(colorBySpeed){const spd=Math.sqrt(vx*vx+vy*vy+vz*vz);const t=Math.min((spd/speed-1)*2+0.5,1);col[i*3]=t;col[i*3+1]=0.3*(1-t);col[i*3+2]=1-t;}
        else{col[i*3]=0.4;col[i*3+1]=0.7;col[i*3+2]=1.0;}
        if(z<-14||Math.abs(x)>12||Math.abs(y)>8) resetP(i,false);
      }
      geo.attributes.position.needsUpdate=true;
      geo.attributes.color.needsUpdate=true;
    }

    /* ============================================================
       SCHLIEREN – LIC shader on a plane
       ============================================================ */
    let schlierenActive = false, schlierenMesh = null, schlierenUniforms = null;
    let sliceMode = 'XY'; // XY = side view, XZ = top view
    const SCHLIEREN_SIZE = 14;

    // Generate noise texture
    function makeNoiseTex(sz) {
      const c = document.createElement('canvas'); c.width = sz; c.height = sz;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(sz, sz);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
      return tex;
    }

    const licVertShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const licFragShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uNoise;
      uniform float uTime;
      uniform float uRadius;
      uniform float uAoA;
      uniform float uSpeed;

      // Potential flow around a cylinder (2D cross-section)
      vec2 flowVelocity(vec2 p) {
        float r2 = dot(p, p);
        float R2 = uRadius * uRadius;
        float cosA = cos(uAoA);
        float sinA = sin(uAoA);
        // Freestream + cylinder disturbance
        vec2 U = vec2(0.0, -1.0) * cosA + vec2(-1.0, 0.0) * sinA; // freestream direction
        if (r2 < R2 * 1.02) return vec2(0.0); // inside body
        float factor = R2 / r2;
        vec2 rhat = p / sqrt(r2);
        // v = U_inf - U_inf * R^2/r^2 + 2*(U_inf . rhat)*rhat * R^2/r^2
        vec2 v = U - U * factor + 2.0 * dot(U, rhat) * rhat * factor;
        return v;
      }

      void main() {
        // Map UV to physical space centered on cylinder
        vec2 p = (vUv - 0.5) * 2.0 * ${SCHLIEREN_SIZE.toFixed(1)};

        // LIC: trace streamline forward and backward, sample noise
        vec2 pos = p;
        float accum = 0.0;
        float weight = 0.0;
        float dt = 0.08;
        int steps = 28;
        float phase = uTime * uSpeed * 0.4;

        // Forward
        pos = p;
        for (int i = 0; i < 28; i++) {
          vec2 v = flowVelocity(pos);
          float spd = length(v);
          if (spd < 0.001) break;
          pos += normalize(v) * dt;
          vec2 tc = pos / ${(SCHLIEREN_SIZE * 2.0).toFixed(1)} + 0.5;
          // Animate by phase-shifting along flow direction
          tc += normalize(v) * phase * 0.02;
          float n = texture2D(uNoise, fract(tc * 3.0)).r;
          float w = 1.0 - float(i) / 28.0;
          accum += n * w;
          weight += w;
        }
        // Backward
        pos = p;
        for (int i = 0; i < 28; i++) {
          vec2 v = flowVelocity(pos);
          float spd = length(v);
          if (spd < 0.001) break;
          pos -= normalize(v) * dt;
          vec2 tc = pos / ${(SCHLIEREN_SIZE * 2.0).toFixed(1)} + 0.5;
          tc += normalize(v) * phase * 0.02;
          float n = texture2D(uNoise, fract(tc * 3.0)).r;
          float w = 1.0 - float(i) / 28.0;
          accum += n * w;
          weight += w;
        }

        float lic = weight > 0.0 ? accum / weight : 0.5;

        // Speed-based color tinting
        vec2 v = flowVelocity(p);
        float spd = length(v);
        float speedFactor = clamp(spd * 0.5, 0.0, 1.5);

        // Inside cylinder = dark
        float r2 = dot(p, p);
        float R2 = uRadius * uRadius;
        if (r2 < R2 * 1.01) { gl_FragColor = vec4(0.02, 0.02, 0.06, 0.85); return; }

        // Color: blue-white-red by speed
        vec3 slow = vec3(0.1, 0.2, 0.5);
        vec3 mid  = vec3(0.6, 0.75, 0.9);
        vec3 fast = vec3(0.9, 0.3, 0.2);
        vec3 col;
        if (speedFactor < 1.0) col = mix(slow, mid, speedFactor);
        else col = mix(mid, fast, speedFactor - 1.0);

        col *= (lic * 0.6 + 0.4);

        gl_FragColor = vec4(col, 0.65);
      }
    `;

    function createSchlieren() {
      const noiseTex = makeNoiseTex(256);
      schlierenUniforms = {
        uNoise: { value: noiseTex },
        uTime: { value: 0 },
        uRadius: { value: R_FUSE },
        uAoA: { value: aoaDeg * Math.PI / 180 },
        uSpeed: { value: speed }
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: licVertShader,
        fragmentShader: licFragShader,
        uniforms: schlierenUniforms,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const planeGeo = new THREE.PlaneGeometry(SCHLIEREN_SIZE * 2, SCHLIEREN_SIZE * 2);
      schlierenMesh = new THREE.Mesh(planeGeo, mat);
      updateSliceOrientation();
      scene.add(schlierenMesh);
    }

    function updateSliceOrientation() {
      if (!schlierenMesh) return;
      if (sliceMode === 'XY') {
        // Side view: plane in XY, normal = Z
        schlierenMesh.rotation.set(0, 0, 0);
        schlierenMesh.position.set(0, 0, 0);
      } else {
        // Top view: plane in XZ, normal = Y
        schlierenMesh.rotation.set(-Math.PI / 2, 0, 0);
        schlierenMesh.position.set(0, 0, 0);
      }
    }

    /* ============================================================
       HOOK INTO RENDER LOOP
       ============================================================ */
    const _origRender = renderer.render.bind(renderer);
    let _time = 0;
    renderer.render = function (s, c) {
      _time += 0.016;
      if (active && pts) animateStream();
      if (schlierenActive && schlierenUniforms) {
        schlierenUniforms.uTime.value = _time;
        schlierenUniforms.uAoA.value = aoaDeg * Math.PI / 180;
        schlierenUniforms.uSpeed.value = speed;
      }
      _origRender(s, c);
    };

    /* ============================================================
       BUTTON HANDLERS
       ============================================================ */
    document.getElementById('asToggle').addEventListener('click', () => {
      active = !active;
      const btn = document.getElementById('asToggle');
      if (active) { btn.textContent='Streams ON'; btn.style.background='#4caf50'; if(!pts) createParticles(count); else pts.visible=true; }
      else { btn.textContent='Streams OFF'; btn.style.background='#2a2a4a'; if(pts) pts.visible=false; }
    });

    document.getElementById('asSchlieren').addEventListener('click', () => {
      schlierenActive = !schlierenActive;
      const btn = document.getElementById('asSchlieren');
      if (schlierenActive) {
        btn.textContent='Schlieren ON'; btn.style.background='#0f3460';
        if(!schlierenMesh) createSchlieren(); else schlierenMesh.visible=true;
      } else {
        btn.textContent='Schlieren OFF'; btn.style.background='#2a2a4a';
        if(schlierenMesh) schlierenMesh.visible=false;
      }
    });

    document.getElementById('asColor').addEventListener('click', () => {
      colorBySpeed=!colorBySpeed;
      const btn=document.getElementById('asColor');
      btn.textContent=colorBySpeed?'Color: speed':'Color: fixed';
      btn.style.background=colorBySpeed?'#0f3460':'#2a2a4a';
    });

    document.getElementById('asSlice').addEventListener('click', () => {
      sliceMode = sliceMode === 'XY' ? 'XZ' : 'XY';
      const btn = document.getElementById('asSlice');
      btn.textContent = 'Slice: ' + sliceMode;
      updateSliceOrientation();
    });

    document.getElementById('asSpeed').addEventListener('input', function(){ speed=parseFloat(this.value); document.getElementById('asSpeedV').textContent=speed.toFixed(1); });
    document.getElementById('asCount').addEventListener('input', function(){ const n=parseInt(this.value); document.getElementById('asCountV').textContent=n; if(n!==count&&active) createParticles(n); });
    document.getElementById('asAoA').addEventListener('input', function(){ aoaDeg=parseFloat(this.value); document.getElementById('asAoAV').textContent=aoaDeg.toFixed(0)+'\u00B0'; });

    /* ============================================================
       LOCK & STEER (same as v1)
       ============================================================ */
    document.getElementById('asLock').addEventListener('click', () => {
      locked=!locked; const btn=document.getElementById('asLock'); const sd=document.getElementById('asSteer');
      if(locked){
        btn.innerHTML='🔒 Nodes LOCKED'; btn.style.background='#4caf50'; sd.style.display='block';
        steerGrp=new THREE.Group(); scene.add(steerGrp);
        if(typeof aircraftGroup!=='undefined'&&aircraftGroup){scene.remove(aircraftGroup);steerGrp.add(aircraftGroup);}
        if(typeof pipeGroup!=='undefined'&&pipeGroup){scene.remove(pipeGroup);steerGrp.add(pipeGroup);}
        if(schlierenMesh){scene.remove(schlierenMesh);steerGrp.add(schlierenMesh);}
      } else {
        btn.innerHTML='🔓 Lock Nodes to Aircraft'; btn.style.background='#2a2a4a'; sd.style.display='none';
        if(steerGrp){
          if(typeof aircraftGroup!=='undefined'&&aircraftGroup){steerGrp.remove(aircraftGroup);scene.add(aircraftGroup);}
          if(typeof pipeGroup!=='undefined'&&pipeGroup){steerGrp.remove(pipeGroup);scene.add(pipeGroup);}
          if(schlierenMesh){steerGrp.remove(schlierenMesh);scene.add(schlierenMesh);}
          scene.remove(steerGrp);steerGrp=null;
        }
        doResetSteer();
      }
    });
    function applySteer(){if(!steerGrp)return;const p=parseFloat(document.getElementById('asPitch').value)*Math.PI/180;const y=parseFloat(document.getElementById('asYaw').value)*Math.PI/180;const r=parseFloat(document.getElementById('asRoll').value)*Math.PI/180;steerGrp.rotation.set(p,y,r);document.getElementById('asPitchV').textContent=(p*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asYawV').textContent=(y*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asRollV').textContent=(r*180/Math.PI).toFixed(0)+'\u00B0';}
    function doResetSteer(){['asPitch','asYaw','asRoll'].forEach(id=>{document.getElementById(id).value=0;});if(steerGrp)steerGrp.rotation.set(0,0,0);document.getElementById('asPitchV').textContent='0\u00B0';document.getElementById('asYawV').textContent='0\u00B0';document.getElementById('asRollV').textContent='0\u00B0';}
    document.getElementById('asPitch').addEventListener('input',applySteer);
    document.getElementById('asYaw').addEventListener('input',applySteer);
    document.getElementById('asRoll').addEventListener('input',applySteer);
    document.getElementById('asResetSteer').addEventListener('click',doResetSteer);

    console.log('boheme_airstream.js v2 (Streams + Schlieren + Lock&Steer) loaded');
  });
})();
