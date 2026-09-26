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
    <select id="asView" style="flex:1;${B}">
      <option value="side" selected>Ansicht: Seite</option>
      <option value="wing">Ansicht: Flügelprofil</option>
    </select>
  </div>
  <div style="display:flex;gap:4px;margin-bottom:6px;">
    <select id="asCond" style="flex:1;${B}">
      <option value="cruise" selected>Reiseflug M0.78</option>
      <option value="approach">Anflug</option>
      <option value="takeoff">Start</option>
    </select>
    <select id="asProfile" style="flex:1;${B}">
      <option value="root">Profil: Wurzel</option>
      <option value="mac" selected>Profil: MAC</option>
      <option value="tip">Profil: Spitze</option>
    </select>
  </div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">Speed</span><input type="range" id="asSpeed" min="0.5" max="5" step="0.1" value="2" style="flex:1;"><span id="asSpeedV" style="color:#aac;font-size:11px;width:30px;text-align:right;">2.0</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">Count</span><input type="range" id="asCount" min="500" max="8000" step="200" value="3000" style="flex:1;"><span id="asCountV" style="color:#aac;font-size:11px;width:30px;text-align:right;">3000</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">AoA</span><input type="range" id="asAoA" min="-10" max="15" step="0.5" value="2" style="flex:1;"><span id="asAoAV" style="color:#aac;font-size:11px;width:30px;text-align:right;">2°</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#888;font-size:11px;width:50px;">Engine</span><input type="range" id="asMfr" min="0" max="2.5" step="0.05" value="0.7" style="flex:1;"><span id="asMfrV" style="color:#aac;font-size:11px;width:30px;text-align:right;">0.70</span></div>
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
vec2 rot(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
vec2 bodyPos(vec2 uv){return rot(vec2((uv.x-0.5)*uW,(uv.y-0.5)*uW*uAsp),uAl);}
`;
const VERT_Q=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
const VERT_3D=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const LIC_FRAG=GL_COMMON+`
uniform sampler2D uNoise;uniform float uDs;uniform float uAnim;uniform float uNs;
uniform vec2 uShift;float nz(vec2 p){return texture2D(uNoise,(p-uShift)*uNs).r;}
float kern(float s,float L){return exp(-abs(s)/L*1.6);}
void main(){
  vec2 z=bodyPos(vUv);vec3 v0=vel(z);
  if(v0.z>0.5){gl_FragColor=vec4(0.5,0.0,1.0,1.0);return;}
  float L=uDs*26.0;float k=kern(0.0,L);float acc=nz(z)*k,ws=k;
  vec2 p=z;
  for(int i=0;i<26;i++){vec3 v=vel(p);if(v.z>0.5)break;float sp=length(v.xy);if(sp<1e-5)break;p+=v.xy/sp*uDs;float s=float(i+1)*uDs;k=kern(s,L);acc+=nz(p)*k;ws+=k;}
  p=z;
  for(int i=0;i<26;i++){vec3 v=vel(p);if(v.z>0.5)break;float sp=length(v.xy);if(sp<1e-5)break;p-=v.xy/sp*uDs;float s=-float(i+1)*uDs;k=kern(s,L);acc+=nz(p)*k;ws+=k;}
  float sp=length(v0.xy);float cp=1.0-sp*sp;
  gl_FragColor=vec4(acc/ws,clamp((1.0-cp)/2.6,0.0,1.0),0.0,1.0);
}`;
const SHEET_FRAG=GL_COMMON+`
uniform sampler2D uTex;
vec3 magma(float t){t=clamp(t,0.0,1.0);
  if(t<0.25)return mix(vec3(0.0,0.0,0.02),vec3(0.27,0.005,0.33),t*4.0);
  if(t<0.5)return mix(vec3(0.27,0.005,0.33),vec3(0.72,0.13,0.30),(t-0.25)*4.0);
  if(t<0.75)return mix(vec3(0.72,0.13,0.30),vec3(0.99,0.45,0.12),(t-0.5)*4.0);
  return mix(vec3(0.99,0.45,0.12),vec3(1.0,0.98,0.75),(t-0.75)*4.0);}
void main(){
  vec2 z=bodyPos(vUv);float rr=length(zetaOf(z)-uZ0)/uA;
  if(rr<1.0)discard;
  vec4 d=texture2D(uTex,vUv);
  float lic=clamp((d.r-0.5)*3.2+0.5,0.0,1.0);
  vec3 c=magma(0.12+0.85*d.g)*(0.2+1.05*lic);
  float e=max(abs(vUv.x-0.5),abs(vUv.y-0.5));
  gl_FragColor=vec4(c,1.0-smoothstep(0.40,0.5,e));
}`;

/* ---------------- wind-tunnel scene with own wing model ---------------- */
let viewMode='side',flowMode=false,rt=null,licMat=null,sheetMat=null,licScene=null,ocam=null,hud=null,camSave=null,anim=0;
let wtScene=null,wtCam=null,wingPivot=null,wingMesh=null,wingSrc='';
const SHEET_W=18.0,SHEET_H=11.0,SPAN=2.2,RT_W=1280,RT_H=800;
const wingCache={};
function makeNoiseTex(sz){const d=new Uint8Array(sz*sz*4);for(let i=0;i<sz*sz;i++){const v=Math.floor(Math.random()*256);d[i*4]=v;d[i*4+1]=v;d[i*4+2]=v;d[i*4+3]=255;}const t=new THREE.DataTexture(d,sz,sz,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
function commonUniforms(){return{uZ0:{value:new THREE.Vector2()},uA:{value:1},uAl:{value:0},uG:{value:0},uW:{value:SHEET_W},uAsp:{value:SHEET_H/SHEET_W}};}
function proceduralWing(){
  const a=prof.a,beta=prof.beta,n=240,shape=new THREE.Shape();
  for(let k=0;k<n;k++){const th=-beta+2*Math.PI*k/n;const zx=-prof.eps+a*Math.cos(th),zy=prof.del+a*Math.sin(th),r2=zx*zx+zy*zy;const x=zx+zx/r2,y=zy-zy/r2;k===0?shape.moveTo(x,y):shape.lineTo(x,y);}
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth:SPAN,bevelEnabled:false,steps:1,curveSegments:1});
}
function setWingGeometry(g){
  g.computeVertexNormals();
  if(wingMesh){wingPivot.remove(wingMesh);wingMesh.geometry.dispose();}
  wingMesh=new THREE.Mesh(g,new THREE.MeshPhongMaterial({color:0xb8c4d6,specular:0x555566,shininess:45,side:THREE.DoubleSide}));
  wingPivot.add(wingMesh);updateInfo();
}
function loadWing(key){
  if(wingCache[key]){wingSrc=wingCache[key].src;setWingGeometry(wingCache[key].g.clone());return;}
  const path='models/a320_wing_'+key+'.stl';
  const done=(g,src)=>{wingCache[key]={g,src};wingSrc=src;setWingGeometry(g.clone());};
  if(THREE.STLLoader){new THREE.STLLoader().load(path,g=>done(g,'STL: '+path),undefined,()=>done(proceduralWing(),'prozedural (STL fehlt)'));}
  else done(proceduralWing(),'prozedural (kein STLLoader)');
}
function initFlow(){
  ocam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const lu=Object.assign(commonUniforms(),{uNoise:{value:makeNoiseTex(256)},uDs:{value:1.3*SHEET_W/RT_W},uAnim:{value:0},uShift:{value:new THREE.Vector2()},uNs:{value:RT_W/(SHEET_W*256.0)}});
  licMat=new THREE.ShaderMaterial({vertexShader:VERT_Q,fragmentShader:LIC_FRAG,uniforms:lu,depthTest:false,depthWrite:false});
  licScene=new THREE.Scene();licScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),licMat));
  rt=new THREE.WebGLRenderTarget(RT_W,RT_H,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false});
  sheetMat=new THREE.ShaderMaterial({vertexShader:VERT_3D,fragmentShader:SHEET_FRAG,uniforms:Object.assign(commonUniforms(),{uTex:{value:rt.texture}}),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  wtScene=new THREE.Scene();wtScene.background=new THREE.Color(0x05050c);
  wtScene.add(new THREE.Mesh(new THREE.PlaneGeometry(SHEET_W,SHEET_H),sheetMat));
  wtScene.add(new THREE.AmbientLight(0xffffff,0.45));
  const d1=new THREE.DirectionalLight(0xffffff,0.9);d1.position.set(4,8,10);wtScene.add(d1);
  const d2=new THREE.DirectionalLight(0xffb070,0.35);d2.position.set(-6,-2,4);wtScene.add(d2);
  wingPivot=new THREE.Group();wtScene.add(wingPivot);
  wtCam=new THREE.PerspectiveCamera(34,1,0.1,100);
  wtCam.position.set(-2.6,1.4,10.5);wtCam.lookAt(0.2,-0.1,0.9);
  loadWing(profKey);
}
function renderFlow(){
  const ae=aero();
  for(const m of [licMat,sheetMat]){const u=m.uniforms;u.uZ0.value.set(-prof.eps,prof.del);u.uA.value=prof.a;u.uAl.value=ae.al;u.uG.value=ae.G;}
  advance(shiftW,frameDt()*speed*0.6,ae.al,SHEET_W*256.0/RT_W);licMat.uniforms.uShift.value.set(shiftW[0],shiftW[1]);
  wingPivot.rotation.z=-ae.al;
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  if(Math.abs(wtCam.aspect-sz.x/sz.y)>1e-3){wtCam.aspect=sz.x/sz.y;wtCam.updateProjectionMatrix();}
  const prev=renderer.getRenderTarget();
  renderer.setRenderTarget(rt);_origRender(licScene,ocam);
  renderer.setRenderTarget(prev);_origRender(wtScene,wtCam);
}
function updateInfo(){
  let txt,foot;
  if(viewMode==='side'){
    const c=CONDS[condKey],vm=sideVM;
    txt=`<b>A320 Seitenriss</b> – ${c.name}<br>U = ${c.U} m/s · Re<sub>L</sub> = ${vm?(vm.ReL/1e6).toFixed(0):'–'}·10<sup>6</sup> · α = ${aoaDeg.toFixed(1)}°<br>Grenzschicht am Heck δ ≈ ${vm?vm.dTE.toFixed(2):'–'} m · Strahl V<sub>j</sub>/U = ${c.vj.toFixed(2)} · MFR = ${mfr.toFixed(2)}`+(sideStats.n?`<br>${sideStats.n} Panels · ${sideStats.ms} ms`:'');
    foot='Potentialströmung (Hess-Smith) + turbulente Grenzschicht (1/7-Gesetz, Haftbedingung)<br>+ Nachlauf (Schlichting) + Triebwerksstrahl + Prandtl-Glauert · halbempirisch, kein CFD<br>Leitwerk halbtransparent (dünn, seitlich umströmt) · Triebwerk in Seitenprojektion';
  }else{
    const ae=aero();
    txt=`<b>${PRESETS[profKey].name}</b> (Joukowsky-Näherung)<br>t/c = ${(prof.tc*100).toFixed(1)} % · f/c = ${(prof.fc*100).toFixed(1)} %<br>α = ${aoaDeg.toFixed(1)}° · α<sub>L0</sub> = ${ae.aL0.toFixed(2)}°<br>C<sub>L</sub> = 2Γ/c = <b>${ae.CL.toFixed(3)}</b>`;
    foot=`Modell: ${wingSrc||'…'}<br>2D-Potentialströmung · inkompressibel · reibungsfrei · Kutta-Bedingung`;
  }
  document.getElementById('asInfo').innerHTML=flowMode?txt:'';
  if(hud){hud.querySelector('#asHudTxt').innerHTML=txt+`<br><span style="color:#888">${foot}</span>`;
    hud.querySelector('#asLegL').innerHTML=viewMode==='side'?'V/U = 0 (Staupunkt, Wand)':'C<sub>p</sub> = 1 (Staupunkt)';
    hud.querySelector('#asLegR').innerHTML=viewMode==='side'?'V/U ≥ 2 (Strahl)':'C<sub>p</sub> &lt; 0 (Sog)';}
}
function enterFlow(){
  if(!ocam)ocam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  if(viewMode==='side'){if(!sideGeo)initSide();}else if(!licMat)initFlow();
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
      <div style="display:flex;justify-content:space-between;width:220px;"><span id="asLegL"></span><span id="asLegR"></span></div>
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


/* ================= SIDE VIEW: A320 fuselage + engine, 2D panel method ================= */
/*PANEL_BEGIN*/
function a320SidePolys(){
  const R=2.07,f=[],nac=[];
  const push=(a,x,y)=>a.push([x,y]);
  for(let i=0;i<=24;i++){const th=Math.PI-(Math.PI/2)*i/24;push(f,6.5+6.5*Math.cos(th),-0.35+(R+0.35)*Math.sin(th));}
  for(let x=7.5;x<26;x+=1.0)push(f,x,R);
  const topY=x=>R-(R-0.95)*Math.pow(Math.max(0,(x-26)/11.57),1.8);
  for(let x=26;x<37.5;x+=0.5)push(f,x,topY(x));
  push(f,37.57,0.95);push(f,37.57,0.65);
  const fin=[];push(fin,26,R);push(fin,27.5,R+0.3);push(fin,29.0,R+0.75);
  for(let i=1;i<=8;i++){const s=i/8;push(fin,29.0+3.6*s,R+0.75+(7.9-R-0.75)*s);}
  push(fin,33.8,8.0);push(fin,35.0,7.9);
  for(let i=1;i<=8;i++){const s=i/8;push(fin,35.0+1.9*s,7.9-(7.9-1.35)*s);}
  for(let x=36.9;x>26;x-=0.5)push(fin,x,topY(x));
  for(let i=1;i<=20;i++){const x=37.57-15.57*i/20,s=(x-22)/15.57;push(f,x,-R+(R+0.65)*Math.pow(s,1.7));}
  for(let x=21;x>4.5;x-=1.0)push(f,x,-R);
  for(let i=0;i<24;i++){const th=-Math.PI/2-(Math.PI/2)*i/24;push(f,4.5+4.5*Math.cos(th),-0.35+(R-0.35)*Math.sin(th));}
  const c=-3.6,x0=10.8,Ln=4.4;
  const r=x=>{const t=(x-x0)/Ln;if(t<0.2)return 1.05+0.13*Math.sin(t/0.2*Math.PI/2);if(t<0.55)return 1.18;return 1.18-0.43*Math.pow((t-0.55)/0.45,1.3);};
  for(let i=0;i<=20;i++){const x=x0+Ln*i/20;push(nac,x,c+r(x));}
  for(let i=1;i<4;i++)push(nac,x0+Ln,c+0.75-1.5*i/4);
  for(let i=20;i>=0;i--){const x=x0+Ln*i/20;push(nac,x,c-r(x));}
  for(let i=1;i<4;i++)push(nac,x0,c-1.05+2.1*i/4);
  const chaikin=(poly,it)=>{let q=poly;for(let k=0;k<it;k++){const o=[];for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length];o.push([0.75*a[0]+0.25*b[0],0.75*a[1]+0.25*b[1]],[0.25*a[0]+0.75*b[0],0.25*a[1]+0.75*b[1]]);}q=o;}return q;};
  return {fus:chaikin(f,3),fin:chaikin(fin,2),nac:chaikin(nac,2),inlet:[x0-0.35,c],nozzle:[x0+Ln+0.35,c],dFan:1.73};
}
function resamplePoly(poly,ds){
  const n=poly.length,segs=[];let tot=0;
  for(let i=0;i<n;i++){const a=poly[i],b=poly[(i+1)%n],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>1e-9){segs.push([a,b,l]);tot+=l;}}
  const N=Math.max(8,Math.round(tot/ds)),out=[];let si=0,acc=0;
  for(let k=0;k<N;k++){const s=k*tot/N;while(si<segs.length-1&&acc+segs[si][2]<s){acc+=segs[si][2];si++;}const [a,b,l]=segs[si],f=(s-acc)/l;out.push([a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1])]);}
  return out;
}
function buildPanels(polys){
  const P=[];
  for(const poly of polys){const n=poly.length;for(let i=0;i<n;i++){const a=poly[i],b=poly[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),tx=dx/L,ty=dy/L;P.push({x1:a[0],y1:a[1],L,tx,ty,mx:-ty,my:tx,cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2});}}
  return P;
}
function panelVel(p,px,py,out){
  const dx=px-p.x1,dy=py-p.y1,xi=dx*p.tx+dy*p.ty,eta=dx*p.mx+dy*p.my;
  let uxi,ueta;
  const rcx=px-p.cx,rcy=py-p.cy,rc2=rcx*rcx+rcy*rcy;
  if(rc2>16*p.L*p.L){const k=p.L/(2*Math.PI*rc2);out[0]=k*rcx;out[1]=k*rcy;return;}
  const r1=xi*xi+eta*eta,r2=(xi-p.L)*(xi-p.L)+eta*eta;
  uxi=Math.log(r1/r2)/(4*Math.PI);
  ueta=(Math.atan2(eta,xi-p.L)-Math.atan2(eta,xi))/(2*Math.PI);
  out[0]=uxi*p.tx+ueta*p.mx;out[1]=uxi*p.ty+ueta*p.my;
}
function extVel(g,Q,px,py,out){
  const K=12,q=Q/(2*Math.PI*K);out[0]=0;out[1]=0;
  for(let k=0;k<K;k++){const f=(k+0.5)/K-0.5;
    let dx=px-g.inlet[0],dy=py-(g.inlet[1]+1.9*f),r2=dx*dx+dy*dy+0.04;out[0]-=q*dx/r2;out[1]-=q*dy/r2;
    dx=px-g.nozzle[0];dy=py-(g.nozzle[1]+1.3*f);r2=dx*dx+dy*dy+0.04;out[0]+=q*dx/r2;out[1]+=q*dy/r2;}
}
function solvePanels(P,g,alpha,Q){
  const n=P.length,A=new Float64Array(n*n),b=new Float64Array(n),t=[0,0],e=[0,0],ca=Math.cos(alpha),sa=Math.sin(alpha);
  for(let i=0;i<n;i++){const pi=P[i];for(let j=0;j<n;j++){if(i===j){A[i*n+j]=0.5;continue;}panelVel(P[j],pi.cx,pi.cy,t);A[i*n+j]=t[0]*pi.mx+t[1]*pi.my;}
    extVel(g,Q,pi.cx,pi.cy,e);b[i]=-((ca+e[0])*pi.mx+(sa+e[1])*pi.my);}
  for(let k=0;k<n;k++){let m=k;for(let i=k+1;i<n;i++)if(Math.abs(A[i*n+k])>Math.abs(A[m*n+k]))m=i;
    if(m!==k){for(let j=0;j<n;j++){const tmp=A[k*n+j];A[k*n+j]=A[m*n+j];A[m*n+j]=tmp;}const tb=b[k];b[k]=b[m];b[m]=tb;}
    const d=A[k*n+k];for(let i=k+1;i<n;i++){const f=A[i*n+k]/d;if(f===0)continue;for(let j=k;j<n;j++)A[i*n+j]-=f*A[k*n+j];b[i]-=f*b[k];}}
  const s=new Float64Array(n);for(let i=n-1;i>=0;i--){let acc=b[i];for(let j=i+1;j<n;j++)acc-=A[i*n+j]*s[j];s[i]=acc/A[i*n+i];}
  return s;
}
function inPoly(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function velAt(P,sig,g,alpha,Q,x,y,out){
  const t=[0,0];let u=Math.cos(alpha),v=Math.sin(alpha);
  for(let j=0;j<P.length;j++){panelVel(P[j],x,y,t);u+=sig[j]*t[0];v+=sig[j]*t[1];}
  extVel(g,Q,x,y,t);out[0]=u+t[0];out[1]=v+t[1];
}
/*PANEL_END*/

const DOM_MIN=[-14,-22],DOM_SIZE=[68,46],NX=340,NY=230;
let sideGeo=null,sidePanels=null,sideFusP=null,sideNacP=null,sideSig=null,fieldTex=null,fieldData=null,sideStats={};
let sideVM=null,sideScene=null,sideCam=null,sideQuad=null,sideLicMat=null,sideLicScene=null,rtSide=null,sideBlitMat=null,sideTimer=null,mfr=0.70;
const CONDS={
  cruise:  {name:'Reiseflug FL350, M 0.78',U:230,nu:3.8e-5,M:0.78,vj:1.40,mfr:0.70},
  approach:{name:'Anflug, Meereshöhe',     U:70, nu:1.46e-5,M:0.21,vj:1.50,mfr:1.20},
  takeoff: {name:'Start (Rotation), MSL',  U:75, nu:1.46e-5,M:0.22,vj:4.00,mfr:2.00}
};
let condKey='cruise';
function viscousSetup(){
  const c=CONDS[condKey],F=sideFusP,n=F.length;
  let iN=0;for(let i=1;i<n;i++)if(F[i][0]<F[iN][0])iN=i;
  const cum=[0];for(let i=0;i<n;i++){const a=F[i],b=F[(i+1)%n];cum.push(cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
  const per=cum[n],arc=new Float64Array(n);
  for(let i=0;i<n;i++){const m=(cum[i]+cum[i+1])/2;let d=Math.abs(m-cum[iN]);arc[i]=Math.min(d,per-d);}
  const delta=x=>{const xs=Math.max(0.2,x);const Rex=c.U*xs/c.nu;return 0.37*xs*Math.pow(Rex,-0.2);};
  const upsweep=x=>1+2.0*Math.max(0,Math.min(1,(x-26)/11.6));
  const dTE=delta(37.6)*upsweep(37.6);
  const theta=2*(7/72)*dTE, Cdd=2*theta;
  const xi0=Math.pow(dTE/0.57,2)/Cdd;
  return {c,arc,delta,upsweep,dTE,Cdd,xi0,beta:Math.sqrt(Math.max(0.05,1-c.M*c.M)),ReL:c.U*37.6/c.nu,
          te:[37.6,0.8],noz:[sideGeo.nozzle[0]-0.35,sideGeo.nozzle[1]],r0:0.75,xc:9.0};
}
function segDist(px,py,p){const dx=px-p.x1,dy=py-p.y1;let t=(dx*p.tx+dy*p.ty)/p.L;t=Math.max(0,Math.min(1,t));const qx=p.x1+t*p.tx*p.L-px,qy=p.y1+t*p.ty*p.L-py;return Math.hypot(qx,qy);}
function applyViscous(vm,x,y,o,nF){
  const ca=Math.cos(aoaDeg*Math.PI/180),sa=Math.sin(aoaDeg*Math.PI/180);
  let f=1;
  if(x>-1.5&&x<39.5&&y>-3.8&&y<3.8){
    let dmin=1e9,im=0;for(let j=0;j<nF;j++){const d=segDist(x,y,sidePanels[j]);if(d<dmin){dmin=d;im=j;}}
    const P=sidePanels[im],dl=vm.delta(vm.arc[im])*vm.upsweep(P.cx);
    if(dmin<dl)f=Math.pow(Math.max(dmin,1e-3)/dl,1/7);
  }
  o[0]*=f;o[1]*=f;
  let dx=x-vm.te[0],dy=y-vm.te[1],xi=dx*ca+dy*sa,eta=-dx*sa+dy*ca;
  if(xi>0){const xx=xi+vm.xi0,b=0.57*Math.sqrt(xx*vm.Cdd),u1=Math.min(0.6,0.98*Math.sqrt(vm.Cdd/xx));
    if(Math.abs(eta)<b){const w=1-Math.pow(Math.abs(eta)/b,1.5);const d=u1*w*w;o[0]-=d*ca;o[1]-=d*sa;}}
  dx=x-vm.noz[0];dy=y-vm.noz[1];xi=dx*ca+dy*sa;eta=-dx*sa+dy*ca;
  if(xi>0){const dU0=vm.c.vj-1,uc=xi<vm.xc?dU0:dU0*vm.xc/xi,bj=vm.r0+0.09*xi,pw=2+2*Math.max(0,1-xi/vm.xc);
    const e=uc*Math.exp(-Math.LN2*Math.pow(Math.abs(eta)/bj,pw));o[0]+=e*ca;o[1]+=e*sa;}
}
function computeSideField(){
  const t0=performance.now();
  const al=aoaDeg*Math.PI/180,Q=mfr*sideGeo.dFan;
  sideSig=solvePanels(sidePanels,sideGeo,al,Q);
  const o=[0,0];let vmax=0;const vm=viscousSetup(),nF=sideFusP.length;sideVM=vm;
  for(let j=0;j<NY;j++){const y=DOM_MIN[1]+(j+0.5)/NY*DOM_SIZE[1];
    for(let i=0;i<NX;i++){const x=DOM_MIN[0]+(i+0.5)/NX*DOM_SIZE[0],k=(j*NX+i)*4;
      const inside=(x>-0.5&&x<38&&y>-2.5&&y<8.5&&inPoly(sideFusP,x,y))||(x>10.5&&x<15.5&&y>-5&&y<-2.2&&inPoly(sideNacP,x,y));
      if(inside){fieldData[k]=0;fieldData[k+1]=0;fieldData[k+2]=1;fieldData[k+3]=0;continue;}
      velAt(sidePanels,sideSig,sideGeo,al,Q,x,y,o);applyViscous(vm,x,y,o,nF);let s=Math.hypot(o[0],o[1]);if(s>5){o[0]*=5/s;o[1]*=5/s;s=5;}
      fieldData[k]=o[0];fieldData[k+1]=o[1];fieldData[k+2]=0;fieldData[k+3]=Math.max(0,1+(s-1)/vm.beta);if(s>vmax)vmax=s;}}
  fieldTex.needsUpdate=true;
  sideStats={n:sidePanels.length,ms:Math.round(performance.now()-t0),vmax};
  updateInfo();
}
let sideJob=null,sideGen=0;
function computeSideFieldAsync(){
  const gen=++sideGen,t0=performance.now();
  const al=aoaDeg*Math.PI/180,Q=mfr*sideGeo.dFan;
  const sig=solvePanels(sidePanels,sideGeo,al,Q);
  const vm=viscousSetup(),nF=sideFusP.length,buf=new Float32Array(NX*NY*4),o=[0,0];
  let j=0;
  const step=()=>{
    if(gen!==sideGen)return;
    const tEnd=performance.now()+6;
    while(j<NY&&performance.now()<tEnd){
      const y=DOM_MIN[1]+(j+0.5)/NY*DOM_SIZE[1];
      for(let i=0;i<NX;i++){const x=DOM_MIN[0]+(i+0.5)/NX*DOM_SIZE[0],k=(j*NX+i)*4;
        const inside=(x>-0.5&&x<38&&y>-2.5&&y<8.5&&inPoly(sideFusP,x,y))||(x>10.5&&x<15.5&&y>-5&&y<-2.2&&inPoly(sideNacP,x,y));
        if(inside){buf[k]=0;buf[k+1]=0;buf[k+2]=1;buf[k+3]=0;continue;}
        velAt(sidePanels,sig,sideGeo,al,Q,x,y,o);applyViscous(vm,x,y,o,nF);let sp=Math.hypot(o[0],o[1]);if(sp>5){o[0]*=5/sp;o[1]*=5/sp;sp=5;}
        buf[k]=o[0];buf[k+1]=o[1];buf[k+2]=0;buf[k+3]=Math.max(0,1+(sp-1)/vm.beta);}
      j++;
    }
    if(j<NY){sideJob=setTimeout(step,0);return;}
    sideSig=sig;sideVM=vm;fieldData.set(buf);fieldTex.needsUpdate=true;
    sideStats={n:sidePanels.length,ms:Math.round(performance.now()-t0)};updateInfo();
  };
  step();
}
function scheduleSide(){if(!sideGeo)return;clearTimeout(sideTimer);clearTimeout(sideJob);sideTimer=setTimeout(computeSideFieldAsync,60);}
const MAGMA=`vec3 magma(float t){t=clamp(t,0.0,1.0);
  if(t<0.25)return mix(vec3(0.0,0.0,0.02),vec3(0.27,0.005,0.33),t*4.0);
  if(t<0.5)return mix(vec3(0.27,0.005,0.33),vec3(0.72,0.13,0.30),(t-0.25)*4.0);
  if(t<0.75)return mix(vec3(0.72,0.13,0.30),vec3(0.99,0.45,0.12),(t-0.5)*4.0);
  return mix(vec3(0.99,0.45,0.12),vec3(1.0,0.98,0.75),(t-0.75)*4.0);}`;
const SIDE_LIC=`
precision highp float;varying vec2 vUv;
uniform sampler2D uField;uniform sampler2D uNoise;
uniform vec2 uDomMin;uniform vec2 uDomSize;uniform vec2 uGrid;uniform vec2 uVisMin;uniform vec2 uVisSize;
uniform float uAl;uniform float uDs;uniform float uAnim;uniform float uNs;
vec4 fld(vec2 p){
  vec2 g=(p-uDomMin)/uDomSize*uGrid-0.5;
  if(g.x<0.0||g.y<0.0||g.x>uGrid.x-1.0||g.y>uGrid.y-1.0)return vec4(cos(uAl),sin(uAl),0.0,1.0);
#ifdef HW_LINEAR
  return texture2D(uField,(g+0.5)/uGrid);
#endif
  vec2 i0=floor(g),f=g-i0;
  vec4 a=texture2D(uField,(i0+vec2(0.5,0.5))/uGrid);vec4 b=texture2D(uField,(i0+vec2(1.5,0.5))/uGrid);
  vec4 c=texture2D(uField,(i0+vec2(0.5,1.5))/uGrid);vec4 d=texture2D(uField,(i0+vec2(1.5,1.5))/uGrid);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
uniform vec2 uShift;float nz(vec2 p){return texture2D(uNoise,(p-uShift)*uNs).r;}
float kern(float s,float L){return exp(-abs(s)/L*1.6);}
void main(){
  vec2 z=uVisMin+vUv*uVisSize;vec4 v0=fld(z);
  if(v0.z>0.5){gl_FragColor=vec4(0.5,0.0,1.0,1.0);return;}
  float L=uDs*28.0;float k=kern(0.0,L);float acc=nz(z)*k,ws=k;vec2 p=z;
  for(int i=0;i<28;i++){vec4 v=fld(p);if(v.z>0.5)break;float sp=length(v.xy);if(sp<1e-5)break;p+=v.xy/sp*uDs;k=kern(float(i+1)*uDs,L);acc+=nz(p)*k;ws+=k;}
  p=z;
  for(int i=0;i<28;i++){vec4 v=fld(p);if(v.z>0.5)break;float sp=length(v.xy);if(sp<1e-5)break;p-=v.xy/sp*uDs;k=kern(-float(i+1)*uDs,L);acc+=nz(p)*k;ws+=k;}
  gl_FragColor=vec4(acc/ws,clamp(0.03+0.47*v0.w,0.0,1.0),0.0,1.0);
}`;
const SIDE_BLIT=`precision highp float;varying vec2 vUv;uniform sampler2D uTex;${MAGMA}
void main(){vec4 d=texture2D(uTex,vUv);float lic=clamp((d.r-0.5)*3.2+0.5,0.0,1.0);gl_FragColor=vec4(magma(0.12+0.85*d.g)*(0.2+1.05*lic),1.0);}`;
function initSide(){
  sideGeo=a320SidePolys();
  sideFusP=resamplePoly(sideGeo.fus,0.42);sideNacP=resamplePoly(sideGeo.nac,0.28);
  sidePanels=buildPanels([sideFusP,sideNacP]);
  fieldData=new Float32Array(NX*NY*4);
  fieldTex=new THREE.DataTexture(fieldData,NX,NY,THREE.RGBAFormat,THREE.FloatType);
  const hwLin=!!renderer.extensions.get('OES_texture_float_linear');
  fieldTex.minFilter=fieldTex.magFilter=hwLin?THREE.LinearFilter:THREE.NearestFilter;
  sideLicMat=new THREE.ShaderMaterial({vertexShader:VERT_Q,fragmentShader:SIDE_LIC,defines:hwLin?{HW_LINEAR:1}:{},depthTest:false,depthWrite:false,uniforms:{
    uField:{value:fieldTex},uNoise:{value:makeNoiseTex(256)},uDomMin:{value:new THREE.Vector2(DOM_MIN[0],DOM_MIN[1])},uDomSize:{value:new THREE.Vector2(DOM_SIZE[0],DOM_SIZE[1])},
    uGrid:{value:new THREE.Vector2(NX,NY)},uVisMin:{value:new THREE.Vector2()},uVisSize:{value:new THREE.Vector2()},uAl:{value:0},uDs:{value:0.05},uAnim:{value:0},uShift:{value:new THREE.Vector2()},uNs:{value:1}}});
  sideLicScene=new THREE.Scene();sideLicScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),sideLicMat));
  rtSide=new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false});
  sideBlitMat=new THREE.ShaderMaterial({vertexShader:VERT_3D,fragmentShader:SIDE_BLIT,uniforms:{uTex:{value:rtSide.texture}},depthTest:false,depthWrite:false});
  sideScene=new THREE.Scene();
  sideQuad=new THREE.Mesh(new THREE.PlaneGeometry(1,1),sideBlitMat);sideQuad.renderOrder=0;sideScene.add(sideQuad);
  const addBody=(poly,fill,op)=>{
    const sh=new THREE.Shape(poly.map(p=>new THREE.Vector2(p[0],p[1])));
    const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:fill,depthTest:false,transparent:op!==undefined,opacity:op===undefined?1:op}));m.renderOrder=1;sideScene.add(m);
    const l=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(poly.map(p=>new THREE.Vector3(p[0],p[1],0))),new THREE.LineBasicMaterial({color:0xd0d4de,depthTest:false}));l.renderOrder=2;sideScene.add(l);
  };
  addBody(sideGeo.fin,0x2b303c,0.45);addBody(sideGeo.fus,0x2b303c);addBody(sideGeo.nac,0x3a4150);
  const win=[];for(let x=8.5;x<27;x+=0.55)win.push(new THREE.Vector3(x,0.55,0),new THREE.Vector3(x+0.25,0.55,0));
  const wl=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(win),new THREE.LineBasicMaterial({color:0x6f7890,depthTest:false}));wl.renderOrder=2;sideScene.add(wl);
  sideCam=new THREE.OrthographicCamera(-1,1,1,-1,-10,10);
  computeSideField();
}
let sideScale=0.5,sideEma=0.016;
function renderSide(){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),asp=sz.x/sz.y;
  let w=50,h=w/asp;if(h<24){h=24;w=h*asp;}
  const cx=19.5,cy=1.2,vx0=cx-w/2,vy0=cy-h/2;
  sideCam.left=vx0;sideCam.right=vx0+w;sideCam.bottom=vy0;sideCam.top=vy0+h;sideCam.updateProjectionMatrix();
  sideQuad.position.set(cx,cy,0);sideQuad.scale.set(w,h,1);
  const dtF=frameDt();sideEma=0.9*sideEma+0.1*dtF;
  if(sideEma>0.030&&sideScale>0.26){sideScale=Math.max(0.25,sideScale*0.85);sideEma=0.016;}
  else if(sideEma<0.017&&sideScale<0.5){sideScale=Math.min(0.5,sideScale/0.9);sideEma=0.020;}
  const rw=Math.max(2,Math.floor(sz.x*sideScale)),rh=Math.max(2,Math.floor(sz.y*sideScale));
  if(rtSide.width!==rw||rtSide.height!==rh)rtSide.setSize(rw,rh);
  const u=sideLicMat.uniforms;u.uVisMin.value.set(vx0,vy0);u.uVisSize.value.set(w,h);u.uAl.value=aoaDeg*Math.PI/180;
  u.uDs.value=1.3*w/rw;u.uNs.value=rw/(w*256.0);advance(shiftS,dtF*speed*2.5,aoaDeg*Math.PI/180,w*256.0/rw);u.uShift.value.set(shiftS[0],shiftS[1]);
  const prev=renderer.getRenderTarget();
  renderer.setRenderTarget(rtSide);_origRender(sideLicScene,ocam);
  renderer.setRenderTarget(prev);_origRender(sideScene,sideCam);
}
/* ---------------- smooth animation clock ---------------- */
let _lastT=performance.now();const shiftW=[0,0],shiftS=[0,0];
function frameDt(){const now=performance.now();const dt=Math.min(0.05,Math.max(0,(now-_lastT)/1000));_lastT=now;return dt;}
function advance(sh,dist,al,per){const m=(v)=>((v%per)+per)%per;sh[0]=m(sh[0]+dist*Math.cos(al));sh[1]=m(sh[1]+dist*Math.sin(al));}
/* ---------------- render hook ---------------- */
const _origRender=renderer.render.bind(renderer);
renderer.render=function(s,c){
  if(flowMode&&s===scene){if(viewMode==='side')renderSide();else renderFlow();return;}
  if(active&&pts)animateStream();
  _origRender(s,c);
};

/* ---------------- UI ---------------- */
document.getElementById('asToggle').addEventListener('click',()=>{active=!active;const btn=document.getElementById('asToggle');if(active){btn.textContent='Particles ON';btn.style.background='#4caf50';if(!pts)createParticles(count);else pts.visible=true;}else{btn.textContent='Particles OFF';btn.style.background='#2a2a4a';if(pts)pts.visible=false;}});
document.getElementById('asFlow').addEventListener('click',toggleFlow);
document.getElementById('asProfile').addEventListener('change',function(){profKey=this.value;prof=fitProfile(PRESETS[profKey].tc,PRESETS[profKey].fc);if(wingPivot)loadWing(profKey);updateInfo();});
document.getElementById('asColor').addEventListener('click',()=>{colorBySpeed=!colorBySpeed;const btn=document.getElementById('asColor');btn.textContent=colorBySpeed?'Color: speed':'Color: fixed';btn.style.background=colorBySpeed?'#0f3460':'#2a2a4a';});
document.getElementById('asSpeed').addEventListener('input',function(){speed=parseFloat(this.value);document.getElementById('asSpeedV').textContent=speed.toFixed(1);});
document.getElementById('asCount').addEventListener('input',function(){const n=parseInt(this.value);document.getElementById('asCountV').textContent=n;if(n!==count&&active)createParticles(n);});
document.getElementById('asAoA').addEventListener('input',function(){aoaDeg=parseFloat(this.value);document.getElementById('asAoAV').textContent=aoaDeg.toFixed(1)+'\u00B0';updateInfo();scheduleSide();});
document.getElementById('asMfr').addEventListener('input',function(){mfr=parseFloat(this.value);document.getElementById('asMfrV').textContent=mfr.toFixed(2);updateInfo();scheduleSide();});
document.getElementById('asCond').addEventListener('change',function(){condKey=this.value;mfr=CONDS[condKey].mfr;document.getElementById('asMfr').value=mfr;document.getElementById('asMfrV').textContent=mfr.toFixed(2);updateInfo();scheduleSide();});
document.getElementById('asView').addEventListener('change',function(){viewMode=this.value;if(flowMode){if(viewMode==='side'&&!sideGeo)initSide();if(viewMode==='wing'&&!licMat)initFlow();}updateInfo();});

document.getElementById('asLock').addEventListener('click',()=>{locked=!locked;const btn=document.getElementById('asLock');const sd=document.getElementById('asSteer');if(locked){btn.innerHTML='🔒 Nodes LOCKED';btn.style.background='#4caf50';sd.style.display='block';steerGrp=new THREE.Group();scene.add(steerGrp);if(typeof aircraftGroup!=='undefined'&&aircraftGroup){scene.remove(aircraftGroup);steerGrp.add(aircraftGroup);}if(typeof pipeGroup!=='undefined'&&pipeGroup){scene.remove(pipeGroup);steerGrp.add(pipeGroup);}}else{btn.innerHTML='🔓 Lock Nodes to Aircraft';btn.style.background='#2a2a4a';sd.style.display='none';if(steerGrp){if(typeof aircraftGroup!=='undefined'&&aircraftGroup){steerGrp.remove(aircraftGroup);scene.add(aircraftGroup);}if(typeof pipeGroup!=='undefined'&&pipeGroup){steerGrp.remove(pipeGroup);scene.add(pipeGroup);}scene.remove(steerGrp);steerGrp=null;}doResetSteer();}});
function applySteer(){if(!steerGrp)return;const p=parseFloat(document.getElementById('asPitch').value)*Math.PI/180;const y=parseFloat(document.getElementById('asYaw').value)*Math.PI/180;const r=parseFloat(document.getElementById('asRoll').value)*Math.PI/180;steerGrp.rotation.set(p,y,r);document.getElementById('asPitchV').textContent=(p*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asYawV').textContent=(y*180/Math.PI).toFixed(0)+'\u00B0';document.getElementById('asRollV').textContent=(r*180/Math.PI).toFixed(0)+'\u00B0';}
function doResetSteer(){['asPitch','asYaw','asRoll'].forEach(id=>{document.getElementById(id).value=0;});if(steerGrp)steerGrp.rotation.set(0,0,0);document.getElementById('asPitchV').textContent='0\u00B0';document.getElementById('asYawV').textContent='0\u00B0';document.getElementById('asRollV').textContent='0\u00B0';}
document.getElementById('asPitch').addEventListener('input',applySteer);
document.getElementById('asYaw').addEventListener('input',applySteer);
document.getElementById('asRoll').addEventListener('input',applySteer);
document.getElementById('asResetSteer').addEventListener('click',doResetSteer);

console.log('boheme_airstream.js v18 loaded – profile',prof);
});
})();
