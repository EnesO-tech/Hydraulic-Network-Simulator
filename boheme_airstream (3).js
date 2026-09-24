(function(){
'use strict';
function waitForScene(cb){const iv=setInterval(()=>{if(typeof scene!=='undefined'&&scene&&typeof THREE!=='undefined'&&typeof renderer!=='undefined'){clearInterval(iv);cb();}},300);}

waitForScene(()=>{
const panel=document.getElementById('airstream-panel');
if(!panel)return;
panel.innerHTML=`
<div style="padding:8px 10px;border-bottom:1px solid #2a2a4a;">
  <h4 style="color:#e94560;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Airstream</h4>
  <div style="display:flex;gap:4px;margin-bottom:6px;">
    <button id="asToggle" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Streams OFF</button>
    <button id="asSchlieren" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Schlieren OFF</button>
  </div>
  <div style="display:flex;gap:4px;margin-bottom:6px;">
    <button id="asColor" style="flex:1;padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">Color: fixed</button>
  </div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">Speed</span><input type="range" id="asSpeed" min="0.5" max="5" step="0.1" value="2" style="flex:1;"><span id="asSpeedV" style="color:#aac;font-size:11px;width:30px;text-align:right;">2.0</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">Count</span><input type="range" id="asCount" min="500" max="8000" step="200" value="3000" style="flex:1;"><span id="asCountV" style="color:#aac;font-size:11px;width:30px;text-align:right;">3000</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">AoA</span><input type="range" id="asAoA" min="-15" max="20" step="0.5" value="5" style="flex:1;"><span id="asAoAV" style="color:#aac;font-size:11px;width:30px;text-align:right;">5°</span></div>
</div>
<div style="padding:8px 10px;border-bottom:1px solid #2a2a4a;">
  <h4 style="color:#e94560;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Lock &amp; Steer</h4>
  <button id="asLock" style="width:100%;padding:5px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;margin-bottom:6px;">🔓 Lock Nodes to Aircraft</button>
  <div id="asSteer" style="display:none;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#e94560;font-size:11px;width:36px;font-weight:700;">Pitch</span><input type="range" id="asPitch" min="-30" max="30" step="0.5" value="0" style="flex:1;"><span id="asPitchV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#4caf50;font-size:11px;width:36px;font-weight:700;">Yaw</span><input type="range" id="asYaw" min="-45" max="45" step="0.5" value="0" style="flex:1;"><span id="asYawV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#6fc3f7;font-size:11px;width:36px;font-weight:700;">Roll</span><input type="range" id="asRoll" min="-60" max="60" step="0.5" value="0" style="flex:1;"><span id="asRollV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span></div>
    <button id="asResetSteer" style="width:100%;padding:4px;background:#1a1a2e;border:1px solid #2a4a7a;color:#888;border-radius:3px;cursor:pointer;font-size:11px;">Reset Orientation</button>
  </div>
</div>`;

let active=false,colorBySpeed=false,pts=null,geo=null,pos=null,col=null;
let count=3000,speed=2.0,aoaDeg=5;
const R_FUSE=1.5,L_FUSE=8.0;
let steerGrp=null,locked=false;
const SPX=18,SPY=14,ZF=20,ZB=-20;

function resetP(i,rz){pos[i*3]=(Math.random()-0.5)*SPX*2;pos[i*3+1]=(Math.random()-0.5)*SPY*2;pos[i*3+2]=rz?(Math.random()*(ZF-ZB)+ZB):(ZF+Math.random()*3);col[i*3]=0.35;col[i*3+1]=0.65;col[i*3+2]=1.0;}
function createParticles(n){if(pts)scene.remove(pts);count=n;pos=new Float32Array(n*3);col=new Float32Array(n*3);for(let i=0;i<n;i++)resetP(i,true);geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));pts=new THREE.Points(geo,new THREE.PointsMaterial({size:0.06,vertexColors:true,transparent:true,opacity:0.75,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));scene.add(pts);}
function animateStream(){if(!pos||!geo)return;const dt=0.016,aoa=aoaDeg*Math.PI/180;for(let i=0;i<count;i++){let x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2],lx=x,ly=y,lz=z;if(steerGrp){const inv=new THREE.Matrix4().copy(steerGrp.matrixWorld).invert();const v=new THREE.Vector3(x,y,z).applyMatrix4(inv);lx=v.x;ly=v.y;lz=v.z;}let vx=0,vy=Math.sin(aoa)*speed*0.4,vz=-Math.cos(aoa)*speed;const r2d=Math.sqrt(lx*lx+ly*ly);if(r2d>0.01&&Math.abs(lz)<L_FUSE*0.55){if(r2d<R_FUSE*3.0){const f=(R_FUSE*R_FUSE)/(r2d*r2d);vx+=(lx/r2d)*speed*f*0.6;vy+=(ly/r2d)*speed*f*0.6;vz-=speed*f*0.2;}if(r2d<R_FUSE*1.08&&Math.abs(lz)<L_FUSE*0.5){const push=R_FUSE*1.2-r2d;vx+=(lx/r2d)*push*12;vy+=(ly/r2d)*push*12;}}if(steerGrp){const vel=new THREE.Vector3(vx,vy,vz).applyQuaternion(steerGrp.quaternion);x+=vel.x*dt;y+=vel.y*dt;z+=vel.z*dt;}else{x+=vx*dt;y+=vy*dt;z+=vz*dt;}pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;if(colorBySpeed){const spd=Math.sqrt(vx*vx+vy*vy+vz*vz);const t=Math.min(Math.max((spd/speed-0.8)*3,0),1);col[i*3]=0.2+t*0.8;col[i*3+1]=0.5*(1-t)+0.2*t;col[i*3+2]=1.0-t*0.7;}else{col[i*3]=0.35;col[i*3+1]=0.65;col[i*3+2]=1.0;}if(z<ZB-2||z>ZF+2||Math.abs(x)>SPX+2||Math.abs(y)>SPY+2)resetP(i,false);}geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;}

let schlierenActive=false,schlierenGroup=null,schlierenPlanes=[],allUniforms=[];
const SZ=20;

function makeNoiseTex(sz){const c=document.createElement('canvas');c.width=sz;c.height=sz;const ctx=c.getContext('2d');const img=ctx.createImageData(sz,sz);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v;img.data[i+3]=255;}ctx.putImageData(img,0,0);const tex=new THREE.CanvasTexture(c);tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;return tex;}

const licVert=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;

function makeLicFrag(sz){return `
precision highp float;
varying vec2 vUv;
uniform sampler2D uNoise;
uniform float uTime;
uniform float uRadius;
uniform float uAoA;
uniform float uSpeed;
uniform float uAlpha;

vec2 flowVel(vec2 p){
  float R2=uRadius*uRadius;
  float r2=dot(p,p);
  float r=sqrt(r2);
  if(r<uRadius*0.9) return vec2(0.0);
  float ca=cos(uAoA),sa=sin(uAoA);
  vec2 Uinf=vec2(-sa,-ca);
  vec2 rh=p/r;
  float fac=R2/r2;
  vec2 v=Uinf-Uinf*fac+2.0*dot(Uinf,rh)*rh*fac;
  float circ=-6.28318*uRadius*sa*1.5;
  v+=circ/(6.28318*r)*vec2(-p.y/r,p.x/r);
  return v;
}

void main(){
  vec2 p=(vUv-0.5)*2.0*${sz.toFixed(1)};
  float r=length(p);
  float phase=uTime*uSpeed*0.3;

  float bodyMask=smoothstep(uRadius*0.9,uRadius*1.5,r);

  float accum=0.0,weight=0.0;
  float dt=0.05;
  vec2 fwd=p;
  for(int i=0;i<60;i++){
    vec2 v=flowVel(fwd);float s=length(v);if(s<0.0003)break;
    fwd+=v/s*dt;
    vec2 tc=fwd/${(sz*2.0).toFixed(1)}+0.5+normalize(v+vec2(0.001))*phase*0.012;
    float n=texture2D(uNoise,fract(tc*3.5)).r+texture2D(uNoise,fract(tc*8.1+0.31)).r*0.4;
    float w=exp(-float(i)*0.045);accum+=n*w;weight+=w;
  }
  vec2 bwd=p;
  for(int i=0;i<60;i++){
    vec2 v=flowVel(bwd);float s=length(v);if(s<0.0003)break;
    bwd-=v/s*dt;
    vec2 tc=bwd/${(sz*2.0).toFixed(1)}+0.5+normalize(v+vec2(0.001))*phase*0.012;
    float n=texture2D(uNoise,fract(tc*3.5)).r+texture2D(uNoise,fract(tc*8.1+0.31)).r*0.4;
    float w=exp(-float(i)*0.045);accum+=n*w;weight+=w;
  }

  float lic=weight>0.0?accum/weight:0.5;
  lic=smoothstep(0.25,1.1,lic)*0.75+0.15;

  vec2 v=flowVel(p);float spd=length(v);
  float sf=clamp(spd*0.45,0.0,2.0);

  vec3 c1=vec3(0.06,0.09,0.18);
  vec3 c2=vec3(0.15,0.28,0.55);
  vec3 c3=vec3(0.50,0.65,0.90);
  vec3 c4=vec3(0.88,0.93,1.0);
  vec3 c5=vec3(1.0,0.55,0.22);
  vec3 col;
  if(sf<0.4)col=mix(c1,c2,sf/0.4);
  else if(sf<0.9)col=mix(c2,c3,(sf-0.4)/0.5);
  else if(sf<1.4)col=mix(c3,c4,(sf-0.9)/0.5);
  else col=mix(c4,c5,(sf-1.4)/0.6);
  col*=lic;

  float edgeFade=1.0-smoothstep(0.35,0.50,length(vUv-0.5));
  float alpha=bodyMask*edgeFade*uAlpha;
  gl_FragColor=vec4(col,alpha);
}
`;}

function createSchlieren(){
  schlierenGroup=new THREE.Group();
  const noiseTex=makeNoiseTex(512);
  const planeGeo=new THREE.PlaneGeometry(SZ*2,SZ*2);

  function addPlane(rotX,rotY,rotZ,px,py,pz,alpha){
    const u={uNoise:{value:noiseTex},uTime:{value:0},uRadius:{value:R_FUSE},uAoA:{value:aoaDeg*Math.PI/180},uSpeed:{value:speed},uAlpha:{value:alpha}};
    allUniforms.push(u);
    const mat=new THREE.ShaderMaterial({vertexShader:licVert,fragmentShader:makeLicFrag(SZ),uniforms:u,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.NormalBlending});
    const m=new THREE.Mesh(planeGeo,mat);
    m.rotation.set(rotX,rotY,rotZ);
    m.position.set(px,py,pz);
    m.renderOrder=-1;
    schlierenGroup.add(m);
    schlierenPlanes.push(m);
  }

  // XY plane (front view) - main slice at z=0
  addPlane(0,0,0, 0,0,0, 0.55);

  // XZ plane (top view) at y=0
  addPlane(-Math.PI/2,0,0, 0,0,0, 0.40);

  // YZ plane (side view) at x=0
  addPlane(0,Math.PI/2,0, 0,0,0, 0.40);

  // Additional XY cross-sections along the fuselage
  addPlane(0,0,0, 0,0, 3.5, 0.25);
  addPlane(0,0,0, 0,0,-3.5, 0.25);
  addPlane(0,0,0, 0,0, 6.0, 0.18);
  addPlane(0,0,0, 0,0,-6.0, 0.18);

  scene.add(schlierenGroup);
}

const _origRender=renderer.render.bind(renderer);let _time=0;
renderer.render=function(s,c){
  _time+=0.016;
  if(active&&pts)animateStream();
  if(schlierenActive&&allUniforms.length){
    for(const u of allUniforms){
      u.uTime.value=_time;
      u.uAoA.value=aoaDeg*Math.PI/180;
      u.uSpeed.value=speed;
    }
  }
  _origRender(s,c);
};

document.getElementById('asToggle').addEventListener('click',()=>{active=!active;const btn=document.getElementById('asToggle');if(active){btn.textContent='Streams ON';btn.style.background='#4caf50';if(!pts)createParticles(count);else pts.visible=true;}else{btn.textContent='Streams OFF';btn.style.background='#2a2a4a';if(pts)pts.visible=false;}});
document.getElementById('asSchlieren').addEventListener('click',()=>{schlierenActive=!schlierenActive;const btn=document.getElementById('asSchlieren');if(schlierenActive){btn.textContent='Schlieren ON';btn.style.background='#0f3460';if(!schlierenGroup)createSchlieren();else schlierenGroup.visible=true;}else{btn.textContent='Schlieren OFF';btn.style.background='#2a2a4a';if(schlierenGroup)schlierenGroup.visible=false;}});
document.getElementById('asColor').addEventListener('click',()=>{colorBySpeed=!colorBySpeed;const btn=document.getElementById('asColor');btn.textContent=colorBySpeed?'Color: speed':'Color: fixed';btn.style.background=colorBySpeed?'#0f3460':'#2a2a4a';});
document.getElementById('asSpeed').addEventListener('input',function(){speed=parseFloat(this.value);document.getElementById('asSpeedV').textContent=speed.toFixed(1);});
document.getElementById('asCount').addEventListener('input',function(){const n=parseInt(this.value);document.getElementById('asCountV').textContent=n;if(n!==count&&active)createParticles(n);});
document.getElementById('asAoA').addEventListener('input',function(){aoaDeg=parseFloat(this.value);document.getElementById('asAoAV').textContent=aoaDeg.toFixed(0)+'\u00B0';});

document.getElementById('asLock').addEventListener('click',()=>{locked=!locked;const btn=document.getElementById('asLock');const sd=document.getElementById('asSteer');if(locked){btn.innerHTML='🔒 Nodes LOCKED';btn.style.background='#4caf50';sd.style.display='block';steerGrp=new THREE.Group();scene.add(steerGrp);if(typeof aircraftGroup!=='undefined'&&aircraftGroup){scene.remove(aircraftGroup);steerGrp.add(aircraftGroup);}if(typeof pipeGroup!=='undefined'&&pipeGroup){scene.remove(pipeGroup);steerGrp.add(pipeGroup);}if(schlierenGroup){scene.remove(schlierenGroup);steerGrp.add(schlierenGroup);}}else{btn.innerHTML='🔓 Lock Nodes to Aircraft';btn.style.background='#2a2a4a';sd.style.display='none';if(steerGrp){if(typeof aircraftGroup!=='undefined'&&aircraftGroup){steerGrp.remove(aircraftGroup);scene.add(aircraftGroup);}if(typeof pipeGroup!=='undefined'&&pipeGroup){steerGrp.remove(pipeGroup);scene.add(pipeGroup);}if(schlierenGroup){steerGrp.remove(schlierenGroup);scene.add(schlierenGroup);}scene.remove(steerGrp);steerGrp=null;}doResetSteer();}});
function applySteer(){if(!steerGrp)return;const p=parseFloat(document.getElementById('asPitch').value)*Math.PI/180;const y=parseFloat(document.getElementById('asYaw').value)*Math.PI/180;const r=parseFloat(document.getElementById('asRoll').value)*Math.PI/180;steerGrp.rotation.set(p,y,r);document.getElementById('asPitchV').textContent=(p*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asYawV').textContent=(y*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asRollV').textContent=(r*180/Math.PI).toFixed(0)+'\u00B0';}
function doResetSteer(){['asPitch','asYaw','asRoll'].forEach(id=>{document.getElementById(id).value=0;});if(steerGrp)steerGrp.rotation.set(0,0,0);document.getElementById('asPitchV').textContent='0\u00B0';document.getElementById('asYawV').textContent='0\u00B0';document.getElementById('asRollV').textContent='0\u00B0';}
document.getElementById('asPitch').addEventListener('input',applySteer);
document.getElementById('asYaw').addEventListener('input',applySteer);
document.getElementById('asRoll').addEventListener('input',applySteer);
document.getElementById('asResetSteer').addEventListener('click',doResetSteer);
console.log('boheme_airstream.js v5 loaded');
});
})();
