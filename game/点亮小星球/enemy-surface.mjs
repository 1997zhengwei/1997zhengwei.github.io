import * as THREE from './vendor/three.module.js';

// Analytic corner normals keep highlights continuous across the six box faces.
function bevelBox(){
 const g=new THREE.BoxGeometry(1,1,1,8,8,8),p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),q=new THREE.Vector3(),normal=new THREE.Vector3(),inner=.34,r=.16;
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);q.set(THREE.MathUtils.clamp(v.x,-inner,inner),THREE.MathUtils.clamp(v.y,-inner,inner),THREE.MathUtils.clamp(v.z,-inner,inner));
  normal.copy(v).sub(q).normalize();v.copy(q).addScaledVector(normal,r);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,normal.x,normal.y,normal.z);
 }
 return g;
}
function turned(profile,segments=24){return new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),segments)}
export const ENEMY_GEOMETRIES={
 round:bevelBox(),box:bevelBox(),
 ball:new THREE.SphereGeometry(1,28,18),
 rock:new THREE.SphereGeometry(1,28,18),
 capsule:new THREE.CapsuleGeometry(.5,.5,6,24),
 hex:turned([[0,-.5],[.80,-.5],[.94,-.46],[1,-.35],[1,.35],[.94,.46],[.80,.5],[0,.5]],24),
 cylinder:turned([[0,-.5],[.85,-.5],[.96,-.46],[1,-.36],[1,.36],[.96,.46],[.85,.5],[0,.5]],28),
 muzzle:turned([[.68,-.5],[.86,-.5],[.97,-.42],[1,-.25],[1,.25],[.97,.42],[.86,.5],[.68,.5],[.68,-.5]],28),
 cone:turned([[0,-.5],[.74,-.5],[.94,-.44],[1,-.34],[.87,-.13],[.62,.13],[.31,.36],[.10,.48],[0,.5]],24),
 // Crystals retain planar facets; a bevel band removes the raw octahedron edge.
 crystal:turned([[0,-1],[.16,-.91],[.86,-.22],[1,-.07],[1,.07],[.86,.22],[.16,.91],[0,1]],6),
};
export const ENEMY_FINISHES={
 skin:{roughness:.38,metalness:.03,clearcoat:.28,clearcoatRoughness:.28},
 shell:{roughness:.29,metalness:.13,clearcoat:.72,clearcoatRoughness:.20},
 rubber:{roughness:.53,metalness:.03,clearcoat:.08,clearcoatRoughness:.4},
 metal:{roughness:.27,metalness:.58,clearcoat:.35,clearcoatRoughness:.22},
 lens:{roughness:.16,metalness:.10,clearcoat:1,clearcoatRoughness:.12},
 energy:{roughness:.22,metalness:.12,clearcoat:.65,clearcoatRoughness:.18},
};

// A static reflection environment, generated once. No external HDR or render loop.
export function createEnemyStudioEnvironment(renderer){
 const studio=new THREE.Scene();studio.background=new THREE.Color('#617c96');
 for(const [x,y,z,w,h,d,color]of [[-3,5,4,5,5,.1,'#fff5df'],[4,3,1,.1,5,5,'#c6e4ff'],[0,5,-4,6,3,.1,'#e6dcff'],[0,-3,0,12,.1,12,'#1a3047']]){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color}));m.position.set(x,y,z);studio.add(m);
 }
 const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(studio,.08,.1,30);
 studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});pmrem.dispose();return target;
}
