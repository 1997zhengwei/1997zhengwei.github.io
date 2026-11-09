import * as THREE from './vendor/three.module.js';
export const MONSTER_REGIONS=[
 {name:'Bud Nibbler',family:'Soft shell',color:'#d99591',shell:'#ecb8a7',ink:'#6e5b72',core:'#ffcd83',bar:'#f4be82',role:'scout',description:'A small, soft creature with round feet and no armor.'},
 {name:'Dune Stinger',family:'Barbed carapace',color:'#b76b49',shell:'#df9b5c',ink:'#65464f',core:'#ffd37b',bar:'#efa46c',role:'runner',description:'A low scuttler with a segmented tail, pincers and a harder shell.'},
 {name:'Prism Mantis',family:'Crystal blades',color:'#9160b7',shell:'#c292d6',ink:'#4b3d72',core:'#f2a8e3',bar:'#dc8db5',role:'spitter',description:'Tall crystal limbs and hooked forearms signal a more dangerous hunter.'},
 {name:'Frost Bulwark',family:'Layered armor',color:'#526c9f',shell:'#91b9ce',ink:'#343e67',core:'#ff9b9a',bar:'#bd8ddb',role:'shield',description:'A heavy, low body wrapped in layered ice plates and forward armor.'},
 {name:'Scrap Walker',family:'Mechanized weaponry',color:'#465165',shell:'#ad7960',ink:'#252f47',core:'#ff966d',bar:'#f28d82',role:'artillery',description:'An angular machine on jointed legs, with a red visor and exposed weapon mounts.'},
 {name:'Void Ravager',family:'Elite spines',color:'#44334f',shell:'#79516f',ink:'#231f37',core:'#ff648f',bar:'#ff6b86',role:'brute',description:'Dark layered plates, a raised crown of spines and a hot core mark the strongest frontier.'},
 {name:'Relay Sentry',family:'Survey automaton',color:'#719f9f',shell:'#e1ece5',ink:'#39465e',core:'#8effdf',bar:'#a0e5d4',role:'shield',description:'A four-legged survey machine with a luminous ring receiver and armored instrument panels.'},
 {name:'Railbreaker',family:'Tracked machinery',color:'#668db2',shell:'#c8e3ef',ink:'#35445c',core:'#a2eaff',bar:'#a8d7fa',role:'spitter',description:'Exposed wheel hubs, a broad engine block and a raised weapon mount guard the transport rail.'},
 {name:'Vault Automaton',family:'Mechanical core',color:'#9a8bb9',shell:'#e6ddec',ink:'#403e5b',core:'#e4b3ff',bar:'#d5b2f5',role:'artillery',description:'Jointed mechanical legs, shoulder armor and a bright chest core identify a vault defender.'},
];
export const ENEMY_ROLES={scout:{name:'Brawler',icon:'●',hint:'Close-range attacker.'},runner:{name:'Runner',icon:'➤',hint:'Fast pursuit. Keep moving.'},brute:{name:'Heavy',icon:'◆',hint:'More health and a larger body.'},spitter:{name:'Spitter',icon:'◉',hint:'A visible pressure pod marks ranged attacks.'},shield:{name:'Shield',icon:'⬡',hint:'Front plate reduces damage. Flank it or use Rail.'},support:{name:'Support',icon:'✚',hint:'The beacon heals nearby enemies. Focus it first.'},artillery:{name:'Artillery',icon:'⌁',hint:'The raised cannon targets marked ground.'}};
export function buildEnemyRig(enemy,{part,optimizeTree}){
 const zone=Math.max(0,Math.min(MONSTER_REGIONS.length-1,enemy.zone||0)),type=ENEMY_ROLES[enemy.type]?enemy.type:'scout',c=MONSTER_REGIONS[zone],root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const r=[.43,.49,.53,.60,.64,.71,.65,.68,.70][zone],heavy=type==='brute',roleScale=heavy?1.24:1;body.scale.set(roleScale,type==='runner'?.84:roleScale,roleScale);
 const finishFor=color=>color===c.ink?'rubber':color===c.core?'energy':color===c.color&&zone<2?'skin':zone===4||zone>=6?'metal':'shell';
 const p=(shape,color,x,y,z,sx,sy=sx,sz=sx,glow=0,finish=finishFor(color))=>part(body,shape,color,x,y,z,sx,sy,sz,glow,finish);
 const box=(color,x,y,z,w,h,d,glow=0,finish=finishFor(color))=>p('round',color,x,y,z,w,h,d,glow,finish);
 function eyes(y,z,wide=.2){for(const side of [-1,1]){
  p('ball',c.ink,side*wide,y+.01,z-.018,.115,.125,.063);
  p('ball','#fff3df',side*wide,y,z,.095,.105,.060,0,'lens');
  p('ball',c.ink,side*wide,y+.005,z+.051,.049,.065,.026,0,'lens');
  p('ball','#fff3df',side*wide-.015,y+.035,z+.075,.018,.023,.009,0,'lens');
 }}
 function feet(y=.16){for(const side of [-1,1])for(const k of [-1,1]){const leg=box(c.ink,side*r*.93,y,k*r*.53,.30,.13,.18);leg.rotation.z=side*.23;p('cone',c.shell,side*r*1.10,y-.02,k*r*.53,.09,.14,.09)}}
 if(zone===0){
  p('ball',c.color,0,.45,0,r,.39,r);p('ball',c.shell,0,.60,-.06,r*.83,.30,r*.76);eyes(.49,.38,.17);
  p('ball','#f5cfb9',0,.31,.31,.27,.18,.13,0,'skin');
  for(const side of [-1,1])for(const k of [-1,1])p('ball',c.ink,side*.33,.12,k*.24,.16,.10,.15);
  p('ball',c.color,0,.84,-.05,.11,.18,.10);p('ball',c.core,0,1.00,-.05,.075,.075,.075,.08);
  box(c.ink,0,.29,.39,.19,.045,.035);for(const side of [-1,1])p('ball',c.shell,side*.30,.36,.32,.13,.09,.10);
 }
 if(zone===1){
  p('rock',c.ink,0,.40,0,r*.98,.36,r*1.18);p('ball',c.color,0,.55,0,r*.99,.34,r*1.12);
  for(const side of [-1,1]){p('ball',c.shell,side*.21,.67,-.10,.24,.18,.46);box(c.ink,side*.025,.78,-.1,.023,.015,.61)}eyes(.46,.47,.18);feet();
  for(let i=0;i<3;i++){p('ball',i%2?c.color:c.shell,0,.50+i*.18,-.48-i*.14,.16-i*.025,.16,.16-i*.025)}
  const tail=p('cone',c.core,0,1.17,-.72,.12,.30,.12);tail.rotation.x=.7;
  for(const side of [-1,1]){const arm=box(c.ink,side*.46,.38,.42,.14,.14,.48);arm.rotation.y=side*.35;p('cone',c.shell,side*.58,.46,.69,.13,.32,.13).rotation.x=Math.PI/2}
 }
 if(zone===2){
  p('rock',c.color,0,.60,-.04,r*.76,.53,r*.72);p('ball',c.shell,0,1.02,.07,.31,.34,.29);box(c.ink,0,1.04,.34,.45,.12,.06);eyes(1.05,.38,.14);
  for(const side of [-1,1]){p('crystal',c.shell,side*.25,1.20,-.04,.12,.29,.16);p('ball',c.core,side*.38,.73,.12,.13,.14,.13,.07)}
  for(const side of [-1,1])for(const k of [-1,1]){const leg=box(c.ink,side*.44,.26,k*.29,.12,.48,.13);leg.rotation.z=side*.30;p('cone',c.shell,side*.57,.10,k*.32,.10,.20,.1)}
  for(const side of [-1,1]){const claw=p('crystal',c.shell,side*.45,.73,.39,.13,.52,.18);claw.rotation.z=-side*.50;const hook=p('cone',c.ink,side*.59,.48,.49,.11,.30,.11);hook.rotation.x=Math.PI/2;const crown=p('crystal',c.core,side*.18,1.40,-.02,.11,.28,.11,.1);crown.rotation.z=-side*.3}
 }
 if(zone===3){
  p('rock',c.ink,0,.49,0,r,.44,r);for(let i=-1;i<=1;i++){const shell=box(i===0?c.color:c.shell,0,.76-Math.abs(i)*.06,i*.27,1.07,.33,.34);shell.rotation.x=i*.13}
  for(const side of [-1,1]){box(c.color,side*.60,.28,.18,.35,.32,.44);p('cone',c.shell,side*.40,1.10,-.10,.17,.40,.17);p('ball',c.core,side*.49,.79,.36,.08,.08,.045,.05)}eyes(.51,.58,.22);feet(.14);
  box(c.core,0,.74,.55,.36,.07,.04,.10);
 }
 if(zone===4){
  box(c.ink,0,.81,0,1.00,.72,.77);box(c.color,0,1.12,-.02,1.08,.23,.86);box(c.shell,0,.89,-.44,.66,.47,.19);
  for(const side of [-1,1])for(const k of [-1,1]){const leg=box(c.ink,side*.47,.34,k*.30,.18,.64,.18);leg.rotation.z=side*.19;box(c.shell,side*.54,.11,k*.32,.34,.14,.30);p('ball',c.shell,side*.49,.57,k*.30,.13,.13,.13)}
  box('#1c2034',0,.95,.405,.81,.27,.07,0,'lens');box(c.core,0,.97,.455,.65,.075,.035,.15);
  for(const side of [-1,1]){box(c.shell,side*.49,1.0,.17,.09,.35,.45);p('ball','#d0b5a2',side*.46,1.10,.39,.038,.038,.025,0,'metal');for(let i=0;i<3;i++)box(c.ink,side*.514,.83+i*.065,-.12,.025,.025,.25)}
  box(c.ink,.26,1.39,-.18,.055,.42,.055);p('ball',c.core,.26,1.61,-.18,.08,.08,.08,.1);
 }
 if(zone===5){
  p('rock',c.ink,0,.58,0,r,.58,r*.96);p('rock',c.color,0,.79,-.08,r*.92,.42,r*.86);
  for(let i=-1;i<=1;i++){const plate=box(c.shell,0,.90-Math.abs(i)*.11,i*.26,1.0-Math.abs(i)*.10,.23,.32);plate.rotation.x=i*.2}
  for(const side of [-1,1])for(let j=0;j<3;j++){const a=j*Math.PI/3,spine=p('cone',j===1?c.core:c.color,side*(.32+j*.12),1.12-Math.abs(j-1)*.05,-.30+j*.18,.13,.44,.13,j===1?.12:0);spine.rotation.z=-side*.32;const leg=box(c.ink,side*.67,.20,(j-1)*.37,.28,.18,.17);leg.rotation.z=side*.27;p('cone',c.shell,side*.78,.12,(j-1)*.37,.09,.23,.09)}
  box(c.ink,0,.66,.65,.75,.29,.12);for(const side of [-1,1]){const eye=box(c.core,side*.19,.73,.73,.22,.065,.04,.2);eye.rotation.z=side*.2;p('ball',c.shell,side*.43,.53,.47,.19,.20,.21)}for(let j=-1;j<=1;j++)p('cone','#e4b9c5',j*.16,.48,.71,.07,.18,.07).rotation.z=Math.PI;
  p('crystal',c.core,0,1.37,-.02,.17,.28,.17,.16);
 }
 if(zone===6){
  box(c.ink,0,.70,0,.78,.58,.76);box(c.shell,0,.81,-.02,.85,.46,.82);box(c.color,0,1.10,-.02,.91,.15,.88);
  for(const side of [-1,1])for(const k of [-1,1]){const leg=box(c.ink,side*.43,.35,k*.31,.13,.65,.13);leg.rotation.z=side*.24;box(c.shell,side*.51,.12,k*.32,.25,.15,.29);p('ball',c.color,side*.43,.60,k*.31,.13,.13,.13)}
  box(c.ink,0,.87,.43,.70,.23,.065);box(c.core,0,.87,.48,.53,.08,.03,.17);
  p('cylinder',c.ink,0,1.30,-.1,.055,.4,.055);p('hex',c.shell,0,1.48,-.1,.38,.09,.38);p('hex',c.core,0,1.54,-.1,.25,.03,.25,.12);
  for(const side of [-1,1]){const panel=box(c.color,side*.59,.85,-.11,.30,.12,.65);panel.rotation.z=side*-.3;box(c.core,side*.61,.93,-.11,.17,.025,.49,.08)}
 }
 if(zone===7){
  box(c.ink,0,.49,0,1.05,.55,1.06);box(c.shell,0,.85,-.10,1.00,.38,.98);box(c.color,0,1.09,-.12,.77,.19,.74);
  for(const side of [-1,1])for(const z of [-.34,.34]){const wheel=p('cylinder',c.ink,side*.54,.27,z,.25,.19,.25);wheel.rotation.z=Math.PI/2;const hub=p('cylinder',c.shell,side*.65,.27,z,.14,.03,.14);hub.rotation.z=Math.PI/2}
  box(c.ink,0,.77,.45,.72,.34,.10);box(c.core,0,.79,.52,.55,.12,.035,.14);for(const side of [-1,1]){box(c.color,side*.41,1.04,.17,.17,.34,.54);box(c.ink,side*.32,.91,-.62,.20,.30,.12)}
  p('cylinder',c.ink,0,1.35,-.20,.13,.48,.13);p('hex',c.shell,0,1.61,-.20,.25,.16,.25);p('hex',c.core,0,1.71,-.20,.15,.04,.15,.14);
 }
 if(zone===8){
  box(c.ink,0,.96,0,.83,.86,.65);box(c.shell,0,1.32,-.03,.93,.23,.76);box(c.color,0,.93,-.40,.69,.66,.18);
  for(const side of [-1,1]){box(c.ink,side*.30,.38,0,.20,.69,.28);p('ball',c.color,side*.30,.69,0,.15,.15,.15);box(c.shell,side*.34,.12,.10,.40,.20,.49);box(c.shell,side*.60,1.10,-.02,.32,.39,.56);box(c.ink,side*.62,.73,.06,.21,.44,.27)}
  const core=p('hex',c.ink,0,.98,.37,.28,.10,.28);core.rotation.x=Math.PI/2;p('crystal',c.core,0,.98,.46,.18,.25,.075,.20);
  box(c.ink,0,1.56,-.05,.58,.31,.48);box(c.shell,0,1.75,-.05,.65,.10,.55);box(c.core,0,1.58,.22,.44,.07,.045,.16);
  for(const side of [-1,1]){const fin=box(c.color,side*.57,1.44,-.15,.14,.44,.27);fin.rotation.z=-side*.22;box(c.core,side*.58,1.46,.01,.065,.28,.035,.12)}
 }
 // The role overlays retain a consistent visual language across all regions.
 if(type==='runner'){for(const side of [-1,1]){const fin=box(c.shell,side*r*.67,.65,-.38,.12,.33,.46);fin.rotation.z=side*.42}box(c.core,0,.54,-.67,.13,.09,.26,.08)}
 if(type==='brute'){for(const side of [-1,1]){box(c.ink,side*r*.72,.67,.16,.32,.48,.55);box(c.shell,side*r*.72,.91,.16,.34,.16,.52);p('cone',c.core,side*r*.65,1.12,.17,.12,.38,.12)}box(c.ink,0,.42,.64,.75,.30,.18)}
 if(type==='shield'){box(c.ink,0,.65,.66,1.22,1.05,.17);box(c.shell,0,.70,.77,1.08,.84,.09);box(c.core,0,.71,.83,.70,.09,.045,.16);for(const side of [-1,1]){box(c.ink,side*.45,.66,.84,.10,.73,.04);p('crystal',c.core,side*.43,1.12,.79,.09,.17,.05,.08)}}
 if(type==='spitter'){for(const side of [-1,1])p('ball',c.core,side*.23,1.05,-.29,.23,.29,.24,.05);p('ball',c.shell,0,.98,-.39,.27,.25,.27);const nozzle=p('cylinder',c.ink,0,.90,.56,.12,.40,.12);nozzle.rotation.x=Math.PI/2;p('ball',c.core,0,.90,.77,.105,.105,.04,.15)}
 if(type==='support'){box(c.ink,0,1.26,-.31,.085,.90,.085);const beacon=new THREE.Group();beacon.position.set(0,1.75,-.31);body.add(beacon);part(beacon,'round',c.ink,0,0,0,.54,.54,.12,0,'rubber');part(beacon,'round','#ffc2d7',0,0,.09,.36,.10,.045,.16,'energy');part(beacon,'round','#ffc2d7',0,0,.09,.10,.36,.045,.16,'energy');for(const side of [-1,1]){p('ball',c.core,side*.40,1.19,-.29,.17,.17,.17,.08);box(c.shell,side*.44,.84,-.27,.22,.30,.28)}}
 if(type==='artillery'){box(c.shell,0,.96,-.31,.76,.46,.76);const barrel=p('cylinder',c.ink,0,1.31,.04,.20,.87,.20);barrel.rotation.x=Math.PI/4;const rim=p('muzzle',c.shell,0,1.61,.35,.24,.13,.24);rim.rotation.x=Math.PI/4;const bore=p('ball',c.ink,0,1.65,.39,.155,.018,.155,0,'rubber');bore.rotation.x=Math.PI/4;const core=p('ball',c.core,0,1.665,.405,.074,.012,.074,.12);core.rotation.x=Math.PI/4;for(const side of [-1,1])box(c.shell,side*.48,.80,-.35,.25,.55,.36)}
 optimizeTree(root);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),height=bounds.max.y;
 return {root,zone,type,height,barColor:c.bar,threat:zone+1,bounds};
}
