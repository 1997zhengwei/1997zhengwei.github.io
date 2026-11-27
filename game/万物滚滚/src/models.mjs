import {artMaterial} from './art.mjs';
import * as T from '../vendor/three.module.js';
import {makeBuilder,roundedBox} from './geometry.mjs';
import {ITEMS} from './data.mjs';
const cache=new Map(),materialCache=new Map();
const C={cream:'#fff8df',white:'#ffffff',ink:'#27334f',wood:'#b66a32',leaf:'#35a451',pink:'#f3378a',gold:'#ffcb27',blue:'#3fa6ee'};
export function propGeometry(type){
 if(cache.has(type))return cache.get(type);const b=makeBuilder(),{box:B,sphere:S,cylinder:Y,torus:O,add:A}=b,c=ITEMS[type]?.color||'#e5b76c';
 const eye=(x,y,z,scale=1)=>{S(.035*scale,.048*scale,.02*scale,x,y,z,C.ink);S(.01*scale,.012*scale,.009*scale,x-.01*scale,y+.015*scale,z+.015*scale,C.white);};
 const wheel=(x,y,z,r=.19)=>{Y(r,r,.15,x,y,z,C.ink,[0,0,Math.PI/2],16);Y(r*.55,r*.55,.16,x,y,z,C.cream,[0,0,Math.PI/2],12);};
 if(type==='plate'){
  Y(.9,.87,.045,0,0,0,c);O(.84,.035,0,.03,0,'#83b8c7',[Math.PI/2,0,0]);
 }else if(type==='candy'){
  S(.4,.28,.28,0,0,0,c);for(const x of[-.55,.55]){const g=new T.ConeGeometry(.27,.32,6);A(g,C.cream,x,0,0,[0,0,x<0?-Math.PI/2:Math.PI/2]);}for(const x of[-.19,.16])Y(.285,.285,.1,x,0,0,C.cream,[0,0,Math.PI/2],20);
 }else if(type==='berry'){
  S(.38,.48,.35,0,0,0,c);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;S(.19,.05,.09,Math.cos(a)*.13,.43,Math.sin(a)*.13,C.leaf);}for(let j=0;j<12;j++){const a=j*2.4,y=-.25+(j%4)*.17,r=Math.sqrt(Math.max(.01,1-(y/.5)**2))*.36;S(.022,.035,.015,Math.cos(a)*r,y,Math.sin(a)*r,C.gold);}
 }else if(type==='orange'){
  S(.45,.43,.45,0,0,0,c);Y(.025,.035,.13,0,.45,0,C.wood);S(.17,.027,.07,.12,.47,0,C.leaf);
 }else if(type==='dice'){
  B(.8,.8,.8,0,0,0,C.cream);for(const [x,y]of[[-.21,-.21],[0,0],[.21,.21]])S(.055,.055,.017,x,y,.407,C.ink);for(const x of[-.19,.19])S(.055,.017,.055,x,.407,x,C.ink);for(const y of[-.19,.19])for(const z of[-.19,.19])S(.017,.055,.055,.407,y,z,C.ink);
 }else if(type==='block'){
  B(.9,.6,.72,0,0,0,c);for(const x of[-.22,.22])for(const z of[-.17,.17])Y(.13,.13,.12,x,.35,z,c);B(.54,.025,.42,0,-.31,0,C.cream);
 }else if(type==='pencil'){
  Y(.12,.12,1.4,0,0,0,c,[0,0,Math.PI/2],6);Y(.125,.125,.18,-.75,0,0,C.pink,[0,0,Math.PI/2],10);Y(.129,.129,.1,-.62,0,0,C.cream,[0,0,Math.PI/2],12);A(new T.ConeGeometry(.12,.3,6),C.wood,.85,0,0,[0,0,-Math.PI/2]);A(new T.ConeGeometry(.04,.12,6),C.ink,1.01,0,0,[0,0,-Math.PI/2]);
 }else if(type==='donut'){
  O(.36,.2,0,0,0,'#dca46b',[Math.PI/2,0,0]);O(.36,.175,0,.09,0,c,[Math.PI/2,0,0]);for(let i=0;i<14;i++){const a=i*2.4;B(.035,.03,.1,Math.cos(a)*.38,.25,Math.sin(a)*.38,i%3?C.cream:C.blue,[0,a,0]);}
 }else if(type==='duck'){
  S(.44,.32,.44,0,-.1,0,c);S(.29,.29,.28,0,.27,.19,c);S(.24,.055,.15,0,.21,.46,'#ed9b5c');S(.09,.13,.15,-.37,-.08,.03,'#efc655');S(.09,.13,.15,.37,-.08,.03,'#efc655');eye(-.17,.32,.39);eye(.17,.32,.39);S(.14,.13,.25,0,-.03,-.4,c);
 }else if(type==='cup'){
  Y(.37,.29,.67,0,0,0,c);Y(.34,.34,.02,0,.34,0,C.cream);Y(.28,.28,.025,0,.348,0,'#795c45');O(.21,.055,.43,.02,0,c,[0,Math.PI/2,0]);O(.35,.027,0,.34,0,C.cream,[Math.PI/2,0,0]);B(.16,.13,.02,0,.02,.35,C.cream);
 }else if(type==='book'){
  B(.85,.18,1.1,0,0,0,C.cream);for(const y of[-.13,.13])B(.93,.075,1.16,0,y,0,c);B(.11,.3,1.16,-.42,0,0,c);B(.38,.012,.48,.05,.175,0,C.gold);for(let n=0;n<3;n++)B(.05,.012,.4,-.22+n*.12,.185,0,C.cream);for(let n=0;n<3;n++)B(.78,.012,.02,.03,(n-1)*.04,.553,'#d9d1bd');
 }else if(type==='toycar'||type==='car'||type==='van'){
  const van=type==='van',toy=type==='toycar';B(.84,.35,1.5,0,0,0,c);B(.73,van?.72:.42,van?1.15:.82,0,van?.42:.33,van?-.13:-.12,c);for(const x of[-.46,.46])for(const z of[-.47,.47])wheel(x,-.17,z,.2);B(.64,.21,.023,0,van?.52:.4,.34,C.blue);for(const x of[-.376,.376])B(.022,.22,van?.39:.58,x,van?.51:.4,-.15,C.blue);for(const x of[-.26,.26]){B(.17,.09,.03,x,.04,.77,C.cream);B(.13,.075,.03,x,.04,-.77,C.pink);}B(.74,.065,.09,0,-.12,.79,C.cream);B(.74,.065,.09,0,-.12,-.79,C.cream);if(van){B(.86,.14,1.12,0,.87,-.13,C.cream);O(.18,.07,0,1.04,-.13,C.pink,[0,0,0]);for(const x of[-.43,.43])B(.02,.23,.8,x,.1,-.15,C.cream);}if(toy)B(.17,.035,1.2,0,.2,0,C.cream);
 }else if(type==='ball'){
  S(.5,.5,.5,0,0,0,C.cream);O(.488,.027,0,0,0,c,[0,0,0]);O(.488,.027,0,0,0,C.pink,[0,Math.PI/2,0]);O(.488,.027,0,0,0,C.gold,[Math.PI/2,0,0]);
 }else if(type==='plant'){
  Y(.3,.21,.44,0,-.24,0,'#c66f38');Y(.32,.32,.1,0,-.02,0,'#eb9343');Y(.26,.26,.02,0,.035,0,'#6f6650');for(let i=0;i<7;i++){const a=i*2.4;S(.12,.3,.09,Math.cos(a)*.19,.23+i%2*.07,Math.sin(a)*.19,i%2?'#6bc33c':'#249d4e');}Y(.028,.035,.45,0,.18,0,C.leaf);
 }else if(type==='bear'){
  S(.3,.38,.23,0,-.03,0,c);S(.34,.3,.26,0,.43,0,c);for(const sign of[-1,1]){S(.13,.14,.09,sign*.26,.68,0,c);S(.075,.08,.035,sign*.26,.68,.075,'#e8c2a0');S(.12,.21,.13,sign*.32,.03,.03,c);S(.15,.14,.19,sign*.18,-.37,.06,c);eye(sign*.12,.47,.247);}S(.18,.12,.1,0,.34,.235,'#eac7a0');S(.065,.045,.025,0,.39,.335,C.ink);S(.2,.24,.03,0,-.06,.22,'#eac7a0');B(.39,.075,.06,0,.17,.25,C.pink);
 }else if(type==='chair'){
  B(.8,.12,.8,0,-.02,0,c);for(const x of[-.29,.29])for(const z of[-.29,.29])Y(.042,.05,.7,x,-.4,z,C.wood);for(const x of[-.31,.31])Y(.05,.05,.9,x,.4,-.32,C.wood);B(.76,.42,.1,0,.57,-.32,c);B(.64,.055,.58,0,.065,.04,C.cream);
 }else if(type==='lamp'){
  Y(.32,.35,.09,0,-.52,0,c);Y(.045,.065,.77,0,-.1,0,'#b9966e');A(new T.SphereGeometry(.48,24,12,0,Math.PI*2,0,Math.PI/2),c,0,.23,0);Y(.48,.48,.04,0,.22,0,C.cream);S(.1,.06,.1,0,.7,0,c);
 }else if(type==='bin'){
  Y(.32,.28,.79,0,0,0,c);Y(.35,.35,.09,0,.43,0,C.ink);Y(.23,.23,.025,0,.48,0,'#668789');B(.23,.2,.025,0,.02,.32,C.cream);for(const x of[-.31,.31])B(.07,.14,.25,x,.25,0,c);for(let i=0;i<8;i++){const a=i*Math.PI/4;Y(.012,.012,.59,Math.sin(a)*.315,-.01,Math.cos(a)*.315,'#75bab6');}
 }else if(type==='bush'||type==='tree'){
  const tree=type==='tree';Y(tree?.1:.05,tree?.16:.08,tree?1.05:.3,0,tree?-.24:-.3,0,C.wood);for(let i=0;i<5;i++){const a=i*2.4;S(.32+(i===0?.1:0),.35,.31,Math.cos(a)*.22,tree?.36+i%2*.17:-.03+i%2*.1,Math.sin(a)*.21,i%2?'#80c839':'#36a44e');}if(tree)for(let i=0;i<5;i++){const a=i*2.4;S(.045,.05,.045,Math.cos(a)*.43,.38,Math.sin(a)*.4,'#eaa174');}
 }else if(type==='bench'){
  for(let n=0;n<4;n++)B(1.5,.07,.12,0,-.08,(n-1.5)*.14,C.wood);for(let n=0;n<3;n++)B(1.5,.1,.07,0,.18+n*.13,-.26,C.wood);for(const x of[-.53,.53]){Y(.04,.04,.53,x,-.36,-.2,C.ink);Y(.04,.04,.53,x,-.36,.2,C.ink);Y(.04,.04,.73,x,.14,-.3,C.ink);B(.05,.06,.58,x,.14,0,C.ink);}
 }else if(type==='scooter'){
  for(const z of[-.39,.4])wheel(0,-.3,z,.23);B(.4,.25,.7,0,-.05,-.14,c);B(.43,.1,.5,0,.14,-.18,C.ink);Y(.045,.045,.7,0,.19,.4,C.cream,[-.18,0,0]);Y(.045,.045,.5,0,.55,.34,C.ink,[0,0,Math.PI/2]);B(.32,.46,.11,0,.13,.35,c);S(.09,.1,.04,0,.35,.43,C.cream);
 }else if(type==='planet'){
  S(.48,.48,.48,0,0,0,c);S(.19,.055,.16,.1,.4,.15,'#8bb57d');S(.14,.22,.055,-.2,.06,.42,'#8bb57d');O(.67,.033,0,0,0,'#e8c872',[.45,0,.15]);B(.19,.17,.17,.12,.56,-.08,'#f0d1a7');for(const sign of[-1,1])B(.16,.035,.23,.12+sign*.06,.68,-.08,'#d78c7b',[0,0,-sign*.55]);Y(.022,.032,.2,-.19,.52,-.04,'#a08052');S(.1,.13,.09,-.19,.68,-.04,'#8dab72');S(.035,.035,.035,.63,.18,.07,'#fff2cc');
 }else if(type==='rocket'){
  Y(.22,.25,.9,0,0,0,'#fff2d7');A(new T.ConeGeometry(.22,.4,20),c,0,.65,0);Y(.225,.225,.14,0,-.23,0,c);Y(.17,.21,.16,0,-.52,0,'#b9c3b7');for(let i=0;i<3;i++){const a=i*Math.PI*2/3;B(.12,.4,.27,Math.cos(a)*.24,-.35,Math.sin(a)*.24,c,[0,-a,.15]);}S(.12,.12,.04,0,.15,.223,'#79b7c6');O(.12,.022,0,.15,.245,'#dbb967');A(new T.ConeGeometry(.11,.28,12),'#f1c56c',0,-.73,0,[Math.PI,0,0]);
 }else if(type==='gramophone'){
  B(.84,.25,.71,0,-.38,0,'#bf946b');B(.9,.07,.76,0,-.22,0,'#dfbd83');Y(.27,.27,.026,-.1,-.168,.03,'#42625a');Y(.055,.055,.03,-.1,-.15,.03,'#e9cf91');Y(.045,.045,.55,.27,.08,-.19,'#bfa05d');A(new T.CylinderGeometry(.33,.08,.53,24,1,true),'#dcb969',.24,.4,-.03,[.85,0,-.15]);O(.33,.025,.24,.58,.17,'#f0d995',[.85,0,-.15]);Y(.04,.04,.32,.2,-.02,.09,'#bda77d',[.8,0,0]);for(const x of[-.3,.3])for(const z of[-.22,.22])S(.06,.045,.06,x,-.54,z,'#836f54');
 }else if(type==='house'){
  B(1.2,.96,.94,0,-.08,0,c);for(const sign of[-1,1])B(.78,.1,1.18,sign*.3,.63,0,'#de4c3e',[0,0,sign*-.62]);B(.26,.5,.035,.25,-.28,.49,'#267ab7');B(.3,.32,.035,-.27,.01,.49,C.cream);B(.24,.26,.045,-.27,.01,.51,C.blue);B(.025,.3,.04,-.27,.01,.545,C.cream);B(.27,.025,.04,-.27,.01,.545,C.cream);B(.2,.4,.21,.3,.74,-.19,'#fff0b3');B(1.33,.12,1.07,0,-.61,0,C.cream);S(.025,.025,.025,.34,-.26,.53,C.gold);for(const x of[-.32,.32])S(.15,.12,.13,x,-.51,.63,C.leaf);
 }
 const geometry=b.finish({normalize:true});geometry.computeVertexNormals();geometry.userData.bottom=-geometry.boundingBox.min.y;cache.set(type,geometry);return geometry;
}
export function propMaterial(type){if(materialCache.has(type))return materialCache.get(type);const material=artMaterial({vertexColors:true,flatShading:true});materialCache.set(type,material);return material;}
export function createCharacter(color='#73b8aa',accent='#f1cc63',lookId='citrus'){
 const root=new T.Group(),torso=new T.Group(),limbs=[],skin=artMaterial({color:'#fff0cf',roughness:.65}),cloth=artMaterial({color,roughness:.65}),trim=artMaterial({color:accent,roughness:.4}),ink=artMaterial({color:C.ink,roughness:.45});root.add(torso);
 const mesh=(g,m,x,y,z,parent=torso)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 mesh(new T.CapsuleGeometry(.2,.29,5,14),cloth,0,.43,0);mesh(new T.SphereGeometry(.3,22,16),skin,0,.96,.02);const hat=mesh(new T.SphereGeometry(.32,22,14,0,Math.PI*2,0,Math.PI*.51),trim,0,1.01,.02);mesh(new T.CylinderGeometry(.34,.34,.065,24),trim,0,1.01,.02);const antenna=mesh(new T.CapsuleGeometry(.025,.2,4,8),cloth,.1,1.37,0);antenna.rotation.z=-.25;mesh(new T.SphereGeometry(.075,12,10),trim,.13,1.52,0);
 for(const sign of[-1,1]){mesh(new T.SphereGeometry(.037,12,10),ink,sign*.11,.945,.306);mesh(new T.SphereGeometry(.046,12,10),artMaterial({color:'#e9a79a',roughness:.8}),sign*.19,.88,.26);const leg=new T.Group();root.add(leg);leg.position.set(sign*.12,.3,0);mesh(new T.CapsuleGeometry(.075,.2,4,10),cloth,0,-.12,0,leg);mesh(new T.SphereGeometry(.1,12,10),trim,0,-.27,.06,leg);limbs.push(leg);const arm=new T.Group();torso.add(arm);arm.position.set(sign*.2,.62,.03);mesh(new T.CapsuleGeometry(.065,.23,4,10),cloth,0,-.11,.04,arm);mesh(new T.SphereGeometry(.075,12,10),skin,0,-.27,.07,arm);arm.rotation.x=-.95;arm.rotation.z=sign*-.24;limbs.push(arm);}
 const smile=mesh(new T.TorusGeometry(.052,.009,6,16,Math.PI),ink,0,.875,.31);smile.rotation.z=Math.PI;const bag=mesh(roundedBox(.31,.32,.17),trim,0,.52,-.21);mesh(roundedBox(.22,.08,.035),cloth,0,.55,-.31);const ornaments=new T.Group();torso.add(ornaments);const character={root,torso,limbs,hat,bag,cloth,trim,ornaments,lookId:null};dressCharacter(character,lookId);return character;
}
export function dressCharacter(character,id){
 if(character.lookId===id)return;character.lookId=id;for(const child of [...character.ornaments.children]){child.geometry?.dispose();child.material?.dispose();character.ornaments.remove(child);}const b=makeBuilder(),{box:B,sphere:S,cylinder:Y,torus:O,add:A}=b;
 if(id==='soda'){for(const sign of[-1,1]){S(.065,.11,.06,sign*.27,1.27,.02,'#c6ede5');Y(.04,.055,.22,sign*.27,1.15,.02,'#7bbfb6');}O(.115,.018,0,.57,-.32,'#e1f6ec',[0,0,0]);S(.07,.09,.07,0,.55,-.35,'#e9f7ed');}
 if(id==='berry'){for(let i=0;i<6;i++){const a=i*Math.PI/3;S(.12,.035,.06,Math.cos(a)*.11,1.33,Math.sin(a)*.11,'#719c63');}for(const sign of[-1,1]){S(.09,.1,.07,sign*.28,1.05,.07,'#eb9aae');S(.023,.025,.018,sign*.28,1.1,.127,'#f6dfa3');}B(.29,.08,.045,0,.74,.22,'#e786a4');}
 if(id==='violet'){A(new T.ConeGeometry(.22,.42,20),'#a68ac8',0,1.39,.02);O(.19,.03,0,1.25,.02,'#e9cf80',[Math.PI/2,0,0]);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;A(new T.ConeGeometry(.027,.12,3),'#f4da83',Math.sin(a)*.1,1.59+Math.cos(a)*.1,.12,[0,0,-a]);}B(.35,.4,.035,0,.44,-.33,'#c8b3df');for(const sign of[-1,1])S(.045,.045,.045,sign*.22,.72,-.2,'#f0db96');}
 if(id==='sunset'){Y(.45,.45,.035,0,1.04,.02,'#f3cd92');O(.29,.035,0,1.12,.02,'#e58b75',[Math.PI/2,0,0]);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;S(.043,.043,.025,.27+Math.cos(a)*.057,1.17+Math.sin(a)*.057,.2,'#fff1cf');}S(.038,.038,.028,.27,1.17,.22,'#dfb45c');B(.38,.085,.055,0,.75,.18,'#dd8775');B(.09,.24,.035,.18,.62,.24,'#dd8775',[0,0,-.22]);}
 if(id==='royal'){Y(.31,.32,.12,0,1.19,.02,'#deb354');for(let i=0;i<7;i++){const a=i*Math.PI*2/7;A(new T.ConeGeometry(.065,.23,4),'#e7bf65',Math.sin(a)*.26,1.35,.02+Math.cos(a)*.26);S(.035,.035,.035,Math.sin(a)*.26,1.48,.02+Math.cos(a)*.26,i%2?'#bbd5b2':'#fff2c9');}for(const sign of[-1,1])for(let i=0;i<3;i++)S(.075,.2,.025,sign*(.18+i*.08),.58+i*.05,-.32,'#f1d997');O(.13,.026,0,.52,-.34,'#d9ae59',[0,0,0]);}
 if(b.parts.length){const mesh=new T.Mesh(b.finish(),artMaterial({vertexColors:true,roughness:.45,clearcoat:.24}));mesh.castShadow=mesh.receiveShadow=true;character.ornaments.add(mesh);}
}
export function poseCharacter(character,time,speed=0,air=false){const a=time*(7+Math.min(10,speed*.4)),move=Math.min(1,speed*.2);character.limbs.forEach((limb,i)=>{if(i%2===0)limb.rotation.x=air?-.4:Math.sin(a+(i?Math.PI:0))*.65*move;else limb.rotation.x=-1.05+Math.sin(a+i)*.12*move;});character.torso.rotation.x=air?-.22:.18;character.torso.position.y=Math.abs(Math.sin(a))*.025*move;}
