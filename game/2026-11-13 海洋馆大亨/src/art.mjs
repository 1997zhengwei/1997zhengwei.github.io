import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {SPECIES,BY_ID} from './data.mjs';
import {SHORE,rampHeight,shorePose,cargoFrame,footLift,SHOES,LEG_HEIGHT} from './shore.mjs';
import {fishGeometry} from './fish-art.mjs';
import {RARE_COLORS} from './growth.mjs';
import {tropicalPalm,tropicalCoral,seaStar} from './tropical.mjs';
export {T};
const mats=new Map();
export function mat(color,roughness=.65,metalness=0){const k=color+roughness+metalness;if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color,roughness,metalness}));return mats.get(k);}
export function releaseGroup(scene,root){scene.remove(root);const gs=new Set(),ms=new Set(),shared=new Set(mats.values());root.traverse(o=>{if(o.geometry&&o.geometry!==sphere&&o.geometry!==cylinder)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!shared.has(m))ms.add(m);});for(const g of gs)g.dispose();for(const m of ms){m.map?.dispose();m.dispose();}}
const sphere=new T.SphereGeometry(1,16,10),cylinder=new T.CylinderGeometry(1,1,1,20);
export function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent?.add(o);return o;}
export function ball(p,x,y,z,sx,sy,sz,color){const o=mesh(sphere,typeof color==='string'?mat(color):color,p,x,y,z);o.scale.set(sx,sy,sz);return o;}
export function box(p,x,y,z,w,h,d,color,r=.1){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),typeof color==='string'?mat(color):color,p,x,y,z);}
export function cyl(p,x,y,z,r,h,color,r2=r){return mesh(new T.CylinderGeometry(r2,r,h,32),typeof color==='string'?mat(color):color,p,x,y,z);}
export function beam(p,a,b,r,color){const v1=new T.Vector3(...a),v2=new T.Vector3(...b),o=mesh(cylinder,typeof color==='string'?mat(color):color,p);o.position.copy(v1).add(v2).multiplyScalar(.5);o.scale.set(r,v1.distanceTo(v2),r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v2.sub(v1).normalize());return o;}
export function ring(p,r,tube,color,x=0,y=0,z=0){const o=mesh(new T.TorusGeometry(r,tube,8,64),typeof color==='string'?mat(color):color,p,x,y,z);o.rotation.x=-Math.PI/2;return o;}
export function label(text,w=4,h=1.2,bg='#fff7dd',fg='#245569',font=54){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.round(512*h/w);const c=canvas.getContext('2d');c.fillStyle=bg;c.beginPath();c.roundRect(0,0,512,canvas.height,22);c.fill();c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`900 ${font}px Nunito, Microsoft YaHei, sans-serif`;c.fillText(text,256,canvas.height/2);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,toneMapped:false});return new T.Mesh(new T.PlaneGeometry(w,h),m);}
export function softShadow(p,r=1,opacity=.15){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,`rgba(23,75,87,${opacity})`);g.addColorStop(1,'rgba(23,75,87,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const o=new T.Mesh(new T.PlaneGeometry(r*2,r*2),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.y=.022;p.add(o);return o;}
export function studio(renderer,scene){const env=new T.Scene();env.background=new T.Color('#bce4e5');const room=new T.Mesh(new T.BoxGeometry(120,100,120),new T.MeshBasicMaterial({color:'#9ec6c8',side:T.BackSide}));env.add(room);for(const [x,y,z,w,h] of [[-30,30,15,20,45],[30,38,-15,18,38],[0,48,0,26,20]]){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(2.1,2.1,1.8)}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m);}const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(env,.12).texture;scene.environmentIntensity=.32;pmrem.dispose();}
export function waterMaterial(color='#4fc3cc',opacity=.65,caustic=false){const m=new T.ShaderMaterial({transparent:opacity<1,depthWrite:opacity>=1,side:T.DoubleSide,uniforms:{time:{value:0},base:{value:new T.Color(color)},alpha:{value:opacity},scale:{value:caustic?2.45:1.65},strength:{value:caustic?.13:.065}},vertexShader:'varying vec3 wp;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}',fragmentShader:`varying vec3 wp;uniform float time,alpha,scale,strength;uniform vec3 base;
float cells(vec2 uv){vec2 i=floor(uv),f=fract(uv);float d=9.,d2=9.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){vec2 a=vec2(float(x),float(y));vec2 h=vec2(dot(i+a,vec2(127.1,311.7)),dot(i+a,vec2(269.5,183.3)));vec2 off=.5+.26*sin(time*.4+6.2831*fract(sin(h)*43758.5453));float v=length(a+off-f);if(v<d){d2=d;d=v;}else if(v<d2){d2=v;}}return d2-d;}
void main(){vec2 uv=wp.xz*scale*.37;uv+=.07*vec2(sin(wp.z*.5+time*.4),cos(wp.x*.4-time*.3));float c=cells(uv);float lace=1.-smoothstep(.006,.038,c);float s=sin(wp.x*.7+wp.z*.4-time*.65)*.012;vec3 col=mix(base,base*vec3(.58,.81,1.0),smoothstep(0.,40.,-wp.z)*.55)+lace*strength*.32+s;gl_FragColor=vec4(col,alpha+lace*.015);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(');#include',');\n#include')});return m;}
export const palm=(p,x,z,scale=1)=>tropicalPalm(p,x,z,scale);
const coral=(p,x,y,z,seed=0,scale=1)=>tropicalCoral(p,x,y,z,seed,scale);
export function makeWorld(scene){const root=new T.Group();scene.add(root);const animated=[];const seaMat=waterMaterial('#65c6f3',.105),sea=mesh(new T.PlaneGeometry(220,220),seaMat,root,0,-.12,-20);sea.rotation.x=-Math.PI/2;sea.castShadow=false;sea.renderOrder=2;
 const bottomMat=waterMaterial('#379bda',1,true),bottom=mesh(new T.PlaneGeometry(210,210),bottomMat,root,0,-2.85,-20);bottom.rotation.x=-Math.PI/2;bottom.castShadow=false;
 // A warm, open pavilion with a visible white stone edge and a single swimming pier.
 box(root,0,-.35,18,35,.9,34,'#e1cc9f',.35);box(root,0,.08,18,34,.18,33,'#f4d48a',.2);
 for(let x=-15;x<=15;x+=3)for(let z=3;z<=33;z+=3){const tile=box(root,x,.184,z,2.97,.02,2.97,(Math.round((x+z)/3)%2)?'#f4d48a':'#f8dc9c',.02);tile.castShadow=false;}
 for(const x of [-17,17])box(root,x,.27,18,.35,.32,33,'#fffbe3',.08);box(root,-10,.27,1,14,.32,.4,'#fffbe3');box(root,10,.27,1,14,.32,.4,'#fffbe3');
 // A shallow, continuous access ramp. Its top is exactly rampHeight(z).
 const x=SHORE.rampHalfWidth,z0=SHORE.rampStart,z1=SHORE.rampEnd,y0=rampHeight(z0),y1=rampHeight(z1),positions=[-x,y0,z0,x,y0,z0,-x,y1,z1,x,y1,z1,-x,y0-.18,z0,x,y0-.18,z0,-x,y1-.18,z1,x,y1-.18,z1];
 const rampGeo=new T.BufferGeometry();rampGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));rampGeo.setIndex([0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5]);rampGeo.computeVertexNormals();mesh(rampGeo,mat('#bce9dc'),root);
 box(root,0,SHORE.deck-.09,1.8,5.2,.18,2.0,'#f6f4cf',.07);
 for(let i=0;i<=11;i++){const z=z0+(z1-z0)*i/11;beam(root,[-x+.12,rampHeight(z)+.018,z],[x-.12,rampHeight(z)+.018,z],.014,i%3===0?'#35c9be':'#e8fff2');}
 for(const side of [-1,1]){const xx=side*2.53;for(const z of [-4.5,-2,.8,2]){const h=rampHeight(z);beam(root,[xx,h,z],[xx,h+.90,z],.045,'#eafff5');}beam(root,[xx,rampHeight(-4.5)+.86,-4.5],[xx,rampHeight(.8)+.86,.8],.048,'#36bfb8');beam(root,[xx,rampHeight(.8)+.86,.8],[xx,rampHeight(2)+.86,2],.048,'#36bfb8');}
 for(let j=0;j<7;j++){const rope=new T.Mesh(new T.TorusGeometry(1+j*.7,.022,4,64),new T.MeshBasicMaterial({color:'#d7fff1',transparent:true,opacity:.15}));rope.rotation.x=-Math.PI/2;rope.position.set(0,-.07,-2);root.add(rope);animated.push(rope);}
 const p=label('潜水码头  DIVE',4.6,.8,'#f9f2cf','#247889',45);p.rotation.x=-Math.PI/2;p.position.set(0,.205,3);root.add(p);
 const path=label('A Q U A   C O A S T',6.8,.55,'#f4d48a','#d3b87e',28);path.rotation.x=-Math.PI/2;path.position.set(0,.21,15);root.add(path);
 for(let i=0;i<12;i++){const x=i%2?15.2:-15.2,z=4+Math.floor(i/2)*5.3;palm(root,x,z,.7+(i%3)*.1);}
 // Entrance, striped kiosk, seating and landscaping create scale without hiding the tanks.
 for(const x of [-3,3]){cyl(root,x,2.2,34,.22,4.3,'#fff8e1');cyl(root,x,4.2,34,.35,.25,'#fac284');}
 box(root,0,4.45,34,7.8,1.25,.6,'#35a9b5',.25);const title=label('AQUA COAST',6.8,.75,'#35a9b5','#fff9e3',48);title.position.set(0,4.47,34.34);root.add(title);
 for(const x of [-13,13]){box(root,x,.7,34,3.4,1.3,1.5,'#71cdb9',.18);for(let i=0;i<4;i++)ball(root,x-1.2+i*.8,1.45,34,.58,.55,.55,i%2?'#76cdaa':'#9dddaf');}
 const kiosk=new T.Group();kiosk.position.set(-14,0,11.5);root.add(kiosk);box(kiosk,0,1.0,0,2.2,1.8,2,'#66b7bf');box(kiosk,0,2.25,0,2.6,.25,2.7,'#ffe6aa');for(let i=0;i<6;i++)box(kiosk,-1.05+i*.42,2.4,0,.42,.12,2.6,i%2?'#fff6da':'#ff9d87',.02);const ksign=label('PEARL CAFÉ',2.5,.5,'#fff7e1','#2b7180',36);ksign.position.set(0,1.8,1.05);kiosk.add(ksign);
 for(const x of [-14,14])for(const z of [19,25]){box(root,x,.7,z,1.3,.16,2.4,'#d3b08c');for(const zz of [-.8,.8])box(root,x,.4,z+zz,.9,.5,.13,'#f0dfba');box(root,x+(x<0?-.5:.5),1.1,z,.15,.7,2.4,'#d3b08c');}
 // Underwater reefs have real relief, sand patches, plants and caustic light.
 const seaDecor=new T.Group();scene.add(seaDecor);for(let i=0;i<36;i++){const x=Math.sin(i*12.29)*22,z=-4-(i*5.83)%34;const rock=ball(seaDecor,x,-2.7,z,.6+(i%3)*.22,.25+(i%4)*.12,.55,'#8dc3bd');rock.rotation.y=i;coral(seaDecor,x+.5,-2.65,z+.3,i,.6+(i%3)*.2);}
 for(let i=0;i<20;i++){const x=Math.sin(i*5.13)*23,z=-5-(i*3.78)%32;for(let j=0;j<3;j++){const plant=box(seaDecor,x+j*.13,-2.2,z,.07,1.1+(j%2)*.4,.18,j%2?'#46aa99':'#69bba4',.03);plant.rotation.z=(j-1)*.19;}}
 for(let i=0;i<16;i++)seaStar(seaDecor,Math.sin(i*7.3)*21,-2.72,-6-(i*4.7)%30,.6+i%3*.2,i%2?'#ffb56b':'#ee97cb');
 const buoyMat=mat('#ffbd83');for(let i=0;i<11;i++){const x=-25+i*5;ball(root,x,.03,-39.5,.23,.18,.23,buoyMat);}beam(root,[-25,.02,-39.5],[25,.02,-39.5],.025,'#fce9be');
 return {root,seaMat,bottomMat,update(t){seaMat.uniforms.time.value=t;bottomMat.uniforms.time.value=t;for(let i=0;i<animated.length;i++){animated[i].scale.setScalar(1+Math.sin(t*.6+i)*.025);}}};
}
export function makeTank(scene,def){const root=new T.Group();root.position.set(def.x,0,def.z);scene.add(root);const built=new T.Group(),blueprint=new T.Group();root.add(built,blueprint);const r=def.r;
 const shadow=softShadow(root,r*1.5,.16);cyl(built,0,.36,0,r+.27,.37,'#e7bb80');cyl(built,0,.60,0,r+.1,.18,def.color);ring(built,r+.12,.04,'#ffe7a0',0,.52);cyl(built,0,.72,0,r,.15,'#fff4d5');
 const glassMat=new T.MeshPhysicalMaterial({color:'#e3ffff',transparent:true,opacity:.08,metalness:0,roughness:.06,clearcoat:1,clearcoatRoughness:.05,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.8});
 const glass=mesh(new T.CylinderGeometry(r,r,3.2,64,1,true),glassMat,built,0,2.35,0);glass.castShadow=false;glass.renderOrder=5;
 const inner=mesh(new T.CylinderGeometry(r-.07,r-.07,2.65,48,1,true),new T.MeshPhysicalMaterial({color:'#1cbcd3',transparent:true,opacity:.12,roughness:.12,depthWrite:false,side:T.DoubleSide}),built,0,2.15,0);inner.castShadow=false;inner.renderOrder=3;
 const wm=waterMaterial('#49dfe4',.15),surface=mesh(new T.CircleGeometry(r-.055,64),wm,built,0,3.5,0);surface.rotation.x=-Math.PI/2;surface.castShadow=false;surface.renderOrder=4;
 const sand=mesh(new T.CircleGeometry(r-.07,48),mat('#f8dfa8'),built,0,.82,0);sand.rotation.x=-Math.PI/2;
 ring(built,r,.065,'#46c6c5',0,3.95);ring(built,r,.045,'#ffefd3',0,3.84);ring(built,r,.08,'#fff4db',0,.79);ring(built,r-.07,.026,'#cefff3',0,3.52);
 // Narrow specular ribbons make the transparent curved wall legible.
 for(const angle of [.4,2.2,2.65]){const p=[];for(let j=0;j<=12;j++){const a=angle+(j/12-.5)*.17;p.push(new T.Vector3(Math.sin(a)*(r+.012),.95+j/12*2.5,Math.cos(a)*(r+.012)));}const streak=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(p),16,.025,3,false),new T.MeshBasicMaterial({color:'#f6fff6',transparent:true,opacity:.48,depthWrite:false}));streak.renderOrder=6;built.add(streak);}
 for(let i=0;i<4;i++){const a=i*2.31;ball(built,Math.cos(a)*r*.55,.93,Math.sin(a)*r*.55,.4,.18,.32,'#b1c7b0');coral(built,Math.cos(a)*r*.7,.87,Math.sin(a)*r*.7,i,.6);}
 seaStar(built,-r*.3,.91,r*.5,.48,def.color);
 const plaque=label(def.name,3.1,.66,'#fff9e5','#2b6c7d',54);plaque.position.set(0,.72,r+.28);plaque.rotation.x=-.1;built.add(plaque);
 const number=label(String(def.number||SPECIES.indexOf(def)+1).padStart(2,'0'),.72,.45,'#f9b57d','#ffffff',52);number.position.set(-1.85,.78,r*.8);built.add(number);
 cyl(blueprint,0,.3,0,r+.15,.14,'#efdbb0');const dashed=new T.LineLoop(new T.BufferGeometry().setFromPoints(Array.from({length:80},(_,i)=>new T.Vector3(Math.cos(i/80*Math.PI*2)*r,.4,Math.sin(i/80*Math.PI*2)*r))),new T.LineDashedMaterial({color:'#caa169',dashSize:.28,gapSize:.19}));dashed.computeLineDistances();blueprint.add(dashed);
 const cross=label('+',1.7,1.7,'#f7dfa8','#ba996c',120);cross.rotation.x=-Math.PI/2;cross.position.y=.42;blueprint.add(cross);
 const bubbleGeo=new T.BufferGeometry(),bpos=new Float32Array(18*3);bubbleGeo.setAttribute('position',new T.BufferAttribute(bpos,3));const bubbles=new T.Points(bubbleGeo,new T.PointsMaterial({color:'#e3fff9',size:.06,transparent:true,opacity:.65,depthWrite:false}));built.add(bubbles);
 return {root,built,blueprint,water:wm,update(t,tank){built.visible=tank.built;blueprint.visible=!tank.built;wm.uniforms.time.value=t;for(let i=0;i<18;i++){bpos[i*3]=Math.sin(i*2.13)*r*.75;bpos[i*3+1]=.9+((t*.45+i*.29)%2.5);bpos[i*3+2]=Math.cos(i*3.17)*r*.75;}bubbleGeo.attributes.position.needsUpdate=true;}};
}
const colored=(geometry,color)=>{const g=geometry.clone();const a=new Float32Array(g.attributes.position.count*3),c=new T.Color(color);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(a,3));return g;};
export function fishPreviewGeometry(kind,rare=false){const g=fishGeometry(kind);if(rare){const colors=g.attributes.color,c=new T.Color(),tint=new T.Color(RARE_COLORS[kind]);for(let i=0;i<colors.count;i++){c.fromBufferAttribute(colors,i);const hi=Math.max(c.r,c.g,c.b),lo=Math.min(c.r,c.g,c.b);if(hi>.12&&hi-lo>.08)c.lerp(tint,.77);colors.setXYZ(i,c.r,c.g,c.b);}colors.needsUpdate=true;}return g;}
export class FishRenderer{
 constructor(scene){this.time={value:0};this.batches={};this.counts={};this.radii={};this.dummy=new T.Object3D();for(const s of SPECIES.flatMap(d=>[{...d,key:d.id,rare:false},{...d,key:d.id+':rare',rare:true}])){const m=new T.MeshPhysicalMaterial({vertexColors:true,roughness:s.rare?.16:.26,metalness:s.rare?.14:.03,emissive:s.rare?RARE_COLORS[s.id]:'#000000',emissiveIntensity:s.rare?.10:0,clearcoat:1,clearcoatRoughness:.17,iridescence:s.rare?1:['tang','butterfly'].includes(s.id)?.24:0,iridescenceIOR:1.25,side:T.DoubleSide});m.customProgramCacheKey=()=>'aqua-v3-'+s.key;m.onBeforeCompile=shader=>{shader.uniforms.swimTime=this.time;shader.vertexShader='uniform float swimTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nfloat phase=instanceMatrix[3].x*.53+instanceMatrix[3].z*.37;float tail=max(0.,-position.x-.18);transformed.z+=sin(swimTime*7.0+position.x*3.2+phase)*tail*tail*.18;${s.id==='ray'?'transformed.y+=sin(swimTime*3.2+abs(position.z)*2.8+phase)*pow(abs(position.z),1.6)*.18;':''}`);};const geometry=fishPreviewGeometry(s.id,s.rare);geometry.computeBoundingBox();const b=geometry.boundingBox;this.radii[s.id]=Math.hypot(Math.max(Math.abs(b.min.x),Math.abs(b.max.x)),Math.max(Math.abs(b.min.z),Math.abs(b.max.z)))+.18;const batch=new T.InstancedMesh(geometry,m,256);batch.instanceMatrix.setUsage(T.DynamicDrawUsage);batch.frustumCulled=false;batch.count=0;scene.add(batch);this.batches[s.key]=batch;}this.glints=new T.InstancedMesh(new T.OctahedronGeometry(1),new T.MeshBasicMaterial({color:'#fff0a2',toneMapped:false}),160);this.glints.count=0;this.glints.frustumCulled=false;scene.add(this.glints);this.sparkCount=0;}
 stockRadius(kind,radius,scale){return Math.max(.3,radius-this.radii[kind]*BY_ID[kind].size*scale-.25);}
 begin(t){this.time.value=t;for(const key of Object.keys(this.batches))this.counts[key]=0;this.sparkCount=0;}
 add(kind,x,y,z,heading,size=1,rare=false){const key=kind+(rare?':rare':''),i=this.counts[key]++;if(i>=256)return;this.dummy.position.set(x,y,z);this.dummy.rotation.set(0,heading,Math.sin(this.time.value*2+i)*.05);this.dummy.scale.setScalar(size*BY_ID[kind].size);this.dummy.updateMatrix();this.batches[key].setMatrixAt(i,this.dummy.matrix);
  if(rare)for(let n=0;n<2&&this.sparkCount<160;n++){const a=this.time.value*1.2+n*Math.PI+i*.8,r=size*BY_ID[kind].size*.9;this.dummy.position.set(x+Math.cos(a)*r,y+.32*size+Math.sin(a*1.7)*size*.2,z+Math.sin(a)*r*.45);this.dummy.rotation.set(0,a,a);this.dummy.scale.setScalar(size*.085*(.8+.2*Math.sin(a*4)));this.dummy.updateMatrix();this.glints.setMatrixAt(this.sparkCount++,this.dummy.matrix);}}
 end(){for(const key of Object.keys(this.batches)){this.batches[key].count=Math.min(this.counts[key],256);this.batches[key].instanceMatrix.needsUpdate=true;}this.glints.count=this.sparkCount;this.glints.instanceMatrix.needsUpdate=true;}
}
export function makePerson(scene,style=0,owner=false,staff=false){
 const root=new T.Group();scene.add(root);const rig=new T.Group();root.add(rig);const diver=owner||staff;
 const palette=['#ff8466','#46c3bf','#a48ae4','#ffc65e','#8acb73','#ef93c0','#67bce5','#4b8dba'],skin=['#f6d3a7','#e8af88','#bd805a','#8d5a40','#fbe0b6'][style%5],shirt=owner?'#ff7256':staff?'#31c8b6':palette[style%8];
 const dark='#225e78',mint='#a4f5d7',gold='#ffd36c';
 ball(rig,0,1.23,0,.40,.56,.28,shirt);box(rig,0,.71,0,.59,.30,.42,diver?dark:'#4b7693',.11);ball(rig,0,2.03,0,.38,.42,.34,skin);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*.4,1.57,0);rig.add(arm);beam(arm,[0,0,0],[side*.10,-.57,-.03],.108,shirt);ball(arm,0,-.03,0,.17,.18,.18,diver?mint:shirt);ball(arm,side*.10,-.65,-.03,.135,.15,.125,diver?dark:skin);
  if(diver){cyl(arm,side*.1,-.51,-.03,.126,.09,mint);box(arm,side*.10,-.67,-.135,.17,.13,.045,'#6de1d5',.03);if(side===-1){box(arm,-.11,-.42,-.13,.20,.20,.07,'#fff1bb',.04);box(arm,-.11,-.42,-.175,.13,.12,.02,'#3faabe',.02);}}
  arms.push(arm);
  const leg=new T.Group();leg.position.set(side*.18,LEG_HEIGHT,0);rig.add(leg);beam(leg,[0,0,0],[0,-.48,0],.118,diver?dark:'#5b7e9a');
  const shoe=diver?SHOES.diver:SHOES.guest;box(leg,0,shoe.y,shoe.z,shoe.width,shoe.height,shoe.depth,diver?'#ffbd48':'#fff6db',.07);
  if(diver){box(leg,0,-.27,-.11,.18,.22,.08,mint,.05);for(const xx of [-.075,0,.075])box(leg,xx,-.455,-.38,.023,.016,.42,'#fff2ae',.01);cyl(leg,0,-.43,0,.126,.06,'#6fe0d0');}
  legs.push(leg);
 }
 for(const side of [-1,1]){const ex=side*(diver?.17:.13),ey=diver?2.10:2.07,ez=diver?-.36:-.31;ball(rig,ex,ey,ez,.076,.085,.038,'#fffdf0');ball(rig,ex+.01,ey,ez-.035,.039,.047,.020,'#244d64');ball(rig,ex+.027,ey+.026,ez-.054,.014,.016,.008,'#ffffff');}
 ball(rig,0,1.95,-.35,.055,.065,.07,skin);
 if(diver){
  const hood=mesh(new T.SphereGeometry(.414,28,18,0,Math.PI),mat(dark,.42),rig,0,2.04,.02);hood.scale.set(1,1.05,.95);const crown=mesh(new T.SphereGeometry(.414,28,16,0,Math.PI*2,0,Math.PI*.40),mat(dark,.38),rig,0,2.04,.015);crown.scale.set(1,1.05,.96);beam(rig,[0,2.47,.06],[0,2.42,-.17],.044,mint);beam(rig,[0,2.42,-.17],[0,2.28,-.34],.04,mint);
  for(const x of [-.15,.15]){beam(rig,[x,2.37,.04],[x,2.33,.21],.035,mint);beam(rig,[x,2.33,.21],[x,2.19,.36],.035,mint);}
  box(rig,0,1.24,-.246,.43,.65,.11,'#ecffef',.12);box(rig,0,1.38,-.31,.20,.11,.035,'#3ac7bc',.03);box(rig,0,1.12,-.31,.24,.045,.035,gold,.02);
  box(rig,0,.80,0,.70,.15,.49,dark,.07);box(rig,0,.80,-.28,.18,.12,.07,gold,.03);
  for(const side of [-1,1]){
   beam(rig,[side*.27,1.66,-.16],[side*.21,.90,-.27],.041,dark);beam(rig,[side*.27,1.66,.12],[side*.22,.95,.23],.045,dark);
   const frame=mesh(new T.TorusGeometry(.171,.037,8,28),mat('#e8fff1',.22,.15),rig,side*.17,2.10,-.395);frame.scale.y=.84;
   const lens=mesh(new T.CircleGeometry(.142,32),new T.MeshPhysicalMaterial({color:'#86f8ef',transparent:true,opacity:.23,metalness:.05,roughness:.03,clearcoat:1,depthWrite:false,side:T.DoubleSide}),rig,side*.17,2.10,-.425);lens.scale.y=.84;lens.rotation.y=Math.PI;
   const glint=box(rig,side*.17-.035,2.15,-.433,.08,.018,.014,'#ffffff',.006);glint.rotation.z=.32;
  }
  box(rig,0,2.12,-.38,.08,.065,.06,dark,.02);beam(rig,[-.36,2.09,0],[.36,2.09,0],.035,dark);
  const regulator=cyl(rig,0,1.87,-.365,.10,.065,dark);regulator.rotation.x=Math.PI/2;const cap=cyl(rig,0,1.87,-.414,.073,.027,mint);cap.rotation.x=Math.PI/2;
  const hose=new T.CatmullRomCurve3([new T.Vector3(.04,1.87,-.39),new T.Vector3(.55,1.6,-.30),new T.Vector3(.58,1.67,.32),new T.Vector3(.2,1.91,.41)]);mesh(new T.TubeGeometry(hose,24,.035,7,false),mat(dark,.5),rig);
  box(rig,0,1.35,.29,.56,.88,.16,dark,.11);
  for(const x of [-.18,.18]){cyl(rig,x,1.41,.43,.153,.94,'#f1fff4');ball(rig,x,.95,.43,.153,.13,.153,'#4ecdbf');ball(rig,x,1.87,.43,.153,.10,.153,'#4ecdbf');for(const yy of [1.17,1.63])cyl(rig,x,yy,.43,.161,.075,gold);cyl(rig,x,1.98,.43,.047,.13,'#f7c356');beam(rig,[x-.07,2.04,.43],[x+.07,2.04,.43],.025,dark);}
  beam(rig,[.34,2.04,-.22],[.44,2.65,-.22],.045,'#ffd574');beam(rig,[.44,2.65,-.22],[.44,2.65,-.38],.05,shirt);
 }else{
  const hair=['#593f35','#b58340','#65524a','#d6a45b','#303f4d'][style%5];ball(rig,0,2.25,.025,.40,.25,.34,hair);
  if(style%5===1){ball(rig,.17,2.38,.26,.19,.18,.18,hair);ball(rig,.20,2.20,.36,.12,.23,.12,hair);}else if(style%5===2){for(let i=0;i<5;i++)ball(rig,Math.sin(i*1.7)*.27,2.27+Math.cos(i)*.06,.07+Math.cos(i*1.7)*.2,.16,.15,.15,hair);}
  if(style%4===0){cyl(rig,0,2.35,0,.48,.075,'#ffefbe');ball(rig,0,2.43,.02,.34,.18,.32,'#ffe0a0');cyl(rig,0,2.39,0,.345,.065,palette[(style+3)%8]);}
  if(style%3===0){box(rig,0,1.28,.30,.47,.57,.26,palette[(style+2)%8],.13);for(const side of [-1,1])beam(rig,[side*.26,1.65,-.1],[side*.2,1.0,-.23],.035,'#f8e4bf');}
  if(style%3===1){for(const yy of [1.08,1.27,1.46])box(rig,0,yy,-.265,.55,.045,.022,'#fff3d5',.01);}else{box(rig,.13,1.42,-.27,.12,.12,.035,'#fff0b9',.03);}
  const smile=mesh(new T.TorusGeometry(.09,.016,5,12,Math.PI*.75),mat('#8c5e4a'),rig,0,1.88,-.32);smile.rotation.z=Math.PI*1.1;
  if(style%6===3){for(const side of [-1,1])box(rig,side*.135,2.08,-.36,.20,.13,.055,'#356476',.04);box(rig,0,2.08,-.36,.08,.025,.03,'#f9e6bb');}
 }
 const net=new T.Group();rig.add(net);beam(net,[.5,1.03,-.1],[.85,1.75,-1.02],.035,'#fce4aa');const hoop=mesh(new T.TorusGeometry(.43,.035,8,32),mat('#60dbcc',.25,.1),net,.85,1.75,-1.02);hoop.rotation.x=.55;const netMesh=mesh(new T.SphereGeometry(.405,14,10,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:'#e8fff2',wireframe:true,transparent:true,opacity:.43,depthWrite:false}),net,.85,1.75,-1.02);netMesh.rotation.x=2.1;net.visible=diver;
 const combine=group=>{const children=group.children.filter(o=>o.isMesh&&o.material?.color&&!o.material.transparent);if(children.length<2)return;const geos=children.map(o=>{o.updateMatrix();let g=colored(o.geometry,o.material.color);g.applyMatrix4(o.matrix);return g.index?g.toNonIndexed():g;});const joined=mergeGeometries(geos);for(const o of children)group.remove(o);const m=new T.Mesh(joined,new T.MeshStandardMaterial({vertexColors:true,roughness:.55}));m.castShadow=true;m.receiveShadow=true;group.add(m);};if(!owner){combine(rig);arms.forEach(combine);legs.forEach(combine);}
 const bag=new T.Group();root.add(bag);mesh(new T.CylinderGeometry(.38,.38,1,14,8,true),new T.MeshBasicMaterial({color:'#efffe4',wireframe:true,transparent:true,opacity:.25,depthWrite:false}),bag);ring(bag,.38,.026,gold,0,.5);ring(bag,.38,.026,gold,0,-.5);
 const halo=ring(root,.73,.04,'#fff8ac',0,.05);halo.material=new T.MeshBasicMaterial({color:'#fff8b4',transparent:true,opacity:.85,depthWrite:false});halo.visible=owner;
 let marker=null;if(owner){const tag=label('你',.60,.34,'#fff1a5','#217a88',75);marker=new T.Sprite(new T.SpriteMaterial({map:tag.material.map,transparent:true,depthTest:false}));marker.scale.set(.60,.34,1);root.add(marker);}
 const shopping=new T.Group();root.add(shopping);const pouch=ball(shopping,.55,.78,-.1,.31,.36,.24,new T.MeshPhysicalMaterial({color:'#bcf5e7',transparent:true,opacity:.34,roughness:.08,clearcoat:1,depthWrite:false}));pouch.castShadow=false;const handle=mesh(new T.TorusGeometry(.16,.022,5,18),mat('#f4ffe6'),shopping,.55,1.15,-.1);
 const shadow=softShadow(root,.90,.19);
 return {root,rig,bag,net,shadow,marker,halo,update(actor,t,dt,locomotion=true){
  const pose=diver?shorePose(actor.z):{swim:0,feet:SHORE.deck+.01,tilt:0,lift:0},swim=pose.swim,water=swim>.5;
  root.position.set(actor.x,pose.feet,actor.z);let diff=actor.heading-root.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));root.rotation.y+=diff*(1-Math.exp(-dt*12));rig.rotation.x=pose.tilt;rig.position.y=pose.lift+Math.sin(t*2)*.025*swim;
  const speed=actor.moving&&locomotion?1:0,slope=actor.z>SHORE.rampStart&&actor.z<SHORE.rampEnd?Math.atan((SHORE.deck-SHORE.seaFeet)/(SHORE.rampEnd-SHORE.rampStart)):0;for(let i=0;i<2;i++){legs[i].rotation.x=Math.sin(t*(water?9:12)+i*Math.PI)*(.43*speed+.17*swim)-slope*Math.cos(root.rotation.y);legs[i].rotation.z=-slope*Math.sin(root.rotation.y);legs[i].position.y=LEG_HEIGHT+(swim===0?footLift(actor.z,pose.feet,root.rotation.y,legs[i].position.x,legs[i].rotation.x,legs[i].rotation.z,diver):0);arms[i].rotation.x=Math.sin(t*(water?5:12)+i*Math.PI)*.30*speed-.65*swim;}
  const count=typeof actor.bag==='object'?Object.values(actor.bag||{}).reduce((a,b)=>a+b,0):0,frame=cargoFrame(actor.z,count);bag.visible=count>0&&diver;bag.scale.y=frame.height;bag.rotation.x=frame.angle;bag.position.set(0,frame.y,frame.z);shopping.visible=typeof actor.bag==='string';
  if(locomotion&&actor.target!==null&&actor.target!==undefined){arms[1].rotation.x=-.7+Math.sin(t*8)*.22;net.rotation.z=Math.sin(t*9)*.15;net.rotation.x=-.25;}else{net.rotation.z=0;net.rotation.x=0;}
  halo.position.y=swim>.5?-.035-pose.feet:.045;shadow.visible=actor.z>SHORE.rampEnd;marker?.position.set(0,3.1*(1-swim)+1.76*swim,0);
 }};
}
