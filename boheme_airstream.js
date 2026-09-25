(function(){
'use strict';
function waitForScene(cb){const iv=setInterval(()=>{if(typeof scene!=='undefined'&&scene&&typeof THREE!=='undefined'&&typeof renderer!=='undefined'){clearInterval(iv);cb();}},300);}

waitForScene(()=>{
const panel=document.getElementById('airstream-panel');
if(!panel)return;
const B='padding:4px 8px;background:#2a2a4a;border:1px solid #2a4a7a;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;';
panel.innerHTML=`
<div style="padding:8px 10px;border-bottom:1px solid #2a2a4a;">
  <h4 style="color:#e94560;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Airstream</h4>
  <div style="display:flex;gap:4px;margin-bottom:6px;">
    <button id="asToggle" style="flex:1;${B}">Particles OFF</button>
    <button id="asFlow" style="flex:1;${B}">Streamlines OFF</button>
  </div>
  <div style="display:flex;gap:4px;margin-bottom:6px;">
    <button id="asColor" style="flex:1;${B}">Color: fixed</button>
    <select id="asProfile" style="flex:1;${B}">
      <option value="root">Profil: Wurzel</option>
      <option value="mac" selected>Profil: MAC</option>
      <option value="tip">Profil: Spitze</option>
    </select>
  </div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">Speed</span><input type="range" id="asSpeed" min="0.5" max="5" step="0.1" value="2" style="flex:1;"><span id="asSpeedV" style="color:#aac;font-size:11px;width:30px;text-align:right;">2.0</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">Count</span><input type="range" id="asCount" min="500" max="8000" step="200" value="3000" style="flex:1;"><span id="asCountV" style="color:#aac;font-size:11px;width:30px;text-align:right;">3000</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">AoA</span><input type="range" id="asAoA" min="-10" max="15" step="0.5" value="2" style="flex:1;"><span id="asAoAV" style="color:#aac;font-size:11px;width:30px;text-align:right;">2°</span></div>
  <div id="asInfo" style="color:#aac;font-size:11px;line-height:1.5;margin-top:4px;"></div>
</div>
<div style="padding:8px 10px;border-bottom:1px solid #2a2a4a;">
  <h4 style="color:#e94560;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0;">Lock &amp; Steer</h4>
  <button id="asLock" style="width:100%;${B}margin-bottom:6px;">🔓 Lock Nodes to Aircraft</button>
  <div id="asSteer" style="display:none;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#e94560;font-size:11px;width:36px;font-weight:700;">Pitch</span><input type="range" id="asPitch" min="-30" max="30" step="0.5" value="0" style="flex:1;"><span id="asPitchV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#4caf50;font-size:11px;width:36px;font-weight:700;">Yaw</span><input type="range" id="asYaw" min="-45" max="45" step="0.5" value="0" style="flex:1;"><span id="asYawV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#6fc3f7;font-size:11px;width:36px;font-weight:700;">Roll</span><input type="range" id="asRoll" min="-60" max="60" step="0.5" value="0" style="flex:1;"><span id="asRollV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0°</span></div>
    <button id="asResetSteer" style="width:100%;padding:4px;background:#1a1a2e;border:1px solid #2a4a7a;color:#888;border-radius:3px;cursor:pointer;font-size:11px;">Reset Orientation</button>
  </div>
</div>`;

/* ---------------- 3D particles (unchanged) ---------------- */
let active=false,colorBySpeed=false,pts=null,geo=null,pos=null,col=null;
let count=3000,speed=2.0,aoaDeg=2;
const R_FUSE=1.5,L_FUSE=8.0;
let steerGrp=null,locked=false;
const SPX=18,SPY=14,ZF=20,ZB=-20;
function resetP(i,rz){pos[i*3]=(Math.random()-0.5)*SPX*2;pos[i*3+1]=(Math.random()-0.5)*SPY*2;pos[i*3+2]=rz?(Math.random()*(ZF-ZB)+ZB):(ZF+Math.random()*3);col[i*3]=0.35;col[i*3+1]=0.65;col[i*3+2]=1.0;}
function createParticles(n){if(pts)scene.remove(pts);count=n;pos=new Float32Array(n*3);col=new Float32Array(n*3);for(let i=0;i<n;i++)resetP(i,true);geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));pts=new THREE.Points(geo,new THREE.PointsMaterial({size:0.06,vertexColors:true,transparent:true,opacity:0.75,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));scene.add(pts);}
function animateStream(){if(!pos||!geo)return;const dt=0.016,aoa=aoaDeg*Math.PI/180;for(let i=0;i<count;i++){let x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2],lx=x,ly=y,lz=z;if(steerGrp){const inv=new THREE.Matrix4().copy(steerGrp.matrixWorld).invert();const v=new THREE.Vector3(x,y,z).applyMatrix4(inv);lx=v.x;ly=v.y;lz=v.z;}let vx=0,vy=Math.sin(aoa)*speed*0.4,vz=-Math.cos(aoa)*speed;const r2d=Math.sqrt(lx*lx+ly*ly);if(r2d>0.01&&Math.abs(lz)<L_FUSE*0.55){if(r2d<R_FUSE*3.0){const f=(R_FUSE*R_FUSE)/(r2d*r2d);vx+=(lx/r2d)*speed*f*0.6;vy+=(ly/r2d)*speed*f*0.6;vz-=speed*f*0.2;}if(r2d<R_FUSE*1.08&&Math.abs(lz)<L_FUSE*0.5){const push=R_FUSE*1.2-r2d;vx+=(lx/r2d)*push*12;vy+=(ly/r2d)*push*12;}}if(steerGrp){const vel=new THREE.Vector3(vx,vy,vz).applyQuaternion(steerGrp.quaternion);x+=vel.x*dt;y+=vel.y*dt;z+=vel.z*dt;}else{x+=vx*dt;y+=vy*dt;z+=vz*dt;}pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;if(colorBySpeed){const spd=Math.sqrt(vx*vx+vy*vy+vz*vz);const t=Math.min(Math.max((spd/speed-0.8)*3,0),1);col[i*3]=0.2+t*0.8;col[i*3+1]=0.5*(1-t)+0.2*t;col[i*3+2]=1.0-t*0.7;}else{col[i*3]=0.35;col[i*3+1]=0.65;col[i*3+2]=1.0;}if(z<ZB-2||z>ZF+2||Math.abs(x)>SPX+2||Math.abs(y)>SPY+2)resetP(i,false);}geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;}

/* ---------------- Joukowsky airfoil geometry ----------------
   Circle in zeta-plane: centre zeta0 = (-eps, delta), radius a = |1 - zeta0|
   (passes through zeta = 1 -> sharp trailing edge at z = 2).
   Map: z = zeta + 1/zeta.  Kutta: Gamma = 4*pi*a*U*sin(alpha + beta).     */
const PRESETS={
  root:{name:'A320 Wurzel',tc:0.15, fc:0.020},
  mac: {name:'A320 MAC',   tc:0.13, fc:0.020},
  tip: {name:'A320 Spitze',tc:0.11, fc:0.015}
};
function analyse(eps,del){
  const a=Math.hypot(1+eps,del),N=2000,P=[];
  for(let k=0;k<N;k++){const th=2*Math.PI*k/N;const zx=-eps+a*Math.cos(th),zy=del+a*Math.sin(th),r2=zx*zx+zy*zy;P.push([zx+zx/r2,zy-zy/r2]);}
  let le=P[0],te=P[0];for(const p of P){if(p[0]<le[0])le=p;if(p[0]>te[0])te=p;}
  const nb=200,up=new Array(nb).fill(-1e9),lo=new Array(nb).fill(1e9),span=te[0]-le[0];
  for(const p of P){let i=Math.floor((p[0]-le[0])/span*nb);i=Math.max(0,Math.min(nb-1,i));if(p[1]>up[i])up[i]=p[1];if(p[1]<lo[i])lo[i]=p[1];}
  const chord=Math.hypot(te[0]-le[0],te[1]-le[1]);let tmax=0,fmax=0;
  for(let i=0;i<nb;i++){if(up[i]<-1e8||lo[i]>1e8)continue;const f=(i+0.5)/nb;const yc=le[1]+(te[1]-le[1])*f;tmax=Math.max(tmax,up[i]-lo[i]);fmax=Math.max(fmax,(up[i]+lo[i])/2-yc);}
  return {a,chord,tc:tmax/chord,fc:fmax/chord};
}
function fitProfile(tc,fc){
  const del=2*fc;let lo=0.001,hi=0.4;
  for(let i=0;i<40;i++){const m=(lo+hi)/2;if(analyse(m,del).tc<tc)lo=m;else hi=m;}
  const eps=(lo+hi)/2,r=analyse(eps,del);
  return {eps,del,a:r.a,chord:r.chord,tc:r.tc,fc:r.fc,beta:Math.atan2(del,1+eps)};
}
let prof=fitProfile(PRESETS.mac.tc,PRESETS.mac.fc),profKey='mac';
function aero(){
  const al=aoaDeg*Math.PI/180;
  const G=4*Math.PI*prof.a*Math.sin(al+prof.beta);
  return {al,G,CL:2*G/prof.chord,aL0:-prof.beta*180/Math.PI};
}

/* ---------------- GLSL ---------------- */
const GL_COMMON=`
precision highp float;
varying vec2 vUv;
uniform vec2 uZ0;uniform float uA;uniform float uAl;uniform float uG;uniform float uW;uniform float uAsp;
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 cdiv(vec2 a,vec2 b){float d=dot(b,b);return vec2(a.x*b.x+a.y*b.y,a.y*b.x-a.x*b.y)/d;}
vec2 csqrt(vec2 z){float r=length(z);float sx=sqrt(max(0.5*(r+z.x),0.0));float sy=sqrt(max(0.5*(r-z.x),0.0));return vec2(sx,z.y<0.0?-sy:sy);}
vec2 zetaOf(vec2 z){vec2 s=csqrt(cmul(z,z)-vec2(4.0,0.0));vec2 p=0.5*(z+s),q=0.5*(z-s);return length(p-uZ0)>length(q-uZ0)?p:q;}
vec3 vel(vec2 z){
  vec2 zt=zetaOf(z);vec2 zp=zt-uZ0;
  if(length(zp)<uA)return vec3(0.0,0.0,1.0);
  vec2 eia=vec2(cos(uAl),sin(uAl));vec2 emia=vec2(eia.x,-eia.y);
  vec2 dW=emia-uA*uA*cdiv(eia,cmul(zp,zp))+cdiv(vec2(0.0,uG/6.2831853),zp);
  vec2 dz=vec2(1.0,0.0)-cdiv(vec2(1.0,0.0),cmul(zt,zt));
  if(length(dz)<1e-4)return vec3(0.0,0.0,0.0);
  vec2 w=cdiv(dW,dz);vec2 v=vec2(w.x,-w.y);
  float s=length(v);if(s>3.0)v*=3.0/s;
  return vec3(v,0.0);
}
vec2 worldPos(vec2 uv){return vec2((uv.x-0.5)*uW,(uv.y-0.5)*uW*uAsp);}
`;
const VERT=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
const LIC_FRAG=GL_COMMON+`
uniform sampler2D uNoise;uniform float uDs;uniform float uAnim;uniform float uNs;
float nz(vec2 p){return texture2D(uNoise,p*uNs).r;}
float kern(float s,float L){return exp(-abs(s)/L*1.6)*(0.6+0.4*sin(6.2831853*s/(0.45*L)-uAnim));}
void main(){
  vec2 z=worldPos(vUv);vec3 v0=vel(z);
  if(v0.z>0.5){gl_FragColor=vec4(0.5,0.0,1.0,1.0);return;}
  float L=uDs*30.0;float k=kern(0.0,L);float acc=nz(z)*k,ws=k;
  vec2 p=z;
  for(int i=0;i<30;i++){vec3 v=vel(p);if(v.z>0.5)break;float sp=length(v.xy);if(sp<1e-5)break;p+=v.xy/sp*uDs;float s=float(i+1)*uDs;k=kern(s,L);acc+=nz(p)*k;ws+=k;}
  p=z;
  for(int i=0;i<30;i++){vec3 v=vel(p);if(v.z>0.5)break;float sp=length(v.xy);if(sp<1e-5)break;p-=v.xy/sp*uDs;float s=-float(i+1)*uDs;k=kern(s,L);acc+=nz(p)*k;ws+=k;}
  float sp=length(v0.xy);float cp=1.0-sp*sp;
  gl_FragColor=vec4(acc/ws,clamp((1.0-cp)/2.6,0.0,1.0),0.0,1.0);
}`;
const BLIT_FRAG=GL_COMMON+`
uniform sampler2D uTex;
vec3 magma(float t){t=clamp(t,0.0,1.0);
  if(t<0.25)return mix(vec3(0.0,0.0,0.02),vec3(0.27,0.005,0.33),t*4.0);
  if(t<0.5)return mix(vec3(0.27,0.005,0.33),vec3(0.72,0.13,0.30),(t-0.25)*4.0);
  if(t<0.75)return mix(vec3(0.72,0.13,0.30),vec3(0.99,0.45,0.12),(t-0.5)*4.0);
  return mix(vec3(0.99,0.45,0.12),vec3(1.0,0.98,0.75),(t-0.75)*4.0);}
void main(){
  vec2 z=worldPos(vUv);float rr=length(zetaOf(z)-uZ0)/uA;
  if(rr<1.0){gl_FragColor=vec4(0.14,0.15,0.18,1.0);return;}
  vec4 d=texture2D(uTex,vUv);
  float lic=clamp((d.r-0.5)*3.2+0.5,0.0,1.0);
  vec3 c=magma(0.12+0.85*d.g)*(0.2+1.05*lic);
  c=mix(c,vec3(0.85,0.87,0.9),1.0-smoothstep(0.0,0.012,rr-1.0));
  gl_FragColor=vec4(c,1.0);
}`;

/* ---------------- 2D wing-section flow mode ---------------- */
let flowMode=false,rt=null,licMat=null,blitMat=null,licScene=null,blitScene=null,ocam=null,hud=null,camSave=null,anim=0;
const VIEW_W=6.0,RT_SCALE=0.5;
function makeNoiseTex(sz){const d=new Uint8Array(sz*sz*4);for(let i=0;i<sz*sz;i++){const v=Math.floor(Math.random()*256);d[i*4]=v;d[i*4+1]=v;d[i*4+2]=v;d[i*4+3]=255;}const t=new THREE.DataTexture(d,sz,sz,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
function commonUniforms(){return{uZ0:{value:new THREE.Vector2()},uA:{value:1},uAl:{value:0},uG:{value:0},uW:{value:VIEW_W},uAsp:{value:1}};}
function initFlow(){
  ocam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const quad=new THREE.PlaneGeometry(2,2);
  const lu=Object.assign(commonUniforms(),{uNoise:{value:makeNoiseTex(256)},uDs:{value:0.01},uAnim:{value:0},uNs:{value:1}});
  licMat=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:LIC_FRAG,uniforms:lu,depthTest:false,depthWrite:false});
  licScene=new THREE.Scene();licScene.add(new THREE.Mesh(quad,licMat));
  rt=new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false});
  const bu=Object.assign(commonUniforms(),{uTex:{value:rt.texture}});
  blitMat=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:BLIT_FRAG,uniforms:bu,depthTest:false,depthWrite:false});
  blitScene=new THREE.Scene();blitScene.add(new THREE.Mesh(quad,blitMat));
}
function syncUniforms(W,H){
  const ae=aero();
  for(const m of [licMat,blitMat]){const u=m.uniforms;u.uZ0.value.set(-prof.eps,prof.del);u.uA.value=prof.a;u.uAl.value=ae.al;u.uG.value=ae.G;u.uAsp.value=H/W;}
  const rw=Math.max(2,Math.floor(W*RT_SCALE)),rh=Math.max(2,Math.floor(H*RT_SCALE));
  if(rt.width!==rw||rt.height!==rh)rt.setSize(rw,rh);
  licMat.uniforms.uDs.value=1.3*VIEW_W/rw;
  licMat.uniforms.uNs.value=rw/(VIEW_W*256.0);
  anim+=0.016*speed*2.5;licMat.uniforms.uAnim.value=anim;
}
function renderFlow(){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  syncUniforms(sz.x,sz.y);
  const prev=renderer.getRenderTarget();
  renderer.setRenderTarget(rt);_origRender(licScene,ocam);
  renderer.setRenderTarget(prev);_origRender(blitScene,ocam);
}
function updateInfo(){
  const ae=aero();
  const txt=`<b>${PRESETS[profKey].name}</b> (Joukowsky-Näherung)<br>t/c = ${(prof.tc*100).toFixed(1)} % · f/c = ${(prof.fc*100).toFixed(1)} %<br>α = ${aoaDeg.toFixed(1)}° · α<sub>L0</sub> = ${ae.aL0.toFixed(2)}°<br>C<sub>L</sub> = 2π·(a/(c/4))·sin(α−α<sub>L0</sub>) = <b>${ae.CL.toFixed(3)}</b>`;
  document.getElementById('asInfo').innerHTML=flowMode?txt:'';
  if(hud){hud.querySelector('#asHudTxt').innerHTML=txt+`<br><span style="color:#888">2D-Potentialströmung · inkompressibel · reibungsfrei · Kutta-Bedingung</span>`;}
}
function enterFlow(){
  if(!licMat)initFlow();
  flowMode=true;
  if(typeof controls!=='undefined'&&controls){camSave={en:controls.enabled};controls.enabled=false;}
  const host=renderer.domElement.parentElement;
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  hud=document.createElement('div');
  hud.style.cssText='position:absolute;inset:0;z-index:20;pointer-events:auto;cursor:default;font-family:inherit;';
  hud.innerHTML=`
    <div id="asHudTxt" style="position:absolute;top:12px;left:12px;background:rgba(10,10,26,0.8);border:1px solid #2a4a7a;border-radius:4px;padding:8px 10px;color:#ddd;font-size:12px;line-height:1.5;"></div>
    <button id="asHudExit" style="position:absolute;top:12px;right:12px;${B}font-size:12px;">✕ Exit Streamlines</button>
    <div style="position:absolute;bottom:40px;left:12px;background:rgba(10,10,26,0.8);border:1px solid #2a4a7a;border-radius:4px;padding:6px 10px;color:#ddd;font-size:11px;">
      <div style="width:220px;height:10px;background:linear-gradient(90deg,#000005,#450154,#b8214d,#fc731f,#fffabf);margin-bottom:3px;"></div>
      <div style="display:flex;justify-content:space-between;width:220px;"><span>C<sub>p</sub> = 1 (Staupunkt)</span><span>C<sub>p</sub> &lt; 0 (Sog)</span></div>
    </div>`;
  ['wheel','pointerdown','mousedown','touchstart','contextmenu'].forEach(ev=>hud.addEventListener(ev,e=>{if(e.target.id!=='asHudExit')e.preventDefault();e.stopPropagation();},{passive:false}));
  host.appendChild(hud);
  hud.querySelector('#asHudExit').addEventListener('click',toggleFlow);
  const btn=document.getElementById('asFlow');btn.textContent='Streamlines ON';btn.style.background='#0f3460';
  updateInfo();
}
function exitFlow(){
  flowMode=false;
  if(hud){hud.remove();hud=null;}
  if(typeof controls!=='undefined'&&controls&&camSave)controls.enabled=camSave.en;
  const btn=document.getElementById('asFlow');btn.textContent='Streamlines OFF';btn.style.background='#2a2a4a';
  updateInfo();
}
function toggleFlow(){flowMode?exitFlow():enterFlow();}

/* ---------------- render hook ---------------- */
const _origRender=renderer.render.bind(renderer);
renderer.render=function(s,c){
  if(flowMode&&s===scene){renderFlow();return;}
  if(active&&pts)animateStream();
  _origRender(s,c);
};

/* ---------------- UI ---------------- */
document.getElementById('asToggle').addEventListener('click',()=>{active=!active;const btn=document.getElementById('asToggle');if(active){btn.textContent='Particles ON';btn.style.background='#4caf50';if(!pts)createParticles(count);else pts.visible=true;}else{btn.textContent='Particles OFF';btn.style.background='#2a2a4a';if(pts)pts.visible=false;}});
document.getElementById('asFlow').addEventListener('click',toggleFlow);
document.getElementById('asProfile').addEventListener('change',function(){profKey=this.value;prof=fitProfile(PRESETS[profKey].tc,PRESETS[profKey].fc);updateInfo();});
document.getElementById('asColor').addEventListener('click',()=>{colorBySpeed=!colorBySpeed;const btn=document.getElementById('asColor');btn.textContent=colorBySpeed?'Color: speed':'Color: fixed';btn.style.background=colorBySpeed?'#0f3460':'#2a2a4a';});
document.getElementById('asSpeed').addEventListener('input',function(){speed=parseFloat(this.value);document.getElementById('asSpeedV').textContent=speed.toFixed(1);});
document.getElementById('asCount').addEventListener('input',function(){const n=parseInt(this.value);document.getElementById('asCountV').textContent=n;if(n!==count&&active)createParticles(n);});
document.getElementById('asAoA').addEventListener('input',function(){aoaDeg=parseFloat(this.value);document.getElementById('asAoAV').textContent=aoaDeg.toFixed(1)+'\u00B0';updateInfo();});

document.getElementById('asLock').addEventListener('click',()=>{locked=!locked;const btn=document.getElementById('asLock');const sd=document.getElementById('asSteer');if(locked){btn.innerHTML='🔒 Nodes LOCKED';btn.style.background='#4caf50';sd.style.display='block';steerGrp=new THREE.Group();scene.add(steerGrp);if(typeof aircraftGroup!=='undefined'&&aircraftGroup){scene.remove(aircraftGroup);steerGrp.add(aircraftGroup);}if(typeof pipeGroup!=='undefined'&&pipeGroup){scene.remove(pipeGroup);steerGrp.add(pipeGroup);}}else{btn.innerHTML='🔓 Lock Nodes to Aircraft';btn.style.background='#2a2a4a';sd.style.display='none';if(steerGrp){if(typeof aircraftGroup!=='undefined'&&aircraftGroup){steerGrp.remove(aircraftGroup);scene.add(aircraftGroup);}if(typeof pipeGroup!=='undefined'&&pipeGroup){steerGrp.remove(pipeGroup);scene.add(pipeGroup);}scene.remove(steerGrp);steerGrp=null;}doResetSteer();}});
function applySteer(){if(!steerGrp)return;const p=parseFloat(document.getElementById('asPitch').value)*Math.PI/180;const y=parseFloat(document.getElementById('asYaw').value)*Math.PI/180;const r=parseFloat(document.getElementById('asRoll').value)*Math.PI/180;steerGrp.rotation.set(p,y,r);document.getElementById('asPitchV').textContent=(p*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asYawV').textContent=(y*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asRollV').textContent=(r*180/Math.PI).toFixed(0)+'\u00B0';}
function doResetSteer(){['asPitch','asYaw','asRoll'].forEach(id=>{document.getElementById(id).value=0;});if(steerGrp)steerGrp.rotation.set(0,0,0);document.getElementById('asPitchV').textContent='0\u00B0';document.getElementById('asYawV').textContent='0\u00B0';document.getElementById('asRollV').textContent='0\u00B0';}
document.getElementById('asPitch').addEventListener('input',applySteer);
document.getElementById('asYaw').addEventListener('input',applySteer);
document.getElementById('asRoll').addEventListener('input',applySteer);
document.getElementById('asResetSteer').addEventListener('click',doResetSteer);

console.log('boheme_airstream.js v7 loaded – profile',prof);
});
})();
