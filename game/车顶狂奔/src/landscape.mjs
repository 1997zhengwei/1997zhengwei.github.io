import * as T from '../vendor/three.module.js';
import {random} from './math.mjs';
import {roadX,roadSlope} from './courses.mjs';
const color=(hex,roughness=1)=>new T.MeshStandardMaterial({color:hex,roughness});
function cliffGeometry(seed,mesa=false){
 const r=random(seed),n=7,vertices=[],faces=[],shades=[],base=[];
 for(let i=0;i<n;i++)base.push(.78+r()*.34);
 for(let ring=0;ring<4;ring++)for(let i=0;i<n;i++){const a=i*Math.PI*2/n,rad=base[i]*(mesa?[1.10,.97,.87,.84][ring]:[1.08,1,.66,.25][ring]);vertices.push(Math.cos(a)*rad+(ring===3?.13:0),[0,.33,.76,1][ring],Math.sin(a)*rad);}
 for(let ring=0;ring<3;ring++)for(let i=0;i<n;i++){const j=(i+1)%n,a=ring*n+i,b=ring*n+j,c=(ring+1)*n+i,d=(ring+1)*n+j;faces.push(a,c,b,b,c,d);}
 for(let i=1;i<n-1;i++)faces.push(3*n,3*n+i+1,3*n+i);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(faces);const flat=g.toNonIndexed(),positions=flat.attributes.position;
 for(let i=0;i<positions.count;i++){const h=positions.getY(i),band=(Math.floor(h*18)%5===0?.90:1),f=(.94+Math.floor(i/3)%7*.012)*band;shades.push(f,f*(.985+h*.016),f*(.94+h*.045));}
 flat.setAttribute('color',new T.Float32BufferAttribute(shades,3));flat.computeVertexNormals();g.dispose();return flat;
}
function ribbon(c,side){
 const positions=[],indices=[],colors=[],r=random(c.seed+side+90),n=Math.ceil((c.roadEnd+60)/8);
 for(let i=0;i<=n;i++){const s=-60+i*8,x=roadX(c,s),h=.18+r()*.72,w=3+r()*3;positions.push(x+side*c.width/2,0,-s,x+side*(c.width/2+w),h,-s);colors.push(1,1,1,.91,.94,.95);if(i<n){const k=i*2;if(side===1)indices.push(k,k+1,k+2,k+1,k+3,k+2);else indices.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function landscape(scene){
 const c=scene.course,r=random(c.seed+79),groups=[[],[],[]],chips=[],trees=[],treeSnow=[],treeWood=[],cactus=[],arms=[],ruts=[];
 const rockMat=scene.m.rock.clone();rockMat.vertexColors=true;rockMat.flatShading=true;
 for(let s=-40;s<c.length+130;s+=20)for(const side of[-1,1]){
  const width=5+r()*10,h=c.world===1?20+r()*30:7+r()*24,x=roadX(c,s)+side*(c.width/2+width+5+r()*18),type=Math.floor(r()*3);
  groups[type].push({x,y:c.world===1?-20:-.18,z:-s,sx:width,sy:h,sz:6+r()*13,ry:r()*6.28,rz:(r()-.5)*.08});
  for(let i=0;i<5;i++)chips.push({x:roadX(c,s)+side*(c.width/2+2+r()*8),y:.12,z:-s+r()*16,sx:.12+r()*.42,sy:.1+r()*.35,sz:.13+r()*.4,ry:r()*6});
  if(c.world===0&&r()>.58){const tx=roadX(c,s)+side*(c.width/2+3.2+r()*6),h=1.8+r()*2.6;cactus.push({x:tx,y:h/2,z:-s,sx:.22,sy:h/2,sz:.22});for(const sign of[-1,1]){arms.push({x:tx+sign*.32,y:h*.53,z:-s,rz:sign*Math.PI/2,sx:.13,sy:.42,sz:.13});arms.push({x:tx+sign*.64,y:h*.66,z:-s,sx:.13,sy:h*.18,sz:.13});}}
  if(c.world===2){for(let j=0;j<2;j++){const tx=roadX(c,s)+side*(c.width/2+3+r()*16),ts=s+r()*14,h=5+r()*7;treeWood.push({x:tx,y:h*.34,z:-ts,sx:.17,sy:h*.67,sz:.17});for(let k=0;k<4;k++){const a=1-k*.18;trees.push({x:tx,y:h*(.27+k*.20),z:-ts,sx:h*.24*a,sy:h*.43*a,sz:h*.24*a});treeSnow.push({x:tx,y:h*(.29+k*.20),z:-ts,sx:h*.21*a,sy:h*.40*a,sz:h*.21*a});}}}
 }
 groups.forEach((transforms,i)=>scene.instanced(cliffGeometry(407+i*31,i!==2),rockMat,transforms,true));
 scene.instanced(new T.DodecahedronGeometry(1,0),scene.m.rockDark,chips,false);
 if(c.world!==1)for(const side of[-1,1]){const mat=color(c.world===2?'#e5eff2':'#dcae63');mat.vertexColors=true;const edge=new T.Mesh(ribbon(c,side),mat);edge.receiveShadow=true;scene.root.add(edge);}
 // Foreground wheel tracks make motion legible against the clean, broad ground shapes.
 if(c.world!==1){for(let s=-30;s<c.roadEnd;s+=10)for(let lane=0;lane<c.lanes;lane++)for(const side of[-1,1])ruts.push({x:roadX(c,s)+(lane-(c.lanes-1)/2)*4.35+side*1.3,y:.021,z:-s,ry:-Math.atan(roadSlope(c,s)),sx:.16,sy:.003,sz:10.1});const mat=color(c.world===2?'#a7bec7':'#be934f');mat.transparent=true;mat.opacity=.20;mat.depthWrite=false;scene.instanced(new T.BoxGeometry(1,1,1),mat,ruts,false);}
 if(cactus.length){const mat=color('#6b8b71');scene.instanced(new T.CapsuleGeometry(1,1,3,7),mat,cactus,true);scene.instanced(new T.CapsuleGeometry(1,1,3,7),mat,arms,true);}
 if(trees.length){scene.instanced(new T.CylinderGeometry(1,1,1,6),color('#697b78'),treeWood,true);scene.instanced(new T.ConeGeometry(1,1,8),color('#386875'),trees,true);scene.instanced(new T.ConeGeometry(1,1,8),color('#ecf6f7'),treeSnow,true);}
 buildRidges(scene,r);
 if(c.world===1)buildBridgeFrames(scene);
 else if(c.world===2)buildSnowFlags(scene);
}
function buildRidges(scene,r){
 const c=scene.course;
 for(const side of[-1,1])for(let layer=0;layer<2;layer++){
  const positions=[],faces=[],colors=[],steps=18;
  for(let i=0;i<=steps;i++){const s=-150+i*(c.length+450)/steps,x=side*(105+layer*95),height=27+r()*65+layer*9;positions.push(x,-18,-s,x,height,-s,x+side*85,height*.43,-s);for(let k=0;k<3;k++){const f=c.world===2&&k===1?1:.77;colors.push(f,f,f);}}
  for(let i=0;i<steps;i++){const k=i*3;faces.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(faces);g.computeVertexNormals();const mat=color(c.world===2?'#c4e0e7':c.world===1?'#ad7f69':'#c1b087');mat.vertexColors=true;mat.side=T.DoubleSide;const mesh=new T.Mesh(g,mat);scene.root.add(mesh);
 }
}
function buildBridgeFrames(scene){
 const c=scene.course,m=scene.m,beams=[];
 const span=(a,b,width,depth=width)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),o=new T.Object3D();o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());o.scale.set(width,d.length(),depth);o.updateMatrix();beams.push(o.matrix.clone());};
 for(const s of[120,355,590,825].filter(s=>s<c.length-75)){
  const x=roadX(c,s),z=-s,half=c.width/2+3;
  scene.box(c.width+10,1,4.5,m.concrete,x,-.5,z);
  for(const side of[-1,1]){scene.box(2.2,15,3.2,m.concrete,x+side*half,7.5,z);scene.box(3.1,25,4,m.concrete,x+side*half,-12.5,z);scene.box(2.25,.45,3.25,m.white,x+side*half,3.2,z);scene.box(2.28,.40,3.28,m.white,x+side*half,13.4,z);span([x+side*half,14,z],[x,28,z],1.3,1.6);for(const dz of[-1,1]){const anchorS=s-dz*18,anchorX=roadX(c,anchorS)+side*(c.width/2-.55);span([x+side*half,13.8,z+dz*1.2],[anchorX,.75,-anchorS],.22);scene.box(.45,1.0,.65,m.metal,anchorX,.45,-anchorS);}}
  scene.box(c.width+6,.45,1.3,m.metal,x,15.3,z);scene.box(1.9,1.9,2.0,m.white,x,27.5,z);
 }
 for(let s=0;s<c.roadEnd;s+=30){const x=roadX(c,s);for(const side of[-1,1]){const sx=x+side*(c.width/2-.7);span([sx,-.5,-s],[sx,-4.5,-s-15],.20);span([sx,-4.5,-s-15],[sx,-.5,-s-30],.20);span([sx,-4.5,-s],[sx,-4.5,-s-30],.22);}}
 const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),m.metal,beams.length);beams.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.castShadow=true;mesh.receiveShadow=true;scene.root.add(mesh);
}
function buildSnowFlags(scene){
 const c=scene.course,flagMat=color('#447e9c',.6);for(let s=80;s<c.length-60;s+=80)for(const side of[-1,1]){const x=roadX(c,s)+side*(c.width/2+1.2);scene.box(.09,3.2,.09,scene.m.metal,x,1.6,-s);scene.box(.75,.45,.035,flagMat,x+side*.34,2.70,-s);scene.box(.74,.13,.045,scene.m.white,x+side*.34,2.76,-s);}
}
