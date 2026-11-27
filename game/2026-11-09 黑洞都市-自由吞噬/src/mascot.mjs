import * as T from '../vendor/three.module.js';

const shapes=new Map();
function geometry(key,build){if(!shapes.has(key))shapes.set(key,build());return shapes.get(key);}
function armorGeometry(w,h,d){
 const key=`armor:${w}:${h}:${d}`;return geometry(key,()=>{
  const outline=[[-.4,.5],[.4,.5],[.52,.16],[.3,-.38],[0,-.54],[-.3,-.38],[-.52,.16]],pos=[],norm=[],cols=[];
  const front=outline.map(([x,y])=>new T.Vector3(x*w,y*h,d*.18)),back=outline.map(([x,y])=>new T.Vector3(x*w*.88,y*h,d*-.5)),fc=new T.Vector3(0,h*.05,d*.63),bc=new T.Vector3(0,0,-d*.5);
  function tri(a,b,c,color){const n=new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).normalize();const col=new T.Color(color);for(const v of[a,b,c]){pos.push(v.x,v.y,v.z);norm.push(n.x,n.y,n.z);cols.push(col.r,col.g,col.b);}}
  for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;tri(fc,front[j],front[i],['#1d2230','#101521','#252b3a','#111722','#202633','#0c101a','#161c29'][i]);tri(bc,back[i],back[j],'#101622');tri(front[i],front[j],back[j],'#111724');tri(front[i],back[j],back[i],'#111724');}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));return g;
 });
}
export function createMascot(color='#ac8bff',kind='plain',accent='#e0d4ff'){
 const root=new T.Group(),body=new T.Group(),head=new T.Group(),materials=[];root.add(body);head.position.set(0,3.63,0);body.add(head);
 const armor=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.34,metalness:.58});materials.push(armor);
 const mat=(c,alpha=1)=>{const m=new T.MeshBasicMaterial({color:c,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1,side:T.DoubleSide});materials.push(m);return m;};
 const voidMat=mat('#01030a'),energy=mat(color),white=mat('#ede7ff'),veil=mat(color,.28),metal=new T.MeshStandardMaterial({color:'#101622',roughness:.3,metalness:.6});materials.push(metal);
 function add(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;o.userData.shared=true;parent.add(o);return o;}
 function plate(parent,x,y,z,w,h,d,rz=0,rx=0){const o=add(parent,armorGeometry(w,h,d),armor,x,y,z);o.rotation.set(rx,0,rz);return o;}
 const sphere=(parent,x,y,z,r,m)=>add(parent,geometry('void-sphere'+r,()=>new T.SphereGeometry(r,28,20)),m,x,y,z);
 const torus=(parent,x,y,z,r,t,m)=>add(parent,geometry('void-ring'+r+':'+t,()=>new T.TorusGeometry(r,t,8,64)),m,x,y,z);
 const seam=(parent,x,y,z,w,h,d,material=energy,angle=0)=>{const o=add(parent,geometry(`seam:${w}:${h}:${d}`,()=>new T.BoxGeometry(w,h,d)),material,x,y,z);o.rotation.z=angle;return o;};
 // Angular torso, layered abdomen, hip plates and a separate back silhouette.
 plate(body,0,2.76,.02,1.17,1.1,.58);for(const sign of[-1,1])plate(body,sign*.28,2.93,.35,.48,.45,.16,-sign*.24);
 for(let n=0;n<3;n++)plate(body,0,2.41-n*.2,.13,.77-n*.075,.32,.43);
 plate(body,0,1.89,.01,.71,.39,.42);for(const sign of[-1,1])plate(body,sign*.41,1.92,-.03,.43,.52,.27,-sign*.4);
 const back=plate(body,0,2.79,-.34,1.05,.91,.22);back.rotation.y=Math.PI;seam(body,0,2.77,-.49,.025,.67,.02);for(const sign of[-1,1])seam(body,sign*.23,2.98,-.44,.024,.34,.022,energy,-sign*.66);
 add(body,geometry('neck',()=>new T.CylinderGeometry(.11,.14,.28,8)),metal,0,3.23,0);plate(body,0,3.18,0,.48,.28,.41);
 // The head has no face at all: a light-absorbing singularity with a tilted accretion disk.
 const core=sphere(head,0,0,0,.355,voidMat);
 const halo=torus(head,0,0,0,.43,.023,white);halo.rotation.set(1.2,0,.24);
 const disk=add(head,geometry('head-disk',()=>new T.RingGeometry(.405,.64,80)),veil);disk.rotation.copy(halo.rotation);
 const orbit=torus(head,0,0,0,.6,.012,energy);orbit.rotation.copy(halo.rotation);
 const lens=torus(head,0,0,-.025,.395,.012,energy);lens.scale.set(1,1.13,1);
 const arc=add(head,geometry('lensing-arc',()=>new T.TorusGeometry(.48,.007,6,64,Math.PI*1.55)),veil,0,.03,0);arc.rotation.z=.6;
 // A small chest singularity and two asymmetric energy arcs echo the approved concept.
 const chestCore=sphere(body,0,2.84,.45,.19,voidMat),chestHalo=torus(body,0,2.84,.53,.22,.018,energy);
 const chestArc=add(body,geometry('chest-swirl',()=>new T.TorusGeometry(.28,.009,6,40,Math.PI*1.55)),white,0,2.84,.53);chestArc.rotation.z=.8;
 const arms=[],forearms=[],legs=[],shins=[],wrists=[];
 for(const sign of[-1,1]){
  const arm=new T.Group();arm.position.set(sign*.7,3.02,0);body.add(arm);arms.push(arm);
  plate(arm,sign*.09,.03,-.01,.74,.53,.39,-sign*.3);plate(arm,sign*.05,-.34,0,.32,.58,.29,-sign*.08);sphere(arm,0,-.72,0,.135,metal);
  const fore=new T.Group();fore.position.y=-.74;arm.add(fore);forearms.push(fore);plate(fore,0,-.3,.025,.35,.65,.35,sign*.08);seam(fore,sign*.07,-.3,.23,.023,.36,.018,energy,-sign*.17);
  plate(fore,0,-.78,.01,.22,.25,.18);for(let n=0;n<3;n++)seam(fore,(n-1)*.054,-.94,.07,.035,.16,.07,metal);
  const wrist=torus(fore,0,-.67,.02,.23,.011,energy);wrist.rotation.x=1.25;wrists.push(wrist);
  const leg=new T.Group();leg.position.set(sign*.25,1.77,0);body.add(leg);legs.push(leg);plate(leg,0,-.36,.01,.4,.84,.36,sign*.035);seam(leg,sign*.1,-.32,.24,.025,.42,.016,energy,-sign*.13);sphere(leg,0,-.82,0,.135,metal);
  const shin=new T.Group();shin.position.y=-.84;leg.add(shin);shins.push(shin);plate(shin,0,-.35,.045,.33,.74,.31);plate(shin,0,-.82,.16,.35,.24,.56);seam(shin,sign*.08,-.36,.23,.02,.34,.018,energy,sign*.1);
 }
 const fragments=new T.Group();body.add(fragments);for(let n=0;n<5;n++){const m=add(fragments,geometry('obsidian-fragment',()=>new T.OctahedronGeometry(.09)),metal,(n%2?1:-1)*(.8+n*.045),2.1+n*.21,.1+Math.sin(n)*.3);m.rotation.set(n,n*.7,n*.4);}
 const extra=torus(head,0,0,0,.7,.011,energy);extra.rotation.set(.35,.7,-.25);extra.visible=kind==='orbit'||kind==='royal';
 if(kind==='royal'){for(let n=0;n<6;n++){const a=n*Math.PI/3;const gem=add(head,geometry('crown-shard',()=>new T.OctahedronGeometry(.055)),energy,Math.cos(a)*.62,Math.sin(a)*.12,Math.sin(a)*.48);gem.scale.y=1.6;}}
 root.userData.kind=kind;return{root,body,head,core,halo,disk,orbit,lens,arc,chestCore,chestHalo,chestArc,arms,forearms,legs,shins,wrists,fragments,extra,materials,color,kind};
}
export function poseMascot(m,time,{moving=false,chew=0,steer=0,power=false,hurt=false,win=false}={}){
 const stride=moving?Math.sin(time*9):0;m.body.position.y=moving?Math.abs(Math.sin(time*18))*.025:Math.sin(time*1.6)*.018;m.body.rotation.z=-steer*.012;m.body.rotation.y=-steer*.015;m.body.rotation.x=moving?.045:0;
 m.arms.forEach((a,i)=>{a.rotation.x=(i===0?-1:1)*stride*.38-.1;a.rotation.z=(i===0?-.12:.12);});m.forearms.forEach((a,i)=>a.rotation.x=-.22+Math.max(0,(i===0?1:-1)*stride)*-.25);
 m.legs.forEach((l,i)=>l.rotation.x=(i===0?1:-1)*stride*.36);m.shins.forEach((l,i)=>l.rotation.x=Math.max(0,(i===0?-1:1)*stride)*.35);
 const pulse=1+chew*.11+(power?Math.sin(time*12)*.03:0);m.core.scale.setScalar(pulse);m.halo.scale.setScalar(pulse);m.disk.rotation.z=.24+Math.sin(time*.45)*.08;m.halo.rotation.copy(m.disk.rotation);m.orbit.rotation.copy(m.disk.rotation);m.arc.rotation.z=time*.16;m.extra.rotation.y=time*.25;
 m.chestHalo.scale.setScalar(1+chew*.2);m.chestArc.rotation.z=time*(power?3:.7);m.fragments.children.forEach((o,i)=>{o.position.y=2.1+i*.21+Math.sin(time*1.7+i)*.04;o.rotation.y+=.003;});m.wrists.forEach((w,i)=>w.rotation.z=time*(i===0?.6:-.6));
 if(win)m.body.rotation.y=Math.sin(time*.7)*.1;m.root.visible=!hurt||Math.sin(time*28)>-.65;
}

export function portalTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(128,128,2,128,128,128);
 g.addColorStop(0,'#050c25');g.addColorStop(.4,'#14123f');g.addColorStop(.75,'#163d68');g.addColorStop(1,'#111b38');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
 ctx.lineCap='round';for(let arm=0;arm<3;arm++){ctx.beginPath();for(let n=0;n<170;n++){const f=n/170,a=f*Math.PI*4+arm*Math.PI*2/3,r=5+f*119;const x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;if(n===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle=['#58cde3b0','#ae96fbb0','#6ceac890'][arm];ctx.lineWidth=3;ctx.stroke();}
 for(let n=0;n<30;n++){const a=n*2.399,r=20+(n*37)%102;ctx.fillStyle=n%3?'#97cfffd0':'#fff8ccaa';ctx.beginPath();ctx.arc(128+Math.cos(a)*r,128+Math.sin(a)*r,n%4===0?1.6:.8,0,Math.PI*2);ctx.fill();}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.center.set(.5,.5);return texture;
}

let thumbnails=null;
export function mascotThumbnails(looks){
 if(thumbnails)return thumbnails;thumbnails=new Map();const canvas=document.createElement('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(384,264);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff9ef','#a5c4d1',2));const light=new T.DirectionalLight('#ffffff',2.4);light.position.set(-3,6,5);scene.add(light);const camera=new T.PerspectiveCamera(32,384/264,.1,40);camera.position.set(3.6,3.4,8);camera.lookAt(0,2.05,0);
 for(const look of looks){const mascot=createMascot(look.color,look.kind,look.accent);scene.add(mascot.root);poseMascot(mascot,.4);renderer.render(scene,camera);thumbnails.set(look.id,canvas.toDataURL('image/png'));scene.remove(mascot.root);for(const m of mascot.materials)m.dispose();}
 renderer.dispose();return thumbnails;
}
