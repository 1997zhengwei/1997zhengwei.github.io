import * as T from '../vendor/three.module.js';
import { MELT_TICKS, bottom, cell, cols, drainsFor, finds, ice, maxDrops, rows, worldX, worldY } from './flow.js';
import { createSand, sandFace } from './sand.js';
import { brilliantGem, carvedStone, mineralPatches, roundedSlab } from './models.js';

// Cosmetic looks, keyed by shop item id (see progress.js).
export const WATER_LOOKS = {
  'water-clear': { deep:'#0b3a6e', light:'#2fc6e8', foam:'#e8ffff', shift:0 },
  'water-mint': { deep:'#0b5a52', light:'#58efbd', foam:'#f0fff6', shift:0 },
  'water-rose': { deep:'#8a2f6a', light:'#ff9ccf', foam:'#fff0f8', shift:0 },
  'water-gold': { deep:'#8a4a06', light:'#ffd34d', foam:'#fff7d0', shift:0 },
  'water-galaxy': { deep:'#24166a', light:'#8fb4ff', foam:'#ffffff', shift:1 },
};
const TRAIL_LOOKS = {
  'trail-gold': ['#ffcf4a','#fff6c0'], 'trail-petal': ['#ff8fc0','#fff0f6'], 'trail-star': ['#8fd8ff','#ffffff'],
};
const TRAY_LOOKS = {
  'tray-teal': { body:'#2d8f8b', lip:'#6dd6a5', rim:'#ffc771', bar:'#5acfb0', back:'#ecaa60' },
  'tray-brass': { body:'#a06a1c', lip:'#ffd77a', rim:'#ffe9a8', bar:'#e0a93c', back:'#c98a2c' },
  'tray-sakura': { body:'#c0607f', lip:'#ffc4da', rim:'#fff0f6', bar:'#f59ab9', back:'#e48aa8' },
  'tray-amethyst': { body:'#6047ad', lip:'#b9a2ff', rim:'#e9dcff', bar:'#9d84ef', back:'#8a70dc' },
};
// World-space box that must stay on screen: board, springs and the showcase shelf below.
const CONTENT = { half:4.76, top:11.42, bottom:-1.42 };
const SHELF_Y = -.66;
const FX = 1; // render layer drawn after the water
const GLOW = 2; // extra layer: objects that also feed the bloom pass
const POST_VERTEX = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;

export function createWorld(canvas, options={}) {
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.autoClear=false;
  renderer.setClearColor(0x000000,0);
  const scene=new T.Scene();
  const camera=new T.OrthographicCamera(-5.5,5.5,6.5,-6.5,.1,60);
  const view={cy:6.29,shake:0};
  const insets={top:86,bottom:8};
  const hemi=new T.HemisphereLight(0xe9fff6,0x976779,1.56);
  const sun=new T.DirectionalLight(0xffe9c7,2.65);
  sun.position.set(-6,15,8);
  const fill=new T.DirectionalLight(0x72e7ff,1.24);
  fill.position.set(8,5,-3);
  for(const light of [hemi,sun,fill]){light.layers.enableAll();scene.add(light);}

  const boxG=new T.BoxGeometry(1,1,1);
  const cube=new T.DodecahedronGeometry(1);
  const stones=Array.from({length:3},(_,variant)=>carvedStone(variant));
  const mineralBands=mineralPatches();
  const crystal=new T.OctahedronGeometry(1);
  const jewelG=brilliantGem();
  const bulb=new T.SphereGeometry(1,12,10);
  const roundedSphere=new T.SphereGeometry(1,22,15);
  const flowTube=new T.CapsuleGeometry(.50,.43,3,12);
  const woodRing=new T.CylinderGeometry(1,1,1,12);
  const dish=new T.TorusGeometry(1,.11,7,37);
  const shadeG=new T.PlaneGeometry(1,1);
  const splashG=new T.RingGeometry(.74,1,30);
  const ringG=new T.RingGeometry(.80,1,40);
  const arrowG=new T.ConeGeometry(.16,.3,3);
  arrowG.rotateZ(Math.PI);
  const materialCache=new Map();
  const slabCache=new Map();
  const panelColors=new Map();
  const matrix=new T.Object3D();
  const sand=createSand();
  const flyerG=new T.IcosahedronGeometry(1,0);
  const maxParticles=240;
  const crumbsMesh=new T.InstancedMesh(flyerG,new T.MeshStandardMaterial({color:0xffffff,roughness:.7}),maxParticles);
  crumbsMesh.frustumCulled=false;
  crumbsMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  crumbsMesh.count=0;
  crumbsMesh.layers.set(FX);
  crumbsMesh.renderOrder=6;
  scene.add(crumbsMesh);

  // --- Water: soft blobs are summed into a half-res target, then thresholded into one liquid surface.
  const waterScene=new T.Scene();
  const blobMaterial=new T.ShaderMaterial({
    transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vUv;
      void main(){vec2 p=vUv*2.0-1.0;float f=max(0.0,1.0-dot(p,p));gl_FragColor=vec4(f*f,0.0,0.0,1.0);}`,
  });
  const blobs=new T.InstancedMesh(new T.PlaneGeometry(1,1),blobMaterial,maxDrops+40);
  blobs.frustumCulled=false;
  blobs.instanceMatrix.setUsage(T.DynamicDrawUsage);
  waterScene.add(blobs);
  const waterTarget=new T.WebGLRenderTarget(4,4,{depthBuffer:false});
  const surfaceMaterial=new T.ShaderMaterial({
    transparent:true,depthTest:false,depthWrite:false,
    uniforms:{ map:{value:waterTarget.texture}, texel:{value:new T.Vector2(.01,.01)}, clock:{value:0},
      deep:{value:new T.Color()}, light:{value:new T.Color()}, foam:{value:new T.Color()}, shift:{value:0} },
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader:`
      uniform sampler2D map;uniform vec2 texel;uniform float clock,shift;uniform vec3 deep,light,foam;
      varying vec2 vUv;
      vec3 rainbow(float t){return .55+.45*cos(6.2832*(t+vec3(0.0,.33,.67)));}
      void main(){
        float v=texture2D(map,vUv).r;
        float a=smoothstep(.20,.31,v);
        if(a<.01)discard;
        float gx=texture2D(map,vUv+vec2(texel.x*2.0,0.0)).r-texture2D(map,vUv-vec2(texel.x*2.0,0.0)).r;
        float gy=texture2D(map,vUv+vec2(0.0,texel.y*2.0)).r-texture2D(map,vUv-vec2(0.0,texel.y*2.0)).r;
        vec3 n=normalize(vec3(-gx*2.4,-gy*2.4,1.0));
        float body=smoothstep(.28,1.25,v);
        vec3 col=mix(light,deep,body*.82);
        vec2 fc=gl_FragCoord.xy;
        float rip=sin(fc.y*.075-clock*9.0+sin(fc.x*.045+clock*1.7)*2.2)*.5+.5;
        col+=light*rip*.10;
        float spec=pow(max(0.0,dot(n,normalize(vec3(-.45,.62,.64)))),14.0);
        float rim=1.0-smoothstep(.27,.42,v);
        col=mix(col,foam,rim*.78);
        col+=foam*spec*.55;
        // Bright water line along the top surface of pools and the leading edge of streams.
        float line=smoothstep(.03,.14,-gy)*(1.0-smoothstep(.34,.7,v));
        col=mix(col,foam*1.08,line*.85);
        if(shift>.5)col=mix(col,rainbow(fc.x*.0025+fc.y*.0018-clock*.12)*1.1,.28*(1.0-rim));
        #ifdef GLOW_ONLY
          gl_FragColor=vec4(foam*(spec*.9+line*.75+rim*.12)*a,1.0);
        #else
          gl_FragColor=vec4(col,a*.93);
          #include <colorspace_fragment>
        #endif
      }`,
  });
  const surfaceScene=new T.Scene();
  const surfaceQuad=new T.Mesh(new T.PlaneGeometry(2,2),surfaceMaterial);
  surfaceQuad.frustumCulled=false;
  surfaceScene.add(surfaceQuad);
  const flatCamera=new T.Camera();
  const surfaceGlow=surfaceMaterial.clone();
  surfaceGlow.uniforms=surfaceMaterial.uniforms;
  surfaceGlow.defines={GLOW_ONLY:1};
  surfaceGlow.transparent=false;
  const surfaceGlowScene=new T.Scene();
  const surfaceGlowQuad=new T.Mesh(surfaceQuad.geometry,surfaceGlow);
  surfaceGlowQuad.frustumCulled=false;
  surfaceGlowScene.add(surfaceGlowQuad);

  // --- Bloom: gems, coins, gold dust and water highlights are drawn again into a small target,
  // blurred, and added on top. Cheap enough for phones because it runs at half / quarter size.
  const bloomOn=!options.lowFx;
  const bloomA=new T.WebGLRenderTarget(4,4);
  const bloomB=new T.WebGLRenderTarget(4,4,{depthBuffer:false});
  const bloomC=new T.WebGLRenderTarget(4,4,{depthBuffer:false});
  const blurMaterial=new T.ShaderMaterial({
    depthTest:false,depthWrite:false,
    uniforms:{map:{value:null},dir:{value:new T.Vector2()}},
    vertexShader:POST_VERTEX,
    fragmentShader:`uniform sampler2D map;uniform vec2 dir;varying vec2 vUv;
      void main(){
        vec4 s=texture2D(map,vUv)*.227;
        s+=(texture2D(map,vUv+dir*1.385)+texture2D(map,vUv-dir*1.385))*.316;
        s+=(texture2D(map,vUv+dir*3.231)+texture2D(map,vUv-dir*3.231))*.07;
        gl_FragColor=s;
      }`,
  });
  const bloomMix=new T.ShaderMaterial({
    depthTest:false,depthWrite:false,transparent:true,
    blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,
    uniforms:{map:{value:bloomC.texture},strength:{value:.95}},
    vertexShader:POST_VERTEX,
    fragmentShader:`uniform sampler2D map;uniform float strength;varying vec2 vUv;
      void main(){
        // Soft knee: keep only the brighter part so flat colours do not haze over.
        vec3 c=max(texture2D(map,vUv).rgb-vec3(.08),0.0)*strength;
        gl_FragColor=vec4(c,0.0);
      }`,
  });
  const postScene=new T.Scene();
  const postQuad=new T.Mesh(new T.PlaneGeometry(2,2),blurMaterial);
  postQuad.frustumCulled=false;
  postScene.add(postQuad);
  function postPass(material,target) {
    postQuad.material=material;
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(postScene,flatCamera);
  }

  // --- Wet sand: a cols×rows map darkens the sand face where water has passed.
  const wet=new Float32Array(cols*rows);
  const wetBytes=new Uint8Array(cols*rows*4);
  const wetMap=new T.DataTexture(wetBytes,cols,rows,T.RGBAFormat);
  wetMap.magFilter=wetMap.minFilter=T.LinearFilter;
  wetMap.needsUpdate=true;
  sand.setWet(wetMap);

  const cursor=new T.Raycaster();
  const plane=new T.Plane(new T.Vector3(0,0,1),-sandFace);
  const hit=new T.Vector3();
  const particles=[];
  let terrain, site, prizes, springs, plants, trays, rockParts, soilDirty=false, drainedSeen=0;
  let iceMesh=null, iceCells=[];
  let decor=[], crab=null, chapter=0, ambient=null, icicles=[];
  const events=[];
  const coins=[];
  const mists=[];
  const finale={t:-1,x:0,y:0,pulse:-1,stars:0};
  const iceGeometry=roundedSlab(.25,.25,.05,.5,.025);
  const iceMaterial=new T.MeshPhysicalMaterial({color:'#9fdcff',roughness:.06,metalness:.05,clearcoat:1,clearcoatRoughness:.04,
    transparent:true,opacity:.9,emissive:'#4fb4ef',emissiveIntensity:.35});
  let trail=null, trayLook=TRAY_LOOKS['tray-teal'];
  const shadeCanvas=document.createElement('canvas');
  shadeCanvas.width=shadeCanvas.height=96;
  const shadeContext=shadeCanvas.getContext('2d');
  const blur=shadeContext.createRadialGradient(48,48,12,48,48,47);
  blur.addColorStop(0,'#5c342bc4');
  blur.addColorStop(.53,'#5c342b57');
  blur.addColorStop(1,'#5c342b00');
  shadeContext.fillStyle=blur;
  shadeContext.fillRect(0,0,96,96);
  const shadeMap=new T.CanvasTexture(shadeCanvas);
  shadeMap.colorSpace=T.SRGBColorSpace;
  const contactShade=new T.MeshBasicMaterial({map:shadeMap,transparent:true,depthWrite:false});
  const glowCanvas=document.createElement('canvas');
  glowCanvas.width=glowCanvas.height=64;
  const glowContext=glowCanvas.getContext('2d');
  const glowFade=glowContext.createRadialGradient(32,32,0,32,32,32);
  glowFade.addColorStop(0,'#ffffffff');
  glowFade.addColorStop(.35,'#ffffff88');
  glowFade.addColorStop(1,'#ffffff00');
  glowContext.fillStyle=glowFade;
  glowContext.fillRect(0,0,64,64);
  const glowMap=new T.CanvasTexture(glowCanvas);
  const starCanvas=document.createElement('canvas');
  starCanvas.width=starCanvas.height=64;
  const starContext=starCanvas.getContext('2d');
  const starFade=starContext.createRadialGradient(32,32,0,32,32,30);
  starFade.addColorStop(0,'#ffffff');starFade.addColorStop(1,'#ffffff00');
  starContext.fillStyle=starFade;
  starContext.beginPath();
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4, r=i%2?6:30;
    starContext.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r);
  }
  starContext.fill();
  const starMap=new T.CanvasTexture(starCanvas);
  const jewelMaterials=new Map();
  const gleamMaterial=new T.MeshBasicMaterial({color:0xfff9dc});
  const trayFlash=new T.MeshBasicMaterial({color:0xffedaa,transparent:true,opacity:0,depthWrite:false});
  const pearlFinish=new T.MeshPhysicalMaterial({color:0xe2fff8,roughness:.36,clearcoat:.64});
  const ghostMaterial=new T.MeshBasicMaterial({color:0x2a2036,transparent:true,opacity:.32,depthWrite:false});
  const hintMaterial=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false,depthTest:false});
  const dripMaterial=new T.MeshBasicMaterial({color:0x7fe6ff,transparent:true,opacity:.9});

  function material(color,metal=0,roughness=.61) {
    const key=[color,metal,roughness].join('/');
    if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness}));
    return materialCache.get(key);
  }
  function mesh(parent,geometry,color,x,y,z,sx=1,sy=sx,sz=sx,metal=0,roughness=.61) {
    const out=new T.Mesh(geometry,material(color,metal,roughness));
    out.position.set(x,y,z);
    out.scale.set(sx,sy,sz);
    parent.add(out);
    return out;
  }
  const box=(parent,x,y,z,w,h,d,color,metal=0)=>mesh(parent,boxG,color,x,y,z,w,h,d,metal);
  function slab(parent,x,y,z,width,height,depth,radius,color,metal=.035) {
    const params=[width,height,radius,depth];
    const id=params.join('/');
    if(!slabCache.has(id))slabCache.set(id,roundedSlab(...params));
    return mesh(parent,slabCache.get(id),color,x,y,z,1,1,1,metal,.44);
  }
  function stroke(parent,color,x1,y1,x2,y2,z,radius) {
    const length=Math.hypot(x2-x1,y2-y1);
    const line=mesh(parent,woodRing,color,(x1+x2)/2,(y1+y2)/2,z,radius,length,radius,0,.68);
    line.rotation.z=Math.atan2(-(x2-x1),y2-y1);
  }
  function shadow(x,y,width,height) {
    const oval=new T.Mesh(shadeG,contactShade);
    oval.position.set(x,y,sandFace+.011);
    oval.scale.set(width,height,1);
    terrain.add(oval);
    return oval;
  }
  function fx(object) {
    object.traverse(child=>child.layers.set(FX));
    return object;
  }
  function glow(parent,color,size,z=0,map=glowMap) {
    const sprite=new T.Sprite(new T.SpriteMaterial({map,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
    sprite.scale.setScalar(size);
    sprite.position.z=z;
    parent.add(sprite);
    return sprite;
  }
  // Only solid meshes feed the bloom; the additive halo sprites are already soft.
  const bright=object=>{object.traverse(child=>{if(child.isMesh)child.layers.enable(GLOW);});return object;};
  // Pools for coins (finale rain) and soft mist puffs.
  const coinG=new T.CylinderGeometry(.13,.13,.03,20);
  coinG.rotateX(Math.PI/2);
  const coinMaterial=new T.MeshStandardMaterial({color:'#ffcf3d',metalness:.75,roughness:.22,emissive:'#ff9d00',emissiveIntensity:.35});
  const coinMesh=new T.InstancedMesh(coinG,coinMaterial,90);
  coinMesh.frustumCulled=false;
  coinMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  coinMesh.count=0;
  coinMesh.layers.set(FX);coinMesh.layers.enable(GLOW);
  coinMesh.renderOrder=9;
  scene.add(coinMesh);
  for(let k=0;k<6;k++){
    const sprite=new T.Sprite(new T.SpriteMaterial({map:null,color:'#ffffff',transparent:true,depthWrite:false,opacity:0}));
    sprite.layers.set(FX);
    sprite.visible=false;
    sprite.renderOrder=7;
    scene.add(sprite);
    mists.push({sprite,t:1,span:1,grow:1});
  }
  const flash=new T.Sprite(new T.SpriteMaterial({map:glowMap,color:'#ffe9a0',transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0}));
  flash.layers.set(FX);flash.layers.enable(GLOW);
  flash.visible=false;
  flash.renderOrder=10;
  scene.add(flash);
  const shock=new T.Mesh(new T.RingGeometry(.86,1,48),new T.MeshBasicMaterial({color:'#ffe38a',transparent:true,depthWrite:false,depthTest:false,opacity:0}));
  shock.layers.set(FX);shock.layers.enable(GLOW);
  shock.visible=false;
  shock.renderOrder=10;
  scene.add(shock);
  function mist(x,y,color,size=1.6,span=.8) {
    const slot=mists.reduce((a,b)=>a.t/a.span>b.t/b.span?a:b);
    slot.sprite.material.map=glowMap;
    slot.sprite.material.color.set(color);
    slot.sprite.material.needsUpdate=true;
    slot.sprite.position.set(x,y,1.0);
    slot.t=0;slot.span=span;slot.grow=size;
    slot.sprite.visible=true;
  }

  function jewelFinish(hue,faceted) {
    const key=hue+faceted;
    if(!jewelMaterials.has(key)){
      jewelMaterials.set(key,new T.MeshPhysicalMaterial({
        color:hue,vertexColors:faceted,metalness:.14,roughness:.18,clearcoat:.95,clearcoatRoughness:.14,
        emissive:hue,emissiveIntensity:.24,
      }));
    }
    return jewelMaterials.get(key);
  }
  function plant(x,y,z,scale) {
    const stem=new T.Group();
    stem.position.set(x,y,z);
    terrain.add(stem);
    plants.push(stem);
    for(let i=0;i<5;i++){
      const p=mesh(stem,bulb,i%2?'#71bb69':'#87d66e',(i-2)*.105*scale,.13*scale,0,.093*scale,(.26+(i%3)*.08)*scale,.086*scale);
      p.rotation.z=(2-i)*.34;
      p.rotation.x=.23;
    }
  }
  function gemModel(type,parent) {
    const hue=finds[type].hue;
    if(type==='gold'||type==='flake'){
      const chunks=type==='flake'?[[-.12,-.04,.12],[.06,.05,.15],[.17,-.07,.1]]:[[-.18,-.084,.183],[.029,.047,.278],[.229,-.112,.144]];
      for(const [x,y,s] of chunks){
        const chunk=mesh(parent,cube,hue,x,y,.055,s,s*.87,s*.72,.39,.23);
        chunk.material=jewelFinish(hue,false);
        chunk.rotation.z=-.61+x*3;
      }
    }else{
      const stone=mesh(parent,jewelG,hue,0,0,.12,.315,.356,.286,.36,.18);
      stone.material=jewelFinish(hue,true);
      stone.rotation.z=.186;
      const sheen=mesh(parent,roundedSphere,'#eefef3',-.119,.125,.312,.056,.031,.013,.08,.22);
      sheen.material=pearlFinish;
      sheen.rotation.z=.36;
    }
  }
  function createCradle() {
    slab(terrain,0,.72,-.38,9.06,.25,1.67,.12,site.rim);
    return drainsFor(site).map(([lo,hi])=>{
      const x=(worldX(lo)+worldX(hi))*.5;
      const span=(hi-lo+1)*cell;
      slab(terrain,x,.968,.095,span+.29,.42,1.42,.16,trayLook.body,.19);
      slab(terrain,x,.936,.803,span+.12,.146,.064,.06,trayLook.lip,.19);
      slab(terrain,x,1.21,.697,span+.24,.114,.19,.05,trayLook.rim,.28);
      slab(terrain,x,1.24,-.49,span+.19,.147,.18,.05,trayLook.back,.23);
      for(let c=lo;c<=hi;c+=2)box(terrain,worldX(c)+.057,1.219,.047,.047,.044,1.01,trayLook.bar,.22);
      for(const z of [-.21,.09,.39])box(terrain,x,1.223,z,span-.02,.035,.045,'#badc9d',.25);
      for (const side of [-1,1]) {
        const edge=x+side*(span/2+.073);
        slab(terrain,edge,1.165,.04,.113,.148,1.36,.047,trayLook.rim,.31);
        const peg=mesh(terrain,woodRing,trayLook.rim,edge-side*.13,1.014,.848,.072,.045,.072,.34);
        peg.rotation.x=Math.PI/2;
      }
      const highlight=slab(terrain,x,1.246,.791,span+.14,.067,.038,.03,'#ffedaa');
      highlight.material=trayFlash.clone();
      return {lo,hi,x,highlight,flash:0,shake:0};
    });
  }
  // Showcase shelf under the board: one velvet slot per required gem, plus a dish for gold flakes.
  function createShelf(model) {
    const velvet='#'+new T.Color(site.rim).lerp(new T.Color('#2b2140'),.62).getHexString();
    slab(terrain,0,SHELF_Y,-.25,9.0,1.32,.62,.34,'#b97c52',.04);
    slab(terrain,0,SHELF_Y+.02,.12,8.55,1.0,.12,.26,velvet,0);
    slab(terrain,0,SHELF_Y+.62,.12,8.9,.12,.5,.06,'#e7b07a',.05);
    slab(terrain,0,SHELF_Y-.62,.12,8.9,.1,.5,.05,'#94603d',.05);
    const required=model.treasure.filter(t=>!t.bonus);
    const span=Math.min(1.85,6.0/required.length);
    const slots=new Map();
    required.forEach((jewel,i)=>{
      const x=-.65+(i-(required.length-1)/2)*span;
      mesh(terrain,dish,'#ffd28c',x,SHELF_Y+.04,.2,.43,.43,.5,.4,.3);
      mesh(terrain,roundedSphere,'#'+new T.Color(velvet).multiplyScalar(.72).getHexString(),x,SHELF_Y+.04,.16,.4,.4,.05,0,.9);
      const ghost=new T.Group();
      ghost.position.set(x,SHELF_Y+.04,.2);
      ghost.scale.setScalar(1.25);
      terrain.add(ghost);
      gemModel(jewel.type,ghost);
      ghost.traverse(child=>{if(child.isMesh)child.material=ghostMaterial;});
      slots.set(jewel.id,{x,y:SHELF_Y+.06,ghost});
    });
    const px=3.55;
    mesh(terrain,dish,'#ffd28c',px,SHELF_Y,.2,.5,.42,.5,.45,.28);
    mesh(terrain,roundedSphere,'#5a3c2a',px,SHELF_Y,.16,.47,.39,.05,0,.85);
    const flakes=model.treasure.filter(t=>t.bonus);
    flakes.forEach((jewel,i)=>slots.set(jewel.id,{x:px-.3+i*.3,y:SHELF_Y-.06+(i%2)*.08,ghost:null}));
    return slots;
  }

  function setLook(look) {
    const water=WATER_LOOKS[look.water]??WATER_LOOKS['water-clear'];
    surfaceMaterial.uniforms.deep.value.set(water.deep);
    surfaceMaterial.uniforms.light.value.set(water.light);
    surfaceMaterial.uniforms.foam.value.set(water.foam);
    surfaceMaterial.uniforms.shift.value=water.shift;
    dripMaterial.color.set(water.light);
    trail=TRAIL_LOOKS[look.trail]??null;
    trayLook=TRAY_LOOKS[look.tray]??TRAY_LOOKS['tray-teal'];
  }
  setLook({});

  function setSite(next,model) {
    if(terrain){
      scene.remove(terrain);
      for(const tray of trays)tray.highlight.material.dispose();
      for(const prize of prizes){
        prize.ripple.material.dispose();
        prize.halo.material.dispose();
        prize.spark.material.dispose();
      }
    }
    site=next;
    finale.t=finale.pulse=-1;
    coins.length=0;
    flash.visible=shock.visible=false;
    for(const m of mists)m.sprite.visible=false;
    terrain=new T.Group();
    scene.add(terrain);
    particles.length=0;
    plants=[];
    crumbsMesh.count=0;
    wet.fill(0);
    drainedSeen=0;
    const midY=bottom+rows*cell/2;
    slab(terrain,0,midY,-1.05,9.12,9.43,.32,.18,site.rim);
    const backing=slab(terrain,0,midY,-.771,8.70,9.15,.23,.20,site.sky);
    if(!panelColors.has(site.sky)){
      const color=new T.Color(site.sky).lerp(new T.Color('#5c659c'),.29);
      panelColors.set(site.sky,new T.MeshBasicMaterial({color,toneMapped:false}));
    }
    backing.material=panelColors.get(site.sky);
    for(const side of [-1,1]){
      slab(terrain,side*4.434,midY,-.092,.237,9.12,.79,.105,site.rim,.04);
      slab(terrain,side*4.397,midY,.349,.093,8.91,.066,.045,site.deep,.10);
      for(const y of [bottom+.38,bottom+rows*cell-.36]){
        const pin=mesh(terrain,roundedSphere,'#f8c97f',side*4.44,y,.433,.080,.080,.039,.20,.33);
        pin.rotation.z=.4;
      }
    }
    terrain.add(sand.mesh);
    soilDirty=true;
    rockParts=site.rocks.map(([c,r,w,h],i)=>{
      const cool=new T.Color(site.rim).lerp(new T.Color('#4d5b69'),.83);
      const groove=cool.clone().lerp(new T.Color('#4d414f'),.37);
      const light=cool.clone().lerp(new T.Color('#d1c9b3'),.31);
      const x=worldX(c),y=worldY(r);
      const shade=shadow(x+.105,y-.11,w*.33,h*.37);
      const group=new T.Group();
      group.position.set(x,y,.546);
      group.rotation.z=(i%3-1)*.075;
      group.scale.set(w*.123,h*.133,.51);
      terrain.add(group);
      mesh(group,stones[i%stones.length],'#'+cool.getHexString(),0,0,0,1,1,1,.19,.62);
      const bright='#'+light.getHexString(), dark='#'+groove.getHexString();
      const glaze='#'+cool.clone().lerp(light,.26).getHexString();
      mesh(group,mineralBands[0],glaze,0,0,.446,1,1,1,.02,.69);
      mesh(group,mineralBands[1],dark,0,0,.446,1,1,1,.02,.69);
      const veinZ=.454;
      for(const [a,b,p,q] of [[-.60,.26,-.26,.37],[-.26,.37,.07,.18],[.07,.18,.52,.29]]){
        stroke(group,bright,a,b,p,q,veinZ,.029);
      }
      for(const [a,b,p,q] of [[-.46,-.29,-.14,-.36],[-.14,-.36,.25,-.17],[.25,-.17,.59,-.21]]){
        stroke(group,dark,a,b,p,q,veinZ,.025);
      }
      return {group,shade,c,r,w,h,color:'#'+cool.getHexString()};
    });
    // Ice blocks: one instance per ice cell, shrinking as water melts them.
    iceCells=[];
    for(let i=0;i<model.land.length;i++)if(model.land[i]===ice)iceCells.push({i,gone:false});
    iceMesh=null;
    if(iceCells.length){
      iceMesh=new T.InstancedMesh(iceGeometry,iceMaterial,iceCells.length);
      iceMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      iceMesh.frustumCulled=false;
      terrain.add(iceMesh);
    }
    const groundY=bottom+rows*cell+.07;
    let runStart=-4.215;
    for(const stop of [...site.springs.map(worldX),4.86]){
      const end=stop-.64;
      const width=end-runStart;
      if(width>.40){
        slab(terrain,(runStart+end)*.5,groundY-.004,.004,width,.124,1.14,.06,'#86bd61');
        const length=Math.max(1,Math.floor(width/1.52));
        for(let i=0;i<length;i++){
          const x=runStart+(i+.39)*width/length;
          plant(x,groundY+.088,.019,.66+(i%3)*.074);
        }
      }
      runStart=stop+.64;
    }
    springs=site.springs.map(c=>{
      const x=worldX(c);
      slab(terrain,x,groundY+.19,.04,1.15,.33,.96,.16,'#44a9ac',.18);
      slab(terrain,x,groundY+.313,.345,1.17,.15,.53,.066,'#ffd28c',.29);
      const nozzle=mesh(terrain,dish,'#ffdc8b',x,groundY+.301,.671,.382,.236,.29,.35,.24);
      nozzle.rotation.y=.087;
      const cavity=mesh(terrain,roundedSphere,'#215a76',x,groundY+.293,.650,.325,.168,.091,.02,.58);
      cavity.rotation.y=.087;
      const inlay=mesh(terrain,roundedSphere,'#73e9f7',x,groundY+.26,.718,.290,.108,.060,.14,.26);
      const overflow=mesh(terrain,flowTube,'#5cd7ed',x,groundY+.097,.707,.164,.24,.049,.11,.25);
      overflow.visible=false;
      const arm=new T.Group();
      terrain.add(arm);
      arm.position.set(x+.435,groundY+.36,.513);
      stroke(arm,'#daa36c',0,-.02,0,.22,.08,.031);
      mesh(arm,roundedSphere,'#ffb570',0,.244,.088,.085,.074,.075,.14,.34);
      const ring=fx(new T.Mesh(ringG,hintMaterial.clone()));
      ring.position.set(x,groundY+.1,1.0);
      ring.renderOrder=8;
      terrain.add(ring);
      const arrow=fx(new T.Mesh(arrowG,hintMaterial.clone()));
      arrow.position.set(x,groundY-.5,1.0);
      arrow.renderOrder=8;
      terrain.add(arrow);
      const drip=fx(new T.Mesh(bulb,dripMaterial));
      drip.scale.set(.06,.085,.06);
      terrain.add(drip);
      return {c,x,inlay,overflow,arm,ring,arrow,drip,groundY};
    });
    trays=createCradle();
    const slots=createShelf(model);
    prizes=model.treasure.map(jewel=>{
      const group=fx(new T.Group());
      terrain.add(group);
      const hue=finds[jewel.type].hue;
      const inner=new T.Group();
      group.add(inner);
      gemModel(jewel.type,inner);
      const scale=jewel.bonus?1.05:1.6;
      inner.scale.setScalar(scale);
      const halo=glow(group,hue,jewel.bonus?.75:1.35,-.12);
      halo.material.opacity=.55;
      const spark=glow(group,'#fffbe8',.5,.45,starMap);
      spark.position.set(.26*scale,.2*scale,.45);
      const gleam=new T.Mesh(crystal,gleamMaterial);
      gleam.position.set(.30*scale,.225*scale,.276);
      group.add(gleam);
      fx(group);
      bright(group);
      spark.layers.enable(GLOW);
      const ripple=fx(new T.Mesh(splashG,trayFlash.clone()));
      ripple.visible=false;
      terrain.add(ripple);
      return {group,inner,halo,spark,gleam,ripple,landing:null,placed:false,slot:slots.get(jewel.id),scale,bonus:jewel.bonus,pulse:0};
    });
    buildDecor(model);
    buildChapterDressing();
  }

  // --- Small buried details: pebbles, shells, bones and roots pop out when their cell is dug.
  function seeded(text) {
    let seed=[...text].reduce((h,ch)=>Math.imul(h^ch.charCodeAt(0),16777619)>>>0,2166136261);
    return ()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  }
  function buildDecor(model) {
    decor=[];
    crab=null;
    const rand=seeded(site.name+'decor');
    const busy=model.treasure.map(t=>[t.c,t.r]);
    const free=(c,r)=>{
      const v=model.land[r*cols+c];
      return (v===1||v===3)&&!busy.some(([x,y])=>Math.hypot(x-c,y-r)<3.2)&&!decor.some(d=>Math.hypot(d.c-c,d.r-r)<3);
    };
    const pebbleColors=['#8d7f78','#a39385','#6f6560',site.deep,'#c9b8a3'];
    for(let attempt=0;attempt<300&&decor.length<13;attempt++){
      const c=1+Math.floor(rand()*(cols-2)), r=2+Math.floor(rand()*(rows-4));
      if(!free(c,r))continue;
      const roll=rand();
      const kind=r<8&&roll<.3?'root':roll<.55?'pebble':roll<.78?'shell':'bone';
      const group=new T.Group();
      group.position.set(worldX(c),worldY(r),sandFace+.012);
      group.rotation.z=rand()*Math.PI*2;
      if(kind==='pebble'){
        const color=pebbleColors[Math.floor(rand()*pebbleColors.length)];
        const pebble=mesh(group,cube,color,0,0,0,.075+rand()*.04,.05+rand()*.03,.025,0,.8);
        pebble.rotation.z=rand()*3;
        if(rand()<.5)mesh(group,cube,color,.07,-.03,0,.04,.03,.02,0,.8);
      } else if(kind==='shell'){
        const tone=rand()<.5?'#f6d2c4':'#f3e4c8';
        mesh(group,roundedSphere,tone,0,0,0,.085,.07,.02,.05,.5);
        for(let k=-2;k<=2;k++){
          const rib=mesh(group,boxG,'#d8a993',k*.026,.005,.018,.006,.11,.006,0,.6);
          rib.rotation.z=k*.28;
        }
        mesh(group,roundedSphere,tone,0,-.07,0,.03,.022,.015,.05,.5);
      } else if(kind==='bone'){
        const shaft=mesh(group,boxG,'#f1e8d6',0,0,0,.16,.03,.02,0,.7);
        shaft.rotation.z=0;
        for(const sx of [-1,1])for(const sy of [-1,1])mesh(group,roundedSphere,'#f1e8d6',sx*.085,sy*.022,0,.026,.026,.02,0,.7);
      } else {
        let x=0,y=0,a=-Math.PI/2+(rand()-.5);
        for(let k=0;k<4;k++){
          const len=.09+rand()*.05;
          const nx=x+Math.cos(a)*len, ny=y+Math.sin(a)*len;
          const seg=mesh(group,woodRing,'#8a6a4a',(x+nx)/2,(y+ny)/2,0,.012-k*.002,len,.012,0,.8);
          seg.rotation.z=Math.atan2(ny-y,nx-x)-Math.PI/2;
          x=nx;y=ny;a+=(rand()-.5)*1.1;
        }
        group.rotation.z=0;
      }
      terrain.add(group);
      decor.push({group,c,r,i:r*cols+c,state:'buried',t:0,vx:0,vy:0,spin:0});
    }
    // One shy crab in most levels, hiding under the sand.
    if(rand()<.7){
      for(let attempt=0;attempt<200;attempt++){
        const c=3+Math.floor(rand()*(cols-6)), r=6+Math.floor(rand()*(rows-12));
        if(!free(c,r))continue;
        crab={c,r,state:'hidden',t:0,dir:c<cols/2?-1:1,group:makeCrab()};
        crab.group.visible=false;
        terrain.add(crab.group);
        break;
      }
    }
  }
  function makeCrab() {
    const group=fx(new T.Group());
    const shell='#ff7a52', dark='#d9532f';
    const body=mesh(group,roundedSphere,shell,0,0,0,.2,.13,.1,.05,.45);
    body.layers.set(FX);
    mesh(group,roundedSphere,'#ffb08f',0,-.03,.06,.12,.06,.04,0,.5);
    const legs=[];
    for(const side of [-1,1]){
      for(let k=0;k<3;k++){
        const leg=mesh(group,boxG,dark,side*(.17+k*.02),-.06-k*.012,0,.12,.022,.022,0,.6);
        leg.rotation.z=side*(-.5-k*.25);
        legs.push(leg);
      }
      const claw=mesh(group,roundedSphere,shell,side*.25,.06,.03,.07,.055,.05,.05,.45);
      legs.push(claw);
      const stalk=mesh(group,boxG,dark,side*.06,.13,.02,.018,.08,.018,0,.6);
      stalk.rotation.z=side*.2;
      mesh(group,roundedSphere,'#ffffff',side*.075,.18,.03,.035,.035,.03,0,.3);
      mesh(group,roundedSphere,'#1d1d24',side*.078,.18,.058,.017,.017,.012,0,.3);
    }
    group.userData.legs=legs;
    fx(group);
    return group;
  }
  // Chapter dressing that lives in the 3D scene (CSS handles the far background).
  function buildChapterDressing() {
    icicles=[];
    if(chapter===2){
      for(const spring of springs){
        for(const [dx,len] of [[-.32,.26],[-.12,.18],[.1,.3],[.3,.16]]){
          const cone=new T.Mesh(new T.ConeGeometry(.045,len,6),iceMaterial);
          cone.rotation.z=Math.PI;
          cone.position.set(spring.x+dx,spring.groundY+.12-len/2,.66);
          terrain.add(cone);
          icicles.push(cone);
        }
      }
    }
  }
  function setChapter(k) {
    chapter=k;
    if(ambient){scene.remove(ambient.points);ambient.points.geometry.dispose();ambient=null;}
    const kinds=[null,{n:26,color:'#ffb27a',size:5,fall:-.12,sway:.5,add:true},{n:70,color:'#ffffff',size:6,fall:.55,sway:.35,add:false},{n:48,color:'#ffd35a',size:7,fall:-.28,sway:.25,add:true}];
    const kind=kinds[k];
    if(!kind)return;
    const position=new Float32Array(kind.n*3), color=new Float32Array(kind.n*3);
    const seeds=[];
    for(let i=0;i<kind.n;i++){
      seeds.push({x:(Math.random()-.5)*10,y:-1.6+Math.random()*13.4,phase:Math.random()*6.28,speed:.6+Math.random()*.8});
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(position,3));
    geometry.setAttribute('color',new T.BufferAttribute(color,3));
    const material=new T.PointsMaterial({map:glowMap,size:kind.size*renderer.getPixelRatio(),sizeAttenuation:false,
      vertexColors:true,transparent:true,depthWrite:false,blending:kind.add?T.AdditiveBlending:T.NormalBlending,opacity:kind.add?1:.85});
    const points=new T.Points(geometry,material);
    points.frustumCulled=false;
    points.layers.set(FX);
    if(k===3)points.layers.enable(GLOW);
    points.renderOrder=11;
    scene.add(points);
    ambient={points,seeds,kind,base:new T.Color(kind.color)};
  }
  function celebrate(stars) {
    finale.pulse=0;
    finale.stars=stars;
    if(stars===3){
      for(let k=0;k<70;k++){
        coins.push({x:(Math.random()-.5)*9.2,y:11.8+Math.random()*4.5,vx:(Math.random()-.5)*.6,vy:-1-Math.random()*2,
          spin:(Math.random()-.5)*14,rot:Math.random()*6,tilt:Math.random()*6,life:0});
      }
    }
  }
  function startFinale(c) {
    finale.t=0;
    finale.x=worldX(c);
    finale.y=1.25;
    flash.visible=shock.visible=true;
    const gold=new T.Color('#ffd34d'), white=new T.Color('#fff8dc');
    for(let k=0;k<60;k++){
      const a=Math.random()*Math.PI*2, speed=2+Math.random()*4.5;
      spawn(finale.x,finale.y,1.0,Math.cos(a)*speed,Math.sin(a)*speed+2,.7+Math.random()*.6,.04+Math.random()*.06,
        gold.clone().lerp(white,Math.random()*.6),4);
    }
    mist(finale.x,finale.y+.2,'#fff4c8',3.2,1.1);
  }

  function carve(indices) {
    if(indices.length)soilDirty=true;
  }

  function spawn(x,y,z,vx,vy,span,size,color,gravity=6) {
    if(particles.length>=maxParticles)particles.shift();
    particles.push({x,y,z,vx,vy,span,size,color,time:0,gravity});
  }
  function puff(c,r,color,n,prize=false) {
    const palette=!prize&&trail ? trail.map(hex=>new T.Color(hex)) : null;
    const base=new T.Color(color);
    const light=new T.Color(prize?'#fff1b4':'#ffdeb1');
    for(let i=0;i<n;i++){
      const tint=palette ? palette[0].clone().lerp(palette[1],Math.random()) : base.clone().lerp(light,Math.random()*.79);
      spawn(worldX(c)+(Math.random()-.5)*.12,worldY(r),.80+Math.random()*.14,
        (Math.random()-.5)*(prize?4.1:3.05),(prize?1.75:.35)+Math.random()*(prize?1.8:2.15),
        .34+Math.random()*.43,(prize?.065:palette?.05:.042)+Math.random()*.062,tint);
    }
  }
  function showCatch(jewel) {
    const prize=prizes[jewel.id];
    prize.landing={age:0,x:worldX(jewel.c),y:1.2};
    const tray=trays.find(({lo,hi})=>jewel.c>=lo&&jewel.c<=hi);
    if(tray){tray.flash=.65;tray.shake=.3;}
    puff(jewel.c,rows-1,finds[jewel.type].hue,jewel.bonus?12:30,true);
    mist(worldX(jewel.c),1.35,'#eefcff',jewel.bonus?1.1:1.8,.75);
    return toScreen(prize.slot.x,prize.slot.y+.5,.6);
  }
  function blast(k) {
    const part=rockParts[k];
    if(!part||!part.group.visible)return;
    part.group.visible=false;
    part.shade.visible=false;
    const rock=new T.Color(part.color), flash=new T.Color('#ffb347'), dust=new T.Color(site.sand);
    for(let i=0;i<70;i++){
      const a=Math.random()*Math.PI*2, speed=1.5+Math.random()*4.5;
      const tint=i%5===0?flash:i%2?rock.clone().lerp(dust,Math.random()*.4):dust.clone();
      spawn(worldX(part.c)+(Math.random()-.5)*part.w*.2,worldY(part.r)+(Math.random()-.5)*part.h*.2,.9,
        Math.cos(a)*speed,Math.sin(a)*speed+1.5,.5+Math.random()*.6,.05+Math.random()*.1,tint,7);
    }
    view.shake=.45;
    soilDirty=true;
  }
  function rockAt(c,r,model) {
    const i=Math.round(r)*cols+Math.round(c);
    return model.rocks.findIndex(cells=>cells.includes(i));
  }
  function setInsets(top,bottomPx) { insets.top=top; insets.bottom=bottomPx; resize(); }
  function resize() {
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return;
    const usable=Math.max(120,h-insets.top-insets.bottom);
    const contentH=CONTENT.top-CONTENT.bottom;
    const s=Math.max(CONTENT.half*2/w,contentH/usable);
    const spare=usable*s-contentH;
    const viewBottom=CONTENT.bottom-insets.bottom*s-spare*.32;
    view.cy=viewBottom+h*s/2;
    camera.left=-w*s/2;camera.right=w*s/2;
    camera.top=h*s/2;camera.bottom=-h*s/2;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);
    const size=renderer.getDrawingBufferSize(new T.Vector2());
    const tw=Math.max(4,Math.round(size.x*.5)),th=Math.max(4,Math.round(size.y*.5));
    waterTarget.setSize(tw,th);
    bloomA.setSize(tw,th);
    bloomB.setSize(Math.max(4,tw>>1),Math.max(4,th>>1));
    bloomC.setSize(Math.max(4,tw>>1),Math.max(4,th>>1));
    if(ambient)ambient.points.material.size=ambient.kind.size*renderer.getPixelRatio();
    surfaceMaterial.uniforms.texel.value.set(1/tw,1/th);
    placeCamera(0,0);
  }
  function placeCamera(dx,dy) {
    camera.position.set(1.2+dx,view.cy+2.11+dy,21);
    camera.lookAt(dx,view.cy+dy,0);
    camera.updateMatrixWorld();
  }
  function toScreen(x,y,z) {
    const p=new T.Vector3(x,y,z).project(camera);
    const rect=canvas.getBoundingClientRect();
    return {x:rect.left+(p.x+1)/2*rect.width,y:rect.top+(1-p.y)/2*rect.height};
  }
  function pointerCell(screenX,screenY) {
    const rect=canvas.getBoundingClientRect();
    cursor.setFromCamera(new T.Vector2((screenX-rect.left)/rect.width*2-1,1-(screenY-rect.top)/rect.height*2),camera);
    if(!cursor.ray.intersectPlane(plane,hit))return null;
    const c=hit.x/cell+cols/2-.5, r=rows-.5-(hit.y-bottom)/cell;
    return {c,r};
  }
  const connected=(model,c)=>[c-1,c,c+1].some(col=>model.land[col]===0);

  function render(model,u,time,dt,running,realDt=dt) {
    if(soilDirty){
      sand.rebuild(model.land,site);
      soilDirty=false;
    }
    const water=model.water;
    surfaceMaterial.uniforms.clock.value=time;
    for(const spring of springs){
      const {c,x,inlay,overflow,arm,ring,arrow,drip,groundY}=spring;
      const linked=connected(model,c);
      inlay.scale.y=(running?.128:.086)+Math.sin(time*6+c)*.014;
      overflow.visible=running&&linked;
      arm.rotation.z+=((running?-.67:.16)-arm.rotation.z)*(1-Math.exp(-10*dt));
      const pulse=(time*1.2)%1;
      ring.visible=arrow.visible=!linked;
      ring.scale.setScalar(.35+pulse*.55);
      ring.material.opacity=(1-pulse)*(running?.95:.7);
      arrow.position.y=groundY-.45-Math.abs(Math.sin(time*4))*.18;
      arrow.material.opacity=.55+Math.sin(time*4)*.25;
      const fall=(time*.8+c*.13)%1;
      drip.visible=!running;
      drip.position.set(x,groundY+.12-fall*fall*.7,.78);
      drip.scale.set(.05,.06+fall*.05,.05);
    }
    for(const [i,plant] of plants.entries()){
      plant.rotation.z=Math.sin(time*1.58+i*.88)*.064;
    }
    for(const tray of trays){
      tray.flash=Math.max(0,tray.flash-dt);
      tray.shake=Math.max(0,tray.shake-dt);
      tray.highlight.visible=tray.flash>0;
      tray.highlight.material.opacity=tray.flash*.93;
    }
    if(iceMesh){
      for(const [k,block] of iceCells.entries()){
        const c=block.i%cols, r=(block.i-c)/cols;
        if(model.land[block.i]!==ice){
          if(!block.gone){
            block.gone=true;
            events.push('melt');
            for(let n=0;n<5;n++)spawn(worldX(c)+(Math.random()-.5)*.2,worldY(r),.85,(Math.random()-.5)*1.6,.6+Math.random()*1.4,
              .4+Math.random()*.3,.03+Math.random()*.03,new T.Color(n%2?'#ffffff':'#bfeaff'),3);
          }
          matrix.scale.setScalar(0);
        } else {
          const thaw=model.melt[block.i]/MELT_TICKS;
          const shimmer=1+Math.sin(time*2+c*.7+r*.4)*.015;
          matrix.scale.set((1-thaw*.3)*shimmer,(1-thaw*.3)*shimmer,1);
        }
        matrix.position.set(worldX(c),worldY(r),.3);
        matrix.rotation.set(0,0,0);
        matrix.updateMatrix();
        iceMesh.setMatrixAt(k,matrix.matrix);
      }
      iceMesh.instanceMatrix.needsUpdate=true;
    }
    // Glints on remaining ice and swaying icicles.
    for(const [k,cone] of icicles.entries())cone.rotation.z=Math.PI+Math.sin(time*1.3+k)*.03;
    // Buried details pop out once their cell is opened.
    for(const d of decor){
      if(d.state==='buried'&&model.land[d.i]===0){
        d.state='falling';d.t=0;d.vx=(Math.random()-.5)*1.6;d.vy=1.4+Math.random();d.spin=(Math.random()-.5)*10;
        d.group.position.z=.82;
        events.push('pop');
      }
      if(d.state==='falling'){
        d.t+=dt;d.vy-=7*dt;
        d.group.position.x+=d.vx*dt;d.group.position.y+=d.vy*dt;
        d.group.rotation.z+=d.spin*dt;
        d.group.scale.setScalar(Math.max(.01,1-Math.max(0,d.t-.5)*2));
        if(d.t>1){d.state='gone';d.group.visible=false;}
      }
    }
    if(crab){
      const g=crab.group;
      if(crab.state==='hidden'){
        let open=false;
        for(let y=crab.r-1;y<=crab.r+1&&!open;y++)for(let x=crab.c-1;x<=crab.c+1;x++)if(model.land[y*cols+x]===0){open=true;break;}
        if(open){crab.state='pop';crab.t=0;g.visible=true;g.position.set(worldX(crab.c),worldY(crab.r),.8);events.push('crab');}
      } else if(crab.state!=='gone'){
        crab.t+=dt;
        const legs=g.userData.legs;
        if(crab.state==='pop'){
          const t=Math.min(1,crab.t/.55);
          g.position.y=worldY(crab.r)+Math.sin(Math.PI*t)*.55;
          g.scale.setScalar(.4+t*.6);
          g.rotation.z=Math.sin(t*12)*.12;
          if(t>=1){crab.state='run';crab.t=0;}
        } else {
          g.position.x+=crab.dir*2.4*dt;
          g.position.y=worldY(crab.r)+Math.abs(Math.sin(crab.t*14))*.05;
          g.rotation.z=Math.sin(crab.t*28)*.06;
          for(const [k,leg] of legs.entries())leg.rotation.x=Math.sin(crab.t*30+k*1.7)*.6;
          if(Math.abs(g.position.x)>4.3)g.scale.setScalar(Math.max(.01,g.scale.x-dt*3));
          if(Math.abs(g.position.x)>5){crab.state='gone';g.visible=false;}
        }
      }
    }
    if(ambient){
      const {seeds,kind,points,base}=ambient;
      const pos=points.geometry.attributes.position, col=points.geometry.attributes.color;
      for(const [i,p] of seeds.entries()){
        p.y-=kind.fall*p.speed*dt;
        p.x+=Math.sin(time*p.speed+p.phase)*kind.sway*dt;
        if(p.y<-1.8)p.y=11.8;
        if(p.y>11.9)p.y=-1.7;
        pos.setXYZ(i,p.x,p.y,1.2);
        const tw=kind.add?.35+.65*Math.max(0,Math.sin(time*2*p.speed+p.phase)):1;
        col.setXYZ(i,base.r*tw,base.g*tw,base.b*tw);
      }
      pos.needsUpdate=col.needsUpdate=true;
    }
    // Spray at the head of falling water.
    for(const d of water){
      if(d.r>d.pr&&Math.random()<dt*.22){
        spawn(worldX(d.c),worldY(d.r)-.05,.9,(Math.random()-.5)*1.4,.4+Math.random()*.8,.25+Math.random()*.2,.02+Math.random()*.02,
          new T.Color('#ffffff'),5);
      }
    }
    for(const m of mists){
      if(!m.sprite.visible)continue;
      m.t+=dt;
      const t=m.t/m.span;
      if(t>=1){m.sprite.visible=false;continue;}
      m.sprite.scale.setScalar(m.grow*(.35+t*.75));
      m.sprite.material.opacity=(1-t)*.55;
    }
    // Finale: flash, shock ring and the camera push (driven by real time, so it ignores slow motion).
    let push=0;
    if(finale.t>=0){
      finale.t+=realDt;
      const t=finale.t;
      flash.position.set(finale.x,finale.y+.15,1.1);
      flash.scale.setScalar(.5+Math.min(1,t/.25)*4.2);
      flash.material.opacity=Math.max(0,1-t/.9);
      shock.position.set(finale.x,finale.y,1.1);
      shock.scale.setScalar(.2+t*5.5);
      shock.material.opacity=Math.max(0,.9-t*1.3);
      push=t<.35?1-(1-t/.35)**3:t<1.25?1:Math.max(0,1-(t-1.25)/.65);
      if(t>2){finale.t=-1;flash.visible=shock.visible=false;}
    }
    // Shelf gems light up one after another after the level is won.
    if(finale.pulse>=0){
      finale.pulse+=realDt;
      const placed=prizes.filter(p=>p.placed&&!p.bonus);
      placed.forEach((p,k)=>{p.pulse=Math.max(0,1-Math.abs(finale.pulse-.2-k*.18)*4);});
      if(finale.pulse>.6+placed.length*.18){finale.pulse=-1;for(const p of placed)p.pulse=0;}
    }
    for(let k=coins.length-1;k>=0;k--){
      const coin=coins[k];
      coin.life+=realDt;
      coin.vy-=5*realDt;
      coin.x+=coin.vx*realDt;coin.y+=coin.vy*realDt;
      coin.rot+=coin.spin*realDt;
      if(coin.y<-2.2)coins.splice(k,1);
    }
    for(const [k,coin] of coins.entries()){
      matrix.position.set(coin.x,coin.y,1.3);
      matrix.rotation.set(Math.sin(coin.tilt)*.6,coin.rot,0);
      matrix.scale.setScalar(1);
      matrix.updateMatrix();
      coinMesh.setMatrixAt(k,matrix.matrix);
    }
    coinMesh.count=coins.length;
    coinMesh.instanceMatrix.needsUpdate=true;
    // Splashes where water drops into a sieve.
    const drained=model.drained||0;
    if(drained>drainedSeen){
      const tone=surfaceMaterial.uniforms.light.value.clone();
      for(let k=0;k<Math.min(3,drained-drainedSeen);k++){
        spawn(worldX(model.lastDrain)+(Math.random()-.5)*.3,1.3,.95,(Math.random()-.5)*2.4,1.2+Math.random()*1.8,
          .35+Math.random()*.25,.035+Math.random()*.03,tone.clone().lerp(new T.Color('#ffffff'),Math.random()*.6),7);
      }
      drainedSeen=drained;
    }
    // Wet sand: soak cells around every drop, then dry slowly.
    const dry=Math.exp(-dt/16);
    for(let i=0;i<wet.length;i++)wet[i]*=dry;
    for(const d of water){
      for(let y=d.r-2;y<=d.r+2;y++){
        if(y<0||y>=rows)continue;
        for(let x=d.c-2;x<=d.c+2;x++){
          if(x<0||x>=cols)continue;
          const i=y*cols+x, soak=1-Math.hypot(x-d.c,y-d.r)*.3;
          if(soak>wet[i])wet[i]=soak;
        }
      }
    }
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        wetBytes[((rows-1-r)*cols+c)*4]=Math.min(255,wet[r*cols+c]*255);
      }
    }
    wetMap.needsUpdate=true;
    // Water blobs, stretched along their motion.
    for(const [i,d] of water.entries()){
      const x=worldX(d.pc+(d.c-d.pc)*u), y=worldY(d.pr+(d.r-d.pr)*u);
      matrix.position.set(x,y,.61);
      matrix.rotation.set(0,0,Math.atan2(d.c-d.pc,Math.max(.1,d.r-d.pr)));
      const moving=Math.abs(d.c-d.pc)+Math.abs(d.r-d.pr);
      matrix.scale.set(.68,.68+.3*Math.min(1,moving),1);
      matrix.updateMatrix();
      blobs.setMatrixAt(i,matrix.matrix);
    }
    blobs.count=water.length;
    blobs.instanceMatrix.needsUpdate=true;

    for(const jewel of model.treasure){
      const prize=prizes[jewel.id];
      const {group,inner,halo,spark,gleam,ripple,landing,slot}=prize;
      if(landing){
        landing.age+=dt;
        const t=Math.min(1,landing.age/.8);
        const ease=1-(1-t)**3;
        ripple.visible=t<.6;
        ripple.position.set(landing.x,1.274,.895);
        ripple.scale.setScalar(.08+.9*t);
        ripple.material.opacity=Math.max(0,.6-t)*1.1;
        group.visible=true;
        group.position.set(landing.x+(slot.x-landing.x)*ease,landing.y+(slot.y-landing.y)*ease+Math.sin(Math.PI*t)*1.1,.9-ease*.3);
        group.rotation.set(0,t*Math.PI*4,0);
        inner.scale.setScalar(prize.scale*(prize.bonus?.8:.85));
        if(t>=1){
          prize.landing=null;prize.placed=true;
          if(slot.ghost)slot.ghost.visible=false;
          puff(slot.x/cell+cols/2-.5,rows-.5-(slot.y-bottom)/cell,finds[jewel.type].hue,10,true);
        }
        continue;
      }
      if(prize.placed){
        group.visible=true;
        group.position.set(slot.x,slot.y+Math.sin(time*2+jewel.id)*.03+prize.pulse*.25,.6);
        group.rotation.set(0,Math.sin(time*.9+jewel.id)*.6+prize.pulse*3,0);
        inner.scale.setScalar(prize.scale*(prize.bonus?.8:.85)*(1+prize.pulse*.35));
        halo.material.opacity=.45+Math.sin(time*2.4+jewel.id)*.15+prize.pulse*.6;
        spark.material.opacity=Math.max(prize.pulse,Math.max(0,Math.sin(time*2.2+jewel.id*1.7))**6);
        continue;
      }
      group.visible=!jewel.found;
      if(!group.visible)continue;
      const d=jewel.carrier;
      const c=d ? d.pc+(d.c-d.pc)*u : jewel.c;
      const r=d ? d.pr+(d.r-d.pr)*u : jewel.r;
      group.position.set(worldX(c),worldY(r)+(!d?Math.sin(time*2.3+jewel.id)*.03:0),.698);
      group.rotation.y=d?time*6.6:Math.sin(time*1.38+jewel.id)*.25;
      group.rotation.z=d?Math.sin(time*6.7+jewel.id)*.33:Math.sin(time*1.12+jewel.id)*.072;
      inner.scale.setScalar(prize.scale);
      halo.material.opacity=(prize.bonus?.35:.5)+Math.sin(time*2.6+jewel.id)*.15;
      const glint=Math.max(0,Math.sin(time*1.7+jewel.id*2.1))**10;
      spark.material.opacity=glint;
      spark.scale.setScalar(.25+glint*.45);
      const twinkle=.025+Math.max(0,Math.sin(time*3.9+jewel.id*2))**5*.10;
      gleam.scale.set(twinkle*.47,twinkle,.026);
    }
    for(let i=particles.length-1;i>=0;i--){
      const dust=particles[i];
      dust.time+=dt;
      if(dust.time>=dust.span){particles.splice(i,1);continue;}
      dust.vy-=dust.gravity*dt;
      dust.x+=dust.vx*dt;dust.y+=dust.vy*dt;
    }
    for(const [i,dust] of particles.entries()){
      matrix.position.set(dust.x,dust.y,dust.z);
      matrix.rotation.set(dust.time*5,0,dust.time*3);
      matrix.scale.setScalar(dust.size*(1-dust.time/dust.span*.76));
      matrix.updateMatrix();
      crumbsMesh.setMatrixAt(i,matrix.matrix);
      crumbsMesh.setColorAt(i,dust.color);
    }
    crumbsMesh.count=particles.length;
    crumbsMesh.instanceMatrix.needsUpdate=true;
    if(crumbsMesh.instanceColor)crumbsMesh.instanceColor.needsUpdate=true;

    view.shake=Math.max(0,view.shake-dt);
    const shake=view.shake*view.shake*.5;
    const zoom=1+push*.16;
    if(camera.zoom!==zoom){camera.zoom=zoom;camera.updateProjectionMatrix();}
    placeCamera((Math.random()-.5)*shake+finale.x*push*.35,(Math.random()-.5)*shake+(finale.y-view.cy)*push*.3);

    renderer.setRenderTarget(null);
    renderer.clear();
    camera.layers.set(0);
    renderer.render(scene,camera);
    if(water.length){
      renderer.setRenderTarget(waterTarget);
      renderer.clear();
      renderer.render(waterScene,camera);
      renderer.setRenderTarget(null);
      renderer.render(surfaceScene,flatCamera);
    }
    camera.layers.set(FX);
    renderer.render(scene,camera);
    if(bloomOn){
      renderer.setRenderTarget(bloomA);
      renderer.clear();
      camera.layers.set(GLOW);
      renderer.render(scene,camera);
      if(water.length)renderer.render(surfaceGlowScene,flatCamera);
      blurMaterial.uniforms.map.value=bloomA.texture;
      blurMaterial.uniforms.dir.value.set(1/bloomB.width,0);
      postPass(blurMaterial,bloomB);
      blurMaterial.uniforms.map.value=bloomB.texture;
      blurMaterial.uniforms.dir.value.set(0,1/bloomC.height);
      postPass(blurMaterial,bloomC);
      blurMaterial.uniforms.map.value=bloomC.texture;
      blurMaterial.uniforms.dir.value.set(2/bloomB.width,0);
      postPass(blurMaterial,bloomB);
      blurMaterial.uniforms.map.value=bloomB.texture;
      blurMaterial.uniforms.dir.value.set(0,2/bloomC.height);
      postPass(blurMaterial,bloomC);
      renderer.setRenderTarget(null);
      postQuad.material=bloomMix;
      renderer.render(postScene,flatCamera);
    }
  }
  const drainEvents=()=>events.splice(0);
  return {setSite,setLook,setInsets,setChapter,carve,puff,showCatch,blast,rockAt,resize,pointerCell,toScreen,render,
    startFinale,celebrate,drainEvents};
}
