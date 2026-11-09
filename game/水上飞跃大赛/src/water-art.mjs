import * as T from '../vendor/three.module.js';
import {frameAt,pointAt} from './track.mjs';
import {mergeStatic} from './geometry.mjs';

export const material=(color,extra={})=>new T.MeshPhysicalMaterial({color,roughness:.42,metalness:0,clearcoat:.32,clearcoatRoughness:.3,...extra});
export function add(parent,geometry,mat,x=0,y=0,z=0){const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function textSprite(text,color='#ffffff',width=512){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=100;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 46px Microsoft YaHei,Arial,sans-serif';ctx.lineJoin='round';ctx.lineWidth=9;ctx.strokeStyle='#143469';ctx.strokeText(text,width/2,52);ctx.fillStyle=color;ctx.fillText(text,width/2,50);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:true}));sprite.scale.set(5.4,1.05,1);return sprite;
}
export function skyTexture(id){
 const c=document.createElement('canvas');c.width=512;c.height=1024;const ctx=c.getContext('2d'),warm=id!=='reef',g=ctx.createLinearGradient(0,0,0,1024);
 g.addColorStop(0,warm?'#f3a9b8':'#64bde9');g.addColorStop(.28,warm?'#ffd1ad':'#b7e5f5');g.addColorStop(1,warm?'#fff3d0':'#f0fcff');ctx.fillStyle=g;ctx.fillRect(0,0,512,1024);
 const sun=ctx.createRadialGradient(385,115,0,385,115,210);sun.addColorStop(0,warm?'rgba(255,248,201,.95)':'rgba(255,255,246,.8)');sun.addColorStop(.28,'rgba(255,244,214,.35)');sun.addColorStop(1,'rgba(255,230,215,0)');ctx.fillStyle=sun;ctx.fillRect(0,0,512,500);
 const clouds=[[.12,.07,.13],[.66,.10,.18],[.96,.22,.17],[.23,.24,.20],[.55,.43,.24],[.06,.61,.20],[.86,.72,.27]];
 for(let i=0;i<clouds.length;i++){const [x,y,size]=clouds[i];for(let n=0;n<7;n++){const cx=x*512+(n-3)*size*130,cy=y*1024+Math.sin(n*1.8+i)*size*65,rx=size*(230+Math.sin(n*2)*30),ry=rx*.65;ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);const puff=ctx.createRadialGradient(-.1,-.3,.1,0,0,1);puff.addColorStop(0,warm?'rgba(255,241,199,.75)':'rgba(255,255,248,.8)');puff.addColorStop(.6,warm?'rgba(255,220,181,.48)':'rgba(239,252,255,.45)');puff.addColorStop(1,'rgba(255,225,196,0)');ctx.fillStyle=puff;ctx.fillRect(-1,-1,2,2);ctx.restore();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
export function environment(renderer){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#87d6ff');g.addColorStop(.46,'#ffffff');g.addColorStop(.55,'#c8f5ff');g.addColorStop(1,'#317f9c');x.fillStyle=g;x.fillRect(0,0,512,256);x.fillStyle='#ffffff';x.fillRect(70,25,70,70);const t=new T.CanvasTexture(c);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.SRGBColorSpace;const pm=new T.PMREMGenerator(renderer),target=pm.fromEquirectangular(t);pm.dispose();t.dispose();return target;}
export function waterMaterial(track){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;const ctx=canvas.getContext('2d');ctx.fillStyle=track.id==='reef'?'#248cd1':'#3c89d0';ctx.fillRect(0,0,512,1024);
 for(let n=-1;n<=5;n++){
  const phase=n*Math.PI*.5,center=x=>n*256+Math.sin(x/512*Math.PI*2+phase)*24+Math.sin(x/512*Math.PI*6-phase)*6;
  ctx.beginPath();for(let x=0;x<=512;x+=4){const y=center(x);if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}for(let x=512;x>=0;x-=4)ctx.lineTo(x,center(x)+92+Math.sin(x/512*Math.PI*2-phase)*13);ctx.closePath();ctx.fillStyle=n%2?'#42bdb6':'#38abc8';ctx.fill();
  if(n%2===0){ctx.beginPath();for(let x=0;x<=512;x+=4){const y=center(x)+5;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle='rgba(198,255,245,.18)';ctx.lineWidth=3;ctx.stroke();}
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=T.ClampToEdgeWrapping;texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
 const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=128;const normalCtx=normalCanvas.getContext('2d'),pixels=normalCtx.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const u=x/128*Math.PI*2,v=y/128*Math.PI*2,nx=(Math.cos(u*3+v*2)*.6+Math.cos(u*5-v*4)*.28)*.3,ny=(Math.sin(v*3-u*2)*.6+Math.cos(v*5+u*4)*.28)*.3,index=(y*128+x)*4;pixels.data[index]=(nx*.5+.5)*255;pixels.data[index+1]=(ny*.5+.5)*255;pixels.data[index+2]=(Math.sqrt(1-nx*nx-ny*ny)*.5+.5)*255;pixels.data[index+3]=255;}
 normalCtx.putImageData(pixels,0,0);const normalTexture=new T.CanvasTexture(normalCanvas);normalTexture.wrapS=normalTexture.wrapT=T.RepeatWrapping;normalTexture.repeat.set(3,2);
 const mat=new T.MeshPhysicalMaterial({color:'#ffffff',map:texture,normalMap:normalTexture,normalScale:new T.Vector2(.13,.18),roughness:.25,metalness:0,ior:1.33,clearcoat:.65,clearcoatRoughness:.19,side:T.FrontSide});return{material:mat,texture,normalTexture};
}
export function oceanMaterial(track){return new T.ShaderMaterial({uniforms:{time:{value:0},fogColor:{value:new T.Color(track.id==='reef'?'#bde6f1':'#f7ceb0')},coastCenter:{value:new T.Vector2(track.resort.x,track.resort.z)},coastSize:{value:new T.Vector2(track.id==='lagoon'?86:track.resort.rx*1.04,track.id==='lagoon'?75:track.resort.rz*1.07)}},transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`uniform float time;uniform vec3 fogColor;uniform vec2 coastCenter;uniform vec2 coastSize;varying vec3 vWorld;
 void main(){vec2 p=vWorld.xz;float shore=1.-smoothstep(.9,1.6,length((p-coastCenter)/coastSize));float wave=sin(p.x*.085+sin(p.y*.12)*1.5-time*.7)+sin(p.y*.14+sin(p.x*.07)*2.+time*.45);float foam=pow(max(0.,sin(p.y*.22+sin(p.x*.15)*1.7-time*.7)),24.)*.025;vec3 farSea=vec3(.018,.28,.68),shallow=vec3(.025,.7,.79);vec3 col=mix(farSea,shallow,shore*.7)+wave*.012+foam;float haze=smoothstep(170.,650.,length(cameraPosition-vWorld));col=mix(col,fogColor,haze*.5);gl_FragColor=vec4(col,1.-haze);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});}
function coastShape(rx,rz,seed=0){const shape=new T.Shape();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,r=1+Math.sin(a*3+seed)*.055+Math.sin(a*7+.7)*.024,x=Math.cos(a)*rx*r,z=Math.sin(a)*rz*r;if(i===0)shape.moveTo(x,z);else shape.lineTo(x,z);}return shape;}
function island(parent,rx,rz,y,color,seed=0){const geo=new T.ExtrudeGeometry(coastShape(rx,rz,seed),{depth:2.2,bevelEnabled:true,bevelSize:1.6,bevelThickness:.8,bevelSegments:2,curveSegments:1});const o=add(parent,geo,material(color),0,y,0);o.rotation.x=Math.PI/2;return o;}
function frondGeometry(){const pts=[],steps=12,length=4.2;for(let i=0;i<=steps;i++){const t=i/steps,width=Math.sin(Math.PI*t)*.58*(i%2?.75:1),z=t*length;pts.push(new T.Vector3(-width,Math.sin(t*Math.PI)*.4-t*t*.7,z));}for(let i=steps;i>=0;i--){const t=i/steps,width=Math.sin(Math.PI*t)*.58*(i%2?.75:1);pts.push(new T.Vector3(width,Math.sin(t*Math.PI)*.4-t*t*.7,t*length));}const positions=[],uv=[];for(let i=1;i<pts.length-1;i++)for(const p of[pts[0],pts[i],pts[i+1]]){positions.push(p.x,p.y,p.z);uv.push(p.x,p.z);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();return geo;}
export function palm(parent,x,y,z,scale=1,angle=0){const group=new T.Group();group.position.set(x,y,z);group.scale.setScalar(scale);group.rotation.y=angle;parent.add(group);const wood=material('#b57837',{roughness:.85}),leafA=material('#279b35',{side:T.DoubleSide,roughness:.7}),leafB=material('#49bf35',{side:T.DoubleSide,roughness:.75});const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.3,3.7,0),new T.Vector3(1.15,7.1,.2)]);add(group,new T.TubeGeometry(curve,12,.23,8,false),wood);for(let i=0;i<7;i++){const a=i*Math.PI*2/7,leaf=add(group,frondGeometry(),i%2?leafA:leafB,1.15,7.15,.2);leaf.rotation.y=a;}for(let i=0;i<3;i++)add(group,new T.SphereGeometry(.25,10,8),wood,1+Math.cos(i*2)*.35,6.8,Math.sin(i*2)*.35);mergeStatic(group);return group;}
export function umbrella(parent,x,y,z,color='#ff4978',scale=1){const group=new T.Group();group.position.set(x,y,z);group.scale.setScalar(scale);parent.add(group);const a=material(color),b=material('#ffffff'),wood=material('#f2bd6c');for(let i=0;i<10;i++){const canopy=add(group,new T.ConeGeometry(2.4,.85,1,1,true,i*Math.PI/5,Math.PI/5),i%2?a:b,0,3.5,0);canopy.material.side=T.DoubleSide;}add(group,new T.CylinderGeometry(.055,.07,3.5,8),wood,0,1.75,0);mergeStatic(group);return group;}
function lounger(parent,x,y,z,angle=0,color='#ff6396'){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);const white=material('#ffffff'),cloth=material(color);add(g,new T.BoxGeometry(1.4,.18,2.7),cloth,0,.7,0);const back=add(g,new T.BoxGeometry(1.4,.16,1.5),cloth,0,1.15,-1.6);back.rotation.x=-.5;for(const side of[-.55,.55])for(const end of[-.9,.9])add(g,new T.CylinderGeometry(.055,.055,.65,7),white,side,.33,end);mergeStatic(g);}
export function buildResort(world,track){
 const {x,z,rx,rz}=track.resort,sx=rx/83,sz=rz/70,terrain=new T.Group();terrain.position.set(x,0,z);world.add(terrain);island(terrain,rx,rz,-.3,'#ffe59b',track.seed);island(terrain,rx*68/83,rz*56/70,.28,'#66d85b',track.seed);
 const poolGroup=new T.Group(),end=frameAt(track,track.length);poolGroup.position.set(end.x+end.tx*13,0,end.z+end.tz*13);poolGroup.rotation.y=Math.atan2(end.tx,end.tz);world.add(poolGroup);
 add(poolGroup,new T.BoxGeometry(37,1.2,43),material('#ffffff'),0,.1,0);add(poolGroup,new T.BoxGeometry(32,.14,38),material('#08a8ec',{roughness:.18,clearcoat:1}),0,.79,0);
 for(let n=0;n<6;n++){lounger(poolGroup,21,.4,-16+n*6,Math.PI/2,n%2?'#ff4d85':'#08a9f3');if(n%2===0)umbrella(poolGroup,25,.4,-15+n*6,track.color);}
 for(let i=0;i<17;i++){const a=i*Math.PI*2/17,x=Math.cos(a)*[63,68,60][i%3],z=Math.sin(a)*[52,55,57][i%3];palm(terrain,x*sx,.8,z*sz,.8+(i%4)*.13,a);if(i%3===0){umbrella(terrain,x*1.14*sx,.3,z*1.1*sz,track.color,.8);lounger(terrain,x*1.13*sx,.25,(z*1.1+3)*sz,a,track.color);}}
 const rock=material('#e6bf89',{roughness:.9});for(let i=0;i<24;i++){const a=i*Math.PI/12,r=1+(i%3)*.08,o=add(terrain,new T.DodecahedronGeometry(1.7,0),rock,Math.cos(a)*77*r*sx,-.2,Math.sin(a)*63*r*sz);o.scale.set(1.4,1,1.1);o.rotation.set(i,.3*i,.2);}
 for(let i=0;i<7;i++){const x=-57+i*17,z=-44-Math.sin(i)*4,group=new T.Group();group.position.set(x*sx,.8,z*sz);group.rotation.y=(i-3)*.09;terrain.add(group);add(group,new T.BoxGeometry(8,5,6),material(i%2?'#fff8e3':'#ffeeab'),0,2.5,0);const roof=add(group,new T.ConeGeometry(6.4,2.2,4),material('#eb6d42',{roughness:.8}),0,6,0);roof.rotation.y=Math.PI/4;add(group,new T.BoxGeometry(2.1,3.3,.15),material('#1996bf',{metalness:.2,roughness:.2}),0,1.7,3.08);for(const side of[-2.4,2.4])add(group,new T.BoxGeometry(1.5,1.5,.15),material('#2cb7d9'),side,3,3.08);mergeStatic(group);}
 const start=frameAt(track,0),deck=new T.Group();deck.position.set(start.x,start.y-.35,start.z);deck.rotation.y=Math.atan2(start.tx,start.tz);world.add(deck);const wood=material('#cb8a43',{roughness:.75}),wood2=material('#b56b32',{roughness:.85}),rail=material('#f8c66c');
 for(const side of[-1,1]){
  add(deck,new T.BoxGeometry(7.2,.65,35),wood,side*9.1,0,14);for(let n=0;n<36;n++)add(deck,new T.BoxGeometry(7.2,.035,.07),wood2,side*9.1,.35,n-3.5);
  for(let n=0;n<8;n++)add(deck,new T.BoxGeometry(.13,1.5,.13),rail,side*12.6,1.05,n*5-3);add(deck,new T.BoxGeometry(.14,.14,35),rail,side*12.6,1.8,14);
  for(let n=0;n<3;n++)palm(deck,side*12,.35,n*13+1,.56,side*.5+n);
  umbrella(deck,side*8,.35,20,track.accent,.65);lounger(deck,side*8,.35,24,side*.3,track.color);
 }
 
 mergeStatic(deck);
}
