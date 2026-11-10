import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';

export function makeOutfitDetails(r){
 const material=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.85,...extra});r.materials.push(m);return m;};
 const faded=material('#656b60'),dark=material('#27352d'),olive=material('#4d634c'),orange=material('#f6c483'),black=material('#1b2631'),cyan=material('#a7e9ec',{emissive:'#55cce2',emissiveIntensity:.55,roughness:.45}),ivory=material('#e9e5d5'),gold=material('#e4bc60',{metalness:.62,roughness:.3});
 const groups={};
 const box=(g,w,h,d,m,x,y,z,radius=.012)=>{const mesh=r.addMesh(new RoundedBoxGeometry(w,h,d,2,radius),m,g);mesh.position.set(x,y,z);return mesh;};
 const torso=(id,build)=>{const g=new T.Group();r.root.add(g);build(g);r.bones.get('spine_03').attach(g);g.visible=false;(groups[id]??=[]).push(g);};
 const band=(id,bone,end,m,at=.65,radius=.073,width=.035)=>{const g=new T.Group();r.root.add(g);const a=r.bones.get(bone).getWorldPosition(new T.Vector3()),b=r.bones.get(end).getWorldPosition(new T.Vector3()),mesh=r.addMesh(new T.CylinderGeometry(radius,radius,width,14,1,true),m,g);mesh.position.copy(a.clone().lerp(b,at));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());r.bones.get(bone).attach(g);g.visible=false;(groups[id]??=[]).push(g);};
 const vest=(g,m)=>{const mesh=r.addMesh(new T.CylinderGeometry(.258,.23,.35,20,1,true),m,g);mesh.position.set(0,1.28,0);mesh.scale.z=.91;return mesh;};
 torso('chalk',g=>{box(g,.085,.07,.014,faded,.11,1.24,-.215);for(let i=0;i<4;i++)box(g,.006,.005,.018,ivory,.077+i*.02,1.265,-.222,.002);});
 torso('ember',g=>{const stripe=box(g,.018,.30,.016,orange,-.14,1.34,-.224);stripe.rotation.z=-.25;box(g,.12,.09,.025,dark,.10,1.32,-.225);box(g,.075,.012,.032,orange,.10,1.34,-.24);});
 torso('moss',g=>{vest(g,olive);box(g,.018,.34,.022,dark,0,1.28,-.24);for(const side of[-1,1]){box(g,.115,.125,.065,dark,side*.13,1.22,-.225);box(g,.105,.025,.078,olive,side*.13,1.27,-.23);box(g,.025,.12,.025,ivory,side*.175,1.43,-.18);}});
 torso('noir',g=>{vest(g,black);for(const side of[-1,1]){const harness=box(g,.037,.35,.022,black,side*.14,1.31,-.222);harness.rotation.z=side*.17;const stripe=box(g,.012,.35,.03,cyan,side*.17,1.31,-.226);stripe.rotation.z=side*.17;box(g,.16,.018,.035,cyan,side*.105,1.47,-.20);}box(g,.09,.075,.035,black,.10,1.35,-.248);box(g,.05,.02,.04,cyan,.10,1.36,-.255);});
 torso('sunbeam',g=>{vest(g,ivory);for(const side of[-1,1]){const seam=box(g,.03,.34,.03,gold,side*.15,1.30,-.225);seam.rotation.z=side*.18;box(g,.125,.115,.06,ivory,side*.13,1.20,-.23);box(g,.11,.018,.075,gold,side*.13,1.24,-.238);box(g,.13,.04,.18,gold,side*.22,1.49,-.005);}box(g,.018,.35,.025,gold,0,1.29,-.244);const badge=r.addMesh(new T.OctahedronGeometry(.045),gold,g);badge.scale.z=.4;badge.position.set(.075,1.39,-.265);});
 for(const side of['l','r']){band('moss','thigh_'+side,'calf_'+side,dark,.85,.085,.07);band('noir','upperarm_'+side,'lowerarm_'+side,cyan,.5,.079,.025);band('noir','calf_'+side,'foot_'+side,cyan,.68,.065,.024);band('sunbeam','upperarm_'+side,'lowerarm_'+side,ivory,.5,.084,.09);band('sunbeam','upperarm_'+side,'lowerarm_'+side,gold,.52,.086,.027);band('sunbeam','calf_'+side,'foot_'+side,gold,.7,.067,.04);}
 r.outfitDetails=groups;
}
export function applyOutfitDetails(r,id){for(const [key,groups]of Object.entries(r.outfitDetails||{}))for(const group of groups)group.visible=!r.ghost&&key===id;}
