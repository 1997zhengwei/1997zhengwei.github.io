import {THREE,box,ball,cylinder,rod,group,mesh,material} from './world.mjs?v=elastic-2';
// Costumes are model-local children. They follow all swings without touching physics.
const teal='#188d9a',orange='#ee9164',white='#fff7df',navy='#28606c';
function recolor(root,from,to,hide=false){root.traverse(o=>{if(!o.isMesh||!o.material?.color||o.material.color.getHexString()!==from.replace('#',''))return;if(hide){o.visible=false;return;}o.material=o.material.clone();o.material.color.set(to);});}
function number(parent,text,pos,size){const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');x.fillStyle=white;x.font='900 89px Trebuchet MS';x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,69);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=mesh(parent,new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:.8}),pos);m.castShadow=false;return m;}
function sneakers(parent,x,y,z,width=.2){const shoe=group(parent,[x,y,z]);ball(shoe,width,white,[0,0,0],[1.2,.55,1.55]);box(shoe,[width*2.4,.065,width*2.9],navy,[0,-width*.32,.01],.045);box(shoe,[width*.8,.065,width*1.6],orange,[width*.7,.025,.015],.02);for(let i=0;i<3;i++)rod(shoe,[-width*.4,.09,.07-i*.07],[width*.45,.09,.07-i*.07],.012,navy);return shoe;}
export function dressSponge(model){
 const kit=group(model);kit.name='SpongeBob sea-track sportswear';
 recolor(model,'#a86d43',teal);recolor(model,'#5e4633',navy);recolor(model,'#cb5948',teal,true);recolor(model,'#243b39',white);recolor(model,'#ce6254',orange);
 // The shirt sits below the mouth, keeping the familiar silhouette and expression.
 box(kit,[1.7,.29,.7],teal,[0,1.01,0],.035);
 box(kit,[1.72,.065,.73],orange,[0,1.17,0],.02);
 for(const side of [-1,1]){
  box(kit,[.1,.37,.025],white,[side*.65,.65,.38],.012);
  box(kit,[.17,.29,.026],white,[side*.69,1.01,.38],.015);
  const leg=model.userData.legs[side===-1?0:1];
  cylinder(leg,.082,.082,.15,white,[0,-.16,.02]);
  cylinder(leg,.085,.085,.035,teal,[0,-.13,.02]);
  sneakers(leg,0,-.49,.14,.18);
 }
 number(kit,'01',[0,1.015,.377],.23);
 // Sweatband behind the eyelashes, with a tied end on the side.
 box(kit,[1.76,.135,.07],teal,[0,2.57,.402],.025);
 for(const side of [-1,1])box(kit,[.07,.135,.75],teal,[side*.865,2.57,.02],.025);
 box(kit,[1.74,.035,.018],white,[0,2.575,.445],.008);
 const tail=box(kit,[.1,.3,.11],orange,[.91,2.47,-.08],.025);tail.rotation.z=.4;
 ball(kit,.1,orange,[.91,2.56,-.08],[1,.8,.8]);
 model.userData.arms?.forEach(arm=>{cylinder(arm,.09,.09,.13,teal,[Math.sign(arm.position.x)*.16,-.39,.065]);cylinder(arm,.092,.092,.035,white,[Math.sign(arm.position.x)*.16,-.39,.065]);});
 return kit;
}
export function dressPatrick(model){
 const kit=group(model);kit.name='Patrick sea-track sportswear';
 recolor(model,'#b5cf72',teal);recolor(model,'#947bb3',teal,true);
 // A cropped running singlet follows his round belly, below the eyes and smile.
 ball(kit,.73,orange,[0,.91,.02],[1.03,.45,.8]);
 cylinder(kit,.61,.74,.42,orange,[0,.89,0],24);
 for(const side of [-1,1]){
  const strap=box(kit,[.18,.38,.12],orange,[side*.46,1.15,.4],.05);strap.rotation.z=side*-.28;
  box(kit,[.09,.19,.03],white,[side*.53,.5,.56],.02);
  const wrist=cylinder(kit,.19,.19,.15,teal,[side*1.25,1.21,.015]);wrist.rotation.z=Math.PI/2-side*.25;
  const trim=cylinder(kit,.193,.193,.035,white,[side*1.26,1.21,.015]);trim.rotation.copy(wrist.rotation);
  const leg=model.userData.legs[side===-1?0:1];
  cylinder(leg,.14,.14,.14,white,[0,-.54,.1]);
  sneakers(leg,0,-.63,.2,.23);
 }
 box(kit,[1.03,.06,.025],white,[0,.73,.62],.02);
 number(kit,'02',[0,1.015,.75],.3);
 cylinder(kit,.2,.25,.14,teal,[.02,2.15,.015],24);
 box(kit,[.35,.033,.018],white,[.02,2.15,.24],.006);
 ball(kit,.065,orange,[.25,2.16,.015]);const end=box(kit,[.075,.24,.065],orange,[.29,2.06,.015],.02);end.rotation.z=.3;
 return kit;
}
