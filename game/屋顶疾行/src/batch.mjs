import * as T from '../vendor/three.module.js';
// Bake static city details together. Dynamic runners, gates and traffic retain
// their own transforms; identical facade/road materials share a draw call.
export function batchStatic(root){root.updateWorldMatrix(true,true);const groups=new Map(),remove=[];
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;for(let p=o;p&&p!==root.parent;p=p.parent)if(p.userData.dynamic)return;const key=o.material.uuid+':'+Number(o.castShadow)+':'+Number(o.receiveShadow);let b=groups.get(key);if(!b){b={material:o.material,cast:o.castShadow,receive:o.receiveShadow,p:[],n:[],u:[],c:[]};groups.set(key,b);}const g=o.geometry.clone().applyMatrix4(o.matrixWorld),pos=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,col=g.attributes.color,ix=g.index,total=ix?ix.count:pos.count;
  for(let j=0;j<total;j++){const i=ix?ix.getX(j):j;b.p.push(pos.getX(i),pos.getY(i),pos.getZ(i));b.n.push(n?.getX(i)||0,n?.getY(i)||0,n?.getZ(i)||0);b.u.push(uv?.getX(i)||0,uv?.getY(i)||0);b.c.push(col?col.getX(i):1,col?col.getY(i):1,col?col.getZ(i):1);}g.dispose();remove.push(o);
 });
 for(const o of remove){o.removeFromParent();o.geometry.dispose();}
 for(const b of groups.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.u,2));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.computeBoundingSphere();const m=new T.Mesh(g,b.material);m.castShadow=b.cast;m.receiveShadow=b.receive;root.add(m);}
}
