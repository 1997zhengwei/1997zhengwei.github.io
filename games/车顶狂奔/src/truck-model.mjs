import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
const O=new T.Object3D();
function prism(width,profile){
 const vertices=[],indices=[],n=profile.length,contour=profile.map(([s,y])=>new T.Vector2(s,y));
 for(const x of[-width/2,width/2])for(const [s,y]of profile)vertices.push(x,y,-s);
 for(const [a,b,c]of T.ShapeUtils.triangulateShape(contour,[])){indices.push(a,c,b,n+a,n+b,n+c);}
 for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,j,n+i,j,n+j,n+i);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function truckModel(){
 const parts={};
 const add=(key,geometry,x=0,y=0,s=0,rx=0,ry=0,rz=0)=>{
  let g=geometry;if(g.index){g=geometry.toNonIndexed();geometry.dispose();}
  if(!g.attributes.uv){const p=g.attributes.position,a=[];for(let i=0;i<p.count;i++)a.push(p.getZ(i)*.2,p.getY(i)*.3);g.setAttribute('uv',new T.Float32BufferAttribute(a,2));}
  O.position.set(x,y,-s);O.rotation.set(rx,ry,rz);O.scale.set(1,1,1);O.updateMatrix();g.applyMatrix4(O.matrix);(parts[key]??=[]).push(g);
 };
 const b=(key,w,h,d,x,y,s,round=0)=>add(key,round&&Math.min(w,h,d)>.18?new RoundedBoxGeometry(w,h,d,1,Math.min(round,w*.4,h*.4,d*.4)):new T.BoxGeometry(w,h,d),x,y,s);
 const beam=(key,a,b,width=.04)=>{const A=new T.Vector3(a[0],a[1],-a[2]),B=new T.Vector3(b[0],b[1],-b[2]),delta=B.clone().sub(A),g=new T.BoxGeometry(width,delta.length(),width);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize())));add(key,g,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);};
 const q=(key,points)=>{const p=points.flatMap(([x,y,s])=>[x,y,-s]),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals();add(key,g);};

 b('white',3.36,2.65,11.7,0,2.48,-1.7,.065);
 b('roof',3.23,.07,11.53,0,3.80,-1.7);
 // Sealed roof edges, restrained seams and a fine ribbed aluminium surface.
 for(const side of[-1,1]){
  b('metal',.05,.10,11.76,side*1.70,1.22,-1.7);b('shade',.028,.038,11.61,side*1.68,3.73,-1.7);
  b('white',.035,.045,11.55,side*1.59,3.843,-1.7);
  for(let s=-7.0;s<4.0;s+=.62){b('shade',.018,2.27,.014,side*1.687,2.49,s);b('white',.021,2.26,.012,side*1.69,2.5,s+.027);}
  b('shade',.028,.034,11.3,side*1.697,1.55,-1.7);
  for(let s=-6.8;s<4;s+=2.45){b('amber',.048,.075,.17,side*1.729,1.38,s,.015);b('white',.025,.075,.34,side*1.711,1.19,s+.5);}
  for(const x of[.60,1.12])b('white',.028,.008,11.4,side*x,3.844,-1.7);
 }
 for(let s=-6.4;s<4;s+=2.1)b('shade',3.06,.005,.012,0,3.841,s);
 // Rear doors sit inside their steel frame; locking bars have handles, hinges and fasteners.
 b('dark',3.25,2.50,.026,0,2.47,-7.568);
 for(const side of[-1,1]){
  b('white',1.56,2.40,.047,side*.80,2.49,-7.602,.018);
  b('shade',.045,2.44,.075,side*1.624,2.48,-7.63);b('metal',.037,2.21,.056,side*.84,2.45,-7.657);
  for(const y of[1.48,2.20,2.94,3.48]){b('metal',.20,.065,.075,side*1.48,y,-7.66);b('shade',.045,.10,.085,side*1.48,y,-7.69);}
  b('metal',.27,.045,.09,side*.93,1.57,-7.71);b('dark',.045,.13,.072,side*1.055,1.55,-7.72);
  for(const y of[1.28,3.66])b('light',.11,.055,.06,side*1.48,y,-7.71);
 }
 b('metal',3.39,.11,.16,0,1.235,-7.65);b('metal',3.39,.055,.10,0,3.718,-7.64);
 b('dark',3.42,.19,.19,0,.79,-7.65);b('metal',2.84,.105,.12,0,.89,-7.73);
 for(const side of[-1,1]){
  b('dark',.69,.24,.075,side*1.23,1.02,-7.70,.03);b('red',.27,.14,.085,side*1.38,1.02,-7.75,.025);b('amber',.15,.14,.09,side*1.10,1.02,-7.75);
  b('dark',.38,.48,.09,side*1.41,.50,-6.86);
 }
 b('shade',.55,.17,.03,0,1.02,-7.76);
 // Twin frame rails, air tanks, cross-members, drive axle and articulated coupling.
 for(const side of[-1,1]){
  b('dark',.19,.32,14.1,side*.93,.87,-.2);
  b('metal',.10,.10,3.7,side*1.4,1.06,1.63);
  add('metal',new T.CylinderGeometry(.23,.23,1.36,10),side*.82,.65,2.65,Math.PI/2);
 }
 for(const s of[-5.9,-4.15,3.1,6.0]){add('dark',new T.CylinderGeometry(.09,.09,3.10,8),0,.63,s,0,0,Math.PI/2);b('dark',1.4,.15,.25,0,.96,s);}
 b('dark',2.46,.14,2.10,0,1.18,3.42,.035);
 // Sloped front glass and angular cabin break up the rectangular silhouette.
 add('white',prism(3.16,[[4.35,1.24],[7.73,1.24],[7.86,1.65],[7.86,2.12],[7.36,2.98],[4.53,2.98],[4.35,2.76]]));
 b('white',3.18,.15,3.46,0,3.065,6.07,.055);
 q('glass',[[-1.37,2.16,7.887],[1.37,2.16,7.887],[1.37,2.91,7.449],[-1.37,2.91,7.449]]);
 beam('metal',[0,2.13,7.90],[0,2.93,7.44],.035);
 for(const side of[-1,1]){
  beam('white',[side*1.44,2.10,7.90],[side*1.44,2.97,7.40],.07);
  q('glass',[[side*1.596,2.10,5.27],[side*1.596,2.10,7.70],[side*1.596,2.91,7.29],[side*1.596,2.91,5.27]]);
  beam('white',[side*1.62,2.08,6.29],[side*1.62,2.94,6.29],.045);
  b('shade',.024,.035,2.47,side*1.62,2.05,6.48);b('metal',.026,.065,.27,side*1.65,1.93,5.49);
  b('white',.13,.48,.33,side*1.94,2.63,7.13,.03);b('glassLight',.026,.37,.25,side*2.02,2.63,7.13);
  beam('dark',[side*1.60,2.40,7.47],[side*1.93,2.45,7.10],.065);
  for(const y of[1.10,1.31]){b('metal',.40,.06,.90,side*1.57,y,4.86);b('dark',.34,.015,.80,side*1.59,y+.035,4.86);}
  b('white',.30,.11,1.98,side*1.55,1.31,6.03,.035);
  const fender=new T.TorusGeometry(.71,.105,5,16,Math.PI);add('white',fender,side*1.50,.67,6,0,Math.PI/2);
  add('metal',new T.CylinderGeometry(.055,.055,2.0,8),side*1.33,2.42,4.23);add('dark',new T.CylinderGeometry(.063,.063,.10,8),side*1.33,3.43,4.23);
  b('light',.57,.22,.065,side*1.15,1.55,7.91,.03);b('amber',.13,.13,.075,side*1.48,1.56,7.91);
 }
 b('white',3.15,.34,.25,0,1.93,7.81,.045);b('dark',1.76,.42,.035,0,1.65,7.97);
 for(let y=1.48;y<1.86;y+=.075)b('metal',1.71,.022,.045,0,y,8.005);
 b('metal',3.23,.19,.24,0,1.07,7.82,.045);b('shade',.41,.13,.045,0,1.05,7.97);
 for(const x of[-1.04,-.52,0,.52,1.04])b('amber',.075,.048,.10,x,3.16,7.16);
 // Two small direction ticks, rather than a large flat orange rectangle.
 for(const side of[-1,1])beam('stripe',[side*.28,3.849,-5.86],[0,3.849,-5.46],.045);
 const out={};for(const[key,gs]of Object.entries(parts)){out[key]=mergeGeometries(gs);gs.forEach(g=>g.dispose());if(!out[key])throw new Error('Truck merge failed: '+key);}
 return out;
}

export function wheelModel(low=false){
 const transform=(g,rotation)=>{g.applyMatrix4(new T.Matrix4().makeRotationZ(rotation));return g;};
 if(low)return {rubber:transform(new T.CylinderGeometry(.62,.62,.37,12,1),Math.PI/2),metal:transform(new T.CylinderGeometry(.33,.33,.395,10,1),Math.PI/2)};
 const rubber=[transform(new T.CylinderGeometry(.62,.62,.37,20,1),Math.PI/2)],metal=[transform(new T.CylinderGeometry(.34,.34,.395,18,1),Math.PI/2),transform(new T.CylinderGeometry(.125,.125,.43,12,1),Math.PI/2)],detail=[];
 for(const side of[-1,1]){
  const ring=new T.TorusGeometry(.47,.014,4,20);ring.rotateY(Math.PI/2);ring.translate(side*.191,0,0);rubber.push(ring);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,bolt=new T.CylinderGeometry(.022,.022,.015,6);bolt.rotateZ(Math.PI/2);bolt.translate(side*.21,Math.cos(a)*.235,Math.sin(a)*.235);metal.push(bolt);}
  for(let i=0;i<8;i++){const a=i*Math.PI/4,spoke=new T.BoxGeometry(.016,.055,.16);spoke.rotateX(a);spoke.translate(side*.205,Math.cos(a)*.19,Math.sin(a)*.19);detail.push(spoke);}
 }
 for(let i=0;i<20;i++){const a=i*Math.PI/10,tread=new T.BoxGeometry(.32,.018,.022);tread.rotateX(a);tread.translate(0,Math.cos(a)*.617,Math.sin(a)*.617);rubber.push(tread);}
 // Make the torus and cylinders compatible before merging.
 const merge=list=>{const all=list.map(g=>g.index?g.toNonIndexed():g),result=mergeGeometries(all);list.forEach(g=>g.dispose());return result;};
 return {rubber:merge(rubber),metal:merge(metal),shade:merge(detail)};
}

export function truckShadowModel(){
 const parts=[],box=(w,h,d,x,y,s)=>{const g=new T.BoxGeometry(w,h,d);g.translate(x,y,-s);parts.push(g);};
 box(3.34,2.65,11.68,0,2.48,-1.7);box(3.14,2.16,3.40,0,2.04,6.04);box(2.28,.30,14.1,0,.85,-.15);
 for(const side of[-1,1])for(const s of[-5.9,-4.15,3.1,6]){const g=new T.CylinderGeometry(.62,.62,.37,12,1);g.rotateZ(Math.PI/2);g.translate(side*1.5,.635,-s);parts.push(g);}
 const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());return geometry;
}
