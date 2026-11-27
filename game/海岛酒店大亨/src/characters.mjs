import * as T from '../vendor/three.module.js';
import {M,mat,box,sphere,cylinder,torus,batchColors} from './art.mjs';
import {floorHeightAt} from './presentation.mjs';
import {guestAppearance} from './guest-looks.mjs';

let shadowMap,portraitRenderer;
const portraits=new Map();
const staffLooks={
 owner:{skin:'#f0bd94',hair:'#52342b',hairStyle:'wavy',top:'#ed266f',bottom:'#b62b67',accent:'#ffcf57',shape:'uniform',hat:'bellhop',height:1.08,build:1.02},
 cleaner:{skin:'#c98c61',hair:'#4b302b',hairStyle:'bun',top:'#2a8df0',bottom:'#245ab8',accent:'#ffd348',shape:'apron',height:1.01,build:1.02},
 receptionist:{skin:'#f0c4a0',hair:'#2f303a',hairStyle:'side',top:'#237fe2',bottom:'#225bb1',accent:'#ffe5a0',shape:'uniform',height:1.06,build:.98},
 poolstaff:{skin:'#a76b44',hair:'#46312b',hairStyle:'wavy',top:'#36c1ca',bottom:'#f9edd0',accent:'#ffe17e',shape:'shirt',glasses:'sun',height:1.1,build:1.07},
 barista:{skin:'#e3af85',hair:'#8a4b2b',hairStyle:'pony',top:'#f7f4e4',bottom:'#4a8d88',accent:'#b87349',shape:'apron',height:1.04,build:.96}
};

function shadowTexture(){
 if(shadowMap)return shadowMap;
 const c=document.createElement('canvas');c.width=c.height=96;
 const p=c.getContext('2d'),g=p.createRadialGradient(48,48,3,48,48,46);
 g.addColorStop(0,'#224d685c');g.addColorStop(.5,'#224d6830');g.addColorStop(1,'#224d6800');
 p.fillStyle=g;p.fillRect(0,0,96,96);shadowMap=new T.CanvasTexture(c);return shadowMap;
}
function capsule(g,x,y,z,r,length,m){
 const geometry=new T.CapsuleGeometry(r,length,5,10);geometry.userData.transient=true;
 const o=new T.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;
}
function smile(g,skin){
 const mouth=new T.Mesh(new T.TorusGeometry(.057,.012,5,16,Math.PI),mat('#9c5848'));
 mouth.geometry.userData.transient=true;mouth.rotation.z=Math.PI;mouth.position.set(0,-.13,.338);g.add(mouth);
 sphere(g,0,-.025,.363,.058,skin,[.8,.83,1]);
}
function hairMesh(head,p,hair){
 const style=p.hairStyle;
 if(style==='bald'){
  for(const x of [-.32,.32])sphere(head,x,.1,-.05,.12,hair,[.4,1.2,1]);
  return;
 }
 if(style==='curls'){
  sphere(head,0,.16,-.07,.36,hair,[1.13,.85,1]);
  for(let i=0;i<13;i++){
   const a=i*2.399,r=.19+((i%3)/3)*.14;
   sphere(head,Math.cos(a)*r,.24+Math.sin(i*1.5)*.075,Math.sin(a)*r,.132,hair);
  }
  return;
 }
 if(['long','bob','braid','pony','bun'].includes(style)){
  sphere(head,0,-.07,-.19,.36,hair,[1.04,style==='long'?1.25:.88,.68]);
  if(['long','bob'].includes(style))for(const x of [-.32,.32])capsule(head,x,-(style==='long'?.18:.08),-.04,.12,style==='long'?.43:.18,hair);
 }
 sphere(head,0,.22,-.035,.36,hair,[1,.53,1]);
 if(style==='buzz'){
  for(let i=0;i<7;i++)sphere(head,-.26+i*.085,.27,-.04+(i%2)*.08,.075,hair,[1,.6,1]);
 }else if(style==='side'||style==='pixie'){
  const sweep=sphere(head,-.08,.21,.19,.26,hair,[1.18,.6,.68]);sweep.rotation.z=.25;
  sphere(head,.24,.15,.14,.115,hair,[.8,1,.6]);
 }else{
  for(let i=0;i<4;i++){
   const curl=sphere(head,-.25+i*.15,.23,.19,.135,hair,[1.1,.68,.85]);curl.rotation.z=-.2+i*.13;
  }
 }
 if(style==='bun'||style==='topknot'){
  sphere(head,.04,style==='topknot'?.4:.2,-.3,.2,hair,[1,1.03,1]);
  torus(head,.04,style==='topknot'?.35:.2,-.3,.145,.022,mat(p.accent));
 }
 if(style==='pony'){
  const tail=capsule(head,.05,-.11,-.37,.13,.33,hair);tail.rotation.x=-.28;
  torus(head,.05,.05,-.36,.12,.025,mat(p.accent));
 }
 if(style==='braid')for(let i=0;i<5;i++)sphere(head,Math.sin(i*2)*.055,-.2-i*.12,-.31,.113-i*.009,hair,[1,1,.8]);
}
function headwear(head,p,shirt){
 if(!p.hat)return;
 const straw=mat('#f5d69a');
 if(p.hat==='bellhop'){
  cylinder(head,0,.36,-.015,.38,.17,shirt,.34);cylinder(head,0,.28,-.015,.385,.055,M.gold);
  box(head,0,.295,.32,.48,.055,.24,M.dark,.055);sphere(head,0,.37,.348,.077,M.gold,[1,1,.25]);
 }else if(p.hat==='cap'){
  sphere(head,0,.27,-.035,.375,mat(p.accent),[1,.55,1]);box(head,0,.235,.32,.53,.06,.36,mat(p.accent),.13);box(head,0,.34,.275,.13,.09,.035,M.white,.02);
 }else{
  const brim=cylinder(head,0,.28,-.015,p.hat==='sun'?.54:.47,.055,straw);brim.scale.z=.9;
  cylinder(head,0,.38,-.025,.3,.2,straw,.26);cylinder(head,0,.32,-.025,.307,.055,shirt,.3);
 }
}
function glasses(head,p){
 if(!p.glasses)return;
 const dark=p.glasses==='sun',frame=mat(dark?'#263b50':'#986f43');
 for(const x of [-.14,.14]){
  if(dark){box(head,x,.035,.371,.215,.135,.036,frame,.045);box(head,x,.055,.392,.12,.021,.008,mat('#648a9c'),.01);}
  else{const rim=torus(head,x,.032,.375,.096,.013,frame,0);rim.scale.y=.88;}
 }
 box(head,0,.045,.378,.095,.021,.03,frame,.008);
 for(const x of [-.32,.32])box(head,x,.056,.23,.018,.023,.26,frame,.006);
}
function garment(torso,p,shirt,trousers){
 const white=M.white,accent=mat(p.accent),shape=p.shape;
 const chest=box(torso,0,1.19,0,.65,.71,.4,shirt,.2);if(p.build>1.1)chest.scale.x=1.06;
 box(torso,0,.89,0,.64,.13,.39,shirt,.06);
 if(shape==='dress'){
  cylinder(torso,0,.85,0,.42,.58,shirt,.3);cylinder(torso,0,.9,0,.33,.055,accent,.33);
  const collar=torus(torso,0,1.48,.035,.135,.025,accent);collar.scale.z=.75;sphere(torso,0,1.38,.232,.035,M.gold,[1,1,.35]);
 }else{
  box(torso,0,.81,0,.54,.1,.35,trousers,.05);
  if(shape==='suit'||shape==='jacket'){
   box(torso,0,1.28,.216,.29,.4,.035,shape==='suit'?white:accent,.02);
   for(const x of [-.17,.17]){const lapel=box(torso,x,1.33,.24,.14,.35,.04,shirt,.025);lapel.rotation.z=x<0?-.31:.31;}
   if(shape==='suit'){box(torso,0,1.25,.254,.072,.3,.022,accent,.015);box(torso,-.2,1.28,.23,.14,.035,.03,white,.01);}
  }else if(shape==='uniform'){
   for(const x of [-.12,.12]){const collar=box(torso,x,1.45,.22,.17,.2,.035,white,.02);collar.rotation.z=x<0?-.27:.27;}
   box(torso,0,1.22,.235,.035,.32,.03,accent,.01);
   for(const x of [-.12,.12])for(const y of [1.08,.96])sphere(torso,x,y,.23,.026,M.gold,[1,1,.6]);
   box(torso,-.2,1.3,.237,.12,.065,.018,M.gold,.01);for(const x of [-.3,.3])box(torso,x,1.48,0,.13,.04,.31,accent,.02);
  }else if(shape==='apron'){
   box(torso,0,1.17,.231,.45,.55,.045,accent,.06);box(torso,0,.85,.1,.63,.3,.4,accent,.08);box(torso,0,1.03,.265,.29,.16,.025,white,.035);
   for(const x of [-.17,.17])box(torso,x,1.46,.218,.045,.24,.025,accent,.015);
  }else if(shape==='overalls'){
   box(torso,0,1.03,.219,.5,.36,.05,trousers,.04);
   for(const x of [-.2,.2]){box(torso,x,1.31,.225,.08,.36,.04,trousers,.02);sphere(torso,x,1.2,.258,.031,M.gold,[1,1,.5]);}
   box(torso,0,1.02,.251,.22,.16,.02,accent,.025);
  }else if(shape==='hoodie'){
   const hood=torus(torso,0,1.45,-.05,.22,.08,shirt);hood.scale.z=.78;
   for(const x of [-.065,.065])box(torso,x,1.32,.225,.018,.18,.018,white,.005);
   box(torso,0,1.03,.226,.37,.14,.025,shirt,.04);
  }else if(shape==='shirt'){
   for(const x of [-.11,.11]){const collar=box(torso,x,1.45,.22,.16,.19,.03,accent,.025);collar.rotation.z=x<0?-.32:.32;}
   for(const y of [1.29,1.12,.96])sphere(torso,0,y,.222,.019,white,[1,1,.5]);
  }
 }
 if(p.pattern==='stripe')for(const y of [1.02,1.17,1.32]){
  box(torso,0,y,.216,.59,.05,.018,accent,.01);box(torso,0,y,-.211,.59,.05,.018,accent,.01);
 }
 if(p.pattern==='dots'||p.pattern==='island')for(let i=0;i<7;i++){
  const x=(i%3-1)*.18,y=1.03+Math.floor(i/3)*.18;sphere(torso,x,y,.222,.026,accent,[1,p.pattern==='island'?1.8:1,.22]);
  if(p.pattern==='island')sphere(torso,x+.023,y+.018,.223,.023,accent,[1.5,.6,.22]);
 }
 if(p.pattern==='pockets')for(const x of [-.17,.17])box(torso,x,1.22,.226,.17,.16,.026,accent,.025);
 if(p.camera){
  for(const x of [-.21,.21]){const strap=box(torso,x,1.3,.23,.045,.48,.026,M.dark,.01);strap.rotation.z=x<0?-.2:.2;}
  box(torso,0,1.04,.32,.34,.23,.16,M.dark,.04);const lens=cylinder(torso,0,1.05,.43,.083,.09,M.chrome);lens.rotation.x=Math.PI/2;sphere(torso,0,1.05,.49,.06,M.dark,[1,1,.2]);
 }
}
function luggage(root,body,p){
 const g=new T.Group(),bagMat=mat(p.accent),trim=mat('#e7f4ee'),type=p.bag;
 if(type==='backpack'){
  body.add(g);g.position.set(0,1.22,-.3);box(g,0,0,0,.58,.63,.28,bagMat,.13);box(g,0,-.12,-.17,.39,.22,.075,trim,.05);
  for(const x of [-.23,.23])box(body,x,1.29,-.055,.055,.53,.45,bagMat,.025);torus(g,0,.32,0,.1,.025,M.dark,0);
 }else{
  root.add(g);g.position.set(.5,.55,-.2);
  if(type==='roller'){
   box(g,0,0,0,.47,.72,.33,bagMat,.11);
   for(const x of [-.14,.14]){box(g,x,.44,-.035,.026,.22,.035,M.chrome,.01);const wheel=cylinder(g,x,-.38,0,.064,.075,M.dark);wheel.rotation.z=Math.PI/2;}
   box(g,0,.52,-.035,.31,.05,.065,M.dark,.02);for(const x of [-.14,0,.14])box(g,x,0,.17,.02,.51,.015,trim,.006);box(g,.18,.15,.18,.12,.15,.026,M.white,.01);
  }else if(type==='duffel'){
   g.position.set(.55,.65,0);const b=capsule(g,0,0,0,.22,.32,bagMat);b.rotation.z=Math.PI/2;
   for(const x of [-.15,.15]){const strap=torus(g,x,.11,0,.18,.027,trim,0);strap.scale.y=.85;}box(g,0,-.04,.215,.3,.16,.024,trim,.04);
  }else{
   g.position.set(.55,.65,.03);box(g,0,0,0,type==='briefcase'?.5:.38,type==='briefcase'?.32:.4,.18,bagMat,.055);
   const handle=torus(g,0,.23,0,.11,.026,M.dark,0);handle.scale.y=.8;box(g,0,.04,.1,type==='briefcase'?.43:.24,.027,.02,M.gold,.008);
   if(type==='tote'){box(g,0,0,.1,.25,.27,.017,M.white,.015);sphere(g,0,.025,.117,.07,bagMat,[1,1,.15]);}
  }
 }
 batchColors(g);return g;
}

const outfitColours={azure:{top:'#247fdb',bottom:'#184a99'},ivory:{top:'#fff2ce',bottom:'#c5a14d'},royal:{top:'#823cc0',bottom:'#4f277e'}};
export function makePerson(kind='guest',look=0,outfit='classic'){
 const isGuest=kind==='guest',p=isGuest?guestAppearance(look):kind==='owner'?{...staffLooks.owner,...outfitColours[outfit]}:kind==='villaCleaner'?{...staffLooks.cleaner,skin:'#edb88d',hair:'#d9d4c6',hairStyle:'pony',top:'#2379ce',accent:'#fff0ba'}:staffLooks[kind]||staffLooks.cleaner;
 const root=new T.Group(),body=new T.Group(),head=new T.Group(),torso=new T.Group();root.name=`${kind}:${isGuest?p.name:kind}`;root.add(body);body.add(torso,head);head.position.set(0,1.98,0);
 root.scale.set(1.12*p.build,1.12*p.height,1.12*(.95+p.build*.05));
 const skin=mat(p.skin,.72),hair=mat(p.hair,.8),shirt=mat(p.top,.76),trousers=mat(p.bottom,.8);
 garment(torso,p,shirt,trousers);capsule(torso,0,1.57,.015,.1,.08,skin);
 sphere(head,0,0,.025,.365,skin,[1,1.1,.94]);
 for(const x of [-.35,.35]){sphere(head,x,-.02,.015,.075,skin,[.7,1,.8]);sphere(head,x,-.02,.067,.035,mat('#d38e76'),[.7,.9,.3]);}
 for(const x of [-.132,.132]){
  sphere(head,x,.037,.337,.055,mat('#263c50'),[.79,1.16,.28]);sphere(head,x+.01,.059,.354,.012,M.white,[1,1,.55]);
  const brow=box(head,x,.14,.314,.1,.023,.028,hair,.012);brow.rotation.z=x<0?-.1:.1;
  if(p.skin!=='#774a36')sphere(head,x*1.55,-.07,.303,.045,mat('#ea9b88'),[1,.46,.18]);
 }
 smile(head,skin);hairMesh(head,p,hair);
 if(p.beard){sphere(head,0,-.18,.19,.24,hair,[1,.45,.73]);for(const x of [-.075,.075])sphere(head,x,-.095,.333,.065,hair,[1.4,.48,.3]);}
 glasses(head,p);headwear(head,p,shirt);
 const armL=new T.Group(),armR=new T.Group();armL.position.set(-.425,1.45,0);armR.position.set(.425,1.45,0);body.add(armL,armR);
 for(const arm of [armL,armR]){
  capsule(arm,0,-.15,0,.115,.17,shirt);
  if(['suit','hoodie','jacket'].includes(p.shape)){capsule(arm,0,-.4,.015,.087,.22,shirt);box(arm,0,-.51,.022,.17,.045,.17,p.shape==='suit'?M.white:shirt,.025);}
  else capsule(arm,0,-.4,.015,.082,.19,skin);
  sphere(arm,0,-.57,.035,.096,skin,[1,1.07,.93]);batchColors(arm);
 }
 const legL=new T.Group(),legR=new T.Group();legL.position.set(-.17,.8,0);legR.position.set(.17,.8,0);body.add(legL,legR);
 const kneeL=new T.Group(),kneeR=new T.Group();
 for(const [leg,knee] of [[legL,kneeL],[legR,kneeR]]){
  capsule(leg,0,-.15,0,.115,.15,p.shape==='dress'?skin:trousers);
  knee.position.y=-.32;leg.add(knee);capsule(knee,0,-.12,0,.101,.1,p.shape==='dress'?skin:trousers);
  if(isGuest&&p.shape==='dress'){
   box(knee,0,-.30,.075,.25,.065,.38,mat('#d3aa74'),.055);
   sphere(knee,0,-.24,.08,.105,skin,[1,.55,1.55]);
   for(const z of [.04,.19])box(knee,0,-.205,z,.24,.033,.07,mat(p.accent),.018);
  }else{
   const loafer=p.shape==='suit',shoe=loafer?mat('#263d53'):isGuest?M.white:mat('#2a5169');
   box(knee,0,-.26,.075,.25,.16,.39,shoe,.075);
   box(knee,0,-.32,.075,.255,.04,.4,loafer?mat('#304452'):M.white,.018);
   if(isGuest&&!loafer){box(knee,0,-.24,.244,.18,.025,.035,mat(p.accent),.009);for(const z of [.09,.15])box(knee,0,-.17,z,.14,.012,.02,mat('#afc6d1'),.005);}
  }
  batchColors(knee);knee.userData.preserve=true;  batchColors(leg);
 }
 const towels=new T.Group();towels.position.set(0,1.04,.43);body.add(towels);
 for(let i=0;i<16;i++){const folded=new T.Group();folded.position.y=i*.13;towels.add(folded);box(folded,0,0,0,.63,.115,.45,i%2?M.white:mat('#7fe2d3'),.045);box(folded,0,.059,.015,.49,.009,.32,mat('#effffc'),.009);batchColors(folded);}
 const suitcase=luggage(root,body,{...p,bag:p.bag||'roller'});suitcase.visible=isGuest;
 const mop=new T.Group();root.add(mop);const stick=cylinder(mop,.46,.79,.38,.025,1.48,mat('#a1d1df'));stick.rotation.z=-.21;
 box(mop,.62,.15,.43,.74,.095,.29,mat('#48baba'),.065);for(let i=0;i<6;i++)capsule(mop,.37+i*.1,.08,.48,.04,.12,M.white);batchColors(mop);mop.visible=false;
 const floatRing=new T.Group();torus(floatRing,0,1.27,0,.48,.125,mat(p.accent));root.add(floatRing);floatRing.visible=false;
 const cup=new T.Group();cylinder(cup,0,0,0,.1,.21,M.white);cylinder(cup,0,.11,0,.087,.012,mat('#6b4430'));torus(cup,.115,0,0,.063,.019,M.white,0);armR.add(cup);cup.position.set(0,-.55,.16);cup.visible=false;
 const shadow=new T.Mesh(new T.PlaneGeometry(1.5,1.05),new T.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.112,.04);root.add(shadow);
 batchColors(torso);batchColors(head);
 let lastX=null,lastZ=null,stride=look*.9,angle=0,moveBlend=0,carryBlend=0,cleanBlend=0;
 return {root,body,head,armL,armR,legL,legR,kneeL,kneeR,towels,suitcase,mop,shadow,floatRing,cup,kind,profile:p,
  update(a,t,dt=1/60){
   const floor=floorHeightAt(a.x,a.z);
   root.position.set(a.x,floor-.12,a.z);
   const desired=a.angle||0;if(lastX===null){angle=desired;carryBlend=(a.towels||0)>0?1:0;cleanBlend=a.action==='clean'?1:0;}
   angle+=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle))*Math.min(1,dt*13);root.rotation.set(0,angle,0);
   const distance=lastX===null?0:Math.min(.7,Math.hypot(a.x-lastX,a.z-lastZ));lastX=a.x;lastZ=a.z;
   stride+=distance*3.6/(p.height||1);const smooth=1-Math.exp(-dt*13);
   moveBlend+=((a.moving?1:0)-moveBlend)*smooth;carryBlend+=(((a.towels||0)>0?1:0)-carryBlend)*smooth;cleanBlend+=((a.action==='clean'?1:0)-cleanBlend)*smooth;
   const swing=Math.sin(stride)*.59*moveBlend,breath=Math.sin(t*1.7+look)*.01;
   body.position.y=Math.abs(Math.sin(stride))*.065*moveBlend+breath;body.rotation.set(.04*moveBlend+.13*cleanBlend,0,Math.sin(stride)*.028*moveBlend);
   head.rotation.set(-.018*moveBlend,Math.sin(t*.7+look)*.035*(1-moveBlend),Math.sin(stride)*.023*moveBlend);
   legL.rotation.set(swing,0,0);legR.rotation.set(-swing,0,0);kneeL.rotation.x=Math.max(0,-Math.sin(stride))*.48*moveBlend;kneeR.rotation.x=Math.max(0,Math.sin(stride))*.48*moveBlend;
   armL.rotation.set(-swing*.7*(1-carryBlend)-carryBlend,.03,.08-.22*carryBlend);armR.rotation.set(swing*.7*(1-carryBlend)-carryBlend,-.03,-.08+.22*carryBlend);
   const count=a.towels||0;towels.children.forEach((o,i)=>{o.visible=i<count;o.position.set(count>8?(i%2?-.25:.25):0,(count>8?Math.floor(i/2)*.1:i*.13),0);o.scale.x=count>8?.76:1;});towels.visible=count>0;towels.position.y=1.04+Math.abs(Math.sin(stride))*.018*moveBlend;
   mop.visible=cleanBlend>.02;
   if(cleanBlend>.02){
    root.rotation.y=angle+Math.atan2(Math.sin(Math.PI-angle),Math.cos(Math.PI-angle))*cleanBlend;
    armL.rotation.x=armL.rotation.x*(1-cleanBlend)+(-.78+Math.sin(t*8)*.18)*cleanBlend;armR.rotation.x=armR.rotation.x*(1-cleanBlend)+(-.95+Math.sin(t*8)*.23)*cleanBlend;
    mop.position.z=Math.sin(t*8)*.2;mop.rotation.y=Math.sin(t*4)*.1;
   }
   if(a.action==='serve'){root.rotation.y=0;armR.rotation.x=-1.8+Math.sin(t*6)*.13;armR.rotation.z=-.2;}
   if(a.action==='greet'){armL.rotation.x=-2.2+Math.sin(t*7)*.14;armL.rotation.z=.25;}
   if(a.action==='coffee'){root.rotation.y=0;armL.rotation.x=-1.1;armR.rotation.x=-1.35+Math.sin(t*8)*.12;}
   if(a.action==='supply'){root.rotation.y=a.x<0?-Math.PI/2:Math.PI/2;armL.rotation.x=armR.rotation.x=-.95+Math.sin(t*7)*.1;}
   suitcase.visible=isGuest&&!['staying','pool','coffee'].includes(a.state);
   if(isGuest&&p.bag==='roller'&&a.moving){suitcase.rotation.x=-.15;suitcase.position.y=.55+Math.abs(Math.sin(stride))*.012;}
   else if(p.bag==='roller'){suitcase.rotation.x=0;suitcase.position.y=.55;}
   if(isGuest&&suitcase.visible&&p.bag!=='backpack'){armR.rotation.x=p.bag==='roller'?.6:-.06;armR.rotation.z=p.bag==='roller'?.12:.1;}
   shadow.visible=a.state!=='staying'&&!(a.state==='pool'&&!a.path?.length);floatRing.visible=false;cup.visible=(a.state==='coffee'&&!a.path?.length)||a.action==='coffee';
  }
 };
}

export function avatarPortrait(kind,look=0,outfit='classic'){
 const key=kind+look+outfit;if(portraits.has(key))return portraits.get(key);
 if(!portraitRenderer){portraitRenderer=new T.WebGLRenderer({alpha:true,antialias:true});portraitRenderer.setSize(240,240);portraitRenderer.outputColorSpace=T.SRGBColorSpace;portraitRenderer.toneMapping=T.NoToneMapping;}
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(25,1,.1,30);camera.position.set(1.5,2.85,5.9);camera.lookAt(0,1.85,0);
 scene.add(new T.HemisphereLight('#ffffff','#cee7fa',1.55));const light=new T.DirectionalLight('#fffefa',2.05);light.position.set(-3,5,5);scene.add(light);
 const person=makePerson(kind,look,outfit);scene.add(person.root);person.update({x:0,z:0,angle:.15,moving:false,towels:kind==='cleaner'?2:0,action:'idle'},0);person.armR.rotation.x=-1.2;person.armR.rotation.z=-.55;person.suitcase.visible=false;
 portraitRenderer.render(scene,camera);const data=portraitRenderer.domElement.toDataURL('image/png');portraits.set(key,data);return data;
}

export function disposePerson(person){
 person.root.traverse(o=>{if(o.isMesh&&!o.geometry.userData.shared)o.geometry.dispose();});
 person.shadow.material.dispose();person.root.removeFromParent();
}

// Used by the local art-review page; the exact same game meshes are rendered.
export function renderGuestCard(look=0,angle=0,pose='idle'){
 if(!portraitRenderer){portraitRenderer=new T.WebGLRenderer({alpha:true,antialias:true});portraitRenderer.outputColorSpace=T.SRGBColorSpace;portraitRenderer.toneMapping=T.NoToneMapping;}
 portraitRenderer.setSize(210,270);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1.4,1.4,1.8,-1.8,.1,25);
 camera.position.set(0,2.8,7);camera.lookAt(0,1.42,0);
 scene.add(new T.HemisphereLight('#ffffff','#cee7fa',1.55));const light=new T.DirectionalLight('#fffefa',2.05);light.position.set(-3,5,5);scene.add(light);
 const person=makePerson('guest',look);scene.add(person.root);
 person.update({x:0,z:0,angle,moving:false,towels:0,action:'idle'},1);
 if(pose==='walk'){person.legL.rotation.x=.4;person.legR.rotation.x=-.4;person.kneeR.rotation.x=.35;person.armL.rotation.x=-.25;person.armR.rotation.x=.25;}
 portraitRenderer.render(scene,camera);const data=portraitRenderer.domElement.toDataURL('image/png');disposePerson(person);portraitRenderer.setSize(240,240);return data;
}
