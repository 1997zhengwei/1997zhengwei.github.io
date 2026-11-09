import * as T from 'three';
import {BUILDINGS} from './world.mjs';

// Original canvas materials and low-cost set dressing, created locally for this town.
export function createEnvironment(){
 let seed=1731;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 function canvas(size=512){const c=document.createElement('canvas');c.width=c.height=size;return [c,c.getContext('2d')];}
 function texture(c,rx=1,ry=1){const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.magFilter=T.NearestFilter;t.anisotropy=2;return t;}
 function noise(a,size,n,color){a.fillStyle=color;for(let i=0;i<n;i++)a.fillRect(random()*size,random()*size,1+random()*3,1+random()*5);}
 function wall(kind){const [c,a]=canvas();a.fillStyle=kind==='brick'?'#90796a':'#c1c0ad';a.fillRect(0,0,512,512);if(kind==='brick'){for(let y=0;y<512;y+=24){a.fillStyle='#55594d';a.fillRect(0,y,512,2);for(let x=-(y/24%2)*40;x<512;x+=80){a.fillRect(x,y,2,24);a.fillStyle=['#947c6b','#a18b76','#837363'][Math.floor(random()*3)];a.fillRect(x+3,y+3,75,18);a.fillStyle='#55594d';}}}else{for(let y=0;y<512;y+=22){a.fillStyle='#727d6b';a.fillRect(0,y,512,2);a.fillStyle='#e1decb';a.fillRect(0,y+2,512,1);}}
  noise(a,512,1900,'#333f2920');const g=a.createLinearGradient(0,300,0,512);g.addColorStop(0,'#354b3100');g.addColorStop(1,'#30452f99');a.fillStyle=g;a.fillRect(0,260,512,252);for(let i=0;i<25;i++){a.fillStyle='#283a2b18';a.fillRect(random()*512,random()*100,4+random()*10,120+random()*260);}return texture(c,2,1);
 }
 const siding=wall('siding'),brick=wall('brick');
 const [roofC,ra]=canvas();ra.fillStyle='#525650';ra.fillRect(0,0,512,512);for(let y=0;y<512;y+=32)for(let x=-(y/32%2)*32;x<512;x+=64){ra.fillStyle=['#4b514a','#606257','#565c52','#66675a'][Math.floor(random()*4)];ra.fillRect(x+1,y+1,61,29);ra.fillStyle='#2d393388';ra.fillRect(x,y+29,64,3);}noise(ra,512,2000,'#d2c8a218');const shingles=texture(roofC,2,2);
 function floor(tile){const [c,a]=canvas();a.fillStyle=tile?'#969d91':'#9c8e72';a.fillRect(0,0,512,512);for(let y=0;y<512;y+=tile?64:32)for(let x=-(y/32%2)*64;x<512;x+=tile?64:192){a.fillStyle=tile?((x/64+y/64)%2?'#a3a697':'#858e82'):['#97866e','#a09276','#8e806a'][Math.floor(random()*3)];a.fillRect(x+1,y+1,(tile?64:192)-2,(tile?64:32)-2);if(!tile){a.strokeStyle='#5c665149';a.lineWidth=1;for(let n=0;n<5;n++){a.beginPath();a.moveTo(x+8,y+5+n*5);a.lineTo(x+180,y+4+n*5);a.stroke();}}}noise(a,512,1800,'#1d302512');return texture(c,3,3);}
 const boards=floor(false),tiles=floor(true);
 const [shadowC,sa]=canvas(128),gradient=sa.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'#0000008c');gradient.addColorStop(.45,'#0000004d');gradient.addColorStop(1,'#00000000');sa.fillStyle=gradient;sa.fillRect(0,0,128,128);const shadowMap=texture(shadowC),shadowMat=new T.MeshBasicMaterial({map:shadowMap,transparent:true,opacity:.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const unitPlane=new T.PlaneGeometry(1,1);
 function contact(parent,x,z,w,d,y=.265){const m=new T.Mesh(unitPlane,shadowMat);m.rotation.x=-Math.PI/2;m.scale.set(w,d,1);m.position.set(x,y,z);parent.add(m);return m;}
 function foliage(autumn){const [c,a]=canvas(512);a.fillStyle=autumn?'#6e653e':'#435a35';for(let j=0;j<9;j++){a.beginPath();a.ellipse(256+Math.cos(j*.8)*90,242+Math.sin(j*.8)*75,120,130,0,0,6.283);a.fill();}const colors=autumn?['#59553a','#6e613c','#837047','#998052','#655f3e']:['#293c2c','#364c32','#4b5b36','#586b40','#6b774a'];for(let i=0;i<2400;i++){const angle=random()*6.283,r=Math.sqrt(random()),x=256+Math.cos(angle)*r*215,y=240+Math.sin(angle)*r*214;if(Math.abs(x-256)<26&&y>370)continue;a.fillStyle=colors[Math.floor(random()*colors.length)];const size=3+random()*10;a.fillRect(x,y,size,size);if(i%3===0){a.fillStyle='#b5ac6c1f';a.fillRect(x,y,size,2);}}const shade=a.createLinearGradient(110,80,390,490);shade.addColorStop(0,'#c2c5833b');shade.addColorStop(.5,'#8d994a0a');shade.addColorStop(1,'#111f2770');a.globalCompositeOperation='source-atop';a.fillStyle=shade;a.fillRect(0,0,512,512);return texture(c);}
 const leaves=[false,true,false].map((a,i)=>new T.MeshBasicMaterial({map:foliage(a),transparent:false,alphaTest:.42,side:T.DoubleSide,color:i===2?0xaab18c:0xffffff})),trunkMat=new T.MeshStandardMaterial({color:0x62594a,roughness:1});
 function tree(parent,x,z,height,index){const stem=new T.Mesh(new T.CylinderGeometry(.10,.22,height*.64,6),trunkMat);stem.position.set(x,height*.32,z);stem.castShadow=true;parent.add(stem);const crown=new T.Mesh(unitPlane,leaves[index%3]);crown.position.set(x,height*.68,z);crown.rotation.y=Math.PI/4;crown.scale.set(height*.82,height*.85,1);crown.castShadow=true;parent.add(crown);contact(parent,x,z,height*.8,height*.6,.145);}
 const grassMats=[0x626b48,0x738057].map(color=>new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:1}));
 function decorate(fixed,box){
  for(const b of BUILDINGS){
   box(fixed,b.x,.145,b.z+b.d/2+1.25,3.6,.06,2.6,0xa0a18c);box(fixed,b.x,.19,b.z+b.d/2+.5,3.1,.10,.7,0x9c9d8a);
   if(['home','house'].includes(b.type)){box(fixed,b.x,3.04,b.z+b.d/2+.65,3.6,.16,1.5,0x737a65);for(const x of [-1.65,1.65])box(fixed,b.x+x,2.65,b.z+b.d/2+.16,.14,.7,.17,0x727c66);}
   const edge=b.x-b.w/2-.3;for(let n=0;n<5;n++){box(fixed,edge,.19,b.z-3+n*1.35,.4,.06,.6,0x565f45);}
   // Small window ledges, shutters and exterior AC units give buildings distinct use.
   if(b.type==='clinic'||b.type==='market'){box(fixed,b.x+b.w/2+.22,1.2,b.z-2,.48,.65,1.1,0x737c71);for(let n=0;n<5;n++)box(fixed,b.x+b.w/2+.48,1.02+n*.08,b.z-2,.035,.02,.85,0x434e49);}
   for(let n=0;n<9;n++){const x=b.x+(random()-.5)*(b.w+2),z=b.z+b.d/2+1.5+random()*3;if(Math.abs(x-b.x)<2)continue;const verts=[];for(let j=0;j<7;j++){const angle=random()*6.28,bx=Math.cos(angle)*.11,bz=Math.sin(angle)*.11,height=.15+random()*.28;verts.push(bx-.025,0,bz,bx+.025,0,bz,bx+Math.cos(angle)*.09,height,bz+Math.sin(angle)*.09);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();const stem=new T.Mesh(geo,grassMats[n%2]);stem.position.set(x,.15,z);fixed.add(stem);}
  }
  // Broken asphalt, faded crosswalks, leaves, paper and dark stains, all original geometry.
  for(const roadZ of [-6,6])for(let n=0;n<7;n++)box(fixed,-3+n, .105,roadZ,.5,.018,2.8,0xaaa995);
  for(let n=0;n<100;n++){let x=(random()-.5)*94,z=(random()-.5)*94;if(Math.abs(x)>5&&Math.abs(z)>5)continue;for(let j=0;j<3;j++){const m=box(fixed,x+j*.22,.105,z+j*.14,.035,.01,.38,0x303d38);m.rotation.y=.3+j*.5;}}
  for(let n=0;n<150;n++){const b=BUILDINGS[n%BUILDINGS.length],x=b.x+(random()-.5)*(b.w+5),z=b.z+b.d/2+1.4+random()*4;if(Math.abs(x-b.x)<1.6)continue;const m=box(fixed,x,.15,z,.08+random()*.19,.012,.10+random()*.22,n%5===0?0xaeb0a0:n%3?0x6c6751:0x85806a);m.rotation.y=random()*6.28;}
 }
 return {siding,brick,shingles,boards,tiles,contact,tree,decorate,lighting(night){for(const m of leaves)m.color.setHex(night?0x394346:0xc0c8aa);}};
}
