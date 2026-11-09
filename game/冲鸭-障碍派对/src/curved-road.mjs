import * as T from '../vendor/three.module.js';
export function buildCurvedRoad(g,f,topMaterial,edgeMaterial,railMaterial){
 const vertices=[],uv=[],indices=[],sideVertices=[],sideIndices=[],points=f.curve;
 for(let i=0;i<points.length;i++){
  const p=points[i];for(const side of[-1,1]){vertices.push(p.x+side*f.w/2,.01,p.z);uv.push(side<0?0:f.w/5,i/(points.length-1)*f.d/5);}
  sideVertices.push(p.x-f.w/2,.01,p.z,p.x+f.w/2,.01,p.z,p.x-f.w/2,-.9,p.z,p.x+f.w/2,-.9,p.z);
  if(i<points.length-1){const a=i*2,b=i*4;indices.push(a,a+1,a+2,a+1,a+3,a+2);sideIndices.push(b,b+4,b+2,b+2,b+4,b+6,b+1,b+3,b+5,b+3,b+7,b+5,b+2,b+6,b+3,b+3,b+6,b+7);}
 }
 const mesh=(v,ix,mat,texcoords)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(ix);if(texcoords)geo.setAttribute('uv',new T.Float32BufferAttribute(texcoords,2));geo.computeVertexNormals();const m=new T.Mesh(geo,mat);m.receiveShadow=true;m.castShadow=true;g.add(m);return m;};
 mesh(vertices,indices,topMaterial,uv);mesh(sideVertices,sideIndices,edgeMaterial);
 for(const side of[-1,1]){
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p.x+side*(f.w/2-.16),.82,p.z))),tube=new T.Mesh(new T.TubeGeometry(path,192,.105,7,false),railMaterial);g.add(tube);
  for(let i=0;i<points.length;i+=2){const p=points[i],post=new T.Mesh(new T.CylinderGeometry(.12,.12,.86,10),railMaterial);post.position.set(p.x+side*(f.w/2-.16),.4,p.z);post.castShadow=true;g.add(post);}
 }
}
