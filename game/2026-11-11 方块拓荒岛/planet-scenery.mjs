import * as T from 'three';
import {craftedTree,craftedResource} from './crafted-resources.mjs';
import {planet,ownedSet,nodeState,RADIUS,LAND_RADIUS,norm,add,mul,dot} from './globe.mjs';
const PALETTE={grass:['#83c46e','#8ecf78','#9ed783'],stone:['#d1b998','#ddc5a3'],sand:['#f2d38e','#f7dc9d'],ruins:['#9ba1c6','#abb3ce'],snow:['#dbedf0','#e6f3f0']};
const EARTH={grass:'#8b8e64',stone:'#a38b72',sand:'#c1a06d',ruins:'#777692',snow:'#8eb4bf'};
const mix=(a,b,t)=>norm(add(mul(a,1-t),mul(b,t)));
export function terrainGeometry(c){
 const pos=[],colors=[],palette=PALETTE[c.biome]||PALETTE.grass,top=new T.Color(palette[c.id%palette.length]),cap=top.clone().multiplyScalar(.92),soil=new T.Color(EARTH[c.biome]),lower=soil.clone().multiplyScalar(.82),center=mul(c.p,LAND_RADIUS);
 const tri=(a,b,d,color,expected)=>{const ab=new T.Vector3(...b).sub(new T.Vector3(...a)),ac=new T.Vector3(...d).sub(new T.Vector3(...a));if(ab.cross(ac).dot(new T.Vector3(...expected))<0)[b,d]=[d,b];pos.push(...a,...b,...d);for(let j=0;j<3;j++)colors.push(color.r,color.g,color.b);};
 const quad=(a,b,d,e,col,n)=>{tri(a,b,d,col,n);tri(b,e,d,col,n);};
 for(let i=0;i<c.corners.length;i++){
  const j=(i+1)%c.corners.length,a=c.corners[i],b=c.corners[j],insideA=mul(mix(c.p,a,.945),LAND_RADIUS+.018),insideB=mul(mix(c.p,b,.945),LAND_RADIUS+.018),edgeA=mul(a,LAND_RADIUS-.055),edgeB=mul(b,LAND_RADIUS-.055),beltA=mul(a,LAND_RADIUS-.22),beltB=mul(b,LAND_RADIUS-.22),baseA=mul(a,RADIUS-.035),baseB=mul(b,RADIUS-.035),middle=norm(add(a,b)),out=norm(add(middle,mul(c.p,-dot(c.p,middle))));
  tri(center,insideA,insideB,top.clone().multiplyScalar(i%2?1:.986),c.p);quad(insideA,insideB,edgeA,edgeB,c.key?new T.Color('#f5cd78'):top.clone().multiplyScalar(1.05),c.p);quad(edgeA,edgeB,beltA,beltB,cap,out);quad(beltA,beltB,baseA,baseB,soil,out);
  // A thin stone/soil layer gives the coast a readable crafted cross-section.
  if(i%2===0){const lineA=mul(a,RADIUS+.16),lineB=mul(b,RADIUS+.16),lineAA=mul(a,RADIUS+.115),lineBB=mul(b,RADIUS+.115);quad(lineA,lineB,lineAA,lineBB,lower,out);}
 }
 // Quiet inlaid surface marks: part of the terrain batch, never collision props.
 for(let i=0;i<3;i++){const a=c.corners[(i+c.id)%c.corners.length],b=c.corners[(i+c.id+1)%c.corners.length],p=mix(c.p,a,.28+i*.08),q=mix(c.p,b,.28+i*.08),small=mix(p,q,.2),t=mix(c.p,p,.82);tri(mul(p,LAND_RADIUS+.024),mul(small,LAND_RADIUS+.024),mul(t,LAND_RADIUS+.024),top.clone().multiplyScalar(c.biome==='grass'?.94:1.03),c.p);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export class PlanetScenery{
 constructor(scene){this.scene=scene;this.time=0;
  const bg=document.createElement('canvas');bg.width=2;bg.height=256;const ctx=bg.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#171d3a');gradient.addColorStop(.55,'#262a4b');gradient.addColorStop(1,'#414264');ctx.fillStyle=gradient;ctx.fillRect(0,0,2,256);const background=new T.CanvasTexture(bg);background.colorSpace=T.SRGBColorSpace;scene.background=background;
  this.waterMaterial=new T.ShaderMaterial({uniforms:{time:{value:0},deep:{value:new T.Color('#087fc9')},blue:{value:new T.Color('#15bed9')},rim:{value:new T.Color('#8af5ed')}},vertexShader:'varying vec3 p;varying vec3 n;void main(){p=(modelMatrix*vec4(position,1.)).xyz;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',fragmentShader:`uniform float time;uniform vec3 deep;uniform vec3 blue;uniform vec3 rim;varying vec3 p;varying vec3 n;void main(){vec3 normal=normalize(n),view=normalize(cameraPosition-p);float edge=pow(1.-max(0.,dot(normal,view)),2.5);float swell=.5+.5*sin(p.x*.22+sin(p.z*.26)+time*.045)*cos(p.y*.31-p.z*.12);float fine=sin(p.x*3.1+sin(p.y*1.7)+p.z*2.4-time*.4);vec3 color=mix(deep,blue,.24+swell*.23);color=mix(color,rim,edge*.27);color+=smoothstep(.965,1.,fine)*.014;gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
  this.water=new T.Mesh(new T.SphereGeometry(RADIUS,96,64),this.waterMaterial);scene.add(this.water);const shadow=new T.Mesh(new T.SphereGeometry(RADIUS+.009,80,48),new T.ShadowMaterial({color:'#07577a',opacity:.28}));shadow.receiveShadow=true;scene.add(shadow);
  const atmosphere=new T.Mesh(new T.SphereGeometry(RADIUS+.28,64,40),new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'varying vec3 p;varying vec3 n;void main(){p=(modelMatrix*vec4(position,1.)).xyz;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',fragmentShader:'varying vec3 p;varying vec3 n;void main(){float glow=pow(1.-abs(dot(normalize(n),normalize(cameraPosition-p))),3.);gl_FragColor=vec4(.18,.71,.88,glow*.21);}'}));this.atmosphere=atmosphere;scene.add(atmosphere);
  this.shoreMat=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:{time:{value:0},color:{value:new T.Color('#76f5db')}},vertexShader:'attribute float strength;varying float a;varying vec3 p;void main(){a=strength;p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float time;uniform vec3 color;varying float a;varying vec3 p;void main(){float pulse=.92+.08*sin(p.x*2.+p.z*1.3-time*.8);gl_FragColor=vec4(mix(color,vec3(.88,.98,.88),smoothstep(.74,.95,a)),a*pulse*.62);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
  this.clouds=[];const unit=new T.BoxGeometry(1,1,1),white=new T.MeshStandardMaterial({color:'#f4fcf8',roughness:1,transparent:true,opacity:.88});for(let i=0;i<7;i++){const g=new T.Group();for(const[x,y,z,w,h,d]of [[0,0,0,1.8,.32,.75],[-.52,.21,.05,.75,.47,.66],[.37,.31,-.09,.94,.62,.72],[.96,.05,.09,.55,.32,.6]]){const m=new T.Mesh(unit,white);m.position.set(x,y,z);m.scale.set(w,h,d);g.add(m);}scene.add(g);this.clouds.push(g);}
  const points=[];for(let i=0;i<110;i++){const a=i*2.399,y=1-2*(i+.5)/110,r=Math.sqrt(1-y*y);points.push(Math.cos(a)*r*90,y*90,Math.sin(a)*r*90);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));scene.add(new T.Points(geo,new T.PointsMaterial({color:'#b9d4ea',size:.12,transparent:true,opacity:.55,depthWrite:false})));
 }
 sync(g){const p=planet(g.index),owned=ownedSet(g),pos=[],strength=[],vertex=(a,s)=>{pos.push(...a);strength.push(s);},tri=(a,b,c,sa,sb,sc)=>{vertex(a,sa);vertex(b,sb);vertex(c,sc);};
  for(const id of g.owned){const c=p.cells[id];for(let i=0;i<c.corners.length;i++){const a=c.corners[i],b=c.corners[(i+1)%c.corners.length],mid=norm(add(a,b)),neighbor=c.neighbors.reduce((best,n)=>dot(p.cells[n].p,mid)>dot(p.cells[best].p,mid)?n:best,c.neighbors[0]);if(owned.has(neighbor))continue;for(let j=0;j<5;j++){const u=mix(a,b,j/5),v=mix(a,b,(j+1)/5),out=x=>norm(add(x,mul(add(x,mul(c.p,-1)),.48))),inner0=mul(u,RADIUS+.035),inner1=mul(v,RADIUS+.035),outer0=mul(out(u),RADIUS+.035),outer1=mul(out(v),RADIUS+.035);tri(inner0,inner1,outer0,.88,.88,0);tri(inner1,outer1,outer0,.88,0,0);}}}
  if(this.shore){this.scene.remove(this.shore);this.shore.geometry.dispose();}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('strength',new T.Float32BufferAttribute(strength,1));this.shore=new T.Mesh(geometry,this.shoreMat);this.shore.renderOrder=1;this.scene.add(this.shore);this.lodDirty=true;
 }
 makeOverviewProps(g){
  if(this.lod){this.scene.remove(this.lod);this.lod.traverse(m=>{if(m.isInstancedMesh)m.dispose();});}this.lod=new T.Group();this.scene.add(this.lod);const p=planet(g.index),up=new T.Vector3(0,1,0),matrix=new T.Matrix4(),rotation=new T.Quaternion(),scale=new T.Vector3();
  const draw=(source,cells,size)=>{if(!cells.length)return;const mesh=new T.InstancedMesh(source.geometry,source.material,cells.length);cells.forEach((c,i)=>{const normal=new T.Vector3(...c.node);rotation.setFromUnitVectors(up,normal);scale.setScalar(size);matrix.compose(normal.multiplyScalar(LAND_RADIUS+.01),rotation,scale);mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();this.lod.add(mesh);};
  const trees=g.owned.map(id=>p.cells[id]).filter(c=>c.type==='wood'&&nodeState(g,c.id).left>0).slice(0,140),root=new T.Group(),bits=craftedTree(root,0);const treeSize=g.owned.length===p.cells.length?.64:.46;draw(bits.trunk.children[0],trees,treeSize);draw(bits.leaf.children[0],trees,treeSize);
  for(const type of['stone','ore','obsidian','wheat']){const cells=g.owned.map(id=>p.cells[id]).filter(c=>c.type===type&&c.id%3===0&&nodeState(g,c.id).left>0);draw(craftedResource(type),cells,type==='obsidian'?.85:.8);}
  this.lodDirty=false;
 }
 render(g,dt,overview,cinematic){this.time+=dt;this.atmosphere.scale.setScalar((RADIUS+.32+.55*g.owned.length/planet(g.index).cells.length)/(RADIUS+.28));this.waterMaterial.uniforms.time.value=this.time;this.shoreMat.uniforms.time.value=this.time;if(overview&&(this.lodDirty||!this.wasOverview))this.makeOverviewProps(g);if(this.lod)this.lod.visible=overview;this.wasOverview=overview;for(let i=0;i<this.clouds.length;i++){const cloud=this.clouds[i],a=i*2.399+this.time*.007,y=Math.sin(i*1.9)*.65,r=Math.sqrt(1-y*y),normal=new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);cloud.visible=!cinematic&&(overview||normal.dot(new T.Vector3(...g.pos))<.67);cloud.position.copy(normal).multiplyScalar(20.4);cloud.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),normal);}}
}
