import * as T from './vendor/three.module.js';
export {T};
const materials=new Map(),shapes=new Map();
export function group(parent,x=0,y=0,z=0){const g=new T.Group();parent.add(g);g.position.set(x,y,z);return g;}
function shape(id,fn){if(!shapes.has(id))shapes.set(id,fn());return shapes.get(id);}
function mat(hex){
  if(!materials.has(hex))materials.set(hex,new T.MeshStandardMaterial({color:hex,roughness:.77,metalness:.06}));
  return materials.get(hex);
}
export function mesh(p,geo,color,x,y,z,sx=1,sy=1,sz=1){
  const m=new T.Mesh(geo,mat(color));p.add(m);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;
}
const cube=shape('box',()=>new T.BoxGeometry(1,1,1));
export function box(p,x,y,z,w,h,d,c){return mesh(p,cube,c,x,y,z,w,h,d);}
// A small bevel catches a continuous highlight on lacquered housings and upholstery.
function cushionGeometry(){
  const v=[],n=[],idx=[],axis=new T.Vector3(),u=new T.Vector3(),w=new T.Vector3();
  const pt=new T.Vector3(),center=new T.Vector3(),normal=new T.Vector3(),r=.09;
  const ticks=[-.5,-.47,-.41,.41,.47,.5];
  for(const side of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
    axis.fromArray(side);u.set(0,axis.y?0:1,axis.y?1:0);w.crossVectors(axis,u);
    const start=v.length/3;
    for(let j=0;j<ticks.length;j++)for(let i=0;i<ticks.length;i++){
      pt.copy(axis).multiplyScalar(.5).addScaledVector(u,ticks[i]).addScaledVector(w,ticks[j]);
      center.copy(pt).clampScalar(-.5+r,.5-r);normal.copy(pt).sub(center).normalize();pt.copy(center).addScaledVector(normal,r);
      v.push(pt.x,pt.y,pt.z);n.push(normal.x,normal.y,normal.z);
      if(j&&i){const a=start+j*ticks.length+i;idx.push(a-7,a-6,a,a-7,a,a-1);}
    }
  }
  const g=new T.BufferGeometry();g.setIndex(idx);g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));return g;
}
export function softBox(p,x,y,z,w,h,d,c){return mesh(p,shape('bevel',cushionGeometry),c,x,y,z,w,h,d);}
export function ball(p,x,y,z,w,h,d,c){return mesh(p,shape('ball',()=>new T.SphereGeometry(.5,12,8)),c,x,y,z,w,h,d);}
export function facet(p,x,y,z,w,h,d,c){return mesh(p,shape('gem',()=>new T.IcosahedronGeometry(.55,0)),c,x,y,z,w,h,d);}
export function jewel(p,palette){
  const geo=shape('jewel'+palette[0],()=>{
    const pos=[],colors=[],sides=8,loop=(r,y,offset)=>Array.from({length:sides},(_,i)=>{
      const a=i*Math.PI/4+offset;return [Math.cos(a)*r,y,Math.sin(a)*r];
    });
    const crown=loop(.225,.243,.20),girdle=loop(.385,.073,.20),tip=[0,-.32,0];
    const facets=palette.map(c=>new T.Color(c));
    function tri(a,b,c,k){pos.push(...a,...b,...c);const tint=facets[k%facets.length];for(let n=0;n<3;n++)colors.push(tint.r,tint.g,tint.b);}
    for(let i=0;i<sides;i++){
      const j=(i+1)%sides;
      tri([0,.243,0],crown[j],crown[i],0);
      tri(crown[i],crown[j],girdle[i],i+1);tri(crown[j],girdle[j],girdle[i],i+2);
      tri(girdle[i],girdle[j],tip,i+3);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
  });
  const jewelMesh=mesh(p,geo,'#ffffff',0,0,0);jewelMesh.userData.finish='polished';return jewelMesh;
}
export function drum(p,x,y,z,top,base,h,c,n=16){
  const ratio=base?top/base:0;
  return mesh(p,shape('tube'+n+':'+ratio,()=>new T.CylinderGeometry(ratio,1,1,n)),c,x,y,z,base,h,base);
}
export function ring(p,x,y,z,r,t,c,n=32){
  return mesh(p,shape('ring'+n+':'+t/r,()=>new T.TorusGeometry(1,t/r,6,n)),c,x,y,z,r,r,r);
}
export function rod(p,a,b,r,c,n=8){
  const delta=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
  const m=drum(p,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,r,delta.length(),c,n);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
}
// Batch each rigid assembly, keeping joints, lights and collectibles separately movable.
const surfaces={
  paint:new T.MeshStandardMaterial({vertexColors:true,roughness:.76,metalness:.025}),
  alloy:new T.MeshStandardMaterial({vertexColors:true,roughness:.30,metalness:.35}),
  polished:new T.MeshStandardMaterial({vertexColors:true,roughness:.22,metalness:.05})
};
export function bake(p,shadow=true){
  p.updateWorldMatrix(true,true);
  const inv=p.matrixWorld.clone().invert(),m4=new T.Matrix4(),m3=new T.Matrix3(),v=new T.Vector3();
  const batches=new Map();
  p.traverse(m=>{
    if(!m.isMesh)return;
    const finish=m.userData.finish||'paint';
    if(!batches.has(finish))batches.set(finish,{positions:[],normals:[],colors:[]});
    const {positions,normals,colors}=batches.get(finish);
    const geo=m.geometry,pos=geo.attributes.position,nor=geo.attributes.normal,idx=geo.index,col=m.material.color;
    m4.multiplyMatrices(inv,m.matrixWorld);m3.getNormalMatrix(m4);
    for(let i=0;i<(idx?idx.count:pos.count);i++){
      const j=idx?idx.getX(i):i;
      v.fromBufferAttribute(pos,j).applyMatrix4(m4);positions.push(v.x,v.y,v.z);
      v.fromBufferAttribute(nor,j).applyNormalMatrix(m3);normals.push(v.x,v.y,v.z);
      const tint=geo.attributes.color;
      if(tint)colors.push(col.r*tint.getX(j),col.g*tint.getY(j),col.b*tint.getZ(j));
      else colors.push(col.r,col.g,col.b);
    }
  });
  p.clear();for(const [finish,{positions,normals,colors}] of batches){
  const geo=new T.BufferGeometry();for(const [key,array] of [['position',positions],['normal',normals],['color',colors]])geo.setAttribute(key,new T.Float32BufferAttribute(array,3));
  const m=new T.Mesh(geo,surfaces[finish]);m.castShadow=shadow;m.receiveShadow=true;p.add(m);m.userData.baked=true;}
}
const silhouetteMaterial=new T.MeshBasicMaterial({color:'#1d2c44',side:T.BackSide});
export function silhouette(p){
  // Expand along the averaged surface normal so sleeves and cap read cleanly at phone scale.
  for(const part of [...p.children]){
    if(!part.userData.baked)continue;
    const g=part.geometry.clone(),pos=g.attributes.position,nor=g.attributes.normal;
    for(let i=0;i<pos.count;i++)pos.setXYZ(i,pos.getX(i)+.014*nor.getX(i),pos.getY(i)+.014*nor.getY(i),pos.getZ(i)+.014*nor.getZ(i));
    g.deleteAttribute('normal');g.deleteAttribute('color');
    const hull=new T.Mesh(g,silhouetteMaterial);hull.userData.baked=true;p.add(hull);
  }
}
export function clearRoom(root){
  root.traverse(m=>{if(m.userData.baked||m.userData.disposable)m.geometry?.dispose();if(m.userData.disposable)m.material?.dispose();});
  root.removeFromParent();
}
export const tau=Math.PI*2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
