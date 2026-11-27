import * as THREE from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {clamp} from './recipes.mjs';

const TAU = Math.PI * 2;
const smoothstep = (a,b,x) => {const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function object(geometry, material, parent, x=0,y=0,z=0) {
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
  parent.add(mesh);return mesh;
}
const standard=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.48,...extra});
let creamBump;

// Buttercream relief: long soft folds that run around the cake (the direction
// the bag and the knife travel), fine star-tip ridges, and almost no grain.
// High-frequency speckle reads as towel or felt, so it is deliberately absent.
function buttercreamTexture() {
  if(creamBump)return creamBump;
  const W=512,H=512,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const context=canvas.getContext('2d'),pixels=context.createImageData(W,H);
  let seed=77193;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const layer=(nx,ny)=>{const cells=Float32Array.from({length:nx*ny},random);return (x,y)=>{
    const gx=x/W*nx,gy=y/H*ny,ix=Math.floor(gx),iy=Math.floor(gy);let tx=gx-ix,ty=gy-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);
    const s=(dx,dy)=>cells[((iy+dy)%ny)*nx+(ix+dx)%nx];
    return (s(0,0)*(1-tx)+s(1,0)*tx)*(1-ty)+(s(0,1)*(1-tx)+s(1,1)*tx)*ty;};};
  const folds=layer(6,22),folds2=layer(12,46),wobble=layer(8,8),soft=layer(64,64);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const w=wobble(x,y);
    const ridge=Math.sin((y/H*56+w*2.2)*TAU)*.5+.5;
    const value=128+(folds(x,y)-.5)*70+(folds2(x,y)-.5)*34+(ridge-.5)*15+(soft(x,y)-.5)*7;
    const i=(y*W+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
  }
  context.putImageData(pixels,0,0);
  creamBump=new THREE.CanvasTexture(canvas);
  creamBump.wrapS=creamBump.wrapT=THREE.RepeatWrapping;
  creamBump.anisotropy=8;
  return creamBump;
}

export class FrostSurface {
  constructor(grid,recipe,surface){
    Object.assign(this,{grid,recipe,surface,revision:-1});
    const w=grid.w,h=grid.h,count=(w+1)*h;
    this.positions=new Float32Array(count*3);this.colors=new Float32Array(count*4);
    this.softness=new Float32Array(count);this.radii=new Float32Array(count);
    this.uvs=new Float32Array(count*2);
    this.geo=new THREE.BufferGeometry();
    this.geo.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color',new THREE.BufferAttribute(this.colors,4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('icingSoftness',new THREE.BufferAttribute(this.softness,1).setUsage(THREE.DynamicDrawUsage));
    const indices=[];
    for(let y=0;y<h-1;y++)for(let x=0;x<w;x++){
      const a=y*(w+1)+x,b=a+w+1;
      if(surface==='top')indices.push(a,a+1,b,a+1,b+1,b);
      else indices.push(a,b,a+1,a+1,b,b+1);
    }
    // Integer repeats around the cake keep the relief seamless at u=0/1.
    for(let y=0;y<h;y++)for(let x=0;x<=w;x++){
      const u=x/w,v=y/(h-1),i=(y*(w+1)+x)*2;
      this.uvs[i]=surface==='side'?u*3:Math.cos(u*TAU)*v*.9+.9;
      this.uvs[i+1]=surface==='side'?v*recipe.height*.55:Math.sin(u*TAU)*v*.9+.9;
    }
    this.geo.setAttribute('uv',new THREE.BufferAttribute(this.uvs,2));
    this.geo.setIndex(indices);
    const bump=buttercreamTexture();
    // Buttercream is a soft, slightly waxy fat emulsion: a broad satin sheen,
    // a thin buttery clearcoat, and light that scatters back out tinted by
    // the cream colour (so shadows stay saturated instead of turning grey).
    this.material=new THREE.MeshPhysicalMaterial({
      vertexColors:true,transparent:false,side:THREE.DoubleSide,
      roughness:.5,metalness:0,clearcoat:.24,clearcoatRoughness:.42,
      sheen:.45,sheenRoughness:.5,sheenColor:new THREE.Color('#ffffff'),
      specularIntensity:.55,bumpMap:bump,bumpScale:.45,envMapIntensity:1.05,
    });
    this.material.onBeforeCompile=shader=>{
      shader.vertexShader='attribute float icingSoftness; varying float vIcingSoftness;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvIcingSoftness=icingSoftness;');
      shader.fragmentShader='varying float vIcingSoftness;\n'+shader.fragmentShader;
      // Piped ropes keep their folds; the knife burnishes them to faint streaks.
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',THREE.ShaderChunk.normal_fragment_maps.replace('dHdxy_fwd()','dHdxy_fwd() * mix(1.0,0.34,vIcingSoftness)'));
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor *= mix(1.0,0.72,vIcingSoftness);');
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nvec3 iceC = max(diffuseColor.rgb, vec3(0.0001));\nfloat iceHi = max(max(iceC.r, iceC.g), iceC.b);\nfloat iceSat = (iceHi - min(min(iceC.r, iceC.g), iceC.b)) / iceHi;\nreflectedLight.indirectDiffuse += iceC * iceC * 0.26 * (0.15 + 0.85 * iceSat);\nreflectedLight.directDiffuse *= mix(vec3(1.0), sqrt(iceC / iceHi) * 1.08, 0.4 * iceSat);');
    };
    this.material.customProgramCacheKey=()=> 'buttercream-finish-v5';
    this.mesh=new THREE.Mesh(this.geo,this.material);
    this.mesh.castShadow=this.mesh.receiveShadow=true;
    this.update(true);
  }
  // Outermost cream radius in a window of the side surface (cake-local u,v),
  // used to rest the knife on the cream instead of inside it.
  outerRadius(u,v0,v1,du){
    const g=this.grid,w=g.w,row=w+1,P=this.positions;let m=0;
    const y0=Math.max(0,Math.floor(v0*(g.h-1))),y1=Math.min(g.h-1,Math.ceil(v1*(g.h-1)));
    const c=Math.round(u*w),n=Math.max(1,Math.ceil(du*w));
    for(let y=y0;y<=y1;y++)for(let k=-n;k<=n;k++){const x=((c+k)%w+w)%w,q=(y*row+x)*3,rr=Math.hypot(P[q],P[q+2]);if(rr>m)m=rr;}
    return m;
  }
  maxHeight(){let m=0;for(let i=1;i<this.positions.length;i+=3)if(this.positions[i]>m)m=this.positions[i];return m;}
  update(force=false){
    const g=this.grid,r=this.recipe,w=g.w,side=this.surface==='side';
    if(!force&&this.revision===g.revision)return;
    this.revision=g.revision;
    const radii=this.radii,colors=this.colors;
    // Rendering-only softened coverage (two 1-2-1 passes, wrapping around the
    // cake): stroke edges become smooth rounded contours instead of following
    // the grid cell by cell, which reads as saw teeth once the cream is opaque.
    const n=w*g.h,ab=this.ab||(this.ab=new Float32Array(n)),tmp=this.abTmp||(this.abTmp=new Float32Array(n));
    ab.set(g.a);
    for(let pass=0;pass<3;pass++){
      for(let y=0;y<g.h;y++)for(let x=0;x<w;x++){const o=y*w;tmp[o+x]=(ab[o+(x+w-1)%w]+2*ab[o+x]+ab[o+(x+1)%w])*.25;}
      for(let y=0;y<g.h;y++)for(let x=0;x<w;x++){const up=Math.min(g.h-1,y+1),dn=Math.max(0,y-1);ab[y*w+x]=(tmp[dn*w+x]+2*tmp[y*w+x]+tmp[up*w+x])*.25;}
    }
    for(let y=0;y<g.h;y++)for(let x=0;x<=w;x++){
      const u=x/w,v=y/(g.h-1),theta=u*TAU,i=y*w+x%w,k=y*(w+1)+x;
      const a=ab[i],s=g.s[i],raw=1-s;
      // Each brush stroke deposits its own rounded cross-section. Pressure
      // wobble makes the piped rope swell and thin gently as it goes round.
      const lump=(Math.sin(theta*5+v*9+Math.sin(theta*11+v*3)*.8)*.006+Math.sin(theta*19-v*23)*.0025)*raw;
      // Icing is either there or not: no see-through fringe. Where a stroke
      // thins out, the cream curls down and dips into the sponge, so its edge
      // is a clean intersection instead of two coplanar layers flickering.
      const cover=smoothstep(.03,.42,a);
      const depth=(g.d[i]*raw+.073*s)*smoothstep(.3,.9,cover);
      let radius,height;
      if(side){
        const bevel=.018*(1-Math.sin(Math.PI*v));
        radius=r.radius-bevel+.004+(cover-.55)*.055+depth+lump*cover;
        if(r.shape==='scallop')radius+=.021*Math.cos(theta*12);
        // The rope rolls over the top edge into a soft shoulder that tucks
        // under the top layer, so no gap opens between the two surfaces.
        radius-=smoothstep(.93,1,v)**1.6*(depth+lump*cover+.05+Math.max(0,(cover-.55)*.055));
        height=v*r.height+smoothstep(.94,1,v)*(.012+a*.060);
      }else{
        radius=(r.radius+.076)*v;
        height=r.height+.014+depth+.020*(1-v*v)-smoothstep(.91,1,v)*.012+lump*a*.6*smoothstep(.05,.45,v);
      }
      radii[k]=(side?depth+lump*cover:height)*(side?1:1);this.cover=this.cover||new Float32Array(radii.length);this.cover[k]=cover;
      const p=k*3;
      this.positions[p]=Math.cos(theta)*radius;
      this.positions[p+1]=height;this.positions[p+2]=Math.sin(theta)*radius;
      this.softness[k]=s;
    }
    // Colour pass: grooves between ropes catch less light (cavity), and the
    // knife drags neighbouring colours into each other where bands meet.
    const row=w+1;
    for(let y=0;y<g.h;y++)for(let x=0;x<=w;x++){
      const k=y*row+x,i=y*w+x%w,s=g.s[i],c=k*4;
      let cavity=0;
      if(side){
        const up=Math.min(g.h-1,y+2),dn=Math.max(0,y-2),l=y*row+(x+w-2)%w,rr=y*row+(x+2)%w;
        cavity=Math.max(0,(radii[up*row+x]+radii[dn*row+x])*.5-radii[k])*11+Math.max(0,(radii[l]+radii[rr])*.5-radii[k])*5;
      }else{
        const up=Math.min(g.h-1,y+1),dn=Math.max(0,y-1);
        cavity=Math.max(0,(radii[up*row+x]+radii[dn*row+x]+radii[y*row+(x+w-2)%w]+radii[y*row+(x+2)%w])*.25-radii[k])*9;
      }
      const shade=1-clamp(cavity*smoothstep(.55,1,this.cover[k]),0,.42);
      let cr=g.c[i*3],cg=g.c[i*3+1],cb=g.c[i*3+2];
      if(g.a[i]<.5){
        // Thin edge cells borrow the colour of the cream next to them, so the
        // rim never fades toward the unpainted (black) value of empty cells.
        let tr=0,tg=0,tb=0,tw=0;
        for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const yy=y+dy;if(yy<0||yy>=g.h)continue;const j=yy*w+(x+dx+w)%w,wt=g.a[j];tr+=g.c[j*3]*wt;tg+=g.c[j*3+1]*wt;tb+=g.c[j*3+2]*wt;tw+=wt;}
        if(tw>1e-4){const m=1-g.a[i]*2;cr+=(tr/tw-cr)*m;cg+=(tg/tw-cg)*m;cb+=(tb/tw-cb)*m;}
      }
      if(s>.05&&side){
        // Streaky vertical smear, stronger where the knife has passed more.
        const theta=x/w*TAU,reach=s*(.55+.45*Math.sin(theta*3+Math.sin(theta*7)*1.3));
        let tr=0,tg=0,tb=0,tw=0;
        for(let d=-3;d<=3;d++){const yy=Math.min(g.h-1,Math.max(0,y+d)),j=(yy*w+x%w)*3,wt=g.a[yy*w+x%w]*(4-Math.abs(d));tr+=g.c[j]*wt;tg+=g.c[j+1]*wt;tb+=g.c[j+2]*wt;tw+=wt;}
        if(tw>0){const m=clamp(reach)*.7;cr+=(tr/tw-cr)*m;cg+=(tg/tw-cg)*m;cb+=(tb/tw-cb)*m;}
      }
      colors[c]=cr*shade;colors[c+1]=cg*shade;colors[c+2]=cb*shade;colors[c+3]=1;
    }
    this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=true;
    this.geo.attributes.icingSoftness.needsUpdate=true;
    this.geo.computeVertexNormals();
    const normals=this.geo.attributes.normal.array;
    for(let y=0;y<g.h;y++){
      const a=y*(g.w+1)*3,b=(y*(g.w+1)+g.w)*3;
      for(let j=0;j<3;j++)normals[a+j]=normals[b+j]=(normals[a+j]+normals[b+j])*.5;
    }
    this.geo.attributes.normal.needsUpdate=true;this.geo.computeBoundingSphere();
  }
}

export function makeSpongeTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const c=canvas.getContext('2d');c.fillStyle='#e9b774';c.fillRect(0,0,512,512);
  let seed=279341;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<19000;i++){
    const x=random()*512,y=random()*512,size=.4+random()*1.5;
    c.fillStyle=i%4?'#a56a2926':'#fff3c960';c.beginPath();c.ellipse(x,y,size,size*.7,random(),0,TAU);c.fill();
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}

export function makeCakeBase(recipe,texture){
  const group=new THREE.Group(),r=recipe.radius,h=recipe.height;
  const profile=[[0,0],[r*.95,0],[r*.986,.035],[r,.09],[r,h-.09],[r*.985,h-.02],[r*.95,h],[0,h]].map(([x,y])=>new THREE.Vector2(x,y));
  const cake=object(new THREE.LatheGeometry(profile,128),standard('#ffffff',{map:texture,roughness:.84,bumpMap:texture,bumpScale:.012}),group);
  cake.material.map.repeat.set(2,1);
  for(const fraction of [.33,.66]){
    if(h<1.15&&fraction>.5)continue;
    object(new THREE.CylinderGeometry(r*.999,r*.999,.034,128),standard('#fff1d6',{roughness:.67}),group,0,h*fraction,0);
    object(new THREE.CylinderGeometry(r*.998,r*.998,.007,128),standard('#c77b39',{roughness:.8}),group,0,h*fraction-.022,0);
  }
  if(recipe.shape==='pie')for(let i=0;i<48;i++){
    const angle=i/48*TAU,m=object(new THREE.SphereGeometry(.076,16,10),standard(i%2?'#db993e':'#edb559',{roughness:.63}),group,Math.cos(angle)*r,h-.012,Math.sin(angle)*r);
    m.scale.set(.75,.67,1.2);m.rotation.y=-angle;
  }
  return group;
}

export function makePedestal(parent){
  const g=new THREE.Group();parent.add(g);
  const profile=[[0,.68],[1.24,.68],[1.31,.71],[1.32,.77],[1.30,.80],[1.26,.816],[0,.816]].map(([x,y])=>new THREE.Vector2(x,y));
  object(new THREE.LatheGeometry(profile,128),new THREE.MeshPhysicalMaterial({color:'#fff1d0',roughness:.34,clearcoat:.25,clearcoatRoughness:.45}),g);
  const ring=object(new THREE.TorusGeometry(1.291,.009,8,128),standard('#e7cda0',{metalness:.25,roughness:.4}),g,0,.785,0);ring.rotation.x=Math.PI/2;
  object(new THREE.CylinderGeometry(.19,.22,.47,48),standard('#424953',{metalness:.3,roughness:.38}),g,0,.435,0);
  object(new THREE.CylinderGeometry(.45,.53,.058,64),standard('#666f76',{metalness:.3,roughness:.5}),g,0,.195,0);
  return g;
}

function latheX(points,material,parent){
  const m=object(new THREE.LatheGeometry(points.map(([x,r])=>new THREE.Vector2(r,x)),64),material,parent);m.rotation.z=-Math.PI/2;return m;
}
export function makePipingBag(){
  const group=new THREE.Group();
  const material=new THREE.MeshPhysicalMaterial({color:'#d62c6d',roughness:.37,clearcoat:.25,clearcoatRoughness:.35,sheen:.1});
  const body=latheX([[-1.31,.035],[-1.23,.10],[-1.16,.23],[-1.03,.25],[-.85,.23],[-.60,.18],[-.38,.12],[-.235,.065]],material,group);
  const p=body.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i));
    const wrinkle=(Math.sin(a*9+y*5)*.011+Math.sin(a*17)*.004)*smoothstep(-.55,-1.3,y);
    const radius=Math.hypot(p.getX(i),p.getZ(i));
    if(radius>.01){const gain=(radius+wrinkle)/radius;p.setX(i,p.getX(i)*gain);p.setZ(i,p.getZ(i)*gain);}
  }
  p.needsUpdate=true;body.geometry.computeVertexNormals();
  latheX([[-.255,.066],[-.225,.070],[-.19,.065],[-.16,.044]],standard('#303c48',{roughness:.5}),group);
  const metal=new THREE.MeshPhysicalMaterial({color:'#dce6ed',metalness:.86,roughness:.19,clearcoat:.25});
  latheX([[-.195,.061],[-.15,.059],[-.018,.026],[.012,.022]],metal,group);
  const opening=object(new THREE.CircleGeometry(.019,24),standard('#796f64'),group,.013,0,0);opening.rotation.y=Math.PI/2;
  const tie=object(new THREE.TorusGeometry(.043,.014,10,24),standard('#eee9da'),group,-1.30,0,0);tie.rotation.y=Math.PI/2;
  const tailMaterial=new THREE.MeshPhysicalMaterial({color:'#f3fbff',transparent:true,opacity:.83,roughness:.3,side:THREE.DoubleSide});
  const tail=latheX([[-1.52,.10],[-1.47,.12],[-1.32,.035]],tailMaterial,group);
  tail.scale.z=.48;
  return {group,material};
}

export function makePaletteKnife(){
  const g=new THREE.Group(),shape=new THREE.Shape();
  shape.moveTo(-.23,.35);shape.lineTo(.23,.35);shape.lineTo(.25,-.29);
  shape.quadraticCurveTo(.25,-.40,.13,-.42);shape.lineTo(-.13,-.42);
  shape.quadraticCurveTo(-.25,-.40,-.25,-.29);shape.closePath();
  const metal=new THREE.MeshPhysicalMaterial({color:'#a9b4bf',metalness:1,roughness:.36,anisotropy:.75,anisotropyRotation:Math.PI/2,clearcoat:.15,clearcoatRoughness:.2});
  // A gently dished blade: a flat plate mirrors one flat patch of the studio
  // and reads as grey plastic, the curvature sweeps the softbox across it.
  const bladeGeo=new THREE.ExtrudeGeometry(shape,{depth:.03,bevelEnabled:true,bevelSegments:3,bevelSize:.016,bevelThickness:.01,curveSegments:12,steps:1});
  bladeGeo.computeBoundingBox();
  {const p=bladeGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,p.getZ(i)-x*x*.35-(y+.42)*(y+.42)*.05);}p.needsUpdate=true;bladeGeo.computeVertexNormals();}
  object(bladeGeo,metal,g,0,.09,0);
  object(new RoundedBoxGeometry(.055,.25,.05,2,.018),metal,g,0,.51,.01);
  const handle=object(new RoundedBoxGeometry(.20,.65,.115,4,.055),new THREE.MeshPhysicalMaterial({color:'#245695',roughness:.34,clearcoat:.25}),g,0,.92,.01);
  const grip=object(new RoundedBoxGeometry(.115,.33,.014,3,.025),standard('#2e65a8',{roughness:.6}),g,0,.89,.074);
  for(const y of [.72,.82,.92,1.02])object(new RoundedBoxGeometry(.087,.009,.009,1,.003),standard('#3b73b4'),g,0,y,.085);
  object(new THREE.SphereGeometry(.018,12,8),metal,g,0,.65,.078).scale.z=.3;
  const eye=object(new THREE.TorusGeometry(.031,.012,10,24),standard('#1b426f'),g,0,1.155,.075);
  return g;
}

// A small photo studio, prefiltered for image-based lighting: a big soft key
// box, a tall strip light (the vertical highlight that makes a frosted cake
// read as round), a rim panel behind and a pale grey sweep below.
export function makeStudioEnvironment(renderer){
  const scene=new THREE.Scene();
  const room=new THREE.SphereGeometry(12,48,24),colors=[],p=room.attributes.position;
  const top=new THREE.Color('#f5f7fb'),mid=new THREE.Color('#d7dce3'),floor=new THREE.Color('#8f979f'),c=new THREE.Color();
  for(let i=0;i<p.count;i++){const y=p.getY(i)/12;if(y>0)c.copy(mid).lerp(top,Math.min(1,y*1.4));else c.copy(mid).lerp(floor,Math.min(1,-y*2.2));colors.push(c.r,c.g,c.b);}
  room.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  scene.add(new THREE.Mesh(room,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const panel=(w,h,pos,intensity,tint='#ffffff')=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(tint).multiplyScalar(intensity),side:THREE.DoubleSide}));m.position.set(...pos);m.lookAt(0,1.4,0);scene.add(m);};
  panel(7,5,[-6,7,6],4.2,'#fffaf2');
  panel(1.4,8,[7,3,3],4.2,'#f2f7ff');
  panel(6,2.2,[1,4.5,-8],2.6);
  panel(7,7,[0,10,0],1.6);
  const pm=new THREE.PMREMGenerator(renderer);
  const texture=pm.fromScene(scene,.035).texture;pm.dispose();
  scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  return texture;
}

export function addContactShadow(scene){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d'),gradient=c.createRadialGradient(64,64,8,64,64,62);
  gradient.addColorStop(0,'#25304a55');gradient.addColorStop(.35,'#3543552a');gradient.addColorStop(1,'#35435500');
  c.fillStyle=gradient;c.fillRect(0,0,128,128);
  const material=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,opacity:.65});
  const plane=object(new THREE.PlaneGeometry(1.9,1.9),material,scene,.15,.125,0);
  plane.rotation.x=-Math.PI/2;plane.castShadow=plane.receiveShadow=false;return plane;
}
