import * as THREE from './vendor/three.module.js';
// Articulated celestial fox. Each rig owns its resources; no world-space armor.
export function createNovaCompanion(stage=1){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const geos={ball:new THREE.SphereGeometry(1,28,20),horn:new THREE.ConeGeometry(1,1,24),ring:new THREE.TorusGeometry(1,.035,8,48)},materials=new Map();
 const color=stage===3?'#ffe3a1':stage===2?'#c4b8ff':'#9fe9e2',glow=stage===3?'#ffda7c':'#8ef8ec';
 function mat(c,energy=false){const key=c+energy;if(!materials.has(key))materials.set(key,new THREE.MeshPhysicalMaterial({color:c,roughness:energy?.2:.34,metalness:energy?.12:.06,clearcoat:.65,clearcoatRoughness:.23,emissive:c,emissiveIntensity:energy?.38:0}));return materials.get(key);}
 function shape(g,c,x,y,z,sx,sy,sz,energy=false,type='ball'){const m=new THREE.Mesh(geos[type],mat(c,energy));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=!energy;g.add(m);return m;}
 const core=shape(body,color,0,.70,-.05,.45,.43,.72);shape(body,'#f4fff7',0,.63,.35,.36,.36,.52);
 const head=new THREE.Group();head.position.set(0,1.07,.58);body.add(head);
 shape(head,'#f3fff9',0,0,0,.51,.47,.44);shape(head,color,0,.18,-.11,.48,.28,.36);
 shape(head,'#e2fff5',0,-.16,.31,.30,.22,.25);shape(head,'#254f68',0,-.07,.51,.11,.075,.085);
 for(const side of [-1,1]){
  const ear=shape(head,color,side*.34,.50,-.11,.19,.53,.16);ear.rotation.z=-side*.25;
  const inner=shape(head,glow,side*.35,.53,.025,.085,.31,.025,true);inner.rotation.z=-side*.25;
  shape(head,'#29435e',side*.23,.025,.36,.145,.20,.09);shape(head,'#6dcfd4',side*.23,-.015,.44,.085,.11,.025,true);
  shape(head,'#ffffff',side*.19,.10,.445,.046,.058,.025,true);shape(head,'#ffcbd7',side*.36,-.13,.34,.08,.04,.025);
  const cheek=shape(head,color,side*.45,-.10,-.02,.24,.15,.35);cheek.rotation.z=-side*.4;
 }
 // Four independently posed paws and three curved, feather-like tails.
 const legs=[];for(const side of [-1,1])for(const z of [-.45,.36]){const joint=new THREE.Group();joint.position.set(side*.30,.52,z);body.add(joint);shape(joint,color,0,-.13,0,.14,.31,.16);shape(joint,'#f9fff5',0,-.37,.07,.19,.14,.25);legs.push(joint);}
 const tails=[];for(let i=0;i<(stage===1?1:3);i++){
  const tail=new THREE.Group();tail.position.set((i-1)*.15,.72,-.61);body.add(tail);
  const t=shape(tail,color,0,.20,-.40,.24,.30,.61);t.rotation.x=.55;
  const tip=shape(tail,'#fafff2',0,.53,-.78,.18,.21,.31,true);tip.rotation.x=.65;tails.push(tail);
 }
 const wings=[];for(const side of [-1,1]){
  const wing=new THREE.Group();wing.position.set(side*.34,.98,-.15);body.add(wing);wings.push(wing);
  const length=stage===1?.5:stage===2?.95:1.3;
  for(let i=0;i<3;i++){const feather=shape(wing,i===1?'#effff4':i===0?color:glow,side*(.28+i*.22)*length,.13+i*.08,-i*.14,.22*length,.10,.50+length*.20,i===2);feather.rotation.z=-side*(.35+i*.14);feather.rotation.y=-side*.4;}
 }
 const charge=new THREE.Group();charge.position.set(0,.95,.9);body.add(charge);
 const halo=shape(charge,glow,0,0,0,.28,.28,.28,true,'ring');
 const jewel=shape(body,glow,0,1.72,.56,.09,.16,.09,true,'horn');
 let crown;if(stage===3){crown=shape(body,'#ffe4a4',0,1.97,.40,.43,.43,.43,true,'ring');crown.rotation.x=Math.PI/2;for(const side of [-1,1])shape(body,glow,side*.32,2.03,.4,.06,.13,.06,true,'horn');}
 root.scale.setScalar(stage===1?.9:stage===2?1.05:1.18);root.userData.stage=stage;
 return {root,update(time,moving,attacking){
  body.position.y=Math.sin(time*(moving?10:2.4))*(moving?.045:.025);head.rotation.x=Math.sin(time*1.8)*.035;
  legs.forEach((g,i)=>g.rotation.x=moving?Math.sin(time*10+(i===0||i===3?0:Math.PI))*.42:0);
  tails.forEach((g,i)=>{g.rotation.y=Math.sin(time*2.5+i*.8)*.18;g.rotation.z=Math.sin(time*2+i)*.10;});
  wings.forEach((g,i)=>g.rotation.z=(i?1:-1)*(.05+Math.sin(time*(attacking?10:3))*.12));
  charge.visible=attacking;halo.rotation.z=time*5;charge.scale.setScalar(.85+.22*Math.sin(time*13));jewel.position.y=1.72+Math.sin(time*2)*.04;
 },dispose(){root.removeFromParent();for(const g of Object.values(geos))g.dispose();for(const m of materials.values())m.dispose();}};
}
