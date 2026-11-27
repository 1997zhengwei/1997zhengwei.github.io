import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {T,box,cyl,ball,beam,label,mat} from './art.mjs';
import {tropicalCoral,seaStar} from './tropical.mjs';
export function enrichPavilion(scene){const g=new T.Group();scene.add(g);const flags=[];
 // All new solid decorations stay outside the walkable perimeter.
 for(const side of [-1,1]){
  const x=side*17.7;for(let i=0;i<7;i++){const z=4+i*4.3;box(g,x,.55,z,.9,.6,2.5,'#e8f9df',.16);box(g,x,.86,z,.75,.05,2.3,'#c6b789',.05);for(let j=0;j<5;j++){const zz=z-.85+j*.42;ball(g,x,1.04,zz,.35,.22,.34,j%2?'#81d6a4':'#b7e87a');for(let k=0;k<5;k++){const a=k*Math.PI*.4;ball(g,x+Math.cos(a)*.12,1.24,zz+Math.sin(a)*.12,.085,.055,.085,i%2?'#ff92bb':'#b8a0f3');}ball(g,x,1.27,zz,.05,.04,.05,'#ffda73');}}
  for(let i=0;i<5;i++){const z=3+i*7.2;cyl(g,x,1.8,z,.055,3.0,'#fafee5');ball(g,x,3.35,z,.10,.10,.10,'#f7cc6c');if(i<4){beam(g,[x,3.1,z],[x,3.1,z+7.2],.02,'#f4e5b8');for(let j=0;j<7;j++){const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(.54,0);sh.lineTo(.27,-.60);sh.closePath();const m=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshStandardMaterial({color:['#ff8fb4','#64ddcf','#c3a3f2','#ffe37a'][j%4],side:T.DoubleSide,roughness:.7}));m.position.set(x,3.1,z+.35+j*.9);m.rotation.y=side*Math.PI/2;g.add(m);flags.push(m);}}}
 }
 // An open entrance arch, bright wayfinding and coastal lanterns.
 const curve=new T.CatmullRomCurve3([new T.Vector3(-3.4,3.9,34.2),new T.Vector3(-2.6,5.5,34.2),new T.Vector3(0,6.0,34.2),new T.Vector3(2.6,5.5,34.2),new T.Vector3(3.4,3.9,34.2)]);const arch=new T.Mesh(new T.TubeGeometry(curve,32,.12,8,false),mat('#d5fff1',.25));g.add(arch);
 for(let i=0;i<13;i++){const p=curve.getPoint(i/12);ball(g,p.x,p.y+.04,p.z+.08,.10,.10,.10,i%2?'#ffe59b':'#d8fff4');}
 const logo=label('FIND YOUR LITTLE OCEAN',7.2,.5,'#e9f5df','#539f9c',26);logo.position.set(0,5.2,34.28);g.add(logo);
 for(const side of [-1,1])for(const z of [1.6,12,22,33]){const x=side*17.3;cyl(g,x,1.5,z,.045,2.4,'#fff3c5');ball(g,x,2.85,z,.23,.30,.23,new T.MeshStandardMaterial({color:'#fff4c1',emissive:'#ffdf82',emissiveIntensity:.25}));}
 const staticMeshes=g.children.filter(o=>o.isMesh&&!flags.includes(o)&&o.material?.color&&!o.material.map&&!o.material.transparent&&!o.material.emissive?.getHex());const parts=staticMeshes.map(o=>{o.updateMatrix();let geo=o.geometry.clone();geo.applyMatrix4(o.matrix);const c=o.material.color,colors=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geo.setAttribute('color',new T.BufferAttribute(colors,3));return geo.index?geo.toNonIndexed():geo;});for(const o of staticMeshes)g.remove(o);const joined=new T.Mesh(mergeGeometries(parts),new T.MeshStandardMaterial({vertexColors:true,roughness:.6}));joined.castShadow=true;joined.receiveShadow=true;g.add(joined);
 return {update(t){flags.forEach((f,i)=>{f.rotation.z=Math.sin(t*2+i*.6)*.06;});}};
}
