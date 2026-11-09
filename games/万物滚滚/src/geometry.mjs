import * as T from '../vendor/three.module.js';
export function roundedBox(w=1,h=1,d=1,r=Math.min(w,h,d)*.026){
 const g=new T.BoxGeometry(w,h,d,3,3,3),p=g.attributes.position,n=g.attributes.normal,v=new T.Vector3(),q=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(T.MathUtils.clamp(v.x,-w/2+r,w/2-r),T.MathUtils.clamp(v.y,-h/2+r,h/2-r),T.MathUtils.clamp(v.z,-d/2+r,d/2-r));v.sub(q).normalize();n.setXYZ(i,v.x,v.y,v.z);v.multiplyScalar(r).add(q);p.setXYZ(i,v.x,v.y,v.z);}g.computeBoundingSphere();return g;
}
export function mergeParts(parts,{normalize=false}={}){
 const positions=[],normals=[],colors=[],matrix=new T.Matrix4(),rotation=new T.Quaternion(),scale=new T.Vector3(),position=new T.Vector3();
 for(const part of parts){const g=part.g.index?part.g.toNonIndexed():part.g.clone();rotation.setFromEuler(new T.Euler(...(part.rotation||[0,0,0])));scale.set(...(part.scale||[1,1,1]));position.set(...(part.position||[0,0,0]));matrix.compose(position,rotation,scale);g.applyMatrix4(matrix);const p=g.attributes.position,n=g.attributes.normal,c=new T.Color(part.color||'#ffffff');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));const shade=.91+.09*Math.max(0,n.getY(i));colors.push(c.r*shade,c.g*shade,c.b*shade);}g.dispose();part.g.dispose();}
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));result.setAttribute('color',new T.Float32BufferAttribute(colors,3));result.computeBoundingBox();if(normalize){const size=result.boundingBox.getSize(new T.Vector3()),center=result.boundingBox.getCenter(new T.Vector3()),factor=2/Math.max(size.x,size.y,size.z);result.translate(-center.x,-center.y,-center.z);result.scale(factor,factor,factor);result.computeBoundingBox();}result.computeBoundingSphere();return result;
}
export function makeBuilder(){
 const parts=[];
 const add=(g,color,x=0,y=0,z=0,rotation,scale)=>{parts.push({g,color,position:[x,y,z],rotation,scale});};
 const box=(w,h,d,x,y,z,color,rotation)=>add(roundedBox(w,h,d),color,x,y,z,rotation);
 const sphere=(rx,ry,rz,x,y,z,color)=>add(new T.SphereGeometry(1,12,8),color,x,y,z,null,[rx,ry,rz]);
 const cylinder=(rt,rb,h,x,y,z,color,rotation,sides=16)=>add(new T.CylinderGeometry(rt,rb,h,sides),color,x,y,z,rotation);
 const torus=(r,t,x,y,z,color,rotation,arc=Math.PI*2)=>add(new T.TorusGeometry(r,t,8,24,arc),color,x,y,z,rotation);
 return{parts,add,box,sphere,cylinder,torus,finish:options=>mergeParts(parts,options)};
}
export function textSprite(text,{color='#fff8e5',stroke='#365d59',font=700,fontSize=54,width=512}={}){const c=document.createElement('canvas');c.width=width;c.height=100;const x=c.getContext('2d');x.font=`${font} ${fontSize}px "Microsoft YaHei",Arial,sans-serif`;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=8;x.strokeStyle=stroke;x.strokeText(text,width/2,51);x.fillStyle=color;x.fillText(text,width/2,50);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.scale.set(4,.8,1);return sprite;}
export function disposeOwned(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry&&!o.userData.shared&&!o.userData.sharedGeometry)geometries.add(o.geometry);if(o.material&&!o.userData.shared)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{if(m.map&&!m.map.userData.shared)m.map.dispose();m.dispose();});}

export function rampGeometry(width,length,height){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-width,0,-length,width,0,-length,-width,0,length,width,0,length,-width,height,length,width,height,length],3));geometry.setIndex([0,5,1,0,4,5,0,3,2,0,1,3,0,2,4,1,5,3,2,5,4,2,3,5]);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;}
